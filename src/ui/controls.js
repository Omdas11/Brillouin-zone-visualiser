/**
 * controls.js — UI control bindings and state management.
 *
 * Manages the toolbar, settings panel, and connects user interactions
 * to the rendering engine.
 */

/**
 * State object containing all user-configurable settings.
 */
export const state = {
  mode: '2d',             // '2d' or '3d'
  latticeType: 'square',  // Current lattice type
  maxZone: 1,             // Number of zones to display
  showGrid: true,
  showReciprocalPoints: true,
  showZoneNumbers: true,
  showLabels: true,
  rayTracing: false,
  exportScale: 1,
  transparentExport: false
};

/**
 * Initialize all UI controls and bind event handlers.
 *
 * @param {Function} onUpdate - Callback invoked when any setting changes
 * @param {Function} onExport - Callback invoked when export is requested
 */
export function initControls(onUpdate, onExport) {
  // Mode toggle
  const modeToggle = document.getElementById('mode-toggle');
  if (modeToggle) {
    modeToggle.addEventListener('click', () => {
      state.mode = state.mode === '2d' ? '3d' : '2d';
      modeToggle.textContent = state.mode === '2d' ? '2D Mode' : '3D Mode';
      update2D3DVisibility();
      onUpdate();
    });
  }

  // Lattice type selector
  const latticeSelect = document.getElementById('lattice-select');
  if (latticeSelect) {
    latticeSelect.addEventListener('change', (e) => {
      state.latticeType = e.target.value;
      onUpdate();
    });
  }

  // Zone slider
  const zoneSlider = document.getElementById('zone-slider');
  const zoneValue = document.getElementById('zone-value');
  const zoneWarning = document.getElementById('zone-warning');
  let zoneUpdateTimeout;
  
  if (zoneSlider) {
    // Show immediate feedback
    zoneSlider.addEventListener('input', (e) => {
      state.maxZone = parseInt(e.target.value, 10);
      if (zoneValue) zoneValue.textContent = state.maxZone;
      
      // Show/hide warning
      if (zoneWarning) {
        if (state.maxZone > 20) {
          zoneWarning.style.display = 'block';
        } else {
          zoneWarning.style.display = 'none';
        }
      }
      
      // Debounce actual render update
      clearTimeout(zoneUpdateTimeout);
      zoneUpdateTimeout = setTimeout(() => {
        onUpdate();
      }, 300);
    });
  }

  // Grid toggle
  const gridToggle = document.getElementById('grid-toggle');
  if (gridToggle) {
    gridToggle.addEventListener('change', (e) => {
      state.showGrid = e.target.checked;
      onUpdate();
    });
  }

  // Reciprocal points toggle
  const pointsToggle = document.getElementById('points-toggle');
  if (pointsToggle) {
    pointsToggle.addEventListener('change', (e) => {
      state.showReciprocalPoints = e.target.checked;
      onUpdate();
    });
  }

  // Zone numbers toggle
  const numbersToggle = document.getElementById('numbers-toggle');
  if (numbersToggle) {
    numbersToggle.addEventListener('change', (e) => {
      state.showZoneNumbers = e.target.checked;
      onUpdate();
    });
  }

  // Labels toggle
  const labelsToggle = document.getElementById('labels-toggle');
  if (labelsToggle) {
    labelsToggle.addEventListener('change', (e) => {
      state.showLabels = e.target.checked;
      onUpdate();
    });
  }

  // Ray tracing toggle
  const rayToggle = document.getElementById('ray-toggle');
  if (rayToggle) {
    rayToggle.addEventListener('change', (e) => {
      state.rayTracing = e.target.checked;
      onUpdate();
    });
  }

  // Export scale
  const scaleSelect = document.getElementById('export-scale');
  if (scaleSelect) {
    scaleSelect.addEventListener('change', (e) => {
      state.exportScale = parseInt(e.target.value, 10);
    });
  }

  // Transparent export
  const transparentToggle = document.getElementById('export-transparent');
  if (transparentToggle) {
    transparentToggle.addEventListener('change', (e) => {
      state.transparentExport = e.target.checked;
    });
  }

  // Export button
  const exportBtn = document.getElementById('export-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      onExport();
    });
  }

  // Notes toggle
  const notesToggle = document.getElementById('notes-toggle');
  const notesPanel = document.getElementById('notes-panel');
  if (notesToggle && notesPanel) {
    notesToggle.addEventListener('click', () => {
      notesPanel.classList.toggle('hidden');
      notesToggle.textContent = notesPanel.classList.contains('hidden')
        ? '📚 Notes' : '✕ Close Notes';
    });
  }

  // Update lattice options based on mode
  update2D3DVisibility();
}

/**
 * Update visibility of 2D/3D specific elements and lattice options.
 */
export function update2D3DVisibility() {
  const canvas2d = document.getElementById('canvas-2d');
  const container3d = document.getElementById('container-3d');
  const latticeSelect = document.getElementById('lattice-select');

  if (canvas2d) canvas2d.style.display = state.mode === '2d' ? 'block' : 'none';
  if (container3d) container3d.style.display = state.mode === '3d' ? 'block' : 'none';

  // Update lattice options
  if (latticeSelect) {
    const options2D = ['square', 'rectangular', 'hexagonal'];
    const options3D = ['cubic', 'fcc', 'bcc'];
    const options = state.mode === '2d' ? options2D : options3D;
    const labels = state.mode === '2d'
      ? ['Square', 'Rectangular', 'Hexagonal']
      : ['Simple Cubic', 'FCC', 'BCC'];

    latticeSelect.innerHTML = '';
    options.forEach((opt, i) => {
      const el = document.createElement('option');
      el.value = opt;
      el.textContent = labels[i];
      latticeSelect.appendChild(el);
    });
    state.latticeType = options[0];
  }
}

/** Show a performance warning */
function showWarning(msg) {
  let warn = document.getElementById('perf-warning');
  if (!warn) {
    warn = document.createElement('div');
    warn.id = 'perf-warning';
    warn.className = 'warning';
    document.getElementById('controls-panel')?.appendChild(warn);
  }
  warn.textContent = '⚠ ' + msg;
  warn.style.display = 'block';
}

/** Hide the performance warning */
function hideWarning() {
  const warn = document.getElementById('perf-warning');
  if (warn) warn.style.display = 'none';
}
