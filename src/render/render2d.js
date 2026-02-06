/**
 * render2d.js — 2D Brillouin zone renderer using HTML5 Canvas.
 *
 * Renders zone polygons, reciprocal lattice points, grid, labels,
 * and high-symmetry points onto a 2D canvas.
 */

import { vlength } from '../core/math.js';
import { polygonCentroid } from '../core/geometry.js';

/** Zone color palette with decreasing opacity for higher zones */
const ZONE_COLORS = [
  'rgba(41, 128, 185, 0.6)',   // 1st zone — blue
  'rgba(39, 174, 96, 0.4)',    // 2nd zone — green
  'rgba(192, 57, 43, 0.35)',   // 3rd zone — red
  'rgba(142, 68, 173, 0.3)',   // 4th zone — purple
  'rgba(243, 156, 18, 0.28)',  // 5th zone — orange
  'rgba(22, 160, 133, 0.25)',  // 6th zone — teal
  'rgba(211, 84, 0, 0.22)',    // 7th zone — dark orange
  'rgba(41, 128, 185, 0.2)',   // 8th+ — cycle
  'rgba(39, 174, 96, 0.18)',
  'rgba(192, 57, 43, 0.16)'
];

const ZONE_BORDER_COLORS = [
  '#2980b9', '#27ae60', '#c0392b', '#8e44ad', '#f39c12',
  '#16a085', '#d35400', '#2980b9', '#27ae60', '#c0392b'
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
      this.ctx.fillStyle = '#0a0a1a';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  /** Draw coordinate axes */
  drawAxes() {
    const ctx = this.ctx;
    const cx = this.canvas.width / 2 + this.offset.x;
    const cy = this.canvas.height / 2 + this.offset.y;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
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
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '14px monospace';
    ctx.fillText('kₓ', this.canvas.width - 30, cy - 10);
    ctx.fillText('kᵧ', cx + 10, 20);
  }

  /** Draw a grid in reciprocal space */
  drawGrid(b1, b2) {
    if (!this.showGrid) return;
    const ctx = this.ctx;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
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
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(origin[0], origin[1], 5, 0, Math.PI * 2);
    ctx.fill();

    // Other points
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
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
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
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
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.arc(p[0], p[1], 4, 0, Math.PI * 2);
      ctx.fill();

      // Label
      ctx.fillStyle = '#f1c40f';
      ctx.font = 'bold 14px serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText(label, p[0] + 6, p[1] - 4);
    }
  }

  /**
   * Full render pass.
   */
  render({ zones, reciprocalPoints, highSymmetryPoints, b1, b2, transparent = false }) {
    this.clear(transparent);
    if (!transparent) {
      this.drawAxes();
      this.drawGrid(b1, b2);
    }
    this.drawZones(zones);
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
