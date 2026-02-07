/**
 * render2d.js — 2D Brillouin zone renderer using HTML5 Canvas.
 *
 * Renders zone polygons, reciprocal lattice points, grid, labels,
 * and high-symmetry points onto a 2D canvas.
 */

import { vlength } from '../core/math.js';
import { polygonCentroid } from '../core/geometry.js';

/** Zone color palette with neutral academic colors */
const ZONE_COLORS = [
  'rgba(139, 69, 19, 0.5)',    // 1st zone — saddle brown
  'rgba(178, 34, 34, 0.4)',    // 2nd zone — firebrick
  'rgba(85, 107, 47, 0.35)',   // 3rd zone — dark olive green
  'rgba(128, 128, 128, 0.3)',  // 4th zone — gray
  'rgba(160, 82, 45, 0.28)',   // 5th zone — sienna
  'rgba(47, 79, 79, 0.25)',    // 6th zone — dark slate gray
  'rgba(112, 128, 144, 0.22)', // 7th zone — slate gray
  'rgba(139, 69, 19, 0.2)',    // 8th+ — cycle
  'rgba(178, 34, 34, 0.18)',
  'rgba(85, 107, 47, 0.16)'
];

const ZONE_BORDER_COLORS = [
  '#8b4513', '#b22222', '#556b2f', '#808080', '#a0522d',
  '#2f4f4f', '#708090', '#8b4513', '#b22222', '#556b2f'
];

export class Renderer2D {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scale = 40; // pixels per reciprocal unit
    this.offset = { x: 0, y: 0 };
    this.showGrid = true;
    this.showReciprocalPoints = true;
    this.showZoneNumbers = true;
    this.showLabels = true;
    this.showBraggPlanes = true; // Show Bragg plane lines
    this.pixelBased = false; // Use pixel-based rendering

    this._setupInteraction();
  }

  /** Set up mouse pan and zoom */
  _setupInteraction() {
    let dragging = false;
    let lastX, lastY;

    this.canvas.addEventListener('mousedown', (e) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      this.offset.x += e.clientX - lastX;
      this.offset.y += e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      if (this._renderCallback) this._renderCallback();
    });

    this.canvas.addEventListener('mouseup', () => { dragging = false; });
    this.canvas.addEventListener('mouseleave', () => { dragging = false; });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      this.scale *= zoomFactor;
      this.scale = Math.max(5, Math.min(200, this.scale));
      if (this._renderCallback) this._renderCallback();
    });
  }

  /** Register a callback to re-render on interaction */
  onInteraction(callback) {
    this._renderCallback = callback;
  }

  /** Convert reciprocal space coordinates to canvas pixel coordinates */
  toCanvas(k) {
    const cx = this.canvas.width / 2 + this.offset.x;
    const cy = this.canvas.height / 2 + this.offset.y;
    return [
      cx + k[0] * this.scale,
      cy - k[1] * this.scale // flip y axis
    ];
  }

  /** Clear the canvas */
  clear(transparent = false) {
    if (transparent) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    } else {
      this.ctx.fillStyle = '#f7f6f3';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  /** Draw coordinate axes */
  drawAxes() {
    const ctx = this.ctx;
    const cx = this.canvas.width / 2 + this.offset.x;
    const cy = this.canvas.height / 2 + this.offset.y;

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1;

    // kx axis
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(this.canvas.width, cy);
    ctx.stroke();

    // ky axis
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, this.canvas.height);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.font = '14px monospace';
    ctx.fillText('kₓ', this.canvas.width - 30, cy - 10);
    ctx.fillText('kᵧ', cx + 10, 20);
  }

  /** Draw a grid in reciprocal space */
  drawGrid(b1, b2) {
    if (!this.showGrid) return;
    const ctx = this.ctx;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.lineWidth = 0.5;

    const range = 10;
    for (let i = -range; i <= range; i++) {
      // Lines along b1 direction
      const start1 = [i * b2[0] - range * b1[0], i * b2[1] - range * b1[1]];
      const end1 = [i * b2[0] + range * b1[0], i * b2[1] + range * b1[1]];
      const s1 = this.toCanvas(start1);
      const e1 = this.toCanvas(end1);
      ctx.beginPath();
      ctx.moveTo(s1[0], s1[1]);
      ctx.lineTo(e1[0], e1[1]);
      ctx.stroke();

      // Lines along b2 direction
      const start2 = [i * b1[0] - range * b2[0], i * b1[1] - range * b2[1]];
      const end2 = [i * b1[0] + range * b2[0], i * b1[1] + range * b2[1]];
      const s2 = this.toCanvas(start2);
      const e2 = this.toCanvas(end2);
      ctx.beginPath();
      ctx.moveTo(s2[0], s2[1]);
      ctx.lineTo(e2[0], e2[1]);
      ctx.stroke();
    }
  }

  /** Draw reciprocal lattice points */
  drawReciprocalPoints(points) {
    if (!this.showReciprocalPoints) return;
    const ctx = this.ctx;

    // Origin
    const origin = this.toCanvas([0, 0]);
    ctx.fillStyle = '#b22222';
    ctx.beginPath();
    ctx.arc(origin[0], origin[1], 5, 0, Math.PI * 2);
    ctx.fill();

    // Other points
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    for (const G of points) {
      const p = this.toCanvas(G);
      ctx.beginPath();
      ctx.arc(p[0], p[1], 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Draw Brillouin zone polygons.
   * @param {Array<{ zone: number, polygons: Array<Array<[number,number]>> }>} zones
   */
  drawZones(zones) {
    const ctx = this.ctx;

    for (const { zone, polygons } of zones) {
      const colorIdx = (zone - 1) % ZONE_COLORS.length;

      for (const poly of polygons) {
        if (poly.length < 3) continue;

        // Fill
        ctx.fillStyle = ZONE_COLORS[colorIdx];
        ctx.beginPath();
        const start = this.toCanvas(poly[0]);
        ctx.moveTo(start[0], start[1]);
        for (let i = 1; i < poly.length; i++) {
          const p = this.toCanvas(poly[i]);
          ctx.lineTo(p[0], p[1]);
        }
        ctx.closePath();
        ctx.fill();

        // Border
        ctx.strokeStyle = ZONE_BORDER_COLORS[colorIdx];
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Zone number label
        if (this.showZoneNumbers) {
          const c = polygonCentroid(poly);
          const cp = this.toCanvas(c);
          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
          ctx.font = 'bold 12px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(zone), cp[0], cp[1]);
        }
      }
    }
  }

  /**
   * Draw high-symmetry point labels.
   * @param {Object} points - Map of label to [kx, ky]
   */
  drawHighSymmetryPoints(points) {
    if (!this.showLabels) return;
    const ctx = this.ctx;

    for (const [label, pos] of Object.entries(points)) {
      const p = this.toCanvas(pos);

      // Point marker
      ctx.fillStyle = '#8b4513';
      ctx.beginPath();
      ctx.arc(p[0], p[1], 4, 0, Math.PI * 2);
      ctx.fill();

      // Label
      ctx.fillStyle = '#8b4513';
      ctx.font = 'bold 14px serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText(label, p[0] + 6, p[1] - 4);
    }
  }

  /**
   * Draw Bragg plane lines (perpendicular bisectors).
   * @param {Array} braggPlanes - Array of {x1, y1, x2, y2, G} objects
   */
  drawBraggPlanes(braggPlanes) {
    if (!this.showBraggPlanes) return;
    const ctx = this.ctx;
    
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 0.5;
    
    for (const plane of braggPlanes) {
      const p1 = this.toCanvas([plane.x1, plane.y1]);
      const p2 = this.toCanvas([plane.x2, plane.y2]);
      
      ctx.beginPath();
      ctx.moveTo(p1[0], p1[1]);
      ctx.lineTo(p2[0], p2[1]);
      ctx.stroke();
    }
  }

  /**
   * Draw zone map from ImageData (pixel-based rendering).
   * @param {ImageData} zoneMap - Zone map as ImageData
   * @param {number} plotRange - The k-space range used to create the map
   */
  drawZoneMap(zoneMap, plotRange) {
    // Calculate where to draw the zone map on the canvas
    const topLeft = this.toCanvas([-plotRange, plotRange]);
    const bottomRight = this.toCanvas([plotRange, -plotRange]);
    
    const width = bottomRight[0] - topLeft[0];
    const height = bottomRight[1] - topLeft[1];
    
    // Create temporary canvas for the zone map
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = zoneMap.width;
    tempCanvas.height = zoneMap.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.putImageData(zoneMap, 0, 0);
    
    // Draw the zone map scaled to fit the view
    this.ctx.imageSmoothingEnabled = false; // Nearest neighbor for crisp zones
    this.ctx.drawImage(tempCanvas, topLeft[0], topLeft[1], width, height);
    this.ctx.imageSmoothingEnabled = true;
  }

  /**
   * Full render pass.
   */
  render({ zones, reciprocalPoints, highSymmetryPoints, b1, b2, transparent = false, zoneMap = null, braggPlanes = null, plotRange = null }) {
    this.clear(transparent);
    
    if (zoneMap && plotRange) {
      // Pixel-based rendering
      this.drawZoneMap(zoneMap, plotRange);
      if (braggPlanes) {
        this.drawBraggPlanes(braggPlanes);
      }
    } else {
      // Polygon-based rendering (original)
      if (!transparent) {
        this.drawAxes();
        this.drawGrid(b1, b2);
      }
      this.drawZones(zones);
    }
    
    // Always draw these
    if (!transparent) {
      this.drawAxes();
    }
    this.drawReciprocalPoints(reciprocalPoints);
    this.drawHighSymmetryPoints(highSymmetryPoints);
  }

  /** Resize canvas to fill its container */
  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }
}
