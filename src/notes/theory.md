# Theoretical Background

## Reciprocal Lattice

Given a set of real-space lattice vectors **a₁**, **a₂** (2D) or **a₁**, **a₂**, **a₃** (3D), the reciprocal lattice vectors are defined such that:

**bᵢ · aⱼ = 2π δᵢⱼ**

### 2D Reciprocal Lattice

For a 2D lattice with basis vectors **a₁** and **a₂**:

**b₁** = 2π (**ẑ × a₂**) / (**a₁ · (ẑ × a₂)**)

**b₂** = 2π (**a₁ × ẑ**) / (**a₂ · (a₁ × ẑ)**)

### 3D Reciprocal Lattice

For a 3D lattice:

**b₁** = 2π (**a₂ × a₃**) / (**a₁ · (a₂ × a₃)**)

**b₂** = 2π (**a₃ × a₁**) / (**a₁ · (a₂ × a₃)**)

**b₃** = 2π (**a₁ × a₂**) / (**a₁ · (a₂ × a₃)**)

---

## Brillouin Zone

The **first Brillouin zone** is the Wigner-Seitz cell of the reciprocal lattice. It is the set of all wave vectors **k** that are closer to the origin than to any other reciprocal lattice point.

### Construction

1. Draw vectors from the origin to all reciprocal lattice points **G**
2. Construct the perpendicular bisector plane of each vector: **G · k = |G|²/2**
3. The first Brillouin zone is the smallest enclosed region around the origin

### Physical Significance

The Brillouin zone is fundamental to solid-state physics:

- **Electron band structure**: Energy bands are periodic in reciprocal space. The first BZ contains all unique k-states.
- **Phonon dispersion**: Lattice vibration frequencies are determined within the first BZ.
- **Bragg diffraction**: The BZ boundaries correspond to Bragg diffraction conditions.
- **Fermi surface**: The Fermi surface of metals is mapped within the BZ.

---

## Higher-Order Brillouin Zones

The **nth Brillouin zone** consists of all k-points that can be reached from the origin by crossing exactly **(n-1) Bragg planes**.

### Properties

- All Brillouin zones have the **same area** (2D) or **volume** (3D)
- When translated by reciprocal lattice vectors, each zone can be folded back into the first zone
- Higher zones become increasingly fragmented

### Zone Numbering Rule

A point **k** belongs to zone **n** if:
1. It lies outside the first (n-1) zones
2. It can be reached from the origin by a path that crosses exactly (n-1) perpendicular bisector planes

---

## Lattice Types

### 2D Lattices

| Type | Basis Vectors | BZ Shape |
|------|--------------|----------|
| Square | a₁ = a x̂, a₂ = a ŷ | Square |
| Rectangular | a₁ = a x̂, a₂ = b ŷ | Rectangle |
| Hexagonal | a₁ = a x̂, a₂ = a(½ x̂ + √3/2 ŷ) | Hexagon |

### 3D Lattices

| Type | BZ Shape | Faces |
|------|----------|-------|
| Simple Cubic (SC) | Cube | 6 squares |
| Face-Centered Cubic (FCC) | Truncated octahedron | 8 hexagons + 6 squares |
| Body-Centered Cubic (BCC) | Rhombic dodecahedron | 12 rhombi |
