/**
 * brillouin.js — Wigner-Seitz construction in reciprocal space.
 *
 * The nth Brillouin zone is constructed by finding the set of k-points
 * that are reached from the origin by crossing exactly (n-1) Bragg planes.
 *
 * For 2D: zones are convex polygons computed via half-plane intersection.
 * For 3D: zones are convex polyhedra computed via half-space intersection.
 */

import {
  vdot, vlength, vscale, vnormalize, bisectorPlane,
  clipPolygonByPlane2D, sortPointsCCW
} from './math.js';

/**
 * Compute the 1st Brillouin zone (Wigner-Seitz cell) in 2D.
 *
 * Algorithm:
 *   1. Start with a large bounding polygon
 *   2. For each reciprocal lattice vector G, compute the perpendicular bisector plane
 *   3. Clip the polygon by the half-plane G·k ≤ |G|²/2
 *
 * @param {Array} reciprocalPoints - Sorted array of reciprocal lattice vectors
 * @returns {Array} Vertices of the 1st BZ polygon (CCW ordered)
 */
export function computeFirstBZ2D(reciprocalPoints) {
  // Start with a large square
  const R = 100;
  let polygon = [[-R, -R], [R, -R], [R, R], [-R, R]];

  for (const G of reciprocalPoints) {
    const plane = bisectorPlane(G);
    const normal = [G[0], G[1]];
    const d = vdot(G, G) / 2;
    polygon = clipPolygonByPlane2D(polygon, normal, d);
    if (polygon.length < 3) break;
  }

  return sortPointsCCW(polygon);
}

/**
 * Compute the nth Brillouin zone in 2D.
 *
 * The nth zone consists of all k-points that require crossing exactly (n-1)
 * Bragg planes to reach from the origin via the shortest path.
 *
 * Algorithm:
 *   1. For each reciprocal lattice point G, the Bragg plane is G·k = |G|²/2
 *   2. A k-point is in the nth zone if exactly (n-1) planes satisfy G·k > |G|²/2
 *      among the planes that are closer to the origin than the point.
 *
 * Implementation:
 *   - Construct all Bragg planes from reciprocal lattice points
 *   - For the nth zone, find the region where exactly (n-1) planes are "crossed"
 *   - This is done by computing the intersection arrangement and selecting cells
 *
 * For practical implementation, we use a cell-decomposition approach:
 *   - Generate candidate vertices from all pairwise Bragg-plane intersections
 *   - Group vertices by zone number
 *   - Construct zone boundaries
 *
 * @param {Array} reciprocalPoints - Sorted reciprocal lattice vectors
 * @param {number} n - Zone number (1-indexed)
 * @returns {Array<Array>} Array of polygon vertex arrays for this zone
 */
export function computeNthBZ2D(reciprocalPoints, n) {
  if (n === 1) return [computeFirstBZ2D(reciprocalPoints)];

  // Use enough reciprocal points for the desired zone
  const planes = reciprocalPoints.map(G => ({
    normal: [G[0], G[1]],
    d: vdot(G, G) / 2,
    G
  }));

  // Determine zone number for a point: count how many Bragg planes
  // the point is on the "far side" of (G·k > |G|²/2)
  function getZoneNumber(k) {
    let crossings = 0;
    for (const plane of planes) {
      if (vdot(plane.normal, k) > plane.d + 1e-9) {
        crossings++;
      }
    }
    return crossings + 1;
  }

  // Build the nth zone by clipping: start with the (n-1)th accumulated zone
  // boundary and subtract the (n-1)th zone
  // More robust approach: generate grid of test points and find zone cells

  // For efficiency, we use a geometric approach:
  // The nth BZ boundary is formed by intersections of Bragg planes
  // We collect all intersection vertices, classify by zone, and build polygons

  const vertices = [];
  const eps = 1e-9;

  // Find all intersection points of pairs of Bragg planes
  for (let i = 0; i < planes.length; i++) {
    for (let j = i + 1; j < planes.length; j++) {
      const n1 = planes[i].normal;
      const n2 = planes[j].normal;
      const det = n1[0] * n2[1] - n1[1] * n2[0];
      if (Math.abs(det) < eps) continue;

      const d1 = planes[i].d;
      const d2 = planes[j].d;
      const x = (d1 * n2[1] - d2 * n1[1]) / det;
      const y = (n1[0] * d2 - n2[0] * d1) / det;
      const pt = [x, y];

      // Determine zone number of this vertex
      // A vertex on a Bragg plane boundary needs special treatment:
      // we test points slightly offset in each adjacent region
      const zn = getZoneNumber(pt);
      if (Math.abs(zn - n) <= 1) {
        vertices.push({ pt, zone: zn });
      }
    }
  }

  // Build the nth zone as a polygon clipping operation
  // Start with a large region and intersect with the constraints
  // that define the nth zone.

  // Alternative approach: use accumulated BZ construction
  // BZ(n) = BZ_accumulated(n) \ BZ_accumulated(n-1)
  // where BZ_accumulated(n) is the union of zones 1..n

  const accumulatedN = computeAccumulatedBZ2D(reciprocalPoints, n);
  const accumulatedNm1 = n > 1 ? computeAccumulatedBZ2D(reciprocalPoints, n - 1) : [];

  if (accumulatedN.length === 0) return [];

  // For zones > 1, we need to decompose the difference
  // The nth zone fragments are the pieces of accumulatedN not in accumulatedNm1
  return computeZoneDifference2D(accumulatedN, accumulatedNm1, planes, n);
}

/**
 * Compute the accumulated BZ up to zone n (union of zones 1..n).
 * This is the region where at most (n-1) Bragg planes are crossed.
 * Equivalently: for each G, at most (n-1) constraints G·k > |G|²/2 are violated.
 *
 * For the 1st zone: no constraints violated (the Wigner-Seitz cell)
 * For accumulated zone n: at most (n-1) constraints violated
 */
function computeAccumulatedBZ2D(reciprocalPoints, n) {
  // The accumulated nth BZ is bounded by the nth-nearest Bragg planes
  // We use a more pragmatic approach: clip by all planes
  const R = 100;
  let polygon = [[-R, -R], [R, -R], [R, R], [-R, R]];

  // Sort planes by distance from origin
  const planes = reciprocalPoints.map(G => ({
    normal: [G[0], G[1]],
    d: vdot(G, G) / 2,
    dist: vlength(G) / 2
  }));
  planes.sort((a, b) => a.dist - b.dist);

  // Group planes by distance (degenerate planes)
  const groups = [];
  let currentGroup = [planes[0]];
  for (let i = 1; i < planes.length; i++) {
    if (Math.abs(planes[i].dist - planes[i - 1].dist) < 1e-9) {
      currentGroup.push(planes[i]);
    } else {
      groups.push(currentGroup);
      currentGroup = [planes[i]];
    }
  }
  groups.push(currentGroup);

  // Clip by the first n groups of Bragg planes
  const usedGroups = groups.slice(0, n);
  for (const group of usedGroups) {
    for (const plane of group) {
      polygon = clipPolygonByPlane2D(polygon, plane.normal, plane.d);
      if (polygon.length < 3) return [];
    }
  }

  return sortPointsCCW(polygon);
}

/**
 * Compute the difference between accumulated zone n and accumulated zone n-1.
 * Returns array of polygon fragments representing the nth zone.
 */
function computeZoneDifference2D(outerPolygon, innerPolygon, planes, n) {
  if (innerPolygon.length < 3) return [outerPolygon];

  // The nth zone is the region in the accumulated(n) but not in accumulated(n-1).
  // We decompose this using the Bragg planes as cutting lines.
  // Each fragment of the difference is a convex polygon.

  // Strategy: subdivide the outer polygon using all relevant Bragg planes,
  // then keep only cells that are NOT inside the inner polygon.

  function centroid(poly) {
    const cx = poly.reduce((s, p) => s + p[0], 0) / poly.length;
    const cy = poly.reduce((s, p) => s + p[1], 0) / poly.length;
    return [cx, cy];
  }

  function isInsidePolygon(pt, poly) {
    // Ray-casting algorithm
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0], yi = poly[i][1];
      const xj = poly[j][0], yj = poly[j][1];
      if (((yi > pt[1]) !== (yj > pt[1])) &&
        (pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    return inside;
  }

  // Subdivide outer polygon by Bragg planes
  let fragments = [outerPolygon];
  for (const plane of planes) {
    const newFragments = [];
    for (const frag of fragments) {
      // Clip by positive and negative half-plane
      const pos = clipPolygonByPlane2D(frag, plane.normal, plane.d);
      const neg = clipPolygonByPlane2D(frag,
        [-plane.normal[0], -plane.normal[1]], -plane.d);
      if (pos.length >= 3) newFragments.push(pos);
      if (neg.length >= 3) newFragments.push(neg);
    }
    fragments = newFragments;
    // Limit fragments to avoid explosion
    if (fragments.length > 500) break;
  }

  // Keep fragments whose centroids are outside the inner polygon
  const result = [];
  for (const frag of fragments) {
    const c = centroid(frag);
    if (!isInsidePolygon(c, innerPolygon)) {
      result.push(sortPointsCCW(frag));
    }
  }

  return result;
}

/**
 * Compute Bragg planes for 3D BZ construction.
 * Returns array of { normal, d, G } objects.
 */
export function computeBraggPlanes3D(reciprocalPoints) {
  return reciprocalPoints.map(G => ({
    normal: vnormalize(G),
    d: vdot(G, G) / 2,
    G
  }));
}

/**
 * Compute the 1st Brillouin zone in 3D as a convex polyhedron.
 * Returns array of face objects, each with vertices in CCW order.
 *
 * Uses iterative half-space clipping starting from a large cube.
 */
export function computeFirstBZ3D(reciprocalPoints) {
  const planes = computeBraggPlanes3D(reciprocalPoints);

  // Start with a large bounding box as list of faces
  const R = 50;
  let faces = createCubeFaces(R);

  for (const plane of planes) {
    faces = clipPolyhedronByPlane(faces, plane.G, plane.d);
    if (faces.length === 0) break;
  }

  return faces;
}

/**
 * Create faces of an axis-aligned cube centered at origin with half-size R.
 */
function createCubeFaces(R) {
  return [
    // +X face
    { vertices: [[R, -R, -R], [R, R, -R], [R, R, R], [R, -R, R]], normal: [1, 0, 0] },
    // -X face
    { vertices: [[-R, -R, -R], [-R, -R, R], [-R, R, R], [-R, R, -R]], normal: [-1, 0, 0] },
    // +Y face
    { vertices: [[-R, R, -R], [-R, R, R], [R, R, R], [R, R, -R]], normal: [0, 1, 0] },
    // -Y face
    { vertices: [[-R, -R, -R], [R, -R, -R], [R, -R, R], [-R, -R, R]], normal: [0, -1, 0] },
    // +Z face
    { vertices: [[-R, -R, R], [R, -R, R], [R, R, R], [-R, R, R]], normal: [0, 0, 1] },
    // -Z face
    { vertices: [[-R, -R, -R], [-R, R, -R], [R, R, -R], [R, -R, -R]], normal: [0, 0, -1] }
  ];
}

/**
 * Clip a convex polyhedron (given as faces) by the half-space G·k ≤ d.
 * Returns new set of faces.
 */
function clipPolyhedronByPlane(faces, G, d) {
  const newFaces = [];
  const capVertices = []; // Vertices on the clipping plane

  for (const face of faces) {
    const clipped = [];
    const verts = face.vertices;
    for (let i = 0; i < verts.length; i++) {
      const curr = verts[i];
      const next = verts[(i + 1) % verts.length];
      const dc = vdot(G, curr) - d;
      const dn = vdot(G, next) - d;

      if (dc <= 1e-9) {
        clipped.push(curr);
        if (dn > 1e-9) {
          const t = dc / (dc - dn);
          const inter = curr.map((v, j) => v + (next[j] - v) * t);
          clipped.push(inter);
          capVertices.push(inter);
        }
      } else if (dn <= 1e-9) {
        const t = dc / (dc - dn);
        const inter = curr.map((v, j) => v + (next[j] - v) * t);
        clipped.push(inter);
        capVertices.push(inter);
      }
    }
    if (clipped.length >= 3) {
      newFaces.push({ vertices: clipped, normal: face.normal });
    }
  }

  // Add cap face if there are enough intersection vertices
  if (capVertices.length >= 3) {
    const capNormal = vnormalize(G);
    // Sort cap vertices in CCW order around the cap normal
    const sorted = sortVertices3DCCW(capVertices, capNormal);
    if (sorted.length >= 3) {
      newFaces.push({ vertices: sorted, normal: capNormal });
    }
  }

  return newFaces;
}

/**
 * Sort 3D vertices in CCW order when projected onto a plane with given normal.
 */
function sortVertices3DCCW(vertices, normal) {
  if (vertices.length <= 2) return vertices;

  // Compute centroid
  const n = vertices.length;
  const cx = vertices.reduce((s, v) => s + v[0], 0) / n;
  const cy = vertices.reduce((s, v) => s + v[1], 0) / n;
  const cz = vertices.reduce((s, v) => s + v[2], 0) / n;
  const centroid = [cx, cy, cz];

  // Create a local coordinate system on the plane
  let u = [0, 0, 0];
  // Find a vector not parallel to normal
  if (Math.abs(normal[0]) < 0.9) {
    u = [1 - normal[0] * normal[0], -normal[0] * normal[1], -normal[0] * normal[2]];
  } else {
    u = [-normal[1] * normal[0], 1 - normal[1] * normal[1], -normal[1] * normal[2]];
  }
  const ulen = vlength(u);
  if (ulen < 1e-12) return vertices;
  u = vscale(u, 1 / ulen);
  const v = [
    normal[1] * u[2] - normal[2] * u[1],
    normal[2] * u[0] - normal[0] * u[2],
    normal[0] * u[1] - normal[1] * u[0]
  ];

  // Remove duplicate vertices
  const unique = [];
  for (const vert of vertices) {
    let isDup = false;
    for (const uv of unique) {
      const dx = vert[0] - uv[0], dy = vert[1] - uv[1], dz = vert[2] - uv[2];
      if (dx * dx + dy * dy + dz * dz < 1e-14) { isDup = true; break; }
    }
    if (!isDup) unique.push(vert);
  }
  if (unique.length < 3) return unique;

  // Project and sort
  return unique.sort((a, b) => {
    const da = [a[0] - cx, a[1] - cy, a[2] - cz];
    const db = [b[0] - cx, b[1] - cy, b[2] - cz];
    const angA = Math.atan2(vdot(da, v), vdot(da, u));
    const angB = Math.atan2(vdot(db, v), vdot(db, u));
    return angA - angB;
  });
}
