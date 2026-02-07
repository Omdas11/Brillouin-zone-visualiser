/**
 * main.js — Application entry point.
 *
 * Orchestrates the Brillouin Zone Visualiser:
 * - Initialises UI controls
 * - Computes lattice and zone geometry
 * - Routes rendering to 2D or 3D pipelines
 * - Handles export and notes display
 */

import {
  LATTICE_2D, LATTICE_3D,
  reciprocal2D, reciprocal3D,
  generateReciprocalPoints2D, generateReciprocalPoints3D,
  getHighSymmetryPoints2D, getHighSymmetryPoints3D
} from './core/lattice.js';

import { computeFirstBZ2D, computeNthBZ2D, computeFirstBZ3D, computeZoneMapPixelBased, getBraggPlanes } from './core/brillouin.js';
import { Renderer2D } from './render/render2d.js';
import { Renderer3D } from './render/render3d.js';
import { createEnvironmentMap, applyRayTraceSettings, removeRayTraceSettings } from './render/raytracer.js';
import { exportCanvas2D, exportCanvas3D, downloadDataURL } from './render/export.js';
import { state, initControls, update2D3DVisibility } from './ui/controls.js';
import { initMenu } from './ui/menu.js';
import { LabelManager } from './ui/labels.js';
import glossary from './notes/glossary.json';

let renderer2d = null;
let renderer3d = null;
let labelManager = null;
let currentHighSymmetryPoints = {};
let envMap = null;

/**
 * Compute and render the current Brillouin zone based on UI state.
 */
function update() {
  if (state.mode === '2d') {
    update2D();
  } else {
    update3D();
  }
}

/**
 * Compute and render 2D Brillouin zones.
 */
function update2D() {
  if (!renderer2d) {
    console.warn('2D renderer not initialized');
    return;
  }

  try {
    // Get lattice definition
    const latticeFn = LATTICE_2D[state.latticeType];
    if (!latticeFn) {
      console.error('Unknown lattice type:', state.latticeType);
      return;
    }
    const lattice = latticeFn();
    const { b1, b2 } = reciprocal2D(lattice.a1, lattice.a2);

    // Generate reciprocal lattice points
    const latticeRange = Math.ceil(Math.sqrt(state.maxZone)) + 5; // Enough for high zones
    const reciprocalPoints = generateReciprocalPoints2D(b1, b2, latticeRange);

    // Use pixel-based rendering (Python algorithm)
    const plotRange = 3.2;
    const resolution = 800; // High resolution for quality
    
    // Compute zone map using pixel-based algorithm
    const zoneMap = computeZoneMapPixelBased(reciprocalPoints, state.maxZone, resolution, plotRange);
    
    // Get Bragg planes for visualization
    const braggPlanes = getBraggPlanes(reciprocalPoints, plotRange);

    // Get high-symmetry points
    currentHighSymmetryPoints = getHighSymmetryPoints2D(state.latticeType, b1, b2);

    // Update renderer settings
    renderer2d.showGrid = state.showGrid;
    renderer2d.showReciprocalPoints = state.showReciprocalPoints;
    renderer2d.showZoneNumbers = state.showZoneNumbers;
    renderer2d.showLabels = state.showLabels;
    renderer2d.pixelBased = true;

    // Render with pixel-based zone map
    renderer2d.render({
      zoneMap,
      braggPlanes,
      plotRange,
      reciprocalPoints: reciprocalPoints.slice(0, 50),
      highSymmetryPoints: currentHighSymmetryPoints,
      b1,
      b2
    });

    // Set up hover tooltips
    labelManager.setupHover2D(
      renderer2d.canvas,
      currentHighSymmetryPoints,
      (k) => renderer2d.toCanvas(k)
    );

    // Update info display
    updateInfo(lattice.name, b1, b2);
  } catch (error) {
    console.error('Error in 2D render:', error);
  }
}

/**
 * Compute and render 3D Brillouin zones.
 */
function update3D() {
  try {
    if (!renderer3d) {
      const container = document.getElementById('container-3d');
      if (!container) {
        console.error('3D container not found');
        return;
      }
      renderer3d = new Renderer3D(container);
      console.log('✓ 3D renderer initialized');
    }

    renderer3d.clearZones();

    // Get lattice definition
    const latticeFn = LATTICE_3D[state.latticeType];
    if (!latticeFn) {
      console.error('Unknown 3D lattice type:', state.latticeType);
      return;
    }
    const lattice = latticeFn();
    const { b1, b2, b3 } = reciprocal3D(lattice.a1, lattice.a2, lattice.a3);

    // Generate reciprocal lattice points
    const maxIndex = Math.max(state.maxZone + 1, 3);
    const reciprocalPoints = generateReciprocalPoints3D(b1, b2, b3, maxIndex);

    // Ray tracing settings
    renderer3d.showLabels = state.showLabels;
    renderer3d.setRayTracing(state.rayTracing);

    if (state.rayTracing) {
      applyRayTraceSettings(renderer3d.renderer);
      if (!envMap) {
        envMap = createEnvironmentMap(renderer3d.renderer);
      }
      renderer3d.scene.environment = envMap;
    } else {
      removeRayTraceSettings(renderer3d.renderer);
      renderer3d.scene.environment = null;
    }

    // Compute and display 1st BZ (3D higher zones are complex; show 1st zone)
    const faces = computeFirstBZ3D(reciprocalPoints);
    const opacity = state.maxZone === 1 ? 0.6 : 0.4;
    renderer3d.addZone(faces, 1, opacity);

    // Add reciprocal lattice points
    const displayPoints = reciprocalPoints.slice(0, 100);
    renderer3d.addReciprocalPoints(displayPoints);

    // High-symmetry labels
    currentHighSymmetryPoints = getHighSymmetryPoints3D(state.latticeType, b1, b2, b3);
    renderer3d.addHighSymmetryLabels(currentHighSymmetryPoints);

    // Update info
    updateInfo(lattice.name, b1, b2, b3);
  } catch (error) {
    console.error('Error in 3D render:', error);
    // Fallback to 2D if 3D fails
    console.log('⚠️ 3D rendering failed, falling back to 2D');
    state.mode = '2d';
    const modeToggle = document.getElementById('mode-toggle');
    if (modeToggle) modeToggle.textContent = '2D Mode';
    update2D3DVisibility();
    update2D();
  }
}

/**
 * Handle PNG export.
 */
function handleExport() {
  let dataURL;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `brillouin-zone-${state.latticeType}-${timestamp}.png`;

  if (state.mode === '2d' && renderer2d) {
    dataURL = exportCanvas2D(
      renderer2d.canvas,
      state.exportScale,
      state.transparentExport
    );
  } else if (state.mode === '3d' && renderer3d) {
    dataURL = exportCanvas3D(
      renderer3d.renderer,
      renderer3d.scene,
      renderer3d.camera,
      state.exportScale,
      state.transparentExport
    );
  }

  if (dataURL) {
    downloadDataURL(dataURL, filename);
  }
}

/**
 * Update the lattice info display.
 */
function updateInfo(name, b1, b2, b3 = null) {
  const infoEl = document.getElementById('lattice-info');
  if (!infoEl) return;

  let html = `<strong>${name} Lattice</strong><br>`;
  html += `<span>b₁ = (${b1.map(v => v.toFixed(2)).join(', ')})</span><br>`;
  html += `<span>b₂ = (${b2.map(v => v.toFixed(2)).join(', ')})</span>`;
  if (b3) {
    html += `<br><span>b₃ = (${b3.map(v => v.toFixed(2)).join(', ')})</span>`;
  }
  infoEl.innerHTML = html;
}

/**
 * Load and render physics notes in the notes panel.
 */
async function loadNotes() {
  const notesContent = document.getElementById('notes-content');
  if (!notesContent) return;

  // Build notes HTML from theory and glossary
  let html = '<div class="notes-section">';
  html += '<h3>📖 Theory</h3>';
  html += '<div class="theory-content">';
  html += renderMarkdownBasic(await fetchNote('theory'));
  html += '</div>';

  html += '<h3>📐 Derivation</h3>';
  html += '<div class="derivation-content">';
  html += renderMarkdownBasic(await fetchNote('derivation'));
  html += '</div>';

  html += '<h3>📚 Glossary</h3>';
  html += '<div class="glossary-content">';
  for (const item of glossary.terms) {
    html += `<div class="glossary-term">`;
    html += `<strong>${item.term}</strong>`;
    if (item.symbol) html += ` <code>${item.symbol}</code>`;
    html += `<p>${item.definition}</p>`;
    html += `</div>`;
  }
  html += '</div>';
  html += '</div>';

  notesContent.innerHTML = html;
}

/**
 * Fetch a markdown note file.
 */
async function fetchNote(name) {
  try {
    const response = await fetch(`/src/notes/${name}.md`);
    if (!response.ok) return `*${name} notes not available*`;
    return await response.text();
  } catch {
    return `*${name} notes not available*`;
  }
}

/**
 * Basic markdown to HTML converter (no external dependency).
 */
function renderMarkdownBasic(md) {
  return md
    .replace(/^### (.+)$/gm, '<h5>$1</h5>')
    .replace(/^## (.+)$/gm, '<h4>$1</h4>')
    .replace(/^# (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^---$/gm, '<hr>')
    .replace(/^\|(.+)\|$/gm, (match) => {
      const cells = match.split('|').filter(c => c.trim());
      return '<tr>' + cells.map(c => `<td>${c.trim()}</td>`).join('') + '</tr>';
    })
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');
}

/**
 * Application initialisation.
 */
function init() {
  console.log('🔬 Brillouin Zone Visualiser - Initializing...');
  
  try {
    // Initialise 2D renderer
    const canvas = document.getElementById('canvas-2d');
    if (!canvas) {
      throw new Error('Canvas element not found');
    }
    
    console.log('✓ Canvas element found');
    renderer2d = new Renderer2D(canvas);
    renderer2d.resize();
    renderer2d.onInteraction(() => update());
    
    window.addEventListener('resize', () => {
      renderer2d.resize();
      update();
    });
    console.log('✓ 2D renderer initialized');

    // Initialise label manager
    labelManager = new LabelManager();
    console.log('✓ Label manager initialized');

    // Initialise controls
    initControls(update, handleExport);
    initMenu();
    console.log('✓ Controls initialized');

    // Load notes
    loadNotes();

    // Initial render
    console.log('🎨 Rendering initial scene...');
    update();
    console.log('✓ Initial render complete');
  } catch (error) {
    console.error('❌ Initialization failed:', error);
    displayError('Failed to initialize the visualiser. Please refresh the page.');
  }
}

/**
 * Display user-visible error message.
 */
function displayError(message) {
  const viewport = document.getElementById('viewport');
  if (viewport) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #fff3cd;
      border: 2px solid #ffc107;
      padding: 20px;
      border-radius: 8px;
      color: #856404;
      font-size: 14px;
      max-width: 400px;
      text-align: center;
      z-index: 1000;
    `;
    errorDiv.innerHTML = `<strong>⚠️ Error</strong><br>${message}`;
    viewport.appendChild(errorDiv);
  }
}

// Start application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
