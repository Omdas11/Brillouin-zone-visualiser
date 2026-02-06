/**
 * math.js — Vector algebra utilities for 2D and 3D reciprocal space computations.
 * All operations are pure functions operating on plain arrays [x,y] or [x,y,z].
 */

/** Add two vectors */
export function vadd(a, b) {
  return a.map((v, i) => v + b[i]);
}

/** Subtract b from a */
export function vsub(a, b) {
  return a.map((v, i) => v - b[i]);
}

/** Scale vector by scalar */
export function vscale(a, s) {
  return a.map(v => v * s);
}

/** Dot product */
export function vdot(a, b) {
  return a.reduce((sum, v, i) => sum + v * b[i], 0);
}

/** Euclidean length */
export function vlength(a) {
  return Math.sqrt(vdot(a, a));
}

/** Normalize to unit vector */
export function vnormalize(a) {
  const len = vlength(a);
  if (len < 1e-12) return a.map(() => 0);
  return vscale(a, 1 / len);
}

/** Cross product (3D only) */
export function vcross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];
}

/** Distance between two points */
export function vdist(a, b) {
  return vlength(vsub(a, b));
}

/** Linear interpolation between a and b */
export function vlerp(a, b, t) {
  return a.map((v, i) => v + (b[i] - v) * t);
}

/**
 * Compute intersection point of two 2D lines.
 * Each line is defined by a point p and a normal n: n · (x - p) = 0
 * Returns null if lines are parallel.
 */
export function lineLineIntersection2D(p1, n1, p2, n2) {
  const det = n1[0] * n2[1] - n1[1] * n2[0];
  if (Math.abs(det) < 1e-12) return null;
  const d1 = vdot(n1, p1);
  const d2 = vdot(n2, p2);
  return [
    (d1 * n2[1] - d2 * n1[1]) / det,
    (n1[0] * d2 - n2[0] * d1) / det
  ];
}

/**
 * Compute the perpendicular bisector plane for a reciprocal lattice vector G.
 * The plane satisfies G · k = |G|²/2.
 * Returns { normal, point, d } where d = |G|²/2.
 */
export function bisectorPlane(G) {
  const d = vdot(G, G) / 2;
  const normal = vnormalize(G);
  const point = vscale(G, 0.5);
  return { normal, point, d, G };
}

/**
 * Sort 2D points in counter-clockwise order around their centroid.
 */
export function sortPointsCCW(points) {
  if (points.length <= 2) return [...points];
  const cx = points.reduce((s, p) => s + p[0], 0) / points.length;
  const cy = points.reduce((s, p) => s + p[1], 0) / points.length;
  return [...points].sort((a, b) => {
    return Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx);
  });
}

/**
 * Check if a 2D point is inside a convex polygon (given as CCW-ordered vertices).
 */
export function pointInConvexPolygon(point, polygon) {
  const n = polygon.length;
  if (n < 3) return false;
  for (let i = 0; i < n; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % n];
    const edge = vsub(b, a);
    const toPoint = vsub(point, a);
    const cross = edge[0] * toPoint[1] - edge[1] * toPoint[0];
    if (cross < -1e-9) return false;
  }
  return true;
}

/**
 * Clip a convex polygon by a half-plane defined by n · x <= d.
 * Uses Sutherland-Hodgman algorithm.
 */
export function clipPolygonByPlane2D(vertices, normal, d) {
  if (vertices.length === 0) return [];
  const output = [];
  for (let i = 0; i < vertices.length; i++) {
    const current = vertices[i];
    const next = vertices[(i + 1) % vertices.length];
    const dc = vdot(normal, current) - d;
    const dn = vdot(normal, next) - d;
    if (dc <= 1e-9) {
      output.push(current);
      if (dn > 1e-9) {
        const t = dc / (dc - dn);
        output.push(vlerp(current, next, t));
      }
    } else if (dn <= 1e-9) {
      const t = dc / (dc - dn);
      output.push(vlerp(current, next, t));
    }
  }
  return output;
}
