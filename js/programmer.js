/**
 * programmer.js - Programmer Calculator Module
 * OmniCalc Pro - Engineering Calculator
 * Developer: Sujal Mahalange
 * 
 * Features:
 * - Real-time synchronization across HEX, DEC, OCT, BIN
 * - Word Sizes: 64-bit (QWORD), 32-bit (DWORD), 16-bit (WORD), 8-bit (BYTE)
 * - Interactive 64-bit Clickable Grid (toggles individual bits live)
 * - Bitwise Operators: AND, OR, XOR, NOT, NAND, NOR, LSH, RSH, ROL, ROR
 * - Two's Complement & One's Complement calculations
 * - Signed vs Unsigned decimal representation
 * - Safe BigInt architecture with zero precision loss
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.OmniProgrammer = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const WORD_SIZES = {
    64: { name: 'QWORD', bits: 64, mask: 0xFFFFFFFFFFFFFFFFn, maxSigned: 0x7FFFFFFFFFFFFFFFn },
    32: { name: 'DWORD', bits: 32, mask: 0xFFFFFFFFn, maxSigned: 0x7FFFFFFFn },
    16: { name: 'WORD', bits: 16, mask: 0xFFFFn, maxSigned: 0x7FFFn },
    8: { name: 'BYTE', bits: 8, mask: 0xFFn, maxSigned: 0x7Fn }
  };

  class ProgrammerCalculator {
    constructor() {
      this.wordSizeBits = 64;
      this.currentBase = 10; // 16 (HEX), 10 (DEC), 8 (OCT), 2 (BIN)
      this.currentValue = 0n; // Stored as BigInt
      this.pendingValue = 0n;
      this.pendingOp = null; // 'AND', 'OR', 'XOR', 'NAND', 'NOR', 'LSH', 'RSH', etc.
      this.newInputMode = true; // True when next digit should replace or append
      this.listeners = new Set();
    }

    subscribe(fn) {
      this.listeners.add(fn);
      return () => this.listeners.delete(fn);
    }

    notify(type) {
      const state = this.getState();
      for (const fn of this.listeners) {
        fn(type, state);
      }
    }

    setWordSize(bits) {
      if (WORD_SIZES[bits]) {
        this.wordSizeBits = bits;
        this.maskCurrentValue();
        this.notify('word_size_change');
      }
    }

    getWordConfig() {
      return WORD_SIZES[this.wordSizeBits];
    }

    maskCurrentValue() {
      const mask = this.getWordConfig().mask;
      this.currentValue = this.currentValue & mask;
    }

    setBase(base) {
      if ([16, 10, 8, 2].includes(base)) {
        this.currentBase = base;
        this.notify('base_change');
      }
    }

    // Returns current signed value (two's complement)
    getSignedDecimal() {
      const { bits, mask, maxSigned } = this.getWordConfig();
      const val = this.currentValue & mask;
      if (val > maxSigned) {
        // Negative in two's complement
        return (val - (1n << BigInt(bits))).toString(10);
      }
      return val.toString(10);
    }

    // Returns formatted string in base
    getStringInBase(radix) {
      const mask = this.getWordConfig().mask;
      const val = this.currentValue & mask;
      let str = val.toString(radix).toUpperCase();
      return str;
    }

    // Formatted binary string with bit groups of 4
    getBinaryFormatted() {
      const bits = this.wordSizeBits;
      const mask = this.getWordConfig().mask;
      const val = this.currentValue & mask;
      let bin = val.toString(2);
      bin = bin.padStart(bits, '0');

      // Group into nibbles (4 bits)
      const groups = [];
      for (let i = 0; i < bits; i += 4) {
        groups.push(bin.slice(i, i + 4));
      }
      return groups.join(' ');
    }

    // Formatted hex string with 2-byte or 4-byte spacing
    getHexFormatted() {
      const mask = this.getWordConfig().mask;
      const val = this.currentValue & mask;
      let hex = val.toString(16).toUpperCase();
      const expectedChars = this.wordSizeBits / 4;
      return hex.padStart(expectedChars, '0');
    }

    getState() {
      return {
        wordSize: this.wordSizeBits,
        wordName: this.getWordConfig().name,
        currentBase: this.currentBase,
        rawBigInt: this.currentValue,
        hex: this.getStringInBase(16),
        hexFormatted: this.getHexFormatted(),
        dec: this.currentValue.toString(10),
        decSigned: this.getSignedDecimal(),
        oct: this.getStringInBase(8),
        bin: this.getStringInBase(2),
        binFormatted: this.getBinaryFormatted(),
        pendingOp: this.pendingOp,
        newInputMode: this.newInputMode
      };
    }

    // Input a single digit or char (0-9, A-F)
    inputDigit(digitChar) {
      const char = digitChar.toUpperCase();
      const validDigits = {
        2: '01',
        8: '01234567',
        10: '0123456789',
        16: '0123456789ABCDEF'
      };

      if (!validDigits[this.currentBase].includes(char)) {
        return; // Invalid digit for active base
      }

      if (this.newInputMode) {
        this.currentValue = BigInt(parseInt(char, this.currentBase));
        this.newInputMode = false;
      } else {
        const curStr = this.currentValue.toString(this.currentBase);
        const newStr = curStr === '0' ? char : curStr + char;
        try {
          this.setValueFromString(newStr, this.currentBase);
        } catch (e) {
          // Input too large for word size
        }
      }
      this.maskCurrentValue();
      this.notify('input');
    }

    setValueFromString(str, radix) {
      if (!str || !str.trim()) {
        this.currentValue = 0n;
        this.notify('input');
        return;
      }
      try {
        let clean = str.trim();
        let isNegative = false;
        if (clean.startsWith('-')) {
          isNegative = true;
          clean = clean.slice(1);
        }

        // Parse custom radix safely with BigInt
        let val = 0n;
        const radBig = BigInt(radix);
        for (let i = 0; i < clean.length; i++) {
          const digit = parseInt(clean[i], radix);
          if (isNaN(digit)) break;
          val = val * radBig + BigInt(digit);
        }

        if (isNegative) {
          const { bits, mask } = this.getWordConfig();
          val = ((1n << BigInt(bits)) - val) & mask;
        }

        this.currentValue = val;
        this.maskCurrentValue();
        this.notify('input');
      } catch (e) {
        // Ignore parsing errors
      }
    }

    // Toggle a specific bit index (0 to 63)
    toggleBit(index) {
      if (index < 0 || index >= this.wordSizeBits) return;
      const bitMask = 1n << BigInt(index);
      this.currentValue = this.currentValue ^ bitMask;
      this.maskCurrentValue();
      this.newInputMode = false;
      this.notify('bit_toggle');
    }

    getBit(index) {
      const bitMask = 1n << BigInt(index);
      return (this.currentValue & bitMask) !== 0n ? 1 : 0;
    }

    // Unary Bitwise Operations
    bitwiseNot() {
      // One's complement inverted bits within word size
      const mask = this.getWordConfig().mask;
      this.currentValue = (~this.currentValue) & mask;
      this.notify('operation');
    }

    twosComplement() {
      // Two's complement: (~X + 1)
      const mask = this.getWordConfig().mask;
      this.currentValue = ((~this.currentValue) + 1n) & mask;
      this.notify('operation');
    }

    shiftLeft(amount = 1n) {
      const mask = this.getWordConfig().mask;
      this.currentValue = (this.currentValue << amount) & mask;
      this.notify('operation');
    }

    shiftRight(amount = 1n) {
      // Logical right shift
      this.currentValue = (this.currentValue >> amount);
      this.notify('operation');
    }

    rotateLeft(amount = 1n) {
      const bits = BigInt(this.wordSizeBits);
      const mask = this.getWordConfig().mask;
      const amt = amount % bits;
      const leftPart = (this.currentValue << amt) & mask;
      const rightPart = (this.currentValue >> (bits - amt)) & mask;
      this.currentValue = (leftPart | rightPart) & mask;
      this.notify('operation');
    }

    rotateRight(amount = 1n) {
      const bits = BigInt(this.wordSizeBits);
      const mask = this.getWordConfig().mask;
      const amt = amount % bits;
      const rightPart = (this.currentValue >> amt) & mask;
      const leftPart = (this.currentValue << (bits - amt)) & mask;
      this.currentValue = (leftPart | rightPart) & mask;
      this.notify('operation');
    }

    // Binary Bitwise Operations: AND, OR, XOR, NAND, NOR
    setOperation(op) {
      if (this.pendingOp && !this.newInputMode) {
        this.computePending();
      }
      this.pendingValue = this.currentValue;
      this.pendingOp = op;
      this.newInputMode = true;
      this.notify('pending_op');
    }

    computePending() {
      if (!this.pendingOp) return;
      const mask = this.getWordConfig().mask;
      const a = this.pendingValue;
      const b = this.currentValue;

      switch (this.pendingOp) {
        case 'AND':
          this.currentValue = (a & b) & mask;
          break;
        case 'OR':
          this.currentValue = (a | b) & mask;
          break;
        case 'XOR':
          this.currentValue = (a ^ b) & mask;
          break;
        case 'NAND':
          this.currentValue = (~(a & b)) & mask;
          break;
        case 'NOR':
          this.currentValue = (~(a | b)) & mask;
          break;
        case 'LSH':
          this.currentValue = (a << (b & 0x3Fn)) & mask;
          break;
        case 'RSH':
          this.currentValue = (a >> (b & 0x3Fn)) & mask;
          break;
      }

      this.pendingOp = null;
      this.newInputMode = true;
      this.notify('compute');
    }

    backspace() {
      const str = this.currentValue.toString(this.currentBase);
      if (str.length <= 1) {
        this.currentValue = 0n;
      } else {
        const sliced = str.slice(0, -1);
        this.setValueFromString(sliced, this.currentBase);
      }
      this.notify('input');
    }

    clear() {
      this.currentValue = 0n;
      this.notify('input');
    }

    clearAll() {
      this.currentValue = 0n;
      this.pendingValue = 0n;
      this.pendingOp = null;
      this.newInputMode = true;
      this.notify('clear_all');
    }
  }

  return {
    WORD_SIZES,
    ProgrammerCalculator
  };
});
