/**
 * labels.js — Tooltip and label management for high-symmetry points.
 *
 * Provides hover tooltips with physics descriptions for each
 * high-symmetry point in the Brillouin zone.
 */

/** Descriptions of high-symmetry points */
const POINT_DESCRIPTIONS = {
  'Γ': 'Zone center (k = 0). All symmetry operations of the point group leave Γ invariant.',
  'X': 'Zone boundary along a principal axis. Important for band structure along Γ→X.',
  'M': 'Zone corner in square/rectangular lattices. High-symmetry saddle point.',
  'K': 'Zone corner in hexagonal lattice. Dirac point in graphene.',
  'Y': 'Zone boundary along the b-axis in rectangular lattices.',
  'S': 'Zone corner in rectangular lattices at (π/a, π/b).',
  'R': 'Corner of the cubic Brillouin zone at (π/a, π/a, π/a).',
  'L': 'Center of a hexagonal face of the FCC Brillouin zone. Along the [111] direction.',
  'W': 'Corner of the FCC Brillouin zone where square and hexagonal faces meet.',
  'H': 'Vertex of the BCC Brillouin zone (truncated octahedron).',
  'N': 'Center of a face of the BCC Brillouin zone.',
  'P': 'Corner of the BCC Brillouin zone at the octahedron vertex.'
};

/**
 * Create and manage the tooltip element for high-symmetry points.
 */
export class LabelManager {
  constructor() {
    this.tooltip = null;
    this._createTooltip();
  }

  _createTooltip() {
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'point-tooltip';
    this.tooltip.style.display = 'none';
    document.body.appendChild(this.tooltip);
  }

  /**
   * Show tooltip at the given screen position.
   * @param {string} label - Point label (e.g., 'Γ')
   * @param {number} x - Screen x position
   * @param {number} y - Screen y position
   */
  showTooltip(label, x, y) {
    const desc = POINT_DESCRIPTIONS[label] || `High-symmetry point ${label}`;
    this.tooltip.innerHTML = `<strong>${label}</strong><br>${desc}`;
    this.tooltip.style.display = 'block';
    this.tooltip.style.left = (x + 15) + 'px';
    this.tooltip.style.top = (y - 10) + 'px';
  }

  /** Hide the tooltip */
  hideTooltip() {
    this.tooltip.style.display = 'none';
  }

  /**
   * Set up hover detection for 2D canvas high-symmetry points.
   * @param {HTMLCanvasElement} canvas - The 2D canvas
   * @param {Object} points - Map of label to [kx, ky]
   * @param {Function} toCanvasFn - Function to convert k-space to canvas coords
   */
  setupHover2D(canvas, points, toCanvasFn) {
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      for (const [label, pos] of Object.entries(points)) {
        const p = toCanvasFn(pos);
        const dx = mx - p[0];
        const dy = my - p[1];
        if (dx * dx + dy * dy < 100) {
          this.showTooltip(label, e.clientX, e.clientY);
          return;
        }
      }
      this.hideTooltip();
    });

    canvas.addEventListener('mouseleave', () => this.hideTooltip());
  }
}
