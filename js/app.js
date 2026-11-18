/**
 * app.js - Main Application Coordinator & UI Controller
 * OmniCalc Pro - Engineering Calculator
 * Developer: Sujal Mahalange
 * 
 * Features:
 * - Tab / Sidebar navigation across 9 modes
 * - Full Keyboard shortcuts integration + Help Modal
 * - Voice Input via Web Speech API with fallbacks
 * - Copy result & "Copy as LaTeX" formatting
 * - Toast notification system
 * - Engineering Constants & Formula Cheat Sheet modals
 * - PWA Service Worker registration
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // --- Initializing Core Engines ---
  const standardCalc = new OmniCalculator.StandardCalculator();
  const sciController = new OmniScientific.ScientificController(standardCalc);
  const progCalc = new OmniProgrammer.ProgrammerCalculator();
  const historyMgr = new OmniHistory.HistoryManager();
  const themeMgr = new OmniTheme.ThemeManager();

  let graphPlotter = null;
  let activeMode = 'standard';

  // --- Toast Notification System ---
  function showToast(message, type = 'info', duration = 2800) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Choose icon
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';
    } else if (type === 'error') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
    } else {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
    }

    toast.innerHTML = `<span class="toast-icon">${iconSvg}</span><span class="toast-text">${message}</span>`;
    container.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('toast-visible'), 10);

    setTimeout(() => {
      toast.classList.remove('toast-visible');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // --- LaTeX Formatter Helper ---
  function convertToLaTeX(expr, result) {
    if (!expr) return '';
    let latex = expr
      .replace(/\s+/g, '')
      .replace(/pi/g, '\\pi ')
      .replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}')
      .replace(/cbrt\(([^)]+)\)/g, '\\sqrt[3]{$1}')
      .replace(/root\(([^,]+),([^)]+)\)/g, '\\sqrt[$2]{$1}')
      .replace(/sin\(([^)]+)\)/g, '\\sin\\left($1\\right)')
      .replace(/cos\(([^)]+)\)/g, '\\cos\\left($1\\right)')
      .replace(/tan\(([^)]+)\)/g, '\\tan\\left($1\\right)')
      .replace(/asin\(([^)]+)\)/g, '\\arcsin\\left($1\\right)')
      .replace(/acos\(([^)]+)\)/g, '\\arccos\\left($1\\right)')
      .replace(/atan\(([^)]+)\)/g, '\\arctan\\left($1\\right)')
      .replace(/ln\(([^)]+)\)/g, '\\ln\\left($1\\right)')
      .replace(/log\(([^)]+)\)/g, '\\log_{10}\\left($1\\right)')
      .replace(/exp\(([^)]+)\)/g, 'e^{$1}')
      .replace(/\*/g, ' \\times ')
      .replace(/\//g, ' \\div ')
      .replace(/\^([0-9a-zA-Z]+)/g, '^{$1}')
      .replace(/\^(\([^)]+\))/g, '^{$1}');

    if (result !== undefined && result !== null && result !== '') {
      return `\\[ ${latex} = ${result} \\]`;
    }
    return `\\[ ${latex} \\]`;
  }

  // --- Mode Switching Logic ---
  const modeButtons = document.querySelectorAll('.mode-nav-btn');
  const modePanels = document.querySelectorAll('.calc-panel');

  function switchMode(newMode) {
    if (activeMode === newMode) return;
    activeMode = newMode;

    modeButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === newMode);
      btn.setAttribute('aria-selected', btn.dataset.mode === newMode ? 'true' : 'false');
    });

    modePanels.forEach(panel => {
      if (panel.id === `panel-${newMode}`) {
        panel.classList.add('active');
        panel.removeAttribute('hidden');
      } else {
        panel.classList.remove('active');
        panel.setAttribute('hidden', 'true');
      }
    });

    // Handle special initialization
    if (newMode === 'graphing') {
      setTimeout(() => {
        if (!graphPlotter) {
          const canvas = document.getElementById('graph-canvas');
          if (canvas) {
            graphPlotter = new OmniGraph.GraphPlotter(canvas, {
              theme: themeMgr.getTheme()
            });
            initGraphingControls();
          }
        } else {
          graphPlotter.resize();
        }
      }, 50);
    }

    if (newMode === 'programmer') {
      updateProgrammerUI();
    }

    // Scroll active nav button into view on mobile
    const activeBtn = document.querySelector(`.mode-nav-btn[data-mode="${newMode}"]`);
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => switchMode(btn.dataset.mode));
  });

  // --- Theme Switching ---
  const themeToggleBtn = document.getElementById('btn-toggle-theme');
  function updateThemeButtonIcon(theme) {
    if (!themeToggleBtn) return;
    const labelSpan = themeToggleBtn.querySelector('.theme-label');
    if (labelSpan) {
      labelSpan.textContent = theme.charAt(0).toUpperCase() + theme.slice(1);
    }
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const nextTheme = themeMgr.cycleTheme();
      updateThemeButtonIcon(nextTheme);
      if (graphPlotter) {
        graphPlotter.setTheme(nextTheme);
      }
      showToast(`Theme changed to ${nextTheme.toUpperCase()}`, 'info');
    });
    updateThemeButtonIcon(themeMgr.getTheme());
  }

  // --- Sound Toggle ---
  const soundToggleBtn = document.getElementById('btn-toggle-sound');
  if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', () => {
      const isMuted = !OmniCalculator.isSoundEnabled();
      OmniCalculator.setSoundEnabled(isMuted);
      soundToggleBtn.classList.toggle('muted', !isMuted);
      soundToggleBtn.setAttribute('title', isMuted ? 'Sound: Enabled' : 'Sound: Muted');
      showToast(isMuted ? 'Audio feedback ON' : 'Audio feedback OFF', 'info');
    });
  }

  // --- Standard & Scientific Display Updates ---
  const exprInput = document.getElementById('calc-expression-input');
  const resultDisplay = document.getElementById('calc-result-display');
  const previewDisplay = document.getElementById('calc-preview-display');
  const angleModeToggleBtn = document.getElementById('btn-angle-mode');
  const sciAngleModeToggleBtn = document.getElementById('btn-sci-angle-mode');
  const secondFnToggleBtn = document.getElementById('btn-2nd-fn');
  const hypToggleBtn = document.getElementById('btn-hyp-fn');
  const memoryBadge = document.getElementById('memory-active-indicator');
  const sciMemoryBadge = document.getElementById('sci-memory-indicator');

  const sciExprInput = document.getElementById('sci-expression-input');
  const sciResultDisplay = document.getElementById('sci-result-display');
  const sciPreviewDisplay = document.getElementById('sci-preview-display');

  function updateStandardUI(eventType, data, state) {
    // Standard Display
    if (exprInput) {
      exprInput.value = state.expression;
      exprInput.scrollLeft = exprInput.scrollWidth;
    }
    if (previewDisplay) {
      previewDisplay.textContent = state.preview ? `= ${state.preview}` : '';
    }
    if (angleModeToggleBtn) {
      angleModeToggleBtn.textContent = state.angleMode;
    }
    if (memoryBadge) {
      memoryBadge.style.display = state.memory !== 0 ? 'inline-block' : 'none';
      memoryBadge.textContent = state.memory !== 0 ? `M (${OmniCalculator.formatNumber(state.memory, 3)})` : '';
    }

    // Scientific Mirror Display
    if (sciExprInput) {
      sciExprInput.value = state.expression;
      sciExprInput.scrollLeft = sciExprInput.scrollWidth;
    }
    if (sciPreviewDisplay) {
      sciPreviewDisplay.textContent = state.preview ? `= ${state.preview}` : '';
    }
    if (sciAngleModeToggleBtn) {
      sciAngleModeToggleBtn.textContent = state.angleMode;
    }
    if (sciMemoryBadge) {
      sciMemoryBadge.style.display = state.memory !== 0 ? 'inline-block' : 'none';
      sciMemoryBadge.textContent = state.memory !== 0 ? `M (${OmniCalculator.formatNumber(state.memory, 3)})` : '';
    }

    if (eventType === 'calculate_success') {
      if (resultDisplay) {
        resultDisplay.textContent = data.formattedResult;
        resultDisplay.classList.remove('number-pop');
        void resultDisplay.offsetWidth;
        resultDisplay.classList.add('number-pop');
      }
      if (sciResultDisplay) {
        sciResultDisplay.textContent = data.formattedResult;
        sciResultDisplay.classList.remove('number-pop');
        void sciResultDisplay.offsetWidth;
        sciResultDisplay.classList.add('number-pop');
      }
      historyMgr.add(data.expression, data.formattedResult, state.angleMode);
    } else if (eventType === 'calculate_error') {
      showToast(data.error, 'error');
      document.querySelectorAll('.calculator-main-card').forEach(card => {
        card.classList.add('shake-error');
        setTimeout(() => card.classList.remove('shake-error'), 450);
      });
    }
  }

  standardCalc.subscribe(updateStandardUI);

  // Manual expression typing support for both inputs
  [exprInput, sciExprInput].forEach(inp => {
    if (inp) {
      inp.addEventListener('input', (e) => {
        standardCalc.setExpression(e.target.value);
      });

      inp.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          try {
            standardCalc.calculate();
          } catch (err) {}
        }
      });
    }
  });

  // Angle mode toggles
  [angleModeToggleBtn, sciAngleModeToggleBtn].forEach(btn => {
    if (btn) {
      btn.addEventListener('click', () => {
        const current = standardCalc.angleMode;
        const modes = ['DEG', 'RAD', 'GRAD'];
        const next = modes[(modes.indexOf(current) + 1) % modes.length];
        standardCalc.setAngleMode(next);
        showToast(`Angle mode: ${next}`, 'info');
      });
    }
  });

  // 2nd function toggle
  if (secondFnToggleBtn) {
    secondFnToggleBtn.addEventListener('click', () => {
      const is2nd = sciController.toggle2nd();
      secondFnToggleBtn.classList.toggle('active-accent', is2nd);
      document.querySelectorAll('.key-2nd-target').forEach(el => {
        const altText = el.dataset.alt;
        const mainText = el.dataset.main;
        el.textContent = is2nd && altText ? altText : mainText;
      });
      showToast(is2nd ? '2nd Function Active' : 'Standard Functions Active', 'info');
    });
  }

  // Hyperbolic function toggle
  if (hypToggleBtn) {
    hypToggleBtn.addEventListener('click', () => {
      const isHyp = sciController.toggleHyp();
      hypToggleBtn.classList.toggle('active-accent', isHyp);
      showToast(isHyp ? 'Hyperbolic Mode Active' : 'Normal Mode Active', 'info');
    });
  }

  // Keypad click delegation for standard & scientific keys
  document.querySelectorAll('.calc-keypad').forEach(keypad => {
    keypad.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;

      // Ripple animation effect
      createRipple(e, btn);

      const action = btn.dataset.action;
      const val = btn.dataset.val;
      const fn = btn.dataset.fn;

      if (action === 'calculate') {
        try {
          standardCalc.calculate();
        } catch (err) {}
      } else if (action === 'clear') {
        standardCalc.clear();
      } else if (action === 'clear-all') {
        standardCalc.clearAll();
      } else if (action === 'backspace') {
        standardCalc.backspace();
      } else if (action === 'memory-add') {
        standardCalc.memoryAdd();
        showToast('Added to Memory (M+)', 'success');
      } else if (action === 'memory-sub') {
        standardCalc.memorySubtract();
        showToast('Subtracted from Memory (M−)', 'info');
      } else if (action === 'memory-recall') {
        standardCalc.memoryRecall();
      } else if (action === 'memory-clear') {
        standardCalc.memoryClear();
        showToast('Memory Cleared (MC)', 'info');
      } else if (fn) {
        sciController.handleFunction(fn);
      } else if (val !== undefined) {
        standardCalc.append(val);
      }
    });
  });

  // Ripple visual effect on button click
  function createRipple(event, button) {
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    const rect = button.getBoundingClientRect();

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - rect.left - radius}px`;
    circle.style.top = `${event.clientY - rect.top - radius}px`;
    circle.classList.add('ripple');

    const existing = button.querySelector('.ripple');
    if (existing) existing.remove();

    button.appendChild(circle);
    setTimeout(() => circle.remove(), 600);
  }

  // --- Copy Result & Copy as LaTeX ---
  const btnCopyResult = document.getElementById('btn-copy-result');
  const btnCopyLatex = document.getElementById('btn-copy-latex');

  if (btnCopyResult) {
    btnCopyResult.addEventListener('click', () => {
      const activeRes = (activeMode === 'scientific' && sciResultDisplay) ? sciResultDisplay : resultDisplay;
      const textToCopy = activeRes ? activeRes.textContent.trim() : '';
      if (!textToCopy) {
        showToast('Nothing to copy', 'info');
        return;
      }
      navigator.clipboard.writeText(textToCopy).then(() => {
        showToast(`Copied "${textToCopy}" to clipboard!`, 'success');
      }).catch(() => {
        showToast('Copy failed, permission denied', 'error');
      });
    });
  }

  if (btnCopyLatex) {
    btnCopyLatex.addEventListener('click', () => {
      const activeExp = (activeMode === 'scientific' && sciExprInput) ? sciExprInput : exprInput;
      const activeRes = (activeMode === 'scientific' && sciResultDisplay) ? sciResultDisplay : resultDisplay;
      const expr = activeExp ? activeExp.value.trim() : '';
      const res = activeRes ? activeRes.textContent.trim() : '';
      if (!expr) {
        showToast('Enter an expression first', 'info');
        return;
      }
      const latex = convertToLaTeX(expr, res);
      navigator.clipboard.writeText(latex).then(() => {
        showToast('Copied as LaTeX formula!', 'success');
      }).catch(() => {
        showToast('Copy failed', 'error');
      });
    });
  }

  // --- Voice Input (Web Speech API) ---
  const voiceBtn = document.getElementById('btn-voice-input');
  let recognition = null;
  let isListening = false;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      isListening = true;
      if (voiceBtn) voiceBtn.classList.add('listening');
      showToast('Listening... Speak a math expression', 'info', 4000);
    };

    recognition.onend = () => {
      isListening = false;
      if (voiceBtn) voiceBtn.classList.remove('listening');
    };

    recognition.onerror = (e) => {
      isListening = false;
      if (voiceBtn) voiceBtn.classList.remove('listening');
      showToast(`Speech error: ${e.error}`, 'error');
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      showToast(`Heard: "${transcript}"`, 'info');
      parseVoiceCommand(transcript);
    };
  }

  function parseVoiceCommand(text) {
    if (!text) return;

    if (text.includes('clear') || text.includes('reset')) {
      standardCalc.clearAll();
      return;
    }
    if (text.includes('equal') || text.includes('calculate')) {
      try {
        standardCalc.calculate();
      } catch (e) {}
      return;
    }

    // Replace spoken math words with symbols
    let parsed = text
      .replace(/plus/g, '+')
      .replace(/minus/g, '-')
      .replace(/times|multiplied by/g, '*')
      .replace(/divided by|over/g, '/')
      .replace(/to the power of/g, '^')
      .replace(/squared/g, '^2')
      .replace(/cubed/g, '^3')
      .replace(/square root of|square root/g, 'sqrt(')
      .replace(/cube root of/g, 'cbrt(')
      .replace(/sine of|sine|sign of/g, 'sin(')
      .replace(/cosine of|cosine|cause of/g, 'cos(')
      .replace(/tangent of|tangent/g, 'tan(')
      .replace(/pi/g, 'pi')
      .replace(/open parenthesis|open bracket/g, '(')
      .replace(/close parenthesis|close bracket/g, ')')
      .replace(/percent/g, '%');

    // Numbers written in words
    const wordNums = {
      zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
      six: 6, seven: 7, eight: 8, nine: 9, ten: 10
    };
    for (const [w, n] of Object.entries(wordNums)) {
      const regex = new RegExp(`\\b${w}\\b`, 'g');
      parsed = parsed.replace(regex, n);
    }

    standardCalc.append(parsed);
  }

  if (voiceBtn) {
    voiceBtn.addEventListener('click', () => {
      if (!SpeechRecognition) {
        showToast('Voice input is not supported in this browser. Try Chrome or Edge.', 'error');
        return;
      }
      if (isListening) {
        recognition.stop();
      } else {
        try {
          recognition.start();
        } catch (e) {
          showToast('Could not start microphone', 'error');
        }
      }
    });
  }

  // --- History Drawer & Panel ---
  const historyToggleBtn = document.getElementById('btn-toggle-history');
  const historyDrawer = document.getElementById('history-drawer');
  const historyCloseBtn = document.getElementById('btn-close-history');
  const historyList = document.getElementById('history-list');
  const historyClearBtn = document.getElementById('btn-clear-history');

  function openHistory() {
    if (historyDrawer) {
      historyDrawer.classList.add('open');
      historyDrawer.removeAttribute('hidden');
    }
  }

  function closeHistory() {
    if (historyDrawer) {
      historyDrawer.classList.remove('open');
      historyDrawer.setAttribute('hidden', 'true');
    }
  }

  if (historyToggleBtn) historyToggleBtn.addEventListener('click', openHistory);
  if (historyCloseBtn) historyCloseBtn.addEventListener('click', closeHistory);

  function renderHistoryUI(entries) {
    if (!historyList) return;
    if (entries.length === 0) {
      historyList.innerHTML = `
        <div class="empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <p>No calculation history yet</p>
          <span>Calculations you perform will appear here</span>
        </div>
      `;
      return;
    }

    historyList.innerHTML = entries.map(item => `
      <div class="history-item" data-id="${item.id}" data-expr="${encodeURIComponent(item.expression)}" data-res="${encodeURIComponent(item.result)}">
        <div class="history-meta">
          <span class="history-badge">${item.mode || 'Standard'}</span>
          <span class="history-time">${item.timestamp}</span>
          <button class="btn-delete-entry" data-id="${item.id}" title="Delete entry">&times;</button>
        </div>
        <div class="history-expr">${escapeHtml(item.expression)} =</div>
        <div class="history-res">${escapeHtml(item.result)}</div>
      </div>
    `).join('');

    // Attach click listeners
    historyList.querySelectorAll('.history-item').forEach(itemEl => {
      itemEl.addEventListener('click', (e) => {
        if (e.target.closest('.btn-delete-entry')) return;
        const expr = decodeURIComponent(itemEl.dataset.expr);
        const res = decodeURIComponent(itemEl.dataset.res);
        standardCalc.setExpression(res);
        showToast(`Loaded ${res} into calculator`, 'info');
        closeHistory();
      });
    });

    historyList.querySelectorAll('.btn-delete-entry').forEach(delBtn => {
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        historyMgr.remove(delBtn.dataset.id);
        showToast('Entry removed', 'info');
      });
    });
  }

  historyMgr.subscribe(renderHistoryUI);
  renderHistoryUI(historyMgr.getAll());

  if (historyClearBtn) {
    historyClearBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all calculation history?')) {
        historyMgr.clear();
        showToast('History cleared', 'info');
      }
    });
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // --- PROGRAMMER CALCULATOR LOGIC ---
  const progHexVal = document.getElementById('prog-hex-val');
  const progDecVal = document.getElementById('prog-dec-val');
  const progOctVal = document.getElementById('prog-oct-val');
  const progBinVal = document.getElementById('prog-bin-val');
  const progBitGrid = document.getElementById('prog-bit-grid');
  const progWordSizeSelect = document.getElementById('prog-word-size');

  function updateProgrammerUI() {
    const state = progCalc.getState();

    if (progHexVal) progHexVal.textContent = state.hex || '0';
    if (progDecVal) progDecVal.textContent = state.dec || '0';
    if (progOctVal) progOctVal.textContent = state.oct || '0';
    if (progBinVal) progBinVal.textContent = state.binFormatted || '0';

    // Highlight current active base
    document.querySelectorAll('.prog-base-row').forEach(row => {
      const base = parseInt(row.dataset.base, 10);
      row.classList.toggle('active-base', base === state.currentBase);
    });

    // Enable/disable keys based on base
    document.querySelectorAll('.prog-key').forEach(key => {
      const digit = key.dataset.digit;
      if (digit) {
        const char = digit.toUpperCase();
        const validForBase = (
          (state.currentBase === 2 && '01'.includes(char)) ||
          (state.currentBase === 8 && '01234567'.includes(char)) ||
          (state.currentBase === 10 && '0123456789'.includes(char)) ||
          (state.currentBase === 16 && '0123456789ABCDEF'.includes(char))
        );
        key.disabled = !validForBase;
        key.classList.toggle('disabled-key', !validForBase);
      }
    });

    // Render interactive bit-toggle grid (64 bits or active word size)
    renderBitGrid(state);
  }

  function renderBitGrid(state) {
    if (!progBitGrid) return;
    const bits = state.wordSize;
    let html = '';

    // Group into 4-bit nibbles, from bit (bits-1) down to 0
    for (let i = bits - 1; i >= 0; i--) {
      const bitVal = progCalc.getBit(i);
      const isStartOfNibble = (i % 4 === 3);
      const isEndOfNibble = (i % 4 === 0);

      if (isStartOfNibble) {
        html += `<div class="bit-nibble-group"><span class="bit-index">${i}</span><div class="nibble-bits">`;
      }

      html += `<button type="button" class="bit-cell ${bitVal === 1 ? 'bit-active' : ''}" data-bit="${i}">${bitVal}</button>`;

      if (isEndOfNibble) {
        html += `</div></div>`;
      }
    }

    progBitGrid.innerHTML = html;

    // Attach click listeners to bit cells
    progBitGrid.querySelectorAll('.bit-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        const bitIdx = parseInt(cell.dataset.bit, 10);
        progCalc.toggleBit(bitIdx);
        OmniCalculator.playTone(600, 0.02);
      });
    });
  }

  progCalc.subscribe(() => {
    updateProgrammerUI();
  });

  // Base selection row clicks
  document.querySelectorAll('.prog-base-row').forEach(row => {
    row.addEventListener('click', () => {
      const base = parseInt(row.dataset.base, 10);
      progCalc.setBase(base);
    });
  });

  // Word size selector
  if (progWordSizeSelect) {
    progWordSizeSelect.addEventListener('change', (e) => {
      progCalc.setWordSize(parseInt(e.target.value, 10));
    });
  }

  // Programmer keypad delegation
  const progKeypad = document.getElementById('prog-keypad');
  if (progKeypad) {
    progKeypad.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn || btn.disabled) return;
      createRipple(e, btn);

      const digit = btn.dataset.digit;
      const op = btn.dataset.op;
      const action = btn.dataset.action;

      if (digit) {
        progCalc.inputDigit(digit);
        OmniCalculator.playTone(550, 0.02);
      } else if (op) {
        progCalc.setOperation(op);
        OmniCalculator.playTone(600, 0.03);
      } else if (action === 'equals') {
        progCalc.computePending();
        OmniCalculator.playTone(750, 0.04);
      } else if (action === 'not') {
        progCalc.bitwiseNot();
      } else if (action === 'twos') {
        progCalc.twosComplement();
      } else if (action === 'lsh') {
        progCalc.shiftLeft(1n);
      } else if (action === 'rsh') {
        progCalc.shiftRight(1n);
      } else if (action === 'rol') {
        progCalc.rotateLeft(1n);
      } else if (action === 'ror') {
        progCalc.rotateRight(1n);
      } else if (action === 'backspace') {
        progCalc.backspace();
      } else if (action === 'clear') {
        progCalc.clear();
      } else if (action === 'clear-all') {
        progCalc.clearAll();
      }
    });
  }

  // --- GRAPHING CONTROLS ---
  function initGraphingControls() {
    if (!graphPlotter) return;

    const fn1Input = document.getElementById('graph-fn-1');
    const fn2Input = document.getElementById('graph-fn-2');
    const fn3Input = document.getElementById('graph-fn-3');

    const fn1Toggle = document.getElementById('graph-toggle-1');
    const fn2Toggle = document.getElementById('graph-toggle-2');
    const fn3Toggle = document.getElementById('graph-toggle-3');

    if (fn1Input) {
      fn1Input.addEventListener('input', (e) => {
        graphPlotter.updateFunction(1, { expr: e.target.value });
      });
    }
    if (fn2Input) {
      fn2Input.addEventListener('input', (e) => {
        graphPlotter.updateFunction(2, { expr: e.target.value });
      });
    }
    if (fn3Input) {
      fn3Input.addEventListener('input', (e) => {
        let f3 = graphPlotter.functions.find(f => f.id === 3);
        if (!f3) {
          f3 = graphPlotter.addFunction(e.target.value, OmniGraph.DEFAULT_COLORS[2]);
        } else {
          graphPlotter.updateFunction(3, { expr: e.target.value, visible: true });
        }
      });
    }

    if (fn1Toggle) {
      fn1Toggle.addEventListener('change', (e) => {
        graphPlotter.updateFunction(1, { visible: e.target.checked });
      });
    }
    if (fn2Toggle) {
      fn2Toggle.addEventListener('change', (e) => {
        graphPlotter.updateFunction(2, { visible: e.target.checked });
      });
    }
    if (fn3Toggle) {
      fn3Toggle.addEventListener('change', (e) => {
        graphPlotter.updateFunction(3, { visible: e.target.checked });
      });
    }

    // Zoom Buttons
    document.getElementById('btn-graph-zoom-in')?.addEventListener('click', () => graphPlotter.zoom(0.8));
    document.getElementById('btn-graph-zoom-out')?.addEventListener('click', () => graphPlotter.zoom(1.25));
    document.getElementById('btn-graph-reset')?.addEventListener('click', () => {
      graphPlotter.resetView();
      showToast('Graph view reset', 'info');
    });

    // Preset Buttons
    document.querySelectorAll('.graph-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const presetExpr = btn.dataset.expr;
        if (fn1Input) {
          fn1Input.value = presetExpr;
          graphPlotter.updateFunction(1, { expr: presetExpr, visible: true });
          if (fn1Toggle) fn1Toggle.checked = true;
          showToast(`Plotted: ${presetExpr}`, 'info');
        }
      });
    });
  }

  // --- MATRIX CALCULATOR LOGIC ---
  let matrixA = OmniMatrix.MatrixEngine.create(3, 3, 0);
  let matrixB = OmniMatrix.MatrixEngine.create(3, 3, 0);
  let lastMatrixResult = null;

  function renderMatrixInputs() {
    renderSingleMatrixGrid('mat-a-grid', matrixA, 'A');
    renderSingleMatrixGrid('mat-b-grid', matrixB, 'B');
  }

  function renderSingleMatrixGrid(containerId, mat, name) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.style.gridTemplateColumns = `repeat(${mat.cols}, 1fr)`;
    let html = '';

    for (let r = 0; r < mat.rows; r++) {
      for (let c = 0; c < mat.cols; c++) {
        html += `<input type="number" step="any" class="matrix-cell-input" data-matrix="${name}" data-row="${r}" data-col="${c}" value="${mat.data[r][c]}">`;
      }
    }
    container.innerHTML = html;

    container.querySelectorAll('.matrix-cell-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const r = parseInt(e.target.dataset.row, 10);
        const c = parseInt(e.target.dataset.col, 10);
        const targetMat = e.target.dataset.matrix === 'A' ? matrixA : matrixB;
        targetMat.data[r][c] = parseFloat(e.target.value) || 0;
      });
    });
  }

  // Size selectors for Matrix A & B
  const sizeSelectA = document.getElementById('mat-a-size');
  const sizeSelectB = document.getElementById('mat-b-size');

  if (sizeSelectA) {
    sizeSelectA.addEventListener('change', (e) => {
      const [r, c] = e.target.value.split('x').map(Number);
      matrixA = OmniMatrix.MatrixEngine.create(r, c, 0);
      renderMatrixInputs();
    });
  }

  if (sizeSelectB) {
    sizeSelectB.addEventListener('change', (e) => {
      const [r, c] = e.target.value.split('x').map(Number);
      matrixB = OmniMatrix.MatrixEngine.create(r, c, 0);
      renderMatrixInputs();
    });
  }

  // Preset fills (Identity, Zero, Random)
  document.querySelectorAll('.matrix-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target; // 'A' or 'B'
      const type = btn.dataset.type; // 'id', 'zero', 'rand'
      const targetMat = target === 'A' ? matrixA : matrixB;

      if (type === 'id') {
        const minDim = Math.min(targetMat.rows, targetMat.cols);
        for (let r = 0; r < targetMat.rows; r++) {
          for (let c = 0; c < targetMat.cols; c++) {
            targetMat.data[r][c] = (r === c && r < minDim) ? 1 : 0;
          }
        }
      } else if (type === 'zero') {
        for (let r = 0; r < targetMat.rows; r++) {
          for (let c = 0; c < targetMat.cols; c++) {
            targetMat.data[r][c] = 0;
          }
        }
      } else if (type === 'rand') {
        for (let r = 0; r < targetMat.rows; r++) {
          for (let c = 0; c < targetMat.cols; c++) {
            targetMat.data[r][c] = Math.floor(Math.random() * 11) - 5;
          }
        }
      }
      renderMatrixInputs();
      showToast(`Matrix ${target} updated`, 'info');
    });
  });

  // Matrix Operations Execution
  const matrixResultCard = document.getElementById('matrix-result-container');

  function displayMatrixResult(title, content, isMatrix = true) {
    if (!matrixResultCard) return;
    matrixResultCard.removeAttribute('hidden');

    let contentHtml = '';
    if (isMatrix && content.data) {
      const formatted = OmniMatrix.MatrixEngine.formatMatrix(content);
      lastMatrixResult = formatted;
      contentHtml = `
        <div class="matrix-bracket-view" style="grid-template-columns: repeat(${formatted.cols}, 1fr)">
          ${formatted.data.map(row => row.map(v => `<span class="mat-res-val">${v}</span>`).join('')).join('')}
        </div>
        <div class="mat-res-actions">
          <button type="button" class="btn btn-secondary btn-sm" id="btn-copy-to-mata">Copy to Matrix A</button>
        </div>
      `;
    } else {
      contentHtml = `<div class="scalar-result-val">${content}</div>`;
    }

    matrixResultCard.innerHTML = `
      <div class="result-header">
        <span class="result-title">${title}</span>
        <button type="button" class="btn-icon" onclick="this.closest('#matrix-result-container').setAttribute('hidden', 'true')">&times;</button>
      </div>
      ${contentHtml}
    `;

    document.getElementById('btn-copy-to-mata')?.addEventListener('click', () => {
      if (lastMatrixResult) {
        matrixA = OmniMatrix.MatrixEngine.clone(lastMatrixResult);
        if (sizeSelectA) sizeSelectA.value = `${matrixA.rows}x${matrixA.cols}`;
        renderMatrixInputs();
        showToast('Result copied to Matrix A', 'success');
      }
    });

    matrixResultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  document.querySelectorAll('.mat-op-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const op = btn.dataset.op;
      try {
        switch (op) {
          case 'add': {
            const res = OmniMatrix.MatrixEngine.add(matrixA, matrixB);
            displayMatrixResult('Matrix A + Matrix B', res, true);
            break;
          }
          case 'sub': {
            const res = OmniMatrix.MatrixEngine.subtract(matrixA, matrixB);
            displayMatrixResult('Matrix A − Matrix B', res, true);
            break;
          }
          case 'mul': {
            const res = OmniMatrix.MatrixEngine.multiply(matrixA, matrixB);
            displayMatrixResult('Matrix A × Matrix B', res, true);
            break;
          }
          case 'detA': {
            const det = OmniMatrix.MatrixEngine.determinant(matrixA);
            displayMatrixResult('Determinant det(A)', OmniCalculator.formatNumber(det), false);
            break;
          }
          case 'detB': {
            const det = OmniMatrix.MatrixEngine.determinant(matrixB);
            displayMatrixResult('Determinant det(B)', OmniCalculator.formatNumber(det), false);
            break;
          }
          case 'invA': {
            const inv = OmniMatrix.MatrixEngine.inverse(matrixA);
            displayMatrixResult('Inverse A⁻¹', inv, true);
            break;
          }
          case 'invB': {
            const inv = OmniMatrix.MatrixEngine.inverse(matrixB);
            displayMatrixResult('Inverse B⁻¹', inv, true);
            break;
          }
          case 'transA': {
            const trans = OmniMatrix.MatrixEngine.transpose(matrixA);
            displayMatrixResult('Transpose Aᵀ', trans, true);
            break;
          }
          case 'transB': {
            const trans = OmniMatrix.MatrixEngine.transpose(matrixB);
            displayMatrixResult('Transpose Bᵀ', trans, true);
            break;
          }
          case 'rankA': {
            const rank = OmniMatrix.MatrixEngine.rank(matrixA);
            displayMatrixResult('Rank of Matrix A', rank, false);
            break;
          }
        }
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });

  renderMatrixInputs();

  // --- EQUATION SOLVER LOGIC ---
  const solverTypeSelect = document.getElementById('solver-type-select');
  const solverStepsCard = document.getElementById('solver-steps-card');

  function updateSolverInputs() {
    const type = solverTypeSelect ? solverTypeSelect.value : 'quad';
    document.querySelectorAll('.solver-form-group').forEach(group => {
      group.classList.toggle('active-form', group.dataset.solverType === type);
    });
    if (solverStepsCard) solverStepsCard.setAttribute('hidden', 'true');
  }

  if (solverTypeSelect) {
    solverTypeSelect.addEventListener('change', updateSolverInputs);
  }

  // Linear 2x2 Solve
  document.getElementById('btn-solve-linear2')?.addEventListener('click', () => {
    const a1 = parseFloat(document.getElementById('l2-a1').value) || 0;
    const b1 = parseFloat(document.getElementById('l2-b1').value) || 0;
    const c1 = parseFloat(document.getElementById('l2-c1').value) || 0;
    const a2 = parseFloat(document.getElementById('l2-a2').value) || 0;
    const b2 = parseFloat(document.getElementById('l2-b2').value) || 0;
    const c2 = parseFloat(document.getElementById('l2-c2').value) || 0;

    const res = OmniSolver.EquationSolver.solveLinear2(a1, b1, c1, a2, b2, c2);
    displaySolverResult('2×2 Linear System Solution', res);
  });

  // Linear 3x3 Solve
  document.getElementById('btn-solve-linear3')?.addEventListener('click', () => {
    const eq1 = [
      parseFloat(document.getElementById('l3-a1').value) || 0,
      parseFloat(document.getElementById('l3-b1').value) || 0,
      parseFloat(document.getElementById('l3-c1').value) || 0,
      parseFloat(document.getElementById('l3-d1').value) || 0
    ];
    const eq2 = [
      parseFloat(document.getElementById('l3-a2').value) || 0,
      parseFloat(document.getElementById('l3-b2').value) || 0,
      parseFloat(document.getElementById('l3-c2').value) || 0,
      parseFloat(document.getElementById('l3-d2').value) || 0
    ];
    const eq3 = [
      parseFloat(document.getElementById('l3-a3').value) || 0,
      parseFloat(document.getElementById('l3-b3').value) || 0,
      parseFloat(document.getElementById('l3-c3').value) || 0,
      parseFloat(document.getElementById('l3-d3').value) || 0
    ];

    const res = OmniSolver.EquationSolver.solveLinear3(eq1, eq2, eq3);
    displaySolverResult('3×3 Linear System Solution', res);
  });

  // Quadratic Solve
  document.getElementById('btn-solve-quad')?.addEventListener('click', () => {
    const a = parseFloat(document.getElementById('quad-a').value) || 0;
    const b = parseFloat(document.getElementById('quad-b').value) || 0;
    const c = parseFloat(document.getElementById('quad-c').value) || 0;

    try {
      const res = OmniSolver.EquationSolver.solveQuadratic(a, b, c);
      displaySolverResult('Quadratic Equation Solution', res);
    } catch (e) {
      showToast(e.message, 'error');
    }
  });

  // Cubic Solve
  document.getElementById('btn-solve-cubic')?.addEventListener('click', () => {
    const a = parseFloat(document.getElementById('cubic-a').value) || 0;
    const b = parseFloat(document.getElementById('cubic-b').value) || 0;
    const c = parseFloat(document.getElementById('cubic-c').value) || 0;
    const d = parseFloat(document.getElementById('cubic-d').value) || 0;

    try {
      const res = OmniSolver.EquationSolver.solveCubic(a, b, c, d);
      displaySolverResult('Cubic Equation Solution', res);
    } catch (e) {
      showToast(e.message, 'error');
    }
  });

  function displaySolverResult(title, res) {
    if (!solverStepsCard) return;
    solverStepsCard.removeAttribute('hidden');

    solverStepsCard.innerHTML = `
      <div class="result-header">
        <span class="result-title">${title}</span>
        <button type="button" class="btn-icon" onclick="this.closest('#solver-steps-card').setAttribute('hidden', 'true')">&times;</button>
      </div>
      <div class="solver-summary-box">
        <strong>Result:</strong> ${res.summary}
      </div>
      <div class="solver-step-list">
        ${res.steps.map((st, idx) => `<div class="solver-step-item">${st}</div>`).join('')}
      </div>
    `;

    solverStepsCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  updateSolverInputs();

  // --- UNIT CONVERTER LOGIC ---
  const unitCategorySelect = document.getElementById('unit-category-select');
  const unitFromSelect = document.getElementById('unit-from-select');
  const unitToSelect = document.getElementById('unit-to-select');
  const unitFromVal = document.getElementById('unit-from-val');
  const unitToVal = document.getElementById('unit-to-val');
  const unitFormulaDesc = document.getElementById('unit-formula-desc');
  const unitSwapBtn = document.getElementById('btn-swap-units');

  function populateUnitCategories() {
    if (!unitCategorySelect) return;
    const categories = OmniConverter.UnitConverter.getCategories();
    unitCategorySelect.innerHTML = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    updateUnitsDropdown();
  }

  function updateUnitsDropdown() {
    const cat = unitCategorySelect ? unitCategorySelect.value : 'length';
    const units = OmniConverter.UnitConverter.getUnits(cat);

    if (unitFromSelect && unitToSelect) {
      unitFromSelect.innerHTML = units.map(u => `<option value="${u.id}">${u.name}</option>`).join('');
      unitToSelect.innerHTML = units.map(u => `<option value="${u.id}">${u.name}</option>`).join('');

      // Pick first and second unit as default
      if (units.length >= 2) {
        unitToSelect.selectedIndex = 1;
      }
    }
    performUnitConversion('from');
  }

  function performUnitConversion(direction = 'from') {
    const cat = unitCategorySelect ? unitCategorySelect.value : 'length';
    const fromUnit = unitFromSelect ? unitFromSelect.value : '';
    const toUnit = unitToSelect ? unitToSelect.value : '';

    if (!fromUnit || !toUnit) return;

    if (direction === 'from') {
      const val = parseFloat(unitFromVal.value);
      if (isNaN(val)) {
        unitToVal.value = '';
        return;
      }
      const converted = OmniConverter.UnitConverter.convert(val, cat, fromUnit, toUnit);
      unitToVal.value = OmniCalculator.formatNumber(converted, 8);
    } else {
      const val = parseFloat(unitToVal.value);
      if (isNaN(val)) {
        unitFromVal.value = '';
        return;
      }
      const converted = OmniConverter.UnitConverter.convert(val, cat, toUnit, fromUnit);
      unitFromVal.value = OmniCalculator.formatNumber(converted, 8);
    }

    if (unitFormulaDesc) {
      unitFormulaDesc.textContent = OmniConverter.UnitConverter.getFormula(cat, fromUnit, toUnit);
    }
  }

  if (unitCategorySelect) unitCategorySelect.addEventListener('change', updateUnitsDropdown);
  if (unitFromSelect) unitFromSelect.addEventListener('change', () => performUnitConversion('from'));
  if (unitToSelect) unitToSelect.addEventListener('change', () => performUnitConversion('from'));

  if (unitFromVal) {
    unitFromVal.addEventListener('input', () => performUnitConversion('from'));
  }
  if (unitToVal) {
    unitToVal.addEventListener('input', () => performUnitConversion('to'));
  }

  if (unitSwapBtn) {
    unitSwapBtn.addEventListener('click', () => {
      const tempIdx = unitFromSelect.selectedIndex;
      unitFromSelect.selectedIndex = unitToSelect.selectedIndex;
      unitToSelect.selectedIndex = tempIdx;
      performUnitConversion('from');
      showToast('Units swapped', 'info');
    });
  }

  populateUnitCategories();

  // --- COMPLEX NUMBERS LOGIC ---
  const complexA1 = document.getElementById('comp-z1-re');
  const complexB1 = document.getElementById('comp-z1-im');
  const complexA2 = document.getElementById('comp-z2-re');
  const complexB2 = document.getElementById('comp-z2-im');
  const complexResultBox = document.getElementById('complex-result-box');

  function getZ1() {
    return new OmniComplex.Complex(parseFloat(complexA1?.value) || 0, parseFloat(complexB1?.value) || 0);
  }
  function getZ2() {
    return new OmniComplex.Complex(parseFloat(complexA2?.value) || 0, parseFloat(complexB2?.value) || 0);
  }

  function displayComplexResult(title, compObj) {
    if (!complexResultBox) return;
    complexResultBox.removeAttribute('hidden');

    complexResultBox.innerHTML = `
      <div class="result-header">
        <span class="result-title">${title}</span>
        <button type="button" class="btn-icon" onclick="this.closest('#complex-result-box').setAttribute('hidden', 'true')">&times;</button>
      </div>
      <div class="complex-grid-output">
        <div class="stat-metric-card">
          <span class="metric-label">Rectangular Form</span>
          <span class="metric-value highlight">${compObj.toRectString()}</span>
        </div>
        <div class="stat-metric-card">
          <span class="metric-label">Polar Form (Deg)</span>
          <span class="metric-value">${compObj.toPolarDegString()}</span>
        </div>
        <div class="stat-metric-card">
          <span class="metric-label">Polar Form (Rad)</span>
          <span class="metric-value">${compObj.toPolarRadString()}</span>
        </div>
        <div class="stat-metric-card">
          <span class="metric-label">Magnitude |z|</span>
          <span class="metric-value">${OmniComplex.cleanRound(compObj.magnitude())}</span>
        </div>
        <div class="stat-metric-card">
          <span class="metric-label">Phase Angle θ</span>
          <span class="metric-value">${OmniComplex.cleanRound(compObj.phaseDeg())}° (${OmniComplex.cleanRound(compObj.phaseRad())} rad)</span>
        </div>
        <div class="stat-metric-card">
          <span class="metric-label">Exponential Form</span>
          <span class="metric-value">${compObj.toExpString()}</span>
        </div>
      </div>
    `;
    complexResultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  document.querySelectorAll('.complex-op-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const op = btn.dataset.op;
      const z1 = getZ1();
      const z2 = getZ2();

      try {
        switch (op) {
          case 'add':
            displayComplexResult('Z₁ + Z₂', z1.add(z2));
            break;
          case 'sub':
            displayComplexResult('Z₁ − Z₂', z1.subtract(z2));
            break;
          case 'mul':
            displayComplexResult('Z₁ × Z₂', z1.multiply(z2));
            break;
          case 'div':
            displayComplexResult('Z₁ ÷ Z₂', z1.divide(z2));
            break;
          case 'conj1':
            displayComplexResult('Conjugate of Z₁ (Z₁*)', z1.conjugate());
            break;
          case 'recip1':
            displayComplexResult('Reciprocal 1 / Z₁', z1.reciprocal());
            break;
          case 'pow2_1':
            displayComplexResult('Z₁²', z1.power(2));
            break;
          case 'sqrt1':
            displayComplexResult('√Z₁', z1.sqrt());
            break;
        }
      } catch (e) {
        showToast(e.message, 'error');
      }
    });
  });

  // --- STATISTICS LOGIC ---
  const statsInput = document.getElementById('stats-data-input');
  const btnCalculateStats = document.getElementById('btn-calc-stats');
  const btnClearStats = document.getElementById('btn-clear-stats');
  const statsResultsGrid = document.getElementById('stats-results-grid');

  if (btnCalculateStats && statsInput) {
    btnCalculateStats.addEventListener('click', () => {
      const data = OmniStats.StatisticsCalculator.parseInput(statsInput.value);
      if (data.length === 0) {
        showToast('Please enter numbers separated by commas or spaces', 'error');
        return;
      }

      try {
        const stats = OmniStats.StatisticsCalculator.compute(data);
        renderStatsOutput(stats);
        showToast(`Analyzed ${stats.count} data points`, 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  if (btnClearStats && statsInput) {
    btnClearStats.addEventListener('click', () => {
      statsInput.value = '';
      if (statsResultsGrid) statsResultsGrid.setAttribute('hidden', 'true');
    });
  }

  function renderStatsOutput(s) {
    if (!statsResultsGrid) return;
    statsResultsGrid.removeAttribute('hidden');

    const metrics = [
      { label: 'Sample Size (N)', val: s.count, highlight: true },
      { label: 'Mean (μ / x̄)', val: s.mean, highlight: true },
      { label: 'Median', val: s.median, highlight: true },
      { label: 'Mode', val: s.mode },
      { label: 'Sum (Σx)', val: s.sum },
      { label: 'Sum of Squares (Σx²)', val: s.sumSq },
      { label: 'Minimum', val: s.min },
      { label: 'Maximum', val: s.max },
      { label: 'Range', val: s.range },
      { label: 'Sample Std Dev (s)', val: s.sampleStdDev, highlight: true },
      { label: 'Sample Variance (s²)', val: s.sampleVariance },
      { label: 'Population Std Dev (σ)', val: s.popStdDev },
      { label: 'Population Variance (σ²)', val: s.popVariance },
      { label: 'Std Error of Mean (SEM)', val: s.sem },
      { label: 'Q1 (25th Percentile)', val: s.q1 },
      { label: 'Q3 (75th Percentile)', val: s.q3 },
      { label: 'Interquartile Range (IQR)', val: s.iqr }
    ];

    statsResultsGrid.innerHTML = metrics.map(m => `
      <div class="stat-metric-card ${m.highlight ? 'stat-highlight' : ''}">
        <span class="metric-label">${m.label}</span>
        <span class="metric-value">${m.val}</span>
      </div>
    `).join('');

    statsResultsGrid.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Sample data presets for Statistics
  document.querySelectorAll('.stats-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (statsInput) {
        statsInput.value = btn.dataset.data;
        btnCalculateStats.click();
      }
    });
  });

  // --- ENGINEERING CONSTANTS MODAL ---
  const constantsModal = document.getElementById('constants-modal');
  const btnOpenConstants = document.getElementById('btn-open-constants');
  const btnCloseConstants = document.getElementById('btn-close-constants');
  const constantsListContainer = document.getElementById('constants-list-container');
  const constantsSearch = document.getElementById('constants-search');

  function renderConstants(filterText = '') {
    if (!constantsListContainer) return;
    const all = OmniScientific.CONSTANTS;
    const filtered = all.filter(c =>
      c.name.toLowerCase().includes(filterText.toLowerCase()) ||
      c.symbol.toLowerCase().includes(filterText.toLowerCase()) ||
      c.category.toLowerCase().includes(filterText.toLowerCase())
    );

    constantsListContainer.innerHTML = filtered.map(c => `
      <div class="constant-card" data-val="${c.value}" data-symbol="${c.symbol}">
        <div class="constant-header">
          <span class="constant-symbol">${c.symbol}</span>
          <span class="constant-cat">${c.category}</span>
        </div>
        <div class="constant-name">${c.name}</div>
        <div class="constant-val">${c.value.toExponential ? (Math.abs(c.value) >= 1e5 || Math.abs(c.value) < 1e-4 ? c.value.toExponential(4) : c.value) : c.value} ${c.unit}</div>
        <button type="button" class="btn btn-secondary btn-sm btn-insert-const">Insert Value</button>
      </div>
    `).join('');

    constantsListContainer.querySelectorAll('.constant-card').forEach(card => {
      card.addEventListener('click', () => {
        const val = card.dataset.val;
        standardCalc.append(val);
        constantsModal.setAttribute('hidden', 'true');
        showToast(`Inserted constant value: ${val}`, 'success');
      });
    });
  }

  if (btnOpenConstants && constantsModal) {
    btnOpenConstants.addEventListener('click', () => {
      constantsModal.removeAttribute('hidden');
      renderConstants();
    });
  }

  if (btnCloseConstants && constantsModal) {
    btnCloseConstants.addEventListener('click', () => {
      constantsModal.setAttribute('hidden', 'true');
    });
  }

  if (constantsSearch) {
    constantsSearch.addEventListener('input', (e) => {
      renderConstants(e.target.value);
    });
  }

  // --- FORMULA CHEAT SHEET MODAL ---
  const formulaModal = document.getElementById('formula-modal');
  const btnOpenFormula = document.getElementById('btn-open-formula');
  const btnCloseFormula = document.getElementById('btn-close-formula');
  const formulaListContainer = document.getElementById('formula-list-container');
  const formulaCategoryFilter = document.getElementById('formula-cat-filter');

  function renderFormulas(category = 'All') {
    if (!formulaListContainer) return;
    const list = sciController.getFormulas(category);

    formulaListContainer.innerHTML = list.map(f => `
      <div class="formula-card">
        <div class="formula-cat-badge">${f.category}</div>
        <div class="formula-title">${f.title}</div>
        <div class="formula-eq">${escapeHtml(f.equation)}</div>
        <div class="formula-vars">${escapeHtml(f.variables)}</div>
        <button type="button" class="btn btn-secondary btn-sm btn-insert-formula" data-snippet="${escapeHtml(f.calcSnippet)}">Insert into Calculator</button>
      </div>
    `).join('');

    formulaListContainer.querySelectorAll('.btn-insert-formula').forEach(btn => {
      btn.addEventListener('click', () => {
        const snippet = btn.dataset.snippet;
        standardCalc.append(snippet);
        formulaModal.setAttribute('hidden', 'true');
        showToast(`Inserted formula snippet: ${snippet}`, 'info');
      });
    });
  }

  if (btnOpenFormula && formulaModal) {
    btnOpenFormula.addEventListener('click', () => {
      formulaModal.removeAttribute('hidden');
      renderFormulas(formulaCategoryFilter ? formulaCategoryFilter.value : 'All');
    });
  }

  if (btnCloseFormula && formulaModal) {
    btnCloseFormula.addEventListener('click', () => {
      formulaModal.setAttribute('hidden', 'true');
    });
  }

  if (formulaCategoryFilter) {
    formulaCategoryFilter.addEventListener('change', (e) => {
      renderFormulas(e.target.value);
    });
  }

  // --- KEYBOARD SHORTCUTS MODAL ---
  const shortcutsModal = document.getElementById('shortcuts-modal');
  const btnOpenShortcuts = document.getElementById('btn-open-shortcuts');
  const btnCloseShortcuts = document.getElementById('btn-close-shortcuts');

  if (btnOpenShortcuts && shortcutsModal) {
    btnOpenShortcuts.addEventListener('click', () => shortcutsModal.removeAttribute('hidden'));
  }
  if (btnCloseShortcuts && shortcutsModal) {
    btnCloseShortcuts.addEventListener('click', () => shortcutsModal.setAttribute('hidden', 'true'));
  }

  // Global Modal Close on Outside Click & Escape
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
      e.target.setAttribute('hidden', 'true');
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop').forEach(m => m.setAttribute('hidden', 'true'));
      closeHistory();
    }
  });

  // --- KEYBOARD LISTENER FOR GLOBAL CALCULATIONS ---
  window.addEventListener('keydown', (e) => {
    // If typing in a regular text/number input, let default happen (except Enter on math input)
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }

    // Help modal shortcut '?'
    if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
      e.preventDefault();
      shortcutsModal?.removeAttribute('hidden');
      return;
    }

    // Mode Switch Shortcuts: Alt + 1..9
    if (e.altKey && e.key >= '1' && e.key <= '9') {
      e.preventDefault();
      const modeKeys = ['standard', 'scientific', 'programmer', 'graphing', 'matrix', 'solver', 'converter', 'complex', 'statistics'];
      const targetMode = modeKeys[parseInt(e.key, 10) - 1];
      if (targetMode) switchMode(targetMode);
      return;
    }

    // Forward to Standard/Scientific calculator if active
    if (activeMode === 'standard' || activeMode === 'scientific') {
      if ('0123456789.+-*/^%()'.includes(e.key)) {
        e.preventDefault();
        standardCalc.append(e.key);
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        try {
          standardCalc.calculate();
        } catch (err) {}
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        standardCalc.backspace();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        standardCalc.clearAll();
      } else if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        standardCalc.appendFunction('sin');
      } else if (e.key.toLowerCase() === 't') {
        e.preventDefault();
        standardCalc.appendFunction('tan');
      } else if (e.key.toLowerCase() === 'l') {
        e.preventDefault();
        standardCalc.appendFunction('ln');
      } else if (e.key.toLowerCase() === 'p') {
        e.preventDefault();
        standardCalc.append('pi');
      } else if (e.key.toLowerCase() === 'e') {
        e.preventDefault();
        standardCalc.append('e');
      }
    }
  });

  // --- REGISTER PWA SERVICE WORKER ---
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => {
          console.log('OmniCalc ServiceWorker registered with scope:', reg.scope);
        })
        .catch(err => {
          console.log('ServiceWorker registration skipped or failed:', err);
        });
    });
  }

  // Initial welcome greeting
  console.log('%c OmniCalc Pro - Engineering Calculator %c Developer: Sujal Mahalange ', 'background: #00e5ff; color: #000; font-weight: bold; padding: 4px;', 'background: #1e293b; color: #fff; padding: 4px;');
});
