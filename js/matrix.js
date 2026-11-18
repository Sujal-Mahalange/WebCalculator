/**
 * matrix.js - Linear Algebra Matrix Calculator Module
 * OmniCalc Pro - Engineering Calculator
 * Developer: Sujal Mahalange
 * 
 * Features:
 * - Dynamic matrix sizes up to 4x4 (Square & Rectangular)
 * - Operations: Addition, Subtraction, Multiplication (A x B)
 * - Determinant (1x1 to 4x4) with exact precision
 * - Inverse Matrix (via Cofactor/Adjugate & Gauss-Jordan)
 * - Transpose, Trace, Rank, Scalar Multiplication
 * - Matrix Presets: Identity, Zero, Random
 * - Copy result to Matrix A/B
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.OmniMatrix = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  class MatrixEngine {
    // Creates an empty r x c matrix initialized to 0
    static create(rows, cols, initialValue = 0) {
      const data = [];
      for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
          row.push(typeof initialValue === 'function' ? initialValue(r, c) : initialValue);
        }
        data.push(row);
      }
      return { rows, cols, data };
    }

    // Creates an n x n Identity matrix
    static identity(n) {
      return MatrixEngine.create(n, n, (r, c) => (r === c ? 1 : 0));
    }

    // Creates an r x c matrix with random integers (-9 to 9)
    static random(rows, cols, min = -5, max = 9) {
      return MatrixEngine.create(rows, cols, () => Math.floor(Math.random() * (max - min + 1)) + min);
    }

    // Clone matrix
    static clone(m) {
      return {
        rows: m.rows,
        cols: m.cols,
        data: m.data.map(row => [...row])
      };
    }

    // Matrix Addition: A + B
    static add(A, B) {
      if (A.rows !== B.rows || A.cols !== B.cols) {
        throw new Error(`Dimension mismatch: Cannot add (${A.rows}×${A.cols}) and (${B.rows}×${B.cols})`);
      }
      return MatrixEngine.create(A.rows, A.cols, (r, c) => A.data[r][c] + B.data[r][c]);
    }

    // Matrix Subtraction: A - B
    static subtract(A, B) {
      if (A.rows !== B.rows || A.cols !== B.cols) {
        throw new Error(`Dimension mismatch: Cannot subtract (${A.rows}×${A.cols}) and (${B.rows}×${B.cols})`);
      }
      return MatrixEngine.create(A.rows, A.cols, (r, c) => A.data[r][c] - B.data[r][c]);
    }

    // Matrix Multiplication: A × B
    static multiply(A, B) {
      if (A.cols !== B.rows) {
        throw new Error(`Dimension mismatch for multiplication: Columns of A (${A.cols}) must equal rows of B (${B.rows})`);
      }
      const res = MatrixEngine.create(A.rows, B.cols, 0);
      for (let r = 0; r < A.rows; r++) {
        for (let c = 0; c < B.cols; c++) {
          let sum = 0;
          for (let k = 0; k < A.cols; k++) {
            sum += A.data[r][k] * B.data[k][c];
          }
          res.data[r][c] = sum;
        }
      }
      return res;
    }

    // Scalar Multiplication: k × A
    static scalarMultiply(A, k) {
      return MatrixEngine.create(A.rows, A.cols, (r, c) => A.data[r][c] * k);
    }

    // Transpose: A^T
    static transpose(A) {
      return MatrixEngine.create(A.cols, A.rows, (r, c) => A.data[c][r]);
    }

    // Matrix Trace: sum of diagonal elements (square matrices only)
    static trace(A) {
      if (A.rows !== A.cols) {
        throw new Error('Trace is defined for square matrices only');
      }
      let sum = 0;
      for (let i = 0; i < A.rows; i++) {
        sum += A.data[i][i];
      }
      return sum;
    }

    // Submatrix formed by deleting row `delRow` and col `delCol`
    static getSubmatrix(A, delRow, delCol) {
      const sub = [];
      for (let r = 0; r < A.rows; r++) {
        if (r === delRow) continue;
        const row = [];
        for (let c = 0; c < A.cols; c++) {
          if (c === delCol) continue;
          row.push(A.data[r][c]);
        }
        sub.push(row);
      }
      return { rows: A.rows - 1, cols: A.cols - 1, data: sub };
    }

    // Determinant: det(A) (supports up to 4x4)
    static determinant(A) {
      if (A.rows !== A.cols) {
        throw new Error('Determinant is defined for square matrices only');
      }
      const n = A.rows;
      if (n === 1) return A.data[0][0];
      if (n === 2) {
        return A.data[0][0] * A.data[1][1] - A.data[0][1] * A.data[1][0];
      }
      if (n === 3) {
        const d = A.data;
        return (
          d[0][0] * (d[1][1] * d[2][2] - d[1][2] * d[2][1]) -
          d[0][1] * (d[1][0] * d[2][2] - d[1][2] * d[2][0]) +
          d[0][2] * (d[1][0] * d[2][1] - d[1][1] * d[2][0])
        );
      }

      // n >= 4: Laplace expansion along row 0
      let det = 0;
      for (let c = 0; c < n; c++) {
        const cofactorSign = (c % 2 === 0) ? 1 : -1;
        const sub = MatrixEngine.getSubmatrix(A, 0, c);
        det += cofactorSign * A.data[0][c] * MatrixEngine.determinant(sub);
      }
      return det;
    }

    // Inverse Matrix: A^-1 (via adjugate matrix)
    static inverse(A) {
      if (A.rows !== A.cols) {
        throw new Error('Inverse is defined for square matrices only');
      }
      const det = MatrixEngine.determinant(A);
      if (Math.abs(det) < 1e-12) {
        throw new Error('Matrix is singular (determinant is 0), inverse does not exist');
      }

      const n = A.rows;
      if (n === 1) {
        return MatrixEngine.create(1, 1, 1 / A.data[0][0]);
      }

      // Adjugate matrix = transpose of cofactor matrix
      const adj = MatrixEngine.create(n, n, 0);
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          const sign = ((r + c) % 2 === 0) ? 1 : -1;
          const sub = MatrixEngine.getSubmatrix(A, r, c);
          const subDet = MatrixEngine.determinant(sub);
          // Adjugate is transposed: adj[c][r] = cofactor[r][c]
          adj.data[c][r] = sign * subDet;
        }
      }

      // Inverse = (1 / det) * adj
      return MatrixEngine.scalarMultiply(adj, 1 / det);
    }

    // Matrix Rank via Gaussian Elimination
    static rank(A) {
      const m = MatrixEngine.clone(A);
      const rows = m.rows;
      const cols = m.cols;
      let rank = 0;

      for (let col = 0, row = 0; col < cols && row < rows; col++) {
        // Find pivot
        let pivotRow = row;
        while (pivotRow < rows && Math.abs(m.data[pivotRow][col]) < 1e-9) {
          pivotRow++;
        }
        if (pivotRow === rows) continue; // No pivot in this column

        // Swap pivot row with current row
        const temp = m.data[row];
        m.data[row] = m.data[pivotRow];
        m.data[pivotRow] = temp;

        // Eliminate rows below
        for (let r = row + 1; r < rows; r++) {
          const factor = m.data[r][col] / m.data[row][col];
          for (let c = col; c < cols; c++) {
            m.data[r][c] -= factor * m.data[row][c];
          }
        }
        row++;
        rank++;
      }
      return rank;
    }

    // Clean rounding for display
    static formatMatrix(m, maxDecimals = 4) {
      const factor = Math.pow(10, maxDecimals);
      return {
        rows: m.rows,
        cols: m.cols,
        data: m.data.map(row =>
          row.map(v => {
            const rounded = Math.round((v + Number.EPSILON) * factor) / factor;
            return Math.abs(rounded) < 1e-12 ? 0 : rounded;
          })
        )
      };
    }
  }

  return {
    MatrixEngine
  };
});
