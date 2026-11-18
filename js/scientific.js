/**
 * scientific.js - Scientific Calculator Module, Constants & Formula Cheat Sheet
 * OmniCalc Pro - Engineering Calculator
 * Developer: Sujal Mahalange
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.OmniScientific = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // --- Engineering Constants Library ---
  const CONSTANTS = [
    {
      category: 'Universal',
      symbol: 'c',
      name: 'Speed of Light in Vacuum',
      value: 299792458,
      unit: 'm / s',
      description: 'Exact speed of electromagnetic radiation in vacuum'
    },
    {
      category: 'Universal',
      symbol: 'G',
      name: 'Newtonian Gravitational Constant',
      value: 6.67430e-11,
      unit: 'm³ · kg⁻¹ · s⁻²',
      description: 'Gravitational attraction constant'
    },
    {
      category: 'Universal',
      symbol: 'g',
      name: 'Standard Acceleration of Gravity',
      value: 9.80665,
      unit: 'm / s²',
      description: 'Standard Earth surface gravitational acceleration'
    },
    {
      category: 'Universal',
      symbol: 'h',
      name: 'Planck Constant',
      value: 6.62607015e-34,
      unit: 'J · s',
      description: 'Fundamental quantum of action'
    },
    {
      category: 'Universal',
      symbol: 'ħ',
      name: 'Reduced Planck Constant (h-bar)',
      value: 1.054571817e-34,
      unit: 'J · s',
      description: 'h / (2π), Dirac constant'
    },
    {
      category: 'Electromagnetic',
      symbol: 'e',
      name: 'Elementary Charge',
      value: 1.602176634e-19,
      unit: 'C',
      description: 'Electric charge carried by a single proton'
    },
    {
      category: 'Electromagnetic',
      symbol: 'ε₀',
      name: 'Vacuum Electric Permittivity',
      value: 8.8541878128e-12,
      unit: 'F / m',
      description: 'Electric constant of free space'
    },
    {
      category: 'Electromagnetic',
      symbol: 'μ₀',
      name: 'Vacuum Magnetic Permeability',
      value: 1.25663706212e-6,
      unit: 'N / A²',
      description: 'Magnetic constant of free space'
    },
    {
      category: 'Electromagnetic',
      symbol: 'Z₀',
      name: 'Characteristic Impedance of Vacuum',
      value: 376.730313668,
      unit: 'Ω',
      description: 'Wave impedance in free space'
    },
    {
      category: 'Physico-Chemical',
      symbol: 'N_A',
      name: 'Avogadro Constant',
      value: 6.02214076e23,
      unit: 'mol⁻¹',
      description: 'Number of particles per mole'
    },
    {
      category: 'Physico-Chemical',
      symbol: 'k_B',
      name: 'Boltzmann Constant',
      value: 1.380649e-23,
      unit: 'J / K',
      description: 'Relates thermal energy to temperature'
    },
    {
      category: 'Physico-Chemical',
      symbol: 'R',
      name: 'Universal Molar Gas Constant',
      value: 8.314462618,
      unit: 'J · mol⁻¹ · K⁻¹',
      description: 'Constant in the ideal gas equation (PV = nRT)'
    },
    {
      category: 'Physico-Chemical',
      symbol: 'F',
      name: 'Faraday Constant',
      value: 96485.33212,
      unit: 'C / mol',
      description: 'Electric charge per mole of electrons'
    },
    {
      category: 'Physico-Chemical',
      symbol: 'σ',
      name: 'Stefan-Boltzmann Constant',
      value: 5.670374419e-8,
      unit: 'W · m⁻² · K⁻⁴',
      description: 'Black-body radiation constant'
    },
    {
      category: 'Atomic & Nuclear',
      symbol: 'm_e',
      name: 'Electron Rest Mass',
      value: 9.1093837015e-31,
      unit: 'kg',
      description: 'Mass of stationary electron'
    },
    {
      category: 'Atomic & Nuclear',
      symbol: 'm_p',
      name: 'Proton Rest Mass',
      value: 1.67262192369e-27,
      unit: 'kg',
      description: 'Mass of stationary proton'
    },
    {
      category: 'Atomic & Nuclear',
      symbol: 'm_n',
      name: 'Neutron Rest Mass',
      value: 1.67492749804e-27,
      unit: 'kg',
      description: 'Mass of stationary neutron'
    },
    {
      category: 'Atomic & Nuclear',
      symbol: 'a₀',
      name: 'Bohr Radius',
      value: 5.29177210903e-11,
      unit: 'm',
      description: 'Most probable distance from nucleus to electron in hydrogen'
    },
    {
      category: 'Atomic & Nuclear',
      symbol: 'R_∞',
      name: 'Rydberg Constant',
      value: 10973731.568160,
      unit: 'm⁻¹',
      description: 'Relates to electromagnetic spectra of an atom'
    }
  ];

  // --- Engineering Formulas Library ---
  const FORMULAS = [
    {
      category: 'Electrical',
      title: "Ohm's Law & DC Power",
      equation: 'V = I · R   |   P = V · I = I²R = V² / R',
      variables: 'V = Voltage (V), I = Current (A), R = Resistance (Ω), P = Power (W)',
      calcSnippet: 'I * R'
    },
    {
      category: 'Electrical',
      title: 'AC Impedance & Reactance',
      equation: 'X_L = 2π f L   |   X_C = 1 / (2π f C)   |   Z = √(R² + (X_L - X_C)²)',
      variables: 'f = Frequency (Hz), L = Inductance (H), C = Capacitance (F), Z = Impedance (Ω)',
      calcSnippet: 'sqrt(R^2 + (2*pi*f*L - 1/(2*pi*f*C))^2)'
    },
    {
      category: 'Electrical',
      title: 'Resonant Frequency (LC Circuit)',
      equation: 'f₀ = 1 / (2π √(L · C))',
      variables: 'f₀ = Resonant Frequency (Hz), L = Inductance (H), C = Capacitance (F)',
      calcSnippet: '1 / (2 * pi * sqrt(L * C))'
    },
    {
      category: 'Electrical',
      title: 'RC Circuit Time Constant & Cutoff',
      equation: 'τ = R · C   |   f_c = 1 / (2π R C)',
      variables: 'τ = Time constant (s), f_c = Cutoff frequency (-3dB) (Hz)',
      calcSnippet: '1 / (2 * pi * R * C)'
    },
    {
      category: 'Physics',
      title: "Newton's 2nd Law & Work",
      equation: 'F = m · a   |   W = F · d · cos(θ)   |   E_k = 0.5 · m · v²',
      variables: 'F = Force (N), m = Mass (kg), a = Accel (m/s²), E_k = Kinetic Energy (J)',
      calcSnippet: '0.5 * m * v^2'
    },
    {
      category: 'Physics',
      title: 'Kinematic Equations (Uniform Accel)',
      equation: 'v = u + a·t   |   s = u·t + 0.5·a·t²   |   v² = u² + 2·a·s',
      variables: 'u = Initial vel, v = Final vel, a = Accel, t = Time, s = Displacement',
      calcSnippet: 'u*t + 0.5*a*t^2'
    },
    {
      category: 'Physics',
      title: 'Ideal Gas Law',
      equation: 'P · V = n · R · T   =   N · k_B · T',
      variables: 'P = Pressure (Pa), V = Volume (m³), n = Moles, T = Temperature (K)',
      calcSnippet: 'n * 8.314462618 * T / V'
    },
    {
      category: 'Physics',
      title: "Coulomb's Law",
      equation: 'F = (1 / (4πε₀)) · (|q₁ · q₂| / r²)',
      variables: 'q₁, q₂ = Electric charges (C), r = Distance (m), ε₀ = Permittivity',
      calcSnippet: '(1 / (4 * pi * 8.8541878e-12)) * (q1 * q2) / (r^2)'
    },
    {
      category: 'Mathematics',
      title: 'Euler’s Formula & Trig Identity',
      equation: 'e^(iθ) = cos(θ) + i·sin(θ)   |   sin²(θ) + cos²(θ) = 1',
      variables: 'θ = Angle in radians, i = Imaginary unit',
      calcSnippet: 'cos(theta) + sin(theta)'
    },
    {
      category: 'Mathematics',
      title: 'Quadratic Equation Solution',
      equation: 'x = (-b ± √(b² - 4ac)) / (2a)',
      variables: 'Discriminant D = b² - 4ac, a ≠ 0',
      calcSnippet: '(-b + sqrt(b^2 - 4*a*c)) / (2*a)'
    },
    {
      category: 'Mathematics',
      title: 'Logarithm Properties',
      equation: 'log_b(xy) = log_b(x) + log_b(y)   |   log_b(x/y) = log_b(x) - log_b(y)',
      variables: 'Change of base: log_b(x) = ln(x) / ln(b)',
      calcSnippet: 'ln(x) / ln(b)'
    }
  ];

  class ScientificController {
    constructor(calculator) {
      this.calc = calculator;
      this.is2nd = false;
      this.isHyp = false;
    }

    toggle2nd() {
      this.is2nd = !this.is2nd;
      return this.is2nd;
    }

    toggleHyp() {
      this.isHyp = !this.isHyp;
      return this.isHyp;
    }

    // Handles smart insert for scientific functions
    handleFunction(fnName) {
      let resolvedFn = fnName;

      // 2nd function mappings
      if (this.is2nd) {
        const mappings2nd = {
          'sin': 'asin',
          'cos': 'acos',
          'tan': 'atan',
          'sinh': 'asinh',
          'cosh': 'acosh',
          'tanh': 'atanh',
          'ln': 'exp',
          'log': '10^',
          'sqrt': 'sq',
          'cbrt': 'cube'
        };
        if (mappings2nd[fnName]) {
          resolvedFn = mappings2nd[fnName];
        }
      }

      // Hyp mode mappings
      if (this.isHyp && !this.is2nd) {
        const hypMappings = {
          'sin': 'sinh',
          'cos': 'cosh',
          'tan': 'tanh'
        };
        if (hypMappings[fnName]) {
          resolvedFn = hypMappings[fnName];
        }
      }

      // Insert into calculator
      switch (resolvedFn) {
        case 'sq':
          this.calc.append('^2');
          break;
        case 'cube':
          this.calc.append('^3');
          break;
        case 'pow':
          this.calc.append('^');
          break;
        case '10^':
          this.calc.append('10^(');
          break;
        case 'exp':
          this.calc.append('exp(');
          break;
        case 'inv':
          // 1/x: wrap current or insert
          this.calc.append('inv(');
          break;
        case 'root':
          this.calc.append('root(');
          break;
        case 'npr':
          this.calc.append('nPr(');
          break;
        case 'ncr':
          this.calc.append('nCr(');
          break;
        case 'abs':
          this.calc.append('abs(');
          break;
        case 'fact':
          this.calc.append('!');
          break;
        case 'exp_notation':
          // Scientific EXP key: inserts 'e' e.g. 5e6
          this.calc.append('e');
          break;
        default:
          this.calc.appendFunction(resolvedFn);
          break;
      }
    }

    getConstants(category = null) {
      if (!category || category === 'All') return CONSTANTS;
      return CONSTANTS.filter(c => c.category === category);
    }

    getFormulas(category = null) {
      if (!category || category === 'All') return FORMULAS;
      return FORMULAS.filter(f => f.category === category);
    }
  }

  return {
    CONSTANTS,
    FORMULAS,
    ScientificController
  };
});

