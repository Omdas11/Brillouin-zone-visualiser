/**
 * geometry.js — Geometric utilities for planes, polyhedra, and intersections.
 */

import { vdot, vsub, vcross, vnormalize, vlength, vscale } from './math.js';

/**
 * Compute the area of a 2D polygon given its vertices (CCW ordered).
 * Uses the shoelace formula.
 */
export function polygonArea(vertices) {
  let area = 0;
  const n = vertices.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += vertices[i][0] * vertices[j][1];
    area -= vertices[j][0] * vertices[i][1];
  }
  return Math.abs(area) / 2;
}

/**
 * Compute the centroid of a 2D polygon.
 */
export function polygonCentroid(vertices) {
  const n = vertices.length;
  if (n === 0) return [0, 0];
  const cx = vertices.reduce((s, v) => s + v[0], 0) / n;
  const cy = vertices.reduce((s, v) => s + v[1], 0) / n;
  return [cx, cy];
}

/**
 * Compute the surface area of a 3D polyhedron face (triangle fan from centroid).
 */
export function faceArea3D(vertices) {
  if (vertices.length < 3) return 0;
  let area = 0;
  const a = vertices[0];
  for (let i = 1; i < vertices.length - 1; i++) {
    const b = vertices[i];
    const c = vertices[i + 1];
    const ab = vsub(b, a);
    const ac = vsub(c, a);
    area += vlength(vcross(ab, ac)) / 2;
  }
  return area;
}

/**
 * Compute the volume of a convex polyhedron given its faces.
 * Uses the divergence theorem: V = (1/3) Σ (face centroid · face normal) * face area
 */
export function polyhedronVolume(faces) {
  let volume = 0;
  for (const face of faces) {
    const verts = face.vertices;
    if (verts.length < 3) continue;
    const normal = face.normal;
    const a = verts[0];
    for (let i = 1; i < verts.length - 1; i++) {
      const b = verts[i];
      const c = verts[i + 1];
      // Volume contribution of this triangle
      volume += vdot(a, vcross(b, c)) / 6;
    }
  }
  return Math.abs(volume);
}

/**
 * Generate edge list from polygon vertices.
 * Returns array of [startVertex, endVertex] pairs.
 */
export function polygonEdges(vertices) {
  const edges = [];
  for (let i = 0; i < vertices.length; i++) {
    edges.push([vertices[i], vertices[(i + 1) % vertices.length]]);
  }
  return edges;
}

/**
 * Check if a point is inside a convex polyhedron defined by half-planes.
 * Each plane: normal · x ≤ d
 */
export function pointInPolyhedron(point, planes) {
  for (const plane of planes) {
    if (vdot(plane.normal, point) > plane.d + 1e-9) return false;
  }
  return true;
}

/**
 * Compute a bounding radius for a set of vertices.
 */
export function boundingRadius(vertices) {
  let maxR = 0;
  for (const v of vertices) {
    const r = vlength(v);
    if (r > maxR) maxR = r;
  }
  return maxR;
}
