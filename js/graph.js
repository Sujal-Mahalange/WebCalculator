/**
 * graph.js - Canvas Graphing Calculator Module
 * OmniCalc Pro - Engineering Calculator
 * Developer: Sujal Mahalange
 * 
 * Features:
 * - Multi-function plotting y = f(x) with individual color themes
 * - Interactive smooth Pan and Zoom (centered at mouse or pinch)
 * - Dynamic adaptive grid lines with sub-ticks and axis labels
 * - Discontinuity & asymptote detection (no false vertical lines)
 * - Trace inspection cursor showing real-time coordinates (x, y)
 * - HiDPI (Retina) display support
 * - Fast tokenized evaluation
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.OmniGraph = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const DEFAULT_COLORS = ['#00e5ff', '#ff007f', '#00ff66', '#ffb700', '#b388ff'];

  class GraphPlotter {
    constructor(canvas, options = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.options = Object.assign({
        theme: 'dark' // 'dark', 'light', 'neon'
      }, options);

      // Coordinate boundaries
      this.xMin = -10;
      this.xMax = 10;
      this.yMin = -6;
      this.yMax = 6;

      // Functions to plot: { id, expr, color, visible, parsedFn }
      this.functions = [
        { id: 1, expr: 'sin(x)', color: DEFAULT_COLORS[0], visible: true },
        { id: 2, expr: '0.2*x^2 - 2', color: DEFAULT_COLORS[1], visible: false }
      ];

      // Drag / Pan state
      this.isDragging = false;
      this.dragStartX = 0;
      this.dragStartY = 0;
      this.lastXMin = this.xMin;
      this.lastXMax = this.xMax;
      this.lastYMin = this.yMin;
      this.lastYMax = this.yMax;

      // Mouse Trace state
      this.mouseWorldX = null;
      this.mouseWorldY = null;
      this.hoverActive = false;

      this.initEvents();
      this.resize();
    }

    setTheme(theme) {
      this.options.theme = theme;
      this.render();
    }

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      this.canvas.width = Math.max(300, Math.floor(rect.width * dpr));
      this.canvas.height = Math.max(200, Math.floor(rect.height * dpr));
      this.ctx.scale(dpr, dpr);
      this.width = rect.width;
      this.height = rect.height;
      this.render();
    }

    resetView() {
      this.xMin = -10;
      this.xMax = 10;
      this.yMin = -6;
      this.yMax = 6;
      this.render();
    }

    zoom(factor, centerRatioX = 0.5, centerRatioY = 0.5) {
      const xRange = this.xMax - this.xMin;
      const yRange = this.yMax - this.yMin;
      const centerX = this.xMin + xRange * centerRatioX;
      const centerY = this.yMax - yRange * centerRatioY;

      const newXRange = xRange * factor;
      const newYRange = yRange * factor;

      if (newXRange < 1e-6 || newXRange > 1e7) return; // Prevent extreme zoom limit

      this.xMin = centerX - newXRange * centerRatioX;
      this.xMax = centerX + newXRange * (1 - centerRatioX);
      this.yMin = centerY - newYRange * (1 - centerRatioY);
      this.yMax = centerY + newYRange * centerRatioY;

      this.render();
    }

    toScreenX(worldX) {
      return ((worldX - this.xMin) / (this.xMax - this.xMin)) * this.width;
    }

    toScreenY(worldY) {
      return ((this.yMax - worldY) / (this.yMax - this.yMin)) * this.height;
    }

    toWorldX(screenX) {
      return this.xMin + (screenX / this.width) * (this.xMax - this.xMin);
    }

    toWorldY(screenY) {
      return this.yMax - (screenY / this.height) * (this.yMax - this.yMin);
    }

    // Compiles expression string into an optimized evaluator function
    compileExpression(exprStr) {
      if (!exprStr || !exprStr.trim()) return null;
      const clean = exprStr.trim();
      return (xVal) => {
        try {
          return OmniCalculator.evaluate(clean, {
            x: xVal,
            ans: 0,
            angleMode: 'RAD' // Standard graphing convention: radian arguments for trig
          });
        } catch (e) {
          return NaN;
        }
      };
    }

    addFunction(expr = '', color = null) {
      const nextId = (this.functions.length ? Math.max(...this.functions.map(f => f.id)) : 0) + 1;
      const assignedColor = color || DEFAULT_COLORS[(nextId - 1) % DEFAULT_COLORS.length];
      const fnObj = {
        id: nextId,
        expr: expr,
        color: assignedColor,
        visible: true
      };
      this.functions.push(fnObj);
      this.render();
      return fnObj;
    }

    removeFunction(id) {
      this.functions = this.functions.filter(f => f.id !== id);
      this.render();
    }

    updateFunction(id, updates) {
      const fnObj = this.functions.find(f => f.id === id);
      if (fnObj) {
        Object.assign(fnObj, updates);
        this.render();
      }
    }

    initEvents() {
      const canvas = this.canvas;

      // Mouse drag to pan
      canvas.addEventListener('mousedown', (e) => {
        this.isDragging = true;
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;
        this.lastXMin = this.xMin;
        this.lastXMax = this.xMax;
        this.lastYMin = this.yMin;
        this.lastYMax = this.yMax;
        canvas.style.cursor = 'grabbing';
      });

      window.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;

        if (this.isDragging) {
          const dxPixels = e.clientX - this.dragStartX;
          const dyPixels = e.clientY - this.dragStartY;

          const xSpan = this.lastXMax - this.lastXMin;
          const ySpan = this.lastYMax - this.lastYMin;

          const dxWorld = (dxPixels / this.width) * xSpan;
          const dyWorld = (dyPixels / this.height) * ySpan;

          this.xMin = this.lastXMin - dxWorld;
          this.xMax = this.lastXMax - dxWorld;
          this.yMin = this.lastYMin + dyWorld;
          this.yMax = this.lastYMax + dyWorld;

          this.render();
          return;
        }

        // Mouse hover trace
        if (screenX >= 0 && screenX <= this.width && screenY >= 0 && screenY <= this.height) {
          this.hoverActive = true;
          this.mouseWorldX = this.toWorldX(screenX);
          this.mouseWorldY = this.toWorldY(screenY);
          this.render();
        } else if (this.hoverActive) {
          this.hoverActive = false;
          this.render();
        }
      });

      window.addEventListener('mouseup', () => {
        if (this.isDragging) {
          this.isDragging = false;
          canvas.style.cursor = 'crosshair';
        }
      });

      // Mouse Wheel Zoom
      canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const ratioX = mouseX / this.width;
        const ratioY = mouseY / this.height;

        const zoomFactor = e.deltaY > 0 ? 1.15 : 0.87;
        this.zoom(zoomFactor, ratioX, ratioY);
      }, { passive: false });

      // Touch events for mobile
      let touchStartX = 0;
      let touchStartY = 0;
      let initialPinchDist = null;

      canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          this.isDragging = true;
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
          this.lastXMin = this.xMin;
          this.lastXMax = this.xMax;
          this.lastYMin = this.yMin;
          this.lastYMax = this.yMax;
        } else if (e.touches.length === 2) {
          this.isDragging = false;
          const t1 = e.touches[0];
          const t2 = e.touches[1];
          initialPinchDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        }
      }, { passive: true });

      canvas.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1 && this.isDragging) {
          const dxPixels = e.touches[0].clientX - touchStartX;
          const dyPixels = e.touches[0].clientY - touchStartY;

          const xSpan = this.lastXMax - this.lastXMin;
          const ySpan = this.lastYMax - this.lastYMin;

          this.xMin = this.lastXMin - (dxPixels / this.width) * xSpan;
          this.xMax = this.lastXMax - (dxPixels / this.width) * xSpan;
          this.yMin = this.lastYMin + (dyPixels / this.height) * ySpan;
          this.yMax = this.lastYMax + (dyPixels / this.height) * ySpan;

          this.render();
        } else if (e.touches.length === 2 && initialPinchDist) {
          const t1 = e.touches[0];
          const t2 = e.touches[1];
          const curDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
          const factor = initialPinchDist / curDist;
          this.zoom(factor);
          initialPinchDist = curDist;
        }
      }, { passive: true });

      canvas.addEventListener('touchend', () => {
        this.isDragging = false;
        initialPinchDist = null;
      });

      canvas.style.cursor = 'crosshair';
    }

    // Calculate a nice step size for grid ticks
    calculateGridStep(range) {
      const roughStep = range / 8;
      const exponent = Math.floor(Math.log10(roughStep));
      const fraction = roughStep / Math.pow(10, exponent);
      let niceFraction;
      if (fraction < 1.5) niceFraction = 1;
      else if (fraction < 3) niceFraction = 2;
      else if (fraction < 7) niceFraction = 5;
      else niceFraction = 10;
      return niceFraction * Math.pow(10, exponent);
    }

    render() {
      const ctx = this.ctx;
      const w = this.width;
      const h = this.height;
      if (!w || !h) return;

      const isDark = this.options.theme !== 'light';
      const bgColor = isDark ? '#0b0f19' : '#f8fafc';
      const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
      const axisColor = isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.45)';
      const textColor = isDark ? '#94a3b8' : '#64748b';

      ctx.clearRect(0, 0, w, h);

      // Background fill
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, w, h);

      const xRange = this.xMax - this.xMin;
      const yRange = this.yMax - this.yMin;

      const xStep = this.calculateGridStep(xRange);
      const yStep = this.calculateGridStep(yRange);

      // --- Draw Grid Lines ---
      ctx.lineWidth = 1;
      ctx.strokeStyle = gridColor;
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = textColor;

      // Vertical Grid Lines & X Labels
      const firstX = Math.floor(this.xMin / xStep) * xStep;
      for (let x = firstX; x <= this.xMax; x += xStep) {
        const sx = this.toScreenX(x);
        ctx.beginPath();
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx, h);
        ctx.stroke();

        // Label
        if (Math.abs(x) > 1e-9) {
          const sy = Math.min(Math.max(this.toScreenY(0) + 14, 14), h - 4);
          ctx.fillText(Number(x.toPrecision(6)).toString(), sx + 3, sy);
        }
      }

      // Horizontal Grid Lines & Y Labels
      const firstY = Math.floor(this.yMin / yStep) * yStep;
      for (let y = firstY; y <= this.yMax; y += yStep) {
        const sy = this.toScreenY(y);
        ctx.beginPath();
        ctx.moveTo(0, sy);
        ctx.lineTo(w, sy);
        ctx.stroke();

        // Label
        if (Math.abs(y) > 1e-9) {
          const sx = Math.min(Math.max(this.toScreenX(0) + 4, 4), w - 35);
          ctx.fillText(Number(y.toPrecision(6)).toString(), sx, sy - 3);
        }
      }

      // --- Draw Axes (X and Y) ---
      const originX = this.toScreenX(0);
      const originY = this.toScreenY(0);

      ctx.lineWidth = 1.5;
      ctx.strokeStyle = axisColor;

      // X Axis
      if (originY >= 0 && originY <= h) {
        ctx.beginPath();
        ctx.moveTo(0, originY);
        ctx.lineTo(w, originY);
        ctx.stroke();
      }

      // Y Axis
      if (originX >= 0 && originX <= w) {
        ctx.beginPath();
        ctx.moveTo(originX, 0);
        ctx.lineTo(originX, h);
        ctx.stroke();
      }

      // Origin (0,0) label
      if (originX >= 0 && originX <= w && originY >= 0 && originY <= h) {
        ctx.fillText('0', originX - 10, originY + 12);
      }

      // --- Plot Each Function ---
      const numSamples = Math.min(w * 1.5, 1200); // 1.5x resolution for silky curves
      const dx = (this.xMax - this.xMin) / numSamples;

      for (const fnObj of this.functions) {
        if (!fnObj.visible || !fnObj.expr.trim()) continue;

        const evaluateFn = this.compileExpression(fnObj.expr);
        if (!evaluateFn) continue;

        ctx.lineWidth = 2.2;
        ctx.strokeStyle = fnObj.color;
        ctx.shadowColor = fnObj.color;
        ctx.shadowBlur = this.options.theme === 'neon' ? 10 : 3;

        ctx.beginPath();
        let isDrawing = false;
        let prevY = null;

        for (let i = 0; i <= numSamples; i++) {
          const curWorldX = this.xMin + i * dx;
          const curWorldY = evaluateFn(curWorldX);

          if (!Number.isFinite(curWorldY) || Number.isNaN(curWorldY)) {
            isDrawing = false;
            prevY = null;
            continue;
          }

          // Asymptote / Discontinuity jump detection (e.g. tan(x), 1/x)
          if (prevY !== null && Math.abs(curWorldY - prevY) > yRange * 0.8) {
            isDrawing = false;
          }

          const sx = this.toScreenX(curWorldX);
          const sy = this.toScreenY(curWorldY);

          // Clip vertically with margin
          if (sy < -h || sy > 2 * h) {
            isDrawing = false;
            prevY = curWorldY;
            continue;
          }

          if (!isDrawing) {
            ctx.moveTo(sx, sy);
            isDrawing = true;
          } else {
            ctx.lineTo(sx, sy);
          }
          prevY = curWorldY;
        }
        ctx.stroke();
        ctx.shadowBlur = 0; // Reset glow
      }

      // --- Trace Point & Tooltip on Hover ---
      if (this.hoverActive && this.mouseWorldX !== null) {
        const hx = this.toScreenX(this.mouseWorldX);

        // Draw vertical hair line
        ctx.lineWidth = 1;
        ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(hx, 0);
        ctx.lineTo(hx, h);
        ctx.stroke();
        ctx.setLineDash([]);

        // For each active function, calculate exact value at mouseWorldX and draw point
        let tooltipYOffset = 20;
        const visibleFunctions = this.functions.filter(f => f.visible && f.expr.trim());

        for (const fnObj of visibleFunctions) {
          const evalFn = this.compileExpression(fnObj.expr);
          if (!evalFn) continue;

          const traceY = evalFn(this.mouseWorldX);
          if (Number.isFinite(traceY)) {
            const hy = this.toScreenY(traceY);

            // Glowing indicator dot on the curve
            if (hy >= 0 && hy <= h) {
              ctx.beginPath();
              ctx.arc(hx, hy, 5, 0, Math.PI * 2);
              ctx.fillStyle = fnObj.color;
              ctx.fill();
              ctx.lineWidth = 2;
              ctx.strokeStyle = '#ffffff';
              ctx.stroke();
            }

            // Draw HUD Info Box at top-right or near cursor
            const text = `f(x) = ${Number(traceY.toFixed(4))}`;
            ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.9)';
            ctx.fillRect(w - 170, tooltipYOffset, 155, 24);
            ctx.strokeStyle = fnObj.color;
            ctx.strokeRect(w - 170, tooltipYOffset, 155, 24);

            ctx.fillStyle = fnObj.color;
            ctx.font = '11px "JetBrains Mono", monospace';
            ctx.fillText(text, w - 160, tooltipYOffset + 16);
            tooltipYOffset += 30;
          }
        }

        // Display current cursor X
        ctx.fillStyle = isDark ? '#ffffff' : '#000000';
        ctx.fillText(`x = ${Number(this.mouseWorldX.toFixed(4))}`, hx + 5, h - 10);
      }
    }
  }

  return {
    GraphPlotter,
    DEFAULT_COLORS
  };
});

