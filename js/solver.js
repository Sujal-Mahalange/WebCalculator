/**
 * solver.js - Equation Solver Module (Linear 2x2/3x3, Quadratic, Cubic)
 * OmniCalc Pro - Engineering Calculator
 * Developer: Sujal Mahalange
 * 
 * Features:
 * - Linear System (2 Variables) via Cramer's Rule
 * - Linear System (3 Variables) via Cramer's Rule
 * - Quadratic Equations (Real & Complex roots, Vertex, Discriminant)
 * - Cubic Equations (Cardano's Formula & Trigonometric Casus Irreducibilis)
 * - Complete step-by-step mathematical explanations
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.OmniSolver = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function round(n, dec = 5) {
    if (Math.abs(n) < 1e-12) return 0;
    const factor = Math.pow(10, dec);
    return Math.round((n + Number.EPSILON) * factor) / factor;
  }

  function formatSign(n) {
    return n >= 0 ? `+ ${n}` : `- ${Math.abs(n)}`;
  }

  class EquationSolver {
    /**
     * Solves a 2x2 Linear System:
     * a1*x + b1*y = c1
     * a2*x + b2*y = c2
     */
    static solveLinear2(a1, b1, c1, a2, b2, c2) {
      const steps = [];
      steps.push(`<strong>Given Equations:</strong><br>` +
        `[1] ${a1}x ${formatSign(b1)}y = ${c1}<br>` +
        `[2] ${a2}x ${formatSign(b2)}y = ${c2}`);

      // Cramer's rule:
      const D = a1 * b2 - a2 * b1;
      const Dx = c1 * b2 - c2 * b1;
      const Dy = a1 * c2 - a2 * c1;

      steps.push(`<strong>Step 1: Calculate Determinants:</strong><br>` +
        `Δ = (a₁ · b₂) − (a₂ · b₁) = (${a1})(${b2}) − (${a2})(${b1}) = <strong>${round(D)}</strong><br>` +
        `Δx = (c₁ · b₂) − (c₂ · b₁) = (${c1})(${b2}) − (${c2})(${b1}) = <strong>${round(Dx)}</strong><br>` +
        `Δy = (a₁ · c₂) − (a₂ · c₁) = (${a1})(${c2}) − (${a2})(${c1}) = <strong>${round(Dy)}</strong>`);

      if (Math.abs(D) < 1e-12) {
        if (Math.abs(Dx) < 1e-12 && Math.abs(Dy) < 1e-12) {
          return {
            type: 'infinite',
            summary: 'Infinitely many solutions (Lines are coincident / dependent system)',
            steps
          };
        } else {
          return {
            type: 'none',
            summary: 'No solution (Lines are parallel / inconsistent system)',
            steps
          };
        }
      }

      const x = Dx / D;
      const y = Dy / D;

      steps.push(`<strong>Step 2: Apply Cramer's Formulas:</strong><br>` +
        `x = Δx / Δ = ${round(Dx)} / ${round(D)} = <strong>${round(x)}</strong><br>` +
        `y = Δy / Δ = ${round(Dy)} / ${round(D)} = <strong>${round(y)}</strong>`);

      return {
        type: 'unique',
        solution: { x: round(x), y: round(y) },
        summary: `x = ${round(x)}, y = ${round(y)}`,
        steps
      };
    }

    /**
     * Solves a 3x3 Linear System:
     * a1*x + b1*y + c1*z = d1
     * a2*x + b2*y + c2*z = d2
     * a3*x + b3*y + c3*z = d3
     */
    static solveLinear3(eq1, eq2, eq3) {
      const [a1, b1, c1, d1] = eq1;
      const [a2, b2, c2, d2] = eq2;
      const [a3, b3, c3, d3] = eq3;

      const steps = [];
      steps.push(`<strong>Given System of 3 Equations:</strong><br>` +
        `[1] ${a1}x ${formatSign(b1)}y ${formatSign(c1)}z = ${d1}<br>` +
        `[2] ${a2}x ${formatSign(b2)}y ${formatSign(c2)}z = ${d2}<br>` +
        `[3] ${a3}x ${formatSign(b3)}y ${formatSign(c3)}z = ${d3}`);

      // 3x3 Determinant helper
      const det3 = (m1, m2, m3, m4, m5, m6, m7, m8, m9) => {
        return m1 * (m5 * m9 - m6 * m8) -
               m2 * (m4 * m9 - m6 * m7) +
               m3 * (m4 * m8 - m5 * m7);
      };

      const D = det3(a1, b1, c1, a2, b2, c2, a3, b3, c3);
      const Dx = det3(d1, b1, c1, d2, b2, c2, d3, b3, c3);
      const Dy = det3(a1, d1, c1, a2, d2, c2, a3, d3, c3);
      const Dz = det3(a1, b1, d1, a2, b2, d2, a3, b3, d3);

      steps.push(`<strong>Step 1: Compute Determinants via Cramer's Rule:</strong><br>` +
        `Δ = <strong>${round(D)}</strong><br>` +
        `Δx = <strong>${round(Dx)}</strong><br>` +
        `Δy = <strong>${round(Dy)}</strong><br>` +
        `Δz = <strong>${round(Dz)}</strong>`);

      if (Math.abs(D) < 1e-12) {
        if (Math.abs(Dx) < 1e-12 && Math.abs(Dy) < 1e-12 && Math.abs(Dz) < 1e-12) {
          return {
            type: 'infinite',
            summary: 'Infinitely many solutions (Planes intersect along a line or coincide)',
            steps
          };
        } else {
          return {
            type: 'none',
            summary: 'No solution (Inconsistent system / parallel planes)',
            steps
          };
        }
      }

      const x = Dx / D;
      const y = Dy / D;
      const z = Dz / D;

      steps.push(`<strong>Step 2: Compute Variables:</strong><br>` +
        `x = Δx / Δ = ${round(Dx)} / ${round(D)} = <strong>${round(x)}</strong><br>` +
        `y = Δy / Δ = ${round(Dy)} / ${round(D)} = <strong>${round(y)}</strong><br>` +
        `z = Δz / Δ = ${round(Dz)} / ${round(D)} = <strong>${round(z)}</strong>`);

      return {
        type: 'unique',
        solution: { x: round(x), y: round(y), z: round(z) },
        summary: `x = ${round(x)}, y = ${round(y)}, z = ${round(z)}`,
        steps
      };
    }

    /**
     * Solves Quadratic Equation: ax² + bx + c = 0
     */
    static solveQuadratic(a, b, c) {
      if (Math.abs(a) < 1e-12) {
        throw new Error("Coefficient 'a' cannot be zero in a quadratic equation (a ≠ 0).");
      }

      const steps = [];
      steps.push(`<strong>Standard Form:</strong> ${a}x² ${formatSign(b)}x ${formatSign(c)} = 0`);

      const D = b * b - 4 * a * c;
      steps.push(`<strong>Step 1: Calculate Discriminant:</strong><br>` +
        `D = b² − 4ac = (${b})² − 4(${a})(${c}) = ${round(b * b)} − ${round(4 * a * c)} = <strong>${round(D)}</strong>`);

      // Parabola vertex
      const h = -b / (2 * a);
      const k = c - (b * b) / (4 * a);
      steps.push(`<strong>Vertex & Axis of Symmetry:</strong><br>` +
        `Axis of symmetry: x = −b / (2a) = <strong>${round(h)}</strong><br>` +
        `Vertex coordinates: (h, k) = (<strong>${round(h)}, ${round(k)}</strong>)`);

      let roots = [];
      if (D > 1e-12) {
        const sqrtD = Math.sqrt(D);
        const x1 = (-b + sqrtD) / (2 * a);
        const x2 = (-b - sqrtD) / (2 * a);
        roots = [round(x1), round(x2)];
        steps.push(`<strong>Step 2: Two Distinct Real Roots (D > 0):</strong><br>` +
          `x = (−b ± √D) / (2a)<br>` +
          `x₁ = (−(${b}) + √${round(D)}) / (2 · ${a}) = <strong>${round(x1)}</strong><br>` +
          `x₂ = (−(${b}) − √${round(D)}) / (2 · ${a}) = <strong>${round(x2)}</strong>`);
        return {
          type: 'real_distinct',
          roots,
          summary: `x₁ = ${round(x1)}, x₂ = ${round(x2)}`,
          vertex: { h: round(h), k: round(k) },
          steps
        };
      } else if (Math.abs(D) <= 1e-12) {
        const x = -b / (2 * a);
        roots = [round(x)];
        steps.push(`<strong>Step 2: One Repeated Real Root (D = 0):</strong><br>` +
          `x = −b / (2a) = −(${b}) / (2 · ${a}) = <strong>${round(x)}</strong>`);
        return {
          type: 'real_repeated',
          roots,
          summary: `x = ${round(x)} (multiplicity 2)`,
          vertex: { h: round(h), k: round(k) },
          steps
        };
      } else {
        // Complex conjugate roots
        const realPart = -b / (2 * a);
        const imagPart = Math.sqrt(-D) / (2 * Math.abs(a));
        steps.push(`<strong>Step 2: Complex Conjugate Roots (D < 0):</strong><br>` +
          `x = (−b ± i√|D|) / (2a)<br>` +
          `x₁ = <strong>${round(realPart)} + ${round(imagPart)}i</strong><br>` +
          `x₂ = <strong>${round(realPart)} − ${round(imagPart)}i</strong>`);
        return {
          type: 'complex',
          roots: [
            `${round(realPart)} + ${round(imagPart)}i`,
            `${round(realPart)} - ${round(imagPart)}i`
          ],
          summary: `x = ${round(realPart)} ± ${round(imagPart)}i`,
          vertex: { h: round(h), k: round(k) },
          steps
        };
      }
    }

    /**
     * Solves Cubic Equation: ax³ + bx² + cx + d = 0
     * Using Cardano's method and trigonometric Casus Irreducibilis
     */
    static solveCubic(a, b, c, d) {
      if (Math.abs(a) < 1e-12) {
        throw new Error("Coefficient 'a' cannot be zero in a cubic equation (a ≠ 0).");
      }

      const steps = [];
      steps.push(`<strong>Given Equation:</strong> ${a}x³ ${formatSign(b)}x² ${formatSign(c)}x ${formatSign(d)} = 0`);

      // Normalize to monic cubic: x³ + Ax² + Bx + C = 0
      const A = b / a;
      const B = c / a;
      const C = d / a;
      steps.push(`<strong>Step 1: Divide by leading coefficient a:</strong><br>` +
        `x³ ${formatSign(round(A))}x² ${formatSign(round(B))}x ${formatSign(round(C))} = 0`);

      // Depressed cubic substitution: x = t - A/3
      // t³ + pt + q = 0
      const p = B - (A * A) / 3;
      const q = (2 * A * A * A) / 27 - (A * B) / 3 + C;
      steps.push(`<strong>Step 2: Reduce to Depressed Cubic (t³ + pt + q = 0) with x = t − A/3:</strong><br>` +
        `p = B − A²/3 = <strong>${round(p)}</strong><br>` +
        `q = 2A³/27 − AB/3 + C = <strong>${round(q)}</strong><br>` +
        `Substitution shift: −A/3 = <strong>${round(-A / 3)}</strong>`);

      // Cardano's Discriminant: Δ = (q/2)² + (p/3)³
      const delta = (q / 2) * (q / 2) + (p / 3) * (p / 3) * (p / 3);
      steps.push(`<strong>Step 3: Compute Cardano's Discriminant:</strong><br>` +
        `Δ = (q/2)² + (p/3)³ = <strong>${round(delta)}</strong>`);

      const shift = -A / 3;
      const roots = [];

      if (delta > 1e-12) {
        // One real root and two complex conjugate roots
        const sqrtDelta = Math.sqrt(delta);
        const u = Math.cbrt(-q / 2 + sqrtDelta);
        const v = Math.cbrt(-q / 2 - sqrtDelta);

        const t1 = u + v;
        const x1 = t1 + shift;

        const realPart = -(u + v) / 2 + shift;
        const imagPart = ((u - v) * Math.sqrt(3)) / 2;

        roots.push(round(x1));
        roots.push(`${round(realPart)} + ${round(Math.abs(imagPart))}i`);
        roots.push(`${round(realPart)} - ${round(Math.abs(imagPart))}i`);

        steps.push(`<strong>Step 4: Cardano's Evaluation (Δ > 0):</strong><br>` +
          `1 Real root and 2 Complex conjugate roots:<br>` +
          `x₁ = <strong>${round(x1)}</strong> (Real)<br>` +
          `x₂ = <strong>${round(realPart)} + ${round(Math.abs(imagPart))}i</strong><br>` +
          `x₃ = <strong>${round(realPart)} − ${round(Math.abs(imagPart))}i</strong>`);

        return {
          type: 'one_real_two_complex',
          roots,
          summary: `x₁ = ${round(x1)}, x₂,₃ = ${round(realPart)} ± ${round(Math.abs(imagPart))}i`,
          steps
        };
      } else if (Math.abs(delta) <= 1e-12) {
        // Three real roots, at least two are equal
        const u = Math.cbrt(-q / 2);
        const t1 = 2 * u;
        const t2 = -u;

        const x1 = t1 + shift;
        const x2 = t2 + shift;

        roots.push(round(x1), round(x2), round(x2));

        steps.push(`<strong>Step 4: Real Roots with Multiplicity (Δ = 0):</strong><br>` +
          `x₁ = <strong>${round(x1)}</strong><br>` +
          `x₂ = x₃ = <strong>${round(x2)}</strong> (double root)`);

        return {
          type: 'real_multiple',
          roots,
          summary: `x₁ = ${round(x1)}, x₂ = x₃ = ${round(x2)}`,
          steps
        };
      } else {
        // Casus Irreducibilis (Δ < 0): Three distinct real roots via Trigonometric form
        const r = Math.sqrt(-p * p * p / 27);
        const phi = Math.acos(Math.max(-1, Math.min(1, -q / (2 * r))));
        const m = 2 * Math.sqrt(-p / 3);

        const t1 = m * Math.cos(phi / 3);
        const t2 = m * Math.cos((phi + 2 * Math.PI) / 3);
        const t3 = m * Math.cos((phi + 4 * Math.PI) / 3);

        const x1 = t1 + shift;
        const x2 = t2 + shift;
        const x3 = t3 + shift;

        roots.push(round(x1), round(x2), round(x3));
        roots.sort((a, b) => a - b);

        steps.push(`<strong>Step 4: Three Distinct Real Roots via Trig Method (Δ < 0):</strong><br>` +
          `Angle parameter φ = acos(−q / (2r)) = <strong>${round(phi)} rad</strong><br>` +
          `x₁ = <strong>${round(roots[0])}</strong><br>` +
          `x₂ = <strong>${round(roots[1])}</strong><br>` +
          `x₃ = <strong>${round(roots[2])}</strong>`);

        return {
          type: 'three_real',
          roots,
          summary: `x₁ = ${round(roots[0])}, x₂ = ${round(roots[1])}, x₃ = ${round(roots[2])}`,
          steps
        };
      }
    }
  }

  return {
    EquationSolver
  };
});

