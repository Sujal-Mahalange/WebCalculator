# OmniCalc Pro - Modern Engineering Calculator Suite

A responsive, high-performance web calculator engineered for engineering students, researchers, and developers. Built entirely with vanilla HTML5, CSS3, and JavaScript — requiring no build steps, node packages, or frameworks. Ready for immediate static deployment on Netlify or GitHub Pages.

Developed with care by **Sujal Mahalange**.

---

## 🌟 Highlights & Key Features

### 1. 🧮 9 Dedicated Operational Modes
1. **Standard Calculator**: Everyday arithmetic, memory registers (`M+`, `M−`, `MR`, `MC`), backspace, percentage, sign negation, and live expression evaluation.
2. **Scientific Calculator**:
   - Trigonometric & Hyperbolic (`sin`, `cos`, `tan`, `sinh`, `cosh`, `tanh`, and their inverses).
   - Angle toggling: **DEG**, **RAD**, **GRAD**.
   - Power & Root functions: $x^2$, $x^3$, $x^y$, $\sqrt{x}$, $\sqrt[3]{x}$, $\sqrt[n]{x}$.
   - Factorials ($n!$), Combinatorics ($n\text{Pr}$, $n\text{Cr}$), Absolute value ($|x|$), Reciprocal ($1/x$).
   - Constants ($\pi$, $e$, $\text{Ans}$), Scientific notation ($\text{EXP}$).
   - **2nd Function** and **HYP** toggles.
3. **Programmer Calculator**:
   - Real-time simultaneous display in **HEX**, **DEC**, **OCT**, and **BIN**.
   - Word size selection: **QWORD** (64-bit), **DWORD** (32-bit), **WORD** (16-bit), **BYTE** (8-bit) powered by JavaScript `BigInt`.
   - **Interactive Bit-Toggle Grid**: Click individual bits (0 or 1) in 4-bit nibble groupings to alter the number in real-time.
   - Bitwise logic: `AND`, `OR`, `XOR`, `NOT`, `NAND`, `NOR`, `LSH (<<)`, `RSH (>>)`.
   - One's complement and Two's complement calculation.
4. **Graphing Calculator**:
   - Interactive HTML5 Canvas plotting $y = f(x)$ with multi-function support ($f_1, f_2, f_3$).
   - Mouse pan and drag, touch swipe, zoom controls, and coordinate grid scaling.
   - Real-time **Trace Cursor** with crosshairs displaying precise $(x, y)$ values at the pointer.
   - Presets for polynomial, trigonometric, and damped exponential curves.
5. **Matrix Calculator**:
   - Matrices $A$ and $B$ supporting dynamic sizes from $1 \times 1$ up to $4 \times 4$.
   - Matrix addition, subtraction, and multiplication ($A \times B$).
   - Determinant calculation $\det(A), \det(B)$.
   - Matrix inverse ($A^{-1}, B^{-1}$) using cofactor/adjugate algebra.
   - Transpose ($A^T, B^T$), Rank, Trace, and quick presets (Identity, Random, Zero).
6. **Equation Solver**:
   - **2x2 Linear Systems**: Solved via Cramer's Rule with full determinant steps ($\Delta, \Delta_x, \Delta_y$).
   - **3x3 Linear Systems**: Solved via Cramer's Rule with step-by-step 3x3 expansion.
   - **Quadratic Equations**: $ax^2 + bx + c = 0$ with discriminant analysis, vertex coordinates, and real or complex roots.
   - **Cubic Equations**: $ax^3 + bx^2 + cx + d = 0$ using depressed cubic reduction, Cardano's formula, and trigonometric solution for three real roots.
7. **Unit Converter**:
   - 12 Engineering categories: Length, Mass, Temperature, Area, Volume, Speed, Time, Pressure, Energy, Power, Data Size, and Angle.
   - Instant bi-directional calculation and swap button.
8. **Complex Numbers**:
   - Dual representation in Rectangular ($a + bi$) and Polar ($r \angle \theta$) forms.
   - Modulus $|z|$, argument $\theta$, conjugate, reciprocal, powers, and roots.
9. **Descriptive Statistics**:
   - Input numbers separated by commas, spaces, or spreadsheet columns.
   - Computes: Mean, Median, Mode, Min, Max, Range, Sum, Sum of Squares, Sample & Population Variance, Standard Deviation, Standard Error of the Mean (SEM), and Quartiles ($Q_1, Q_3, \text{IQR}$).

---

### 2. ⚡ Engineering Extras
- **Safe Math Parser**: Built from scratch using a recursive descent tokenizer and parser. Does not use unsafe `eval()` or `Function()`.
- **Live Preview**: See the evaluated answer subtly update before pressing `=`.
- **Engineering Constants Library**: 19 fundamental constants (speed of light, Planck constant, gravitational constant, Boltzmann, Avogadro, etc.) ready for one-click insertion.
- **Formula Cheat Sheet**: Quick reference for Physics, Mathematics, and Electrical Engineering formulas.
- **LaTeX Export**: One-click "Copy as LaTeX" formatting for academic papers and reports.
- **Voice Input**: Web Speech API integration to dictate mathematical expressions.
- **Sound & Haptics**: Subtle Web Audio synthesizer for key feedback (can be muted anytime).
- **Themes**: Switch between **Dark**, **Light**, and **Neon** cyberpunk styles, persisted in `localStorage`.
- **Offline PWA Support**: Complete with `manifest.json` and `sw.js` service worker for mobile and desktop app installation.

---

## 📁 Project Architecture

```
WebCalculator/
├── index.html           # Main semantic markup & accessible UI structure
├── netlify.toml         # Netlify production deployment configuration
├── manifest.json        # Progressive Web App manifest
├── sw.js                # Service Worker for offline asset caching
├── favicon.svg          # Vector icon for browser and PWA
├── LICENSE              # Open source license
├── README.md            # Documentation & local running guide
├── .gitignore           # Ignored files for version control
├── css/
│   └── style.css        # Responsive glassmorphism styles & theme variables
└── js/
    ├── calculator.js    # Recursive descent parser & standard calculator state
    ├── scientific.js    # Scientific functions, constants library & cheat sheets
    ├── programmer.js    # Multi-radix logic, bit-grid & BigInt bitwise operations
    ├── graph.js         # Canvas graphing engine with zoom, pan & trace cursor
    ├── matrix.js        # Matrix algebra up to 4x4, inverse, rank & determinants
    ├── solver.js        # Linear systems, quadratic & cubic step-by-step solvers
    ├── converter.js     # 12-category unit converter with instant calculations
    ├── complex.js       # Complex numbers arithmetic & polar/rect conversion
    ├── stats.js         # Descriptive statistics & quartile calculations
    ├── history.js       # localStorage-backed calculation history manager
    ├── theme.js         # Dark/Light/Neon themes & ambient floating background
    └── app.js           # Main coordinator, keyboard shortcuts & voice recognition
```

---

## 🚀 How to Run Locally

Because this project uses vanilla web standards, you don't need `npm install` or any build commands.

### Option A: Using Python (Recommended)
Open a terminal in the project directory and run:

```bash
# Python 3
python -m http.server 8000
```

Then visit [http://localhost:8000](http://localhost:8000) in your web browser.

### Option B: Using VS Code Live Server
1. Open the project folder in VS Code.
2. Install the **Live Server** extension.
3. Right-click `index.html` and click **"Open with Live Server"**.

### Option C: Direct Browser Opening
You can double-click `index.html` directly in your file manager to open it in any modern browser (Chrome, Edge, Firefox, Safari).

---

## ☁️ Deploying to Netlify

This repository is pre-configured with `netlify.toml`:
1. Push this project to your GitHub repository.
2. Log in to [Netlify](https://www.netlify.com/).
3. Click **"Add new site"** > **"Import an existing project"** > Choose your GitHub repository.
4. Leave build command empty and set publish directory to `.` (already in `netlify.toml`).
5. Click **Deploy**. Your calculator website will be live in seconds!

---

## ⌨️ Keyboard Shortcuts Reference

| Key | Function |
| --- | --- |
| `0` - `9`, `.` | Enter numbers or decimal point |
| `+`, `-`, `*`, `/`, `^`, `%` | Arithmetic & power operators |
| `Enter` or `=` | Compute expression |
| `Backspace` | Erase previous character |
| `Escape` or `C` | Clear calculator (AC) |
| `S`, `T`, `L` | Input `sin`, `tan`, `ln` functions |
| `P` | Insert constant $\pi$ |
| `E` | Insert Euler's constant $e$ |
| `Alt` + `1` through `9` | Directly switch between the 9 calculator modes |
| `?` | Open keyboard shortcuts help modal |

---

## 👨‍💻 Author

Crafted by **Sujal Mahalange**  
*OmniCalc Pro — Built for engineering minds.*
