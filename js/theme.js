/**
 * theme.js - Theme Switcher (Dark, Light, Neon) & Ambient Background Animation
 * OmniCalc Pro - Engineering Calculator
 * Developer: Sujal Mahalange
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.OmniTheme = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const STORAGE_KEY = 'omni_calc_theme';
  const THEMES = ['dark', 'light', 'neon'];

  class ThemeManager {
    constructor() {
      this.currentTheme = this.getInitialTheme();
      this.listeners = new Set();
      this.applyTheme(this.currentTheme, false);
      this.initBackgroundCanvas();
    }

    subscribe(fn) {
      this.listeners.add(fn);
      return () => this.listeners.delete(fn);
    }

    getInitialTheme() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && THEMES.includes(saved)) {
          return saved;
        }
      } catch (e) {
        // Local storage inaccessible
      }

      // Check system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
      }
      return 'dark';
    }

    setTheme(theme) {
      if (!THEMES.includes(theme)) return;
      this.currentTheme = theme;
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch (e) {}
      this.applyTheme(theme, true);
      for (const fn of this.listeners) {
        fn(theme);
      }
    }

    cycleTheme() {
      const idx = THEMES.indexOf(this.currentTheme);
      const nextTheme = THEMES[(idx + 1) % THEMES.length];
      this.setTheme(nextTheme);
      return nextTheme;
    }

    applyTheme(theme, animated = true) {
      const root = document.documentElement;
      if (animated) {
        root.classList.add('theme-transitioning');
        setTimeout(() => root.classList.remove('theme-transitioning'), 400);
      }
      root.setAttribute('data-theme', theme);

      // Update meta theme-color for mobile browsers
      let metaTheme = document.querySelector('meta[name="theme-color"]');
      if (!metaTheme) {
        metaTheme = document.createElement('meta');
        metaTheme.name = 'theme-color';
        document.head.appendChild(metaTheme);
      }

      const metaColors = {
        dark: '#0f172a',
        light: '#f8fafc',
        neon: '#0a0014'
      };
      metaTheme.setAttribute('content', metaColors[theme] || '#0f172a');
    }

    getTheme() {
      return this.currentTheme;
    }

    // --- Interactive Floating Ambient Blobs Background ---
    initBackgroundCanvas() {
      const canvas = document.getElementById('ambient-canvas');
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      let width = 0;
      let height = 0;
      let animId = null;

      const blobs = [
        { x: 0.2, y: 0.3, r: 0.35, vx: 0.0003, vy: 0.0002, colorKey: 'blob1' },
        { x: 0.8, y: 0.2, r: 0.40, vx: -0.0002, vy: 0.0003, colorKey: 'blob2' },
        { x: 0.5, y: 0.8, r: 0.45, vx: 0.00025, vy: -0.00025, colorKey: 'blob3' }
      ];

      const resize = () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
      };

      window.addEventListener('resize', resize);
      resize();

      const getBlobColors = () => {
        const theme = this.currentTheme;
        if (theme === 'neon') {
          return {
            blob1: 'rgba(255, 0, 128, 0.16)',
            blob2: 'rgba(0, 229, 255, 0.14)',
            blob3: 'rgba(157, 0, 255, 0.18)'
          };
        } else if (theme === 'light') {
          return {
            blob1: 'rgba(147, 197, 253, 0.28)',
            blob2: 'rgba(196, 181, 253, 0.25)',
            blob3: 'rgba(253, 230, 138, 0.22)'
          };
        }
        // Dark theme default
        return {
          blob1: 'rgba(14, 165, 233, 0.12)',
          blob2: 'rgba(99, 102, 241, 0.14)',
          blob3: 'rgba(168, 85, 247, 0.10)'
        };
      };

      const animate = () => {
        ctx.clearRect(0, 0, width, height);
        const colors = getBlobColors();

        for (const b of blobs) {
          b.x += b.vx;
          b.y += b.vy;

          if (b.x < 0.1 || b.x > 0.9) b.vx *= -1;
          if (b.y < 0.1 || b.y > 0.9) b.vy *= -1;

          const cx = b.x * width;
          const cy = b.y * height;
          const radius = b.r * Math.min(width, height);

          const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
          grad.addColorStop(0, colors[b.colorKey]);
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.fill();
        }

        animId = requestAnimationFrame(animate);
      };

      // Pause when tab not visible to save battery
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          if (animId) cancelAnimationFrame(animId);
        } else {
          animId = requestAnimationFrame(animate);
        }
      });

      animate();
    }
  }

  return {
    ThemeManager,
    THEMES
  };
});

