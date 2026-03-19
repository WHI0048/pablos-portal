/* ============================================================
   lighter.js — Lighter Tool for Pablo's Portal
   - Click to ignite materials
   - Heats nearby cells
   - Creates fire particles
   - Integrates with sandbox + player
============================================================ */

console.log("%c[Lighter] Loaded lighter.js", "color:#ff8800");

// Local state
let lighterEnabledLocal = false;
let lighterRange = 4;       // radius around cursor
let lighterHeatChance = 0.35;

// Sync with UI toggle
document.addEventListener("toolToggle", e => {
  if (e.detail.tool === "lighter") {
    lighterEnabledLocal = e.detail.enabled;
  }
});

// Convert mouse to grid coords
function getMouseGridPos(e) {
  const rect = sandboxCanvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
  const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);
  return { x, y };
}

// Ignite logic
function igniteAt(cx, cy) {
  for (let y = -lighterRange; y <= lighterRange; y++) {
    for (let x = -lighterRange; x <= lighterRange; x++) {
      if (x * x + y * y > lighterRange * lighterRange) continue;

      const gx = cx + x;
      const gy = cy + y;
      if (!inBounds(gx, gy)) continue;

      const cell = getCell(gx, gy);

      // Flammable → ignite
      if (cell.flammable && Math.random() < 0.8) {
        setCell(gx, gy, MATERIALS.fire);
        continue;
      }

      // Heatable → melt or heat
      if (cell.melts && Math.random() < lighterHeatChance) {
        setCell(gx, gy, MATERIALS.water);
        continue;
      }

      if (cell.conductsHeat && Math.random() < lighterHeatChance) {
        setCell(gx, gy, MATERIALS.liquidMetal);
        continue;
      }

      // Empty → small flame
      if (cell === MATERIALS.empty && Math.random() < 0.1) {
        setCell(gx, gy, MATERIALS.fire);
      }
    }
  }
}

// Mouse interaction
sandboxCanvas.addEventListener("mousedown", e => {
  if (!lighterEnabledLocal) return;
  const { x, y } = getMouseGridPos(e);
  igniteAt(x, y);
});

sandboxCanvas.addEventListener("mousemove", e => {
  if (!lighterEnabledLocal) return;
  if (e.buttons !== 1) return; // only while holding left click
  const { x, y } = getMouseGridPos(e);
  igniteAt(x, y);
});

// Rendering glow
function renderLighterGlow() {
  if (!lighterEnabledLocal) return;

  sandboxCtx.strokeStyle = "rgba(255,150,50,0.5)";
  sandboxCtx.lineWidth = 2;
  sandboxCtx.beginPath();

  const mx = lastMouseX * CELL_SIZE;
  const my = lastMouseY * CELL_SIZE;

  sandboxCtx.arc(mx, my, lighterRange * CELL_SIZE, 0, Math.PI * 2);
  sandboxCtx.stroke();
}

// Track mouse for glow
let lastMouseX = 0;
let lastMouseY = 0;

sandboxCanvas.addEventListener("mousemove", e => {
  const { x, y } = getMouseGridPos(e);
  lastMouseX = x;
  lastMouseY = y;
});

// Hook into sandbox frame
document.addEventListener("sandboxFrame", () => {
  renderLighterGlow();
});
