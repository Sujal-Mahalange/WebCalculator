/**
 * calculator.js - Core Mathematical Engine & Standard Calculator
 * OmniCalc Pro - Engineering Calculator
 * Developer: Sujal Mahalange
 * 
 * Features:
 * - Safe Recursive Descent Expression Parser (Zero eval() or Function())
 * - Angle Modes: DEG, RAD, GRAD
 * - Live Expression Preview
 * - Full Memory functions (M+, M-, MR, MC)
 * - Friendly error messages with position context
 * - Audio haptic feedback via Web Audio API
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.OmniCalculator = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // --- Sound Effects using Web Audio API ---
  let audioCtx = null;
  let soundEnabled = true;

  function initAudio() {
    if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();
    }
  }

  function playTone(freq = 600, duration = 0.04, type = 'sine') {
    if (!soundEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Audio not supported or blocked, fail silently
    }
  }

  // --- Safe Tokenizer and Parser ---
  const TOKEN_TYPES = {
    NUMBER: 'NUMBER',
    IDENT: 'IDENT',
    OPERATOR: 'OPERATOR',
    LPAREN: 'LPAREN',
    RPAREN: 'RPAREN',
    COMMA: 'COMMA',
    EOF: 'EOF'
  };

  /**
   * Tokenizes mathematical expressions
   */
  function tokenize(expr) {
    const tokens = [];
    let i = 0;
    const len = expr.length;

    // Normalize mathematical symbols
    const cleanExpr = expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-')
      .replace(/–/g, '-')
      .replace(/π/g, 'pi')
      .replace(/√/g, 'sqrt')
      .replace(/∛/g, 'cbrt');

    while (i < len) {
      const char = cleanExpr[i];

      // Skip whitespace
      if (/\s/.test(char)) {
        i++;
        continue;
      }

      // Numbers (including scientific notation like 1.2e-4, 5e+3)
      if (/[0-9]/.test(char) || (char === '.' && i + 1 < len && /[0-9]/.test(cleanExpr[i + 1]))) {
        let numStr = '';
        let hasDot = false;
        while (i < len) {
          const c = cleanExpr[i];
          if (/[0-9]/.test(c)) {
            numStr += c;
            i++;
          } else if (c === '.' && !hasDot) {
            hasDot = true;
            numStr += c;
            i++;
          } else {
            break;
          }
        }
        // Check for scientific exponent 'e' or 'E'
        if (i < len && (cleanExpr[i] === 'e' || cleanExpr[i] === 'E')) {
          const nextChar = cleanExpr[i + 1];
          if (nextChar === '+' || nextChar === '-' || /[0-9]/.test(nextChar)) {
            numStr += cleanExpr[i];
            i++;
            if (cleanExpr[i] === '+' || cleanExpr[i] === '-') {
              numStr += cleanExpr[i];
              i++;
            }
            while (i < len && /[0-9]/.test(cleanExpr[i])) {
              numStr += cleanExpr[i];
              i++;
            }
          }
        }
        tokens.push({ type: TOKEN_TYPES.NUMBER, value: parseFloat(numStr), raw: numStr });
        continue;
      }

      // Identifiers: functions & constants (e.g. sin, cos, pi, ans)
      if (/[a-zA-Z_]/.test(char)) {
        let ident = '';
        while (i < len && /[a-zA-Z0-9_]/.test(cleanExpr[i])) {
          ident += cleanExpr[i];
          i++;
        }
        tokens.push({ type: TOKEN_TYPES.IDENT, value: ident });
        continue;
      }

      // Parentheses & Brackets
      if (char === '(' || char === '[' || char === '{') {
        tokens.push({ type: TOKEN_TYPES.LPAREN, value: '(' });
        i++;
        continue;
      }
      if (char === ')' || char === ']' || char === '}') {
        tokens.push({ type: TOKEN_TYPES.RPAREN, value: ')' });
        i++;
        continue;
      }

      // Comma separator for multi-argument functions
      if (char === ',') {
        tokens.push({ type: TOKEN_TYPES.COMMA, value: ',' });
        i++;
        continue;
      }

      // Operators: +, -, *, /, %, ^, !
      if ('+-*/%^!'.indexOf(char) !== -1) {
        tokens.push({ type: TOKEN_TYPES.OPERATOR, value: char });
        i++;
        continue;
      }

      // Pipe | for absolute value: |x| -> abs(x)
      if (char === '|') {
        tokens.push({ type: TOKEN_TYPES.OPERATOR, value: '|' });
        i++;
        continue;
      }

      throw new Error(`Unexpected character '${char}' at position ${i + 1}`);
    }

    // Insert implicit multiplications:
    // e.g. 2pi -> 2 * pi, 2(3) -> 2 * (3), (2)(3) -> (2) * (3), 3sin(x) -> 3 * sin(x)
    const refinedTokens = [];
    for (let k = 0; k < tokens.length; k++) {
      const cur = tokens[k];
      refinedTokens.push(cur);

      if (k < tokens.length - 1) {
        const next = tokens[k + 1];
        const curCanPrecedeImplicitMul = (
          cur.type === TOKEN_TYPES.NUMBER ||
          cur.type === TOKEN_TYPES.RPAREN ||
          cur.type === TOKEN_TYPES.IDENT ||
          (cur.type === TOKEN_TYPES.OPERATOR && cur.value === '!')
        );
        const nextCanFollowImplicitMul = (
          next.type === TOKEN_TYPES.NUMBER ||
          next.type === TOKEN_TYPES.LPAREN ||
          next.type === TOKEN_TYPES.IDENT
        );

        if (curCanPrecedeImplicitMul && nextCanFollowImplicitMul) {
          // If current is an ident that is a known function, and next is LPAREN, that's a function call, NOT implicit mul!
          const isFuncCall = cur.type === TOKEN_TYPES.IDENT && next.type === TOKEN_TYPES.LPAREN;
          if (!isFuncCall) {
            refinedTokens.push({ type: TOKEN_TYPES.OPERATOR, value: '*' });
          }
        }
      }
    }

    refinedTokens.push({ type: TOKEN_TYPES.EOF, value: '' });
    return refinedTokens;
  }

  /**
   * Safe Recursive Descent Parser & Evaluator
   */
  class MathParser {
    constructor(tokens, context = {}) {
      this.tokens = tokens;
      this.pos = 0;
      this.context = {
        angleMode: context.angleMode || 'DEG', // DEG, RAD, GRAD
        ans: typeof context.ans === 'number' ? context.ans : 0,
        ...context
      };
    }

    peek() {
      return this.tokens[this.pos];
    }

    consume(expectedType, expectedValue) {
      const t = this.peek();
      if (expectedType && t.type !== expectedType) {
        throw new Error(`Expected ${expectedType} but found ${t.type} ('${t.value}')`);
      }
      if (expectedValue !== undefined && t.value !== expectedValue) {
        throw new Error(`Expected '${expectedValue}' but found '${t.value}'`);
      }
      this.pos++;
      return t;
    }

    // Convert angle to radians based on active mode
    toRadians(angle) {
      const mode = this.context.angleMode;
      if (mode === 'DEG') return angle * (Math.PI / 180);
      if (mode === 'GRAD') return angle * (Math.PI / 200);
      return angle; // RAD
    }

    // Convert radians back to active angle mode
    fromRadians(rad) {
      const mode = this.context.angleMode;
      if (mode === 'DEG') return rad * (180 / Math.PI);
      if (mode === 'GRAD') return rad * (200 / Math.PI);
      return rad; // RAD
    }

    // Grammar:
    // parse() -> Expression EOF
    parse() {
      const val = this.parseExpression();
      if (this.peek().type !== TOKEN_TYPES.EOF) {
        throw new Error(`Unexpected token '${this.peek().value}'`);
      }
      return val;
    }

    // Expression -> Term ( ('+' | '-') Term )*
    parseExpression() {
      let val = this.parseTerm();
      while (this.peek().type === TOKEN_TYPES.OPERATOR && (this.peek().value === '+' || this.peek().value === '-')) {
        const op = this.consume().value;
        const right = this.parseTerm();
        if (op === '+') val += right;
        else val -= right;
      }
      return val;
    }

    // Term -> Factor ( ('*' | '/' | '%') Factor )*
    parseTerm() {
      let val = this.parseFactor();
      while (this.peek().type === TOKEN_TYPES.OPERATOR &&
        (this.peek().value === '*' || this.peek().value === '/' || this.peek().value === '%')) {
        const op = this.consume().value;
        const right = this.parseFactor();
        if (op === '*') {
          val *= right;
        } else if (op === '/') {
          if (Math.abs(right) < 1e-15) {
            throw new Error('Division by zero');
          }
          val /= right;
        } else if (op === '%') {
          if (Math.abs(right) < 1e-15) {
            throw new Error('Modulo by zero');
          }
          val = val % right;
        }
      }
      return val;
    }

    // Factor -> Exponent
    parseFactor() {
      return this.parseExponent();
    }

    // Exponent -> Unary ( '^' Factor )?  -- right associative
    parseExponent() {
      let val = this.parseUnary();
      if (this.peek().type === TOKEN_TYPES.OPERATOR && this.peek().value === '^') {
        this.consume();
        const exponent = this.parseFactor(); // Right-associative: 2^3^2 = 2^(3^2)
        if (val < 0 && Math.floor(exponent) !== exponent) {
          throw new Error('Invalid real root of negative number');
        }
        val = Math.pow(val, exponent);
      }
      return val;
    }

    // Unary -> ('+' | '-') Unary | Postfix
    parseUnary() {
      if (this.peek().type === TOKEN_TYPES.OPERATOR && (this.peek().value === '+' || this.peek().value === '-')) {
        const op = this.consume().value;
        const val = this.parseUnary();
        return op === '-' ? -val : val;
      }
      return this.parsePostfix();
    }

    // Postfix -> Primary ('!')*
    parsePostfix() {
      let val = this.parsePrimary();
      while (this.peek().type === TOKEN_TYPES.OPERATOR && this.peek().value === '!') {
        this.consume();
        val = this.computeFactorial(val);
      }
      return val;
    }

    computeFactorial(n) {
      if (n < 0 || Math.floor(n) !== n) {
        throw new Error('Factorial is defined for non-negative integers only');
      }
      if (n > 170) {
        return Infinity; // Overflow standard IEEE-754 double
      }
      if (n === 0 || n === 1) return 1;
      let res = 1;
      for (let i = 2; i <= n; i++) {
        res *= i;
      }
      return res;
    }

    // Primary -> NUMBER | IDENT | LPAREN Expression RPAREN | FunctionCall | AbsoluteValue
    parsePrimary() {
      const t = this.peek();

      // Number
      if (t.type === TOKEN_TYPES.NUMBER) {
        this.consume();
        return t.value;
      }

      // Grouping (Expression)
      if (t.type === TOKEN_TYPES.LPAREN) {
        this.consume();
        const val = this.parseExpression();
        this.consume(TOKEN_TYPES.RPAREN);
        return val;
      }

      // Absolute value syntax: |expr|
      if (t.type === TOKEN_TYPES.OPERATOR && t.value === '|') {
        this.consume();
        const val = this.parseExpression();
        this.consume(TOKEN_TYPES.OPERATOR, '|');
        return Math.abs(val);
      }

      // Identifier: Constants or Functions
      if (t.type === TOKEN_TYPES.IDENT) {
        const name = this.consume().value.toLowerCase();

        // Check if function call (followed by LPAREN)
        if (this.peek().type === TOKEN_TYPES.LPAREN) {
          this.consume(); // eat '('
          const args = [];
          if (this.peek().type !== TOKEN_TYPES.RPAREN) {
            args.push(this.parseExpression());
            while (this.peek().type === TOKEN_TYPES.COMMA) {
              this.consume(); // eat ','
              args.push(this.parseExpression());
            }
          }
          this.consume(TOKEN_TYPES.RPAREN); // eat ')'
          return this.evaluateFunction(name, args);
        }

        // Named Constants
        if (name === 'pi') return Math.PI;
        if (name === 'e') return Math.E;
        if (name === 'ans') return this.context.ans;
        if (name === 'phi') return 1.618033988749895; // Golden ratio
        if (name === 'c') return 299792458; // Speed of light m/s
        if (name === 'g') return 9.80665; // Standard gravity m/s^2
        if (name === 'h') return 6.62607015e-34; // Planck constant
        if (name === 'na') return 6.02214076e23; // Avogadro
        if (name === 'k' || name === 'kb') return 1.380649e-23; // Boltzmann
        if (name === 'r') return 8.314462618; // Gas constant

        throw new Error(`Unknown variable or constant '${name}'`);
      }

      throw new Error(`Unexpected token '${t.value || t.type}'`);
    }

    evaluateFunction(fn, args) {
      const a = args[0];
      const b = args[1];

      switch (fn) {
        // Standard & Hyperbolic Trigonometry
        case 'sin':
          return Math.sin(this.toRadians(a));
        case 'cos':
          return Math.cos(this.toRadians(a));
        case 'tan': {
          const rad = this.toRadians(a);
          // Check for vertical asymptotes: pi/2 + k*pi
          const cosVal = Math.cos(rad);
          if (Math.abs(cosVal) < 1e-15) throw new Error('Undefined (tan asymptote)');
          return Math.tan(rad);
        }
        case 'asin':
        case 'arcsin':
          if (a < -1 || a > 1) throw new Error('asin argument must be in [-1, 1]');
          return this.fromRadians(Math.asin(a));
        case 'acos':
        case 'arccos':
          if (a < -1 || a > 1) throw new Error('acos argument must be in [-1, 1]');
          return this.fromRadians(Math.acos(a));
        case 'atan':
        case 'arctan':
          return this.fromRadians(Math.atan(a));
        case 'atan2':
          return this.fromRadians(Math.atan2(a, b));
        case 'sinh':
          return Math.sinh(a);
        case 'cosh':
          return Math.cosh(a);
        case 'tanh':
          return Math.tanh(a);
        case 'asinh':
          return Math.asinh(a);
        case 'acosh':
          if (a < 1) throw new Error('acosh argument must be >= 1');
          return Math.acosh(a);
        case 'atanh':
          if (a <= -1 || a >= 1) throw new Error('atanh argument must be in (-1, 1)');
          return Math.atanh(a);

        // Exponentials & Logarithms
        case 'sqrt':
          if (a < 0) throw new Error('Cannot take square root of negative number');
          return Math.sqrt(a);
        case 'cbrt':
          return Math.cbrt(a);
        case 'root':
        case 'nroot': {
          // root(x, n) where n is root degree
          const val = a;
          const rootDegree = b !== undefined ? b : 2;
          if (rootDegree === 0) throw new Error('Zero root is undefined');
          if (val < 0 && rootDegree % 2 === 0) throw new Error('Even root of negative number');
          return val < 0 ? -Math.pow(-val, 1 / rootDegree) : Math.pow(val, 1 / rootDegree);
        }
        case 'ln':
          if (a <= 0) throw new Error('ln domain is x > 0');
          return Math.log(a);
        case 'log':
        case 'log10':
          if (a <= 0) throw new Error('log domain is x > 0');
          return Math.log10(a);
        case 'log2':
          if (a <= 0) throw new Error('log2 domain is x > 0');
          return Math.log2(a);
        case 'logn': {
          // logn(x, base)
          const base = b !== undefined ? b : 10;
          if (a <= 0 || base <= 0 || base === 1) throw new Error('Invalid logn parameters');
          return Math.log(a) / Math.log(base);
        }
        case 'exp':
          return Math.exp(a);
        case 'sq':
          return a * a;
        case 'cube':
          return a * a * a;
        case 'inv':
          if (Math.abs(a) < 1e-15) throw new Error('Division by zero');
          return 1 / a;

        // Combinatorics & Discrete
        case 'fact':
          return this.computeFactorial(a);
        case 'npr': {
          const n = a;
          const r = b;
          if (n < 0 || r < 0 || r > n || Math.floor(n) !== n || Math.floor(r) !== r) {
            throw new Error('nPr requires integers with 0 <= r <= n');
          }
          return this.computeFactorial(n) / this.computeFactorial(n - r);
        }
        case 'ncr': {
          const n = a;
          const r = b;
          if (n < 0 || r < 0 || r > n || Math.floor(n) !== n || Math.floor(r) !== r) {
            throw new Error('nCr requires integers with 0 <= r <= n');
          }
          return this.computeFactorial(n) / (this.computeFactorial(r) * this.computeFactorial(n - r));
        }

        // Basics & Rounding
        case 'abs':
          return Math.abs(a);
        case 'round':
          return Math.round(a);
        case 'floor':
          return Math.floor(a);
        case 'ceil':
          return Math.ceil(a);
        case 'deg':
          return a * (180 / Math.PI);
        case 'rad':
          return a * (Math.PI / 180);

        default:
          throw new Error(`Unknown function '${fn}'`);
      }
    }
  }

  /**
   * Safe evaluation wrapper
   */
  function evaluate(expr, context = {}) {
    if (!expr || !expr.trim()) return 0;
    const tokens = tokenize(expr);
    const parser = new MathParser(tokens, context);
    const result = parser.parse();

    // Check for NaN or invalid numbers
    if (Number.isNaN(result)) {
      throw new Error('Result is not a number');
    }

    // Normalize very close floating point errors (e.g. sin(180 deg) = 1.22e-16 -> 0)
    if (Math.abs(result) < 1e-14) return 0;
    return result;
  }

  /**
   * Formats numbers cleanly (avoids 0.30000000000000004)
   */
  function formatNumber(num, maxDecimals = 10) {
    if (typeof num !== 'number') return String(num);
    if (!Number.isFinite(num)) {
      if (num === Infinity) return '∞';
      if (num === -Infinity) return '-∞';
      return 'NaN';
    }

    // Very large or very tiny non-zero numbers in scientific notation
    const absVal = Math.abs(num);
    if ((absVal >= 1e12 || (absVal < 1e-7 && absVal !== 0))) {
      return num.toExponential(6).replace(/\.?0+e/, 'e');
    }

    // Precision rounding
    const factor = Math.pow(10, maxDecimals);
    const rounded = Math.round((num + Number.EPSILON) * factor) / factor;
    return String(rounded);
  }

  // --- Calculator State Manager ---
  class StandardCalculator {
    constructor() {
      this.expression = '';
      this.lastResult = 0;
      this.memory = 0;
      this.angleMode = 'DEG'; // 'DEG', 'RAD', 'GRAD'
      this.isSecondFunction = false;
      this.listeners = new Set();
    }

    subscribe(fn) {
      this.listeners.add(fn);
      return () => this.listeners.delete(fn);
    }

    notify(eventType, data) {
      for (const fn of this.listeners) {
        fn(eventType, data, this.getState());
      }
    }

    getState() {
      return {
        expression: this.expression,
        lastResult: this.lastResult,
        memory: this.memory,
        angleMode: this.angleMode,
        isSecondFunction: this.isSecondFunction,
        preview: this.getPreviewResult()
      };
    }

    getPreviewResult() {
      if (!this.expression.trim()) return '';
      try {
        const res = evaluate(this.expression, {
          angleMode: this.angleMode,
          ans: this.lastResult
        });
        return formatNumber(res);
      } catch (e) {
        return ''; // If incomplete expression, return empty preview silently
      }
    }

    setAngleMode(mode) {
      if (['DEG', 'RAD', 'GRAD'].includes(mode)) {
        this.angleMode = mode;
        playTone(750, 0.03);
        this.notify('mode_change', { angleMode: mode });
      }
    }

    toggleSecondFunction() {
      this.isSecondFunction = !this.isSecondFunction;
      playTone(650, 0.03);
      this.notify('2nd_toggle', { isSecondFunction: this.isSecondFunction });
    }

    append(val) {
      playTone(550, 0.02);
      this.expression += val;
      this.notify('input', { val });
    }

    appendFunction(fnName) {
      playTone(580, 0.03);
      this.expression += `${fnName}(`;
      this.notify('input', { val: `${fnName}(` });
    }

    backspace() {
      playTone(450, 0.03);
      if (this.expression.length > 0) {
        // If ends with a function call like "sin(" remove all
        const match = this.expression.match(/([a-zA-Z0-9_]+)\($/);
        if (match) {
          this.expression = this.expression.slice(0, -match[0].length);
        } else {
          this.expression = this.expression.slice(0, -1);
        }
        this.notify('backspace');
      }
    }

    clear() {
      playTone(400, 0.04);
      this.expression = '';
      this.notify('clear');
    }

    clearAll() {
      playTone(380, 0.05);
      this.expression = '';
      this.notify('clear_all');
    }

    setExpression(expr) {
      this.expression = expr;
      this.notify('set_expression', { expression: expr });
    }

    calculate() {
      if (!this.expression.trim()) return null;

      try {
        const val = evaluate(this.expression, {
          angleMode: this.angleMode,
          ans: this.lastResult
        });
        playTone(850, 0.05);
        const formatted = formatNumber(val);
        const resultItem = {
          expression: this.expression,
          result: val,
          formattedResult: formatted,
          angleMode: this.angleMode,
          timestamp: Date.now()
        };

        this.lastResult = val;
        this.expression = formatted;
        this.notify('calculate_success', resultItem);
        return resultItem;
      } catch (err) {
        playTone(220, 0.15, 'sawtooth'); // Error tone
        this.notify('calculate_error', { error: err.message });
        throw err;
      }
    }

    // Memory operations
    memoryAdd() {
      try {
        const val = this.expression ? evaluate(this.expression, { angleMode: this.angleMode, ans: this.lastResult }) : this.lastResult;
        this.memory += val;
        playTone(700, 0.04);
        this.notify('memory_update', { memory: this.memory });
      } catch (e) {
        this.notify('calculate_error', { error: e.message });
      }
    }

    memorySubtract() {
      try {
        const val = this.expression ? evaluate(this.expression, { angleMode: this.angleMode, ans: this.lastResult }) : this.lastResult;
        this.memory -= val;
        playTone(700, 0.04);
        this.notify('memory_update', { memory: this.memory });
      } catch (e) {
        this.notify('calculate_error', { error: e.message });
      }
    }

    memoryRecall() {
      playTone(700, 0.04);
      this.expression += formatNumber(this.memory);
      this.notify('input', { val: formatNumber(this.memory) });
    }

    memoryClear() {
      playTone(700, 0.04);
      this.memory = 0;
      this.notify('memory_update', { memory: this.memory });
    }

    setSoundEnabled(enabled) {
      soundEnabled = !!enabled;
    }

    isSoundEnabled() {
      return soundEnabled;
    }
  }

  return {
    tokenize,
    evaluate,
    formatNumber,
    playTone,
    StandardCalculator,
    setSoundEnabled: (v) => { soundEnabled = !!v; },
    isSoundEnabled: () => soundEnabled
  };
});
