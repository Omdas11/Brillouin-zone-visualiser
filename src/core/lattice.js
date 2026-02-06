/**
 * lattice.js — Real and reciprocal lattice generation for 2D and 3D systems.
 *
 * Lattice types supported:
 *   2D: square, rectangular, hexagonal
 *   3D: cubic (SC), face-centered cubic (FCC), body-centered cubic (BCC)
 */

import { vcross, vscale, vdot, vlength } from './math.js';

/** 2D lattice definitions: returns { a1, a2 } real-space basis vectors */
export const LATTICE_2D = {
  square: (a = 1) => ({
    a1: [a, 0],
    a2: [0, a],
    name: 'Square'
  }),
  rectangular: (a = 1, b = 1.5) => ({
    a1: [a, 0],
    a2: [0, b],
    name: 'Rectangular'
  }),
  hexagonal: (a = 1) => ({
    a1: [a, 0],
    a2: [a * Math.cos(Math.PI / 3), a * Math.sin(Math.PI / 3)],
    name: 'Hexagonal'
  })
};

/** 3D lattice definitions: returns { a1, a2, a3 } real-space basis vectors */
export const LATTICE_3D = {
  cubic: (a = 1) => ({
    a1: [a, 0, 0],
    a2: [0, a, 0],
    a3: [0, 0, a],
    name: 'Simple Cubic'
  }),
  fcc: (a = 1) => ({
    a1: [0, a / 2, a / 2],
    a2: [a / 2, 0, a / 2],
    a3: [a / 2, a / 2, 0],
    name: 'FCC'
  }),
  bcc: (a = 1) => ({
    a1: [a / 2, a / 2, -a / 2],
    a2: [-a / 2, a / 2, a / 2],
    a3: [a / 2, -a / 2, a / 2],
    name: 'BCC'
  })
};

/**
 * Compute 2D reciprocal lattice vectors from real-space basis.
 * b1 = 2π (rot90(a2)) / (a1 · rot90(a2))
 * b2 = 2π (rot90(a1)) / (a2 · rot90(a1))
 * where rot90([x,y]) = [-y, x]
 */
export function reciprocal2D(a1, a2) {
  const det = a1[0] * a2[1] - a1[1] * a2[0];
  const factor = 2 * Math.PI / det;
  return {
    b1: [a2[1] * factor, -a2[0] * factor],
    b2: [-a1[1] * factor, a1[0] * factor]
  };
}

/**
 * Compute 3D reciprocal lattice vectors.
 * b_i = 2π (a_j × a_k) / (a_i · (a_j × a_k))
 */
export function reciprocal3D(a1, a2, a3) {
  const a2xa3 = vcross(a2, a3);
  const a3xa1 = vcross(a3, a1);
  const a1xa2 = vcross(a1, a2);
  const vol = vdot(a1, a2xa3);
  const factor = 2 * Math.PI / vol;
  return {
    b1: vscale(a2xa3, factor),
    b2: vscale(a3xa1, factor),
    b3: vscale(a1xa2, factor)
  };
}

/**
 * Generate all reciprocal lattice points within a given shell radius.
 * For 2D: returns array of [kx, ky] vectors (excluding origin).
 * @param {Array} b1 - First reciprocal basis vector
 * @param {Array} b2 - Second reciprocal basis vector
 * @param {number} maxN - Maximum Miller index to consider
 * @returns {Array} Array of reciprocal lattice vectors G = h*b1 + k*b2
 */
export function generateReciprocalPoints2D(b1, b2, maxN) {
  const points = [];
  for (let h = -maxN; h <= maxN; h++) {
    for (let k = -maxN; k <= maxN; k++) {
      if (h === 0 && k === 0) continue;
      const G = [h * b1[0] + k * b2[0], h * b1[1] + k * b2[1]];
      points.push(G);
    }
  }
  // Sort by distance from origin for efficient zone construction
  points.sort((a, b) => vlength(a) - vlength(b));
  return points;
}

/**
 * Generate all reciprocal lattice points within a given shell radius (3D).
 * @param {Array} b1, b2, b3 - Reciprocal basis vectors
 * @param {number} maxN - Maximum Miller index to consider
 * @returns {Array} Array of reciprocal lattice vectors G
 */
export function generateReciprocalPoints3D(b1, b2, b3, maxN) {
  const points = [];
  for (let h = -maxN; h <= maxN; h++) {
    for (let k = -maxN; k <= maxN; k++) {
      for (let l = -maxN; l <= maxN; l++) {
        if (h === 0 && k === 0 && l === 0) continue;
        const G = [
          h * b1[0] + k * b2[0] + l * b3[0],
          h * b1[1] + k * b2[1] + l * b3[1],
          h * b1[2] + k * b2[2] + l * b3[2]
        ];
        points.push(G);
      }
    }
  }
  points.sort((a, b) => vlength(a) - vlength(b));
  return points;
}

/**
 * Get high-symmetry points for a given 2D lattice type.
 * Returns an object mapping label to [kx, ky] coordinates in reciprocal space.
 */
export function getHighSymmetryPoints2D(type, b1, b2) {
  const points = { 'Γ': [0, 0] };
  switch (type) {
    case 'square':
      points['X'] = vscale(b1, 0.5);
      points['M'] = vscale([b1[0] + b2[0], b1[1] + b2[1]], 0.5);
      break;
    case 'rectangular':
      points['X'] = vscale(b1, 0.5);
      points['Y'] = vscale(b2, 0.5);
      points['S'] = vscale([b1[0] + b2[0], b1[1] + b2[1]], 0.5);
      break;
    case 'hexagonal':
      // K and M points for hexagonal lattice
      points['K'] = vscale([b1[0] + b2[0], b1[1] + b2[1]], 1 / 3);
      points['M'] = vscale(b1, 0.5);
      break;
  }
  return points;
}

/**
 * Get high-symmetry points for a given 3D lattice type.
 */
export function getHighSymmetryPoints3D(type, b1, b2, b3) {
  const points = { 'Γ': [0, 0, 0] };
  switch (type) {
    case 'cubic':
      points['X'] = vscale(b1, 0.5);
      points['M'] = vscale([b1[0] + b2[0], b1[1] + b2[1], b1[2] + b2[2]], 0.5);
      points['R'] = vscale([b1[0] + b2[0] + b3[0], b1[1] + b2[1] + b3[1], b1[2] + b2[2] + b3[2]], 0.5);
      break;
    case 'fcc':
      points['X'] = vscale(b1, 0.5);
      points['L'] = vscale([b1[0] + b2[0] + b3[0], b1[1] + b2[1] + b3[1], b1[2] + b2[2] + b3[2]], 0.5);
      points['W'] = vscale([b1[0] + b2[0], b1[1] + b2[1], b1[2] + b2[2]], 0.5);
      points['K'] = vscale([3 * b1[0] + 3 * b2[0], 3 * b1[1] + 3 * b2[1], 3 * b1[2] + 3 * b2[2]], 1 / 8);
      break;
    case 'bcc':
      points['H'] = vscale([b1[0] + b2[0] - b3[0], b1[1] + b2[1] - b3[1], b1[2] + b2[2] - b3[2]], 0.5);
      points['N'] = vscale([b1[0] + b2[0], b1[1] + b2[1], b1[2] + b2[2]], 0.5);
      points['P'] = vscale([b1[0] + b2[0] + b3[0], b1[1] + b2[1] + b3[1], b1[2] + b2[2] + b3[2]], 0.25);
      break;
  }
  return points;
}
