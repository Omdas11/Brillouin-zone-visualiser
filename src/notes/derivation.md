# Derivation of Brillouin Zone Construction

## Bragg Plane Condition

For a reciprocal lattice vector **G**, the Bragg condition for diffraction is:

**2k · G = |G|²**

Rearranging: **k · Ĝ = |G|/2**

This defines a plane perpendicular to **G** at a distance |G|/2 from the origin.

---

## Wigner-Seitz Construction

### Step 1: Generate Reciprocal Lattice

Given real-space lattice vectors, compute reciprocal vectors:

**G** = h**b₁** + k**b₂** + l**b₃** (3D)

**G** = h**b₁** + k**b₂** (2D)

where h, k, l are integers.

### Step 2: Perpendicular Bisector Planes

For each **G** ≠ **0**, construct the perpendicular bisector plane:

**G · r = |G|²/2**

This plane is equidistant from the origin and the lattice point **G**.

### Step 3: Half-Space Intersection

The first Brillouin zone is the intersection of all half-spaces:

**BZ₁ = ∩_G { k : G · k ≤ |G|²/2 }**

### Step 4: Higher Zones

For the nth zone, a point **k** must satisfy exactly (n-1) of the conditions **G · k > |G|²/2** when considering the Bragg planes in order of increasing |G|.

---

## 2D Example: Square Lattice

Real-space: **a₁** = a x̂, **a₂** = a ŷ

Reciprocal: **b₁** = (2π/a) x̂, **b₂** = (2π/a) ŷ

Nearest reciprocal points: (±2π/a, 0), (0, ±2π/a)

Bragg planes at kₓ = ±π/a and kᵧ = ±π/a

**First BZ**: Square with side length 2π/a centered at origin.

---

## 3D Example: FCC Lattice

Real-space primitive vectors:
- **a₁** = (a/2)(ŷ + ẑ)
- **a₂** = (a/2)(x̂ + ẑ)
- **a₃** = (a/2)(x̂ + ŷ)

Reciprocal vectors:
- **b₁** = (2π/a)(-x̂ + ŷ + ẑ)
- **b₂** = (2π/a)(x̂ - ŷ + ẑ)
- **b₃** = (2π/a)(x̂ + ŷ - ẑ)

The first BZ of the FCC lattice is a **truncated octahedron** with:
- 8 regular hexagonal faces (from {111} planes)
- 6 square faces (from {200} planes)
- 14 faces total, 24 vertices, 36 edges

---

## Volume Conservation

An important property: **all Brillouin zones have equal volume**.

This follows from the fact that each zone, when translated by appropriate reciprocal lattice vectors, tiles the first zone exactly once.

**V(BZₙ) = V(BZ₁) = (2π)^d / V_cell**

where d is the dimension and V_cell is the real-space unit cell volume.
