/**
 * complex.js - Complex Numbers Calculator Module
 * OmniCalc Pro - Engineering Calculator
 * Developer: Sujal Mahalange
 * 
 * Features:
 * - Rectangular (a + bi) and Polar (r ∠ θ) representations
 * - Arithmetic: Addition, Subtraction, Multiplication, Division
 * - Modulus / Magnitude |z| and Phase / Argument θ (DEG & RAD)
 * - Complex Conjugate, Reciprocal 1/z, Powers z^n, Square Root
 * - Complex Exp e^z and Natural Log ln(z)
 * - Interactive form conversion (Rectangular <-> Polar)
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.OmniComplex = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function cleanRound(n, dec = 6) {
    if (Math.abs(n) < 1e-12) return 0;
    const factor = Math.pow(10, dec);
    return Math.round((n + Number.EPSILON) * factor) / factor;
  }

  class Complex {
    constructor(real = 0, imag = 0) {
      this.re = Number(real) || 0;
      this.im = Number(imag) || 0;
    }

    // Factory from Polar coordinates (r, theta in radians)
    static fromPolar(r, thetaRad) {
      return new Complex(r * Math.cos(thetaRad), r * Math.sin(thetaRad));
    }

    // Factory from Polar coordinates with theta in degrees
    static fromPolarDeg(r, thetaDeg) {
      const rad = thetaDeg * (Math.PI / 180);
      return Complex.fromPolar(r, rad);
    }

    // Magnitude / Modulus |z| = sqrt(a² + b²)
    magnitude() {
      return Math.hypot(this.re, this.im);
    }

    // Phase in radians [-π, π]
    phaseRad() {
      return Math.atan2(this.im, this.re);
    }

    // Phase in degrees [-180, 180]
    phaseDeg() {
      return this.phaseRad() * (180 / Math.PI);
    }

    // Addition: z1 + z2
    add(other) {
      return new Complex(this.re + other.re, this.im + other.im);
    }

    // Subtraction: z1 - z2
    subtract(other) {
      return new Complex(this.re - other.re, this.im - other.im);
    }

    // Multiplication: z1 * z2
    multiply(other) {
      return new Complex(
        this.re * other.re - this.im * other.im,
        this.re * other.im + this.im * other.re
      );
    }

    // Division: z1 / z2
    divide(other) {
      const denom = other.re * other.re + other.im * other.im;
      if (denom === 0) {
        throw new Error('Complex division by zero');
      }
      return new Complex(
        (this.re * other.re + this.im * other.im) / denom,
        (this.im * other.re - this.re * other.im) / denom
      );
    }

    // Complex conjugate: a - bi
    conjugate() {
      return new Complex(this.re, -this.im);
    }

    // Reciprocal: 1 / z
    reciprocal() {
      const denom = this.re * this.re + this.im * this.im;
      if (denom === 0) throw new Error('Reciprocal of zero is undefined');
      return new Complex(this.re / denom, -this.im / denom);
    }

    // Power z^n using De Moivre's theorem
    power(n) {
      const r = this.magnitude();
      const theta = this.phaseRad();
      const newR = Math.pow(r, n);
      const newTheta = theta * n;
      return Complex.fromPolar(newR, newTheta);
    }

    // Square root
    sqrt() {
      return this.power(0.5);
    }

    // Natural Logarithm: ln(z) = ln|z| + i*theta
    ln() {
      const r = this.magnitude();
      if (r === 0) throw new Error('Logarithm of zero is undefined');
      return new Complex(Math.log(r), this.phaseRad());
    }

    // Exponential: e^z = e^a * (cos b + i*sin b)
    exp() {
      const expA = Math.exp(this.re);
      return new Complex(expA * Math.cos(this.im), expA * Math.sin(this.im));
    }

    // Formatted Rectangular String: "a + bi"
    toRectString() {
      const r = cleanRound(this.re);
      const i = cleanRound(this.im);
      if (i === 0) return `${r}`;
      if (r === 0) {
        if (i === 1) return 'i';
        if (i === -1) return '-i';
        return `${i}i`;
      }
      const sign = i > 0 ? '+' : '-';
      const absI = Math.abs(i);
      const iStr = absI === 1 ? 'i' : `${absI}i`;
      return `${r} ${sign} ${iStr}`;
    }

    // Formatted Polar String (Degrees): "r ∠ θ°"
    toPolarDegString() {
      const r = cleanRound(this.magnitude());
      const theta = cleanRound(this.phaseDeg());
      return `${r} ∠ ${theta}°`;
    }

    // Formatted Polar String (Radians): "r ∠ θ rad"
    toPolarRadString() {
      const r = cleanRound(this.magnitude());
      const theta = cleanRound(this.phaseRad());
      return `${r} ∠ ${theta} rad`;
    }

    // Exponential form: "r · e^(iθ)"
    toExpString() {
      const r = cleanRound(this.magnitude());
      const theta = cleanRound(this.phaseRad());
      return `${r} · e^(${theta}i)`;
    }
  }

  return {
    Complex,
    cleanRound
  };
});
