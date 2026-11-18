/**
 * converter.js - Engineering Unit Converter Module
 * OmniCalc Pro - Engineering Calculator
 * Developer: Sujal Mahalange
 * 
 * Features:
 * - 12 Categories: Length, Mass, Temp, Area, Volume, Speed, Time, Pressure, Energy, Power, Data Size, Angle
 * - Live bi-directional instant conversion
 * - Unit swap with animated transition
 * - Exact conversion factor formula display
 * - High-precision scientific rounding
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.OmniConverter = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // Base unit system definitions
  const CONVERSION_DATA = {
    length: {
      name: 'Length',
      base: 'm',
      units: {
        m: { name: 'Meter (m)', factor: 1 },
        km: { name: 'Kilometer (km)', factor: 1000 },
        cm: { name: 'Centimeter (cm)', factor: 0.01 },
        mm: { name: 'Millimeter (mm)', factor: 0.001 },
        um: { name: 'Micrometer (µm)', factor: 1e-6 },
        nm: { name: 'Nanometer (nm)', factor: 1e-9 },
        mi: { name: 'Mile (mi)', factor: 1609.344 },
        yd: { name: 'Yard (yd)', factor: 0.9144 },
        ft: { name: 'Foot (ft)', factor: 0.3048 },
        in: { name: 'Inch (in)', factor: 0.0254 },
        nmi: { name: 'Nautical Mile (nmi)', factor: 1852 }
      }
    },
    mass: {
      name: 'Mass & Weight',
      base: 'kg',
      units: {
        kg: { name: 'Kilogram (kg)', factor: 1 },
        g: { name: 'Gram (g)', factor: 0.001 },
        mg: { name: 'Milligram (mg)', factor: 1e-6 },
        ug: { name: 'Microgram (µg)', factor: 1e-9 },
        t: { name: 'Metric Ton (t)', factor: 1000 },
        lb: { name: 'Pound (lb)', factor: 0.45359237 },
        oz: { name: 'Ounce (oz)', factor: 0.028349523125 },
        st: { name: 'Stone (st)', factor: 6.35029318 }
      }
    },
    temperature: {
      name: 'Temperature',
      base: 'C',
      units: {
        C: { name: 'Celsius (°C)', factor: 1 },
        F: { name: 'Fahrenheit (°F)', factor: 1 },
        K: { name: 'Kelvin (K)', factor: 1 },
        R: { name: 'Rankine (°R)', factor: 1 }
      },
      // Custom non-linear conversions for temperature
      convert: (val, from, to) => {
        if (from === to) return val;
        // Convert 'from' to Celsius
        let c = val;
        if (from === 'F') c = (val - 32) * (5 / 9);
        else if (from === 'K') c = val - 273.15;
        else if (from === 'R') c = (val - 491.67) * (5 / 9);

        // Convert Celsius to 'to'
        if (to === 'C') return c;
        if (to === 'F') return c * (9 / 5) + 32;
        if (to === 'K') return c + 273.15;
        if (to === 'R') return (c + 273.15) * 1.8;
        return c;
      }
    },
    area: {
      name: 'Area',
      base: 'm2',
      units: {
        m2: { name: 'Square Meter (m²)', factor: 1 },
        km2: { name: 'Square Kilometer (km²)', factor: 1e6 },
        cm2: { name: 'Square Centimeter (cm²)', factor: 1e-4 },
        ft2: { name: 'Square Foot (ft²)', factor: 0.09290304 },
        in2: { name: 'Square Inch (in²)', factor: 0.00064516 },
        yd2: { name: 'Square Yard (yd²)', factor: 0.83612736 },
        ac: { name: 'Acre (ac)', factor: 4046.8564224 },
        ha: { name: 'Hectare (ha)', factor: 10000 }
      }
    },
    volume: {
      name: 'Volume',
      base: 'L',
      units: {
        L: { name: 'Liter (L)', factor: 1 },
        mL: { name: 'Milliliter (mL)', factor: 0.001 },
        m3: { name: 'Cubic Meter (m³)', factor: 1000 },
        cm3: { name: 'Cubic Centimeter (cm³)', factor: 0.001 },
        gal: { name: 'Gallon (US gal)', factor: 3.785411784 },
        qt: { name: 'Quart (US qt)', factor: 0.946352946 },
        pt: { name: 'Pint (US pt)', factor: 0.473176473 },
        cup: { name: 'Cup (US cup)', factor: 0.2365882365 },
        floz: { name: 'Fluid Ounce (fl oz)', factor: 0.0295735295625 },
        ft3: { name: 'Cubic Foot (ft³)', factor: 28.316846592 }
      }
    },
    speed: {
      name: 'Speed',
      base: 'mps',
      units: {
        mps: { name: 'Meter per second (m/s)', factor: 1 },
        kmh: { name: 'Kilometer per hour (km/h)', factor: 0.2777777777777778 },
        mph: { name: 'Mile per hour (mph)', factor: 0.44704 },
        knot: { name: 'Knot (kn)', factor: 0.5144444444444445 },
        fps: { name: 'Foot per second (ft/s)', factor: 0.3048 },
        mach: { name: 'Mach (at sea level)', factor: 340.29 }
      }
    },
    time: {
      name: 'Time',
      base: 's',
      units: {
        s: { name: 'Second (s)', factor: 1 },
        ms: { name: 'Millisecond (ms)', factor: 1e-3 },
        us: { name: 'Microsecond (µs)', factor: 1e-6 },
        ns: { name: 'Nanosecond (ns)', factor: 1e-9 },
        min: { name: 'Minute (min)', factor: 60 },
        h: { name: 'Hour (h)', factor: 3600 },
        d: { name: 'Day (d)', factor: 86400 },
        wk: { name: 'Week (wk)', factor: 604800 },
        mo: { name: 'Month (avg)', factor: 2629800 },
        yr: { name: 'Year (365.25 d)', factor: 31557600 }
      }
    },
    pressure: {
      name: 'Pressure',
      base: 'Pa',
      units: {
        Pa: { name: 'Pascal (Pa)', factor: 1 },
        kPa: { name: 'Kilopascal (kPa)', factor: 1000 },
        MPa: { name: 'Megapascal (MPa)', factor: 1e6 },
        bar: { name: 'Bar', factor: 1e5 },
        mbar: { name: 'Millibar (mbar)', factor: 100 },
        atm: { name: 'Standard Atmosphere (atm)', factor: 101325 },
        psi: { name: 'Pound per sq inch (psi)', factor: 6894.757293 },
        torr: { name: 'Torr / mmHg', factor: 133.322368421 }
      }
    },
    energy: {
      name: 'Energy & Work',
      base: 'J',
      units: {
        J: { name: 'Joule (J)', factor: 1 },
        kJ: { name: 'Kilojoule (kJ)', factor: 1000 },
        MJ: { name: 'Megajoule (MJ)', factor: 1e6 },
        cal: { name: 'Calorie (cal)', factor: 4.184 },
        kcal: { name: 'Kilocalorie (kcal)', factor: 4184 },
        Wh: { name: 'Watt-hour (Wh)', factor: 3600 },
        kWh: { name: 'Kilowatt-hour (kWh)', factor: 3.6e6 },
        eV: { name: 'Electronvolt (eV)', factor: 1.602176634e-19 },
        BTU: { name: 'British Thermal Unit (BTU)', factor: 1055.05585262 }
      }
    },
    power: {
      name: 'Power',
      base: 'W',
      units: {
        W: { name: 'Watt (W)', factor: 1 },
        kW: { name: 'Kilowatt (kW)', factor: 1000 },
        MW: { name: 'Megawatt (MW)', factor: 1e6 },
        hp: { name: 'Horsepower (Mechanical hp)', factor: 745.6998715822702 },
        hpm: { name: 'Horsepower (Metric PS)', factor: 735.49875 },
        ftlbps: { name: 'Foot-pound/sec (ft·lb/s)', factor: 1.3558179483314 }
      }
    },
    data: {
      name: 'Data Storage',
      base: 'B',
      units: {
        B: { name: 'Byte (B)', factor: 1 },
        bit: { name: 'Bit (b)', factor: 0.125 },
        KB: { name: 'Kilobyte (KB - 10³)', factor: 1000 },
        MB: { name: 'Megabyte (MB - 10⁶)', factor: 1e6 },
        GB: { name: 'Gigabyte (GB - 10⁹)', factor: 1e9 },
        TB: { name: 'Terabyte (TB - 10¹²)', factor: 1e12 },
        PB: { name: 'Petabyte (PB - 10¹⁵)', factor: 1e15 },
        KiB: { name: 'Kibibyte (KiB - 2¹⁰)', factor: 1024 },
        MiB: { name: 'Mebibyte (MiB - 2²⁰)', factor: 1048576 },
        GiB: { name: 'Gibibyte (GiB - 2³⁰)', factor: 1073741824 }
      }
    },
    angle: {
      name: 'Angle',
      base: 'deg',
      units: {
        deg: { name: 'Degree (°)', factor: 1 },
        rad: { name: 'Radian (rad)', factor: 180 / Math.PI },
        grad: { name: 'Gradian (grad)', factor: 0.9 },
        arcmin: { name: 'Arcminute (′)', factor: 1 / 60 },
        arcsec: { name: 'Arcsecond (″)', factor: 1 / 3600 },
        rev: { name: 'Revolution (rev / turn)', factor: 360 }
      }
    }
  };

  class UnitConverter {
    static getCategories() {
      return Object.keys(CONVERSION_DATA).map(key => ({
        id: key,
        name: CONVERSION_DATA[key].name
      }));
    }

    static getUnits(category) {
      const cat = CONVERSION_DATA[category];
      if (!cat) return [];
      return Object.keys(cat.units).map(key => ({
        id: key,
        name: cat.units[key].name
      }));
    }

    static convert(value, category, fromUnit, toUnit) {
      if (typeof value !== 'number' || isNaN(value)) {
        return 0;
      }

      const cat = CONVERSION_DATA[category];
      if (!cat) throw new Error(`Unknown category: ${category}`);

      // Custom conversion (e.g. Temperature)
      if (cat.convert) {
        return cat.convert(value, fromUnit, toUnit);
      }

      const fromObj = cat.units[fromUnit];
      const toObj = cat.units[toUnit];

      if (!fromObj || !toObj) {
        throw new Error(`Invalid unit: ${fromUnit} or ${toUnit}`);
      }

      // Base conversion: value * factorFrom / factorTo
      const inBase = value * fromObj.factor;
      return inBase / toObj.factor;
    }

    static getFormula(category, fromUnit, toUnit) {
      const cat = CONVERSION_DATA[category];
      if (!cat) return '';

      if (category === 'temperature') {
        if (fromUnit === 'C' && toUnit === 'F') return '°F = (°C × 9/5) + 32';
        if (fromUnit === 'F' && toUnit === 'C') return '°C = (°F − 32) × 5/9';
        if (fromUnit === 'C' && toUnit === 'K') return 'K = °C + 273.15';
        if (fromUnit === 'K' && toUnit === 'C') return '°C = K − 273.15';
        return '';
      }

      const fromFactor = cat.units[fromUnit]?.factor || 1;
      const toFactor = cat.units[toUnit]?.factor || 1;
      const ratio = fromFactor / toFactor;

      const formattedRatio = (ratio >= 1e6 || (ratio < 1e-4 && ratio > 0))
        ? ratio.toExponential(4)
        : Number(ratio.toPrecision(6));

      return `1 ${fromUnit} = ${formattedRatio} ${toUnit}`;
    }
  }

  return {
    CONVERSION_DATA,
    UnitConverter
  };
});

