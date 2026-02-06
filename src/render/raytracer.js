/**
 * raytracer.js — Enhanced ray-traced rendering for 3D Brillouin zones.
 *
 * Uses Three.js MeshPhysicalMaterial with environment maps and
 * physically-based rendering settings to simulate ray-traced appearance.
 * This provides high-quality reflections, refractions, and caustics
 * without requiring a full path tracer.
 */

import * as THREE from 'three';

/**
 * Create a procedural environment map for reflections.
 * Generates a gradient sky environment for realistic lighting.
 */
export function createEnvironmentMap(renderer) {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  const scene = new THREE.Scene();

  // Create gradient background
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Gradient from dark to light
  const gradient = ctx.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(0, '#000011');
  gradient.addColorStop(0.3, '#000033');
  gradient.addColorStop(0.5, '#001144');
  gradient.addColorStop(0.7, '#002255');
  gradient.addColorStop(1, '#003366');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);

  // Add some "stars" for specular highlights
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 256;
    const r = Math.random() * 2 + 0.5;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;

  const envMap = pmremGenerator.fromEquirectangular(texture).texture;
  pmremGenerator.dispose();
  texture.dispose();

  return envMap;
}

/**
 * Create a ray-traced material for Brillouin zone faces.
 * Uses MeshPhysicalMaterial with high-quality PBR settings.
 *
 * @param {number} color - Hex color value
 * @param {number} opacity - Material opacity
 * @param {THREE.Texture} envMap - Environment map for reflections
 * @returns {THREE.MeshPhysicalMaterial}
 */
export function createRayTracedMaterial(color, opacity = 0.6, envMap = null) {
  const material = new THREE.MeshPhysicalMaterial({
    color,
    transparent: true,
    opacity,
    roughness: 0.05,
    metalness: 0.1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    reflectivity: 0.9,
    ior: 1.5,
    thickness: 0.5,
    transmission: opacity < 0.8 ? 0.3 : 0,
    side: THREE.DoubleSide,
    envMap,
    envMapIntensity: 1.5
  });

  return material;
}

/**
 * Apply ray-traced settings to the renderer.
 * Enables high-quality rendering features.
 */
export function applyRayTraceSettings(renderer) {
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
}

/**
 * Remove ray-traced settings from the renderer.
 */
export function removeRayTraceSettings(renderer) {
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.toneMappingExposure = 1.0;
}
