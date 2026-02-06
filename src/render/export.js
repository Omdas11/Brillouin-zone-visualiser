/**
 * export.js — PNG export system for 2D canvas and 3D WebGL snapshots.
 *
 * Supports multiple resolution scales and optional transparent backgrounds.
 */

/**
 * Export a 2D canvas as PNG.
 *
 * @param {HTMLCanvasElement} canvas - Source canvas
 * @param {number} scale - Resolution multiplier (1, 2, or 4)
 * @param {boolean} transparent - Whether to use transparent background
 * @param {Function} renderFn - Function to call to re-render at new scale
 * @returns {string} Data URL of the exported PNG
 */
export function exportCanvas2D(canvas, scale = 1, transparent = false, renderFn = null) {
  if (scale === 1 && !transparent) {
    return canvas.toDataURL('image/png');
  }

  // Create a high-resolution off-screen canvas
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = canvas.width * scale;
  exportCanvas.height = canvas.height * scale;
  const ctx = exportCanvas.getContext('2d');

  if (!transparent) {
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
  }

  // Scale and draw
  ctx.scale(scale, scale);
  ctx.drawImage(canvas, 0, 0);

  return exportCanvas.toDataURL('image/png');
}

/**
 * Export a 3D WebGL canvas as PNG.
 *
 * @param {THREE.WebGLRenderer} renderer - Three.js renderer
 * @param {THREE.Scene} scene - Three.js scene
 * @param {THREE.Camera} camera - Three.js camera
 * @param {number} scale - Resolution multiplier
 * @param {boolean} transparent - Whether to use transparent background
 * @returns {string} Data URL of the exported PNG
 */
export function exportCanvas3D(renderer, scene, camera, scale = 1, transparent = false) {
  const originalWidth = renderer.domElement.width;
  const originalHeight = renderer.domElement.height;
  const originalBackground = scene.background;

  // Set export resolution
  renderer.setSize(originalWidth * scale, originalHeight * scale);

  if (transparent) {
    scene.background = null;
    renderer.setClearColor(0x000000, 0);
  }

  // Render and capture
  renderer.render(scene, camera);
  const dataURL = renderer.domElement.toDataURL('image/png');

  // Restore original settings
  renderer.setSize(originalWidth, originalHeight);
  scene.background = originalBackground;
  if (transparent) {
    renderer.setClearColor(0x0a0a1a, 1);
  }

  return dataURL;
}

/**
 * Trigger download of a data URL as a file.
 *
 * @param {string} dataURL - The data URL to download
 * @param {string} filename - Filename for the download
 */
export function downloadDataURL(dataURL, filename = 'brillouin-zone.png') {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
