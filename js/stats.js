/**
 * stats.js - Engineering Statistics Module
 * OmniCalc Pro - Engineering Calculator
 * Developer: Sujal Mahalange
 * 
 * Features:
 * - Tolerant input parser (supports commas, tabs, spaces, newlines)
 * - Computes: Mean, Median, Mode, Min, Max, Range, Sum, Sum of Squares
 * - Sample vs Population Variance and Standard Deviation
 * - Quartiles: Q1, Q2 (Median), Q3, Interquartile Range (IQR)
 * - Standard Error of the Mean (SEM)
 * - Clean descriptive statistics summary
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.OmniStats = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function cleanRound(n, dec = 5) {
    if (Math.abs(n) < 1e-12) return 0;
    const factor = Math.pow(10, dec);
    return Math.round((n + Number.EPSILON) * factor) / factor;
  }

  class StatisticsCalculator {
    /**
     * Parses a string containing numbers separated by spaces, commas, or newlines
     */
    static parseInput(rawText) {
      if (!rawText || !rawText.trim()) return [];
      // Split on commas, semicolons, tabs, newlines, and spaces
      const tokens = rawText.trim().split(/[\s,;]+/);
      const numbers = [];
      for (const t of tokens) {
        if (!t) continue;
        const num = Number(t);
        if (!isNaN(num) && Number.isFinite(num)) {
          numbers.push(num);
        }
      }
      return numbers;
    }

    /**
     * Computes all descriptive statistics
     */
    static compute(data) {
      if (!data || data.length === 0) {
        throw new Error('Please enter at least one number');
      }

      const n = data.length;
      const sorted = [...data].sort((a, b) => a - b);

      // Sum and Sum of Squares
      let sum = 0;
      let sumSq = 0;
      for (let i = 0; i < n; i++) {
        sum += data[i];
        sumSq += data[i] * data[i];
      }

      // Mean
      const mean = sum / n;

      // Median
      let median = 0;
      const mid = Math.floor(n / 2);
      if (n % 2 !== 0) {
        median = sorted[mid];
      } else {
        median = (sorted[mid - 1] + sorted[mid]) / 2;
      }

      // Mode
      const counts = new Map();
      let maxCount = 0;
      for (const val of sorted) {
        const c = (counts.get(val) || 0) + 1;
        counts.set(val, c);
        if (c > maxCount) maxCount = c;
      }

      let modeDesc = 'No mode (all unique)';
      const modes = [];
      if (maxCount > 1) {
        for (const [val, c] of counts.entries()) {
          if (c === maxCount) modes.push(val);
        }
        if (modes.length === counts.size) {
          modeDesc = 'No mode (uniform frequencies)';
        } else {
          modeDesc = modes.join(', ');
        }
      }

      // Min, Max, Range
      const min = sorted[0];
      const max = sorted[n - 1];
      const range = max - min;

      // Variance & Standard Deviation
      let sumDiffSq = 0;
      for (let i = 0; i < n; i++) {
        const diff = data[i] - mean;
        sumDiffSq += diff * diff;
      }

      const popVariance = sumDiffSq / n;
      const popStdDev = Math.sqrt(popVariance);

      const sampleVariance = n > 1 ? sumDiffSq / (n - 1) : 0;
      const sampleStdDev = n > 1 ? Math.sqrt(sampleVariance) : 0;
      const sem = n > 1 ? sampleStdDev / Math.sqrt(n) : 0;

      // Quartiles (Tukey / standard method)
      const getPercentile = (arr, p) => {
        const index = (arr.length - 1) * p;
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        const weight = index - lower;
        return arr[lower] * (1 - weight) + arr[upper] * weight;
      };

      const q1 = getPercentile(sorted, 0.25);
      const q3 = getPercentile(sorted, 0.75);
      const iqr = q3 - q1;

      return {
        count: n,
        sum: cleanRound(sum),
        sumSq: cleanRound(sumSq),
        mean: cleanRound(mean),
        median: cleanRound(median),
        mode: modeDesc,
        min: cleanRound(min),
        max: cleanRound(max),
        range: cleanRound(range),
        sampleVariance: cleanRound(sampleVariance),
        sampleStdDev: cleanRound(sampleStdDev),
        popVariance: cleanRound(popVariance),
        popStdDev: cleanRound(popStdDev),
        sem: cleanRound(sem),
        q1: cleanRound(q1),
        q3: cleanRound(q3),
        iqr: cleanRound(iqr),
        sorted
      };
    }
  }

  return {
    StatisticsCalculator,
    cleanRound
  };
});
