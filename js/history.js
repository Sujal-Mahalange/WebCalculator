/**
 * history.js - Calculation History Manager
 * OmniCalc Pro - Engineering Calculator
 * Developer: Sujal Mahalange
 * 
 * Features:
 * - Persistent storage in localStorage
 * - Click-to-reuse expression or result
 * - Delete individual item or clear all
 * - Export history
 * - Formatted timestamps and badges
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.OmniHistory = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const STORAGE_KEY = 'omni_calc_history_v1';
  const MAX_ENTRIES = 80;

  class HistoryManager {
    constructor() {
      this.entries = this.load();
      this.listeners = new Set();
    }

    subscribe(fn) {
      this.listeners.add(fn);
      return () => this.listeners.delete(fn);
    }

    notify() {
      for (const fn of this.listeners) {
        fn(this.entries);
      }
    }

    load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed) ? parsed : [];
        }
      } catch (e) {
        console.warn('Failed to load history from localStorage', e);
      }
      return [];
    }

    save() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.entries));
      } catch (e) {
        console.warn('Failed to save history to localStorage', e);
      }
    }

    add(expression, result, mode = 'Standard') {
      if (!expression || expression.trim() === '') return null;

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const entry = {
        id: 'hist_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        expression: String(expression),
        result: String(result),
        mode: mode,
        timestamp: timeStr,
        rawTime: Date.now()
      };

      // Add to front
      this.entries.unshift(entry);

      // Cap maximum length
      if (this.entries.length > MAX_ENTRIES) {
        this.entries.pop();
      }

      this.save();
      this.notify();
      return entry;
    }

    remove(id) {
      this.entries = this.entries.filter(e => e.id !== id);
      this.save();
      this.notify();
    }

    clear() {
      this.entries = [];
      this.save();
      this.notify();
    }

    getAll() {
      return [...this.entries];
    }
  }

  return {
    HistoryManager
  };
});
