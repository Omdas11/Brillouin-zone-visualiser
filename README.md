# Brillouin Zone Visualiser

An interactive 2D & 3D Brillouin zone visualiser with accurate Wigner–Seitz construction, supporting multiple lattice types, nth-order zones, ray-traced rendering, and PNG export. Works fully offline.

![Screenshot placeholder — 2D view](docs/screenshot-2d.png)
![Screenshot placeholder — 3D view](docs/screenshot-3d.png)

---

## Physics Background

The **Brillouin zone** is the Wigner–Seitz cell of the reciprocal lattice. For a crystal with real-space lattice vectors **a₁**, **a₂**, **a₃**, the reciprocal lattice vectors **b₁**, **b₂**, **b₃** satisfy **bᵢ · aⱼ = 2π δᵢⱼ**.

The first Brillouin zone is the set of all wavevectors **k** closer to the origin than to any other reciprocal lattice point **G**. Its boundary is formed by the perpendicular bisector planes of the reciprocal lattice vectors (Bragg planes):

> **G · k = |G|² / 2**

Higher-order zones consist of k-points reached by crossing exactly *n−1* Bragg planes from the origin.

### Supported Lattice Types

| Dimension | Type | Real-Space Basis | BZ Shape |
|-----------|------|-----------------|----------|
| 2D | Square | a x̂, a ŷ | Square |
| 2D | Rectangular | a x̂, b ŷ | Rectangle |
| 2D | Hexagonal | a x̂, a(½ x̂ + √3/2 ŷ) | Hexagon |
| 3D | Simple Cubic | a x̂, a ŷ, a ẑ | Cube |
| 3D | FCC | a/2(ŷ+ẑ), a/2(x̂+ẑ), a/2(x̂+ŷ) | Truncated octahedron |
| 3D | BCC | a/2(ŷ+ẑ−x̂), a/2(x̂+ẑ−ŷ), a/2(x̂+ŷ−ẑ) | Rhombic dodecahedron |

---

## Features

- **2D & 3D rendering** — Toggle between Canvas-based 2D and Three.js-powered 3D views
- **Nth-order Brillouin zones** — Slide to visualise up to 20+ zone orders (2D)
- **Accurate Wigner–Seitz construction** — Custom vector math, no black-box physics libraries
- **Ray-traced 3D** — Physically-based materials with reflections and environment mapping
- **High-symmetry point labels** — Γ, X, M, K, L, W, etc. with hover tooltips
- **PNG export** — 1×, 2×, or 4× resolution with optional transparent background
- **Physics notes** — Embedded theory, derivation, and glossary panels
- **Fully offline** — No server or internet connection required after install

---

## Getting Started

### Prerequisites

- Node.js ≥ 18

### Install & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

Open `http://localhost:5173` in your browser.

---

## Usage

### Controls

| Control | Description |
|---------|-------------|
| Mode toggle | Switch between 2D and 3D views |
| Lattice selector | Choose lattice type |
| Zone slider | Adjust number of Brillouin zones |
| Display toggles | Show/hide grid, reciprocal points, zone numbers, labels |
| Ray tracing | Enable physically-based rendering (3D mode) |
| Export | Save current view as PNG |
| Notes | Open physics notes panel |

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `M` | Toggle 2D / 3D mode |
| `G` | Toggle grid |
| `P` | Toggle reciprocal lattice points |
| `L` | Toggle labels |
| `N` | Toggle notes panel |
| `E` | Export PNG |
| `R` | Toggle ray tracing (3D) |

### Mouse (2D mode)

- **Drag** — Pan the view
- **Scroll** — Zoom in/out
- **Hover** — Show high-symmetry point tooltips

### Mouse (3D mode)

- **Left drag** — Orbit camera
- **Right drag** — Pan camera
- **Scroll** — Zoom in/out

---

## Project Structure

```
brillouin-zone-visualiser/
├── index.html                  # Main HTML entry point
├── package.json                # Dependencies and scripts
├── vite.config.js              # Build configuration
├── src/
│   ├── main.js                 # Application entry point
│   ├── core/
│   │   ├── math.js             # Vector algebra utilities
│   │   ├── lattice.js          # Real & reciprocal lattice generation
│   │   ├── brillouin.js        # Wigner–Seitz construction
│   │   └── geometry.js         # Polygon/polyhedron utilities
│   ├── render/
│   │   ├── render2d.js         # 2D Canvas renderer
│   │   ├── render3d.js         # 3D Three.js renderer
│   │   ├── raytracer.js        # Ray-traced material & env map
│   │   └── export.js           # PNG export system
│   ├── ui/
│   │   ├── controls.js         # UI state & event bindings
│   │   ├── menu.js             # Menu & keyboard shortcuts
│   │   └── labels.js           # Tooltip & label management
│   └── notes/
│       ├── theory.md           # Physics theory notes
│       ├── derivation.md       # BZ construction derivation
│       └── glossary.json       # Clickable glossary terms
├── public/
│   └── icons/
└── assets/
    └── fonts/
```

---

## License

MIT
