/* ============================================================
   ui.js — Cyber Arcade UI Controller
   Handles:
   - View switching
   - Sidebar active states
   - Status indicator updates
   - Tool toggles (ruler, laser, lighter)
============================================================ */

console.log("%c[UI] Loaded ui.js", "color:#0ff");

// Cached DOM
const views = {
  sandbox: document.getElementById("sandbox-view"),
  snake: document.getElementById("snake-view")
};

const statusIndicator = document.getElementById("status-indicator");

// Sidebar buttons
const navButtons = document.querySelectorAll(".nav-button[data-view]");

// Tool toggles
const rulerToggle = document.querySelector('[data-toggle="ruler"]');
const laserToggle = document.querySelector('[data-toggle="laser"]');
const lighterToggle = document.querySelector('[data-toggle="lighter"]');

// Reset buttons
const resetSandboxBtn = document.getElementById("btn-reset-sandbox");
const resetSnakeBtn = document.getElementById("btn-reset-snake");

// Active tool states
let toolState = {
  ruler: false,
  laser: false,
  lighter: false
};

/* ============================================================
   VIEW SWITCHING
============================================================ */
function switchView(viewName) {
  // Hide all
  Object.values(views).forEach(v => v.classList.remove("active-view"));

  // Show selected
  if (viewName === "sandbox") {
    views.sandbox.classList.add("active-view");
    updateStatus("Sandbox Ready");
  } else if (viewName === "snake") {
    views.snake.classList.add("active-view");
    updateStatus("Neon Snake Ready");
  }

  // Update sidebar active button
  navButtons.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === `${viewName}-view`);
  });
}

// Sidebar click events
navButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const view = btn.dataset.view.replace("-view", "");
    switchView(view);
  });
});

/* ============================================================
   STATUS INDICATOR
============================================================ */
function updateStatus(text) {
  statusIndicator.textContent = text;
}

/* ============================================================
   TOOL TOGGLES
============================================================ */
function toggleTool(name) {
  toolState[name] = !toolState[name];

  updateStatus(`${name.charAt(0).toUpperCase() + name.slice(1)}: ${toolState[name] ? "ON" : "OFF"}`);

  // Visual feedback
  const btn = document.querySelector(`[data-toggle="${name}"]`);
  if (btn) btn.classList.toggle("active", toolState[name]);

  // Notify modules
  document.dispatchEvent(new CustomEvent("toolToggle", {
    detail: { tool: name, enabled: toolState[name] }
  }));
}

rulerToggle.addEventListener("click", () => toggleTool("ruler"));
laserToggle.addEventListener("click", () => toggleTool("laser"));
lighterToggle.addEventListener("click", () => toggleTool("lighter"));

/* ============================================================
   RESET BUTTONS
============================================================ */
resetSandboxBtn.addEventListener("click", () => {
  document.dispatchEvent(new Event("sandboxReset"));
  updateStatus("Sandbox Reset");
});

resetSnakeBtn.addEventListener("click", () => {
  document.dispatchEvent(new Event("snakeReset"));
  updateStatus("Snake Reset");
});

/* ============================================================
   INITIAL VIEW
============================================================ */
switchView("sandbox");
