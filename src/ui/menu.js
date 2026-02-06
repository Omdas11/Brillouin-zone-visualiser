/**
 * menu.js — Responsive sidebar menu and layout management.
 */

/**
 * Initialize the menu system.
 * Handles collapsible sections and responsive behavior.
 */
export function initMenu() {
  // Collapsible sections
  const headers = document.querySelectorAll('.section-header');
  headers.forEach(header => {
    header.addEventListener('click', () => {
      const content = header.nextElementSibling;
      if (content && content.classList.contains('section-content')) {
        content.classList.toggle('collapsed');
        header.classList.toggle('collapsed');
      }
    });
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

    switch (e.key) {
      case 'g':
        toggleCheckbox('grid-toggle');
        break;
      case 'p':
        toggleCheckbox('points-toggle');
        break;
      case 'l':
        toggleCheckbox('labels-toggle');
        break;
      case 'n':
        document.getElementById('notes-toggle')?.click();
        break;
      case 'e':
        document.getElementById('export-btn')?.click();
        break;
      case 'm':
        document.getElementById('mode-toggle')?.click();
        break;
      case 'r':
        toggleCheckbox('ray-toggle');
        break;
    }
  });
}

function toggleCheckbox(id) {
  const el = document.getElementById(id);
  if (el) {
    el.checked = !el.checked;
    el.dispatchEvent(new Event('change'));
  }
}
