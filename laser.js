/* ============================================================
   laser.js — Laser Pointer System for Pablo's Portal
   - Q/E rotate beam
   - Mirror reflection
   - Heating + ignition
   - Gas vaporization
   - Beam rendering
============================================================ */

console.log("%c[Laser] Loaded laser.js", "color:#f0f");

// Laser state
let laserEnabledLocal = false;
let laserAngle = 0;        // radians
let laserLength = 60;      // max ray distance
let laserHeat = 0.4;       // how much heat is applied per hit
let laserStep = 0.2;       // ray marching step

// Controls
document.addEventListener("keydown", e => {
  if (!laserEnabledLocal) return;

  if (e.key === "q") laserAngle -= 0.1;
  if (e.key === "e") laserAngle += 0.1;
});

// Tool toggle sync
document.addEventListener("toolToggle", e => {
  if (e.detail.tool === "laser") {
    laserEnabledLocal = e.detail.enabled;
  }
});

// Raycast
function castLaser() {
  if (!laserEnabledLocal) return null;

  let x = player.x;
  let y = player.y;

  const dx = Math.cos(laserAngle);
  const dy = Math.sin(laserAngle);

  let hit = null;

  for (let i = 0; i < laserLength; i++) {
    x += dx * laserStep;
    y += dy * laserStep;

    const gx = Math.floor(x);
    const gy = Math.floor(y);

    if (!inBounds(gx, gy)) break;

    const cell = getCell(gx, gy);

    // Empty space → continue
    if (cell === MATERIALS.empty) continue;

    // Mirror → reflect
    if (cell.mirror) {
      const normal = { x: -dy, y: dx };
      const dot = dx * normal.x + dy * normal.y;
      const rx = dx - 2 * dot * normal.x;
      const ry = dy - 2 * dot * normal.y;

      return {
        type: "reflect",
        x,
        y,
        newAngle: Math.atan2(ry, rx)
      };
    }

    // Gas → vaporize
    if (cell.type === "gas") {
      setCell(gx, gy, MATERIALS.empty);
      continue;
    }

    // Flammable → ignite
    if (cell.flammable) {
      setCell(gx, gy, MATERIALS.fire);
      continue;
    }

    // Heatable → apply heat
    if (cell.hot || cell.melts || cell.conductsHeat) {
      if (Math.random() < laserHeat) {
        if (cell.melts) setCell(gx, gy, MATERIALS.water);
        if (cell.conductsHeat) setCell(gx, gy, MATERIALS.liquidMetal);
      }
    }

    // Solid hit → stop
    hit = { x, y };
    break;
  }

  return hit;
}

// Rendering
function renderLaser() {
  if (!laserEnabledLocal) return;

  let x = player.x * CELL_SIZE;
  let y = player.y * CELL_SIZE;

  const dx = Math.cos(laserAngle);
  const dy = Math.sin(laserAngle);

  sandboxCtx.strokeStyle = "#ff00ff";
  sandboxCtx.lineWidth = 2;
  sandboxCtx.beginPath();
  sandboxCtx.moveTo(x, y);

  for (let i = 0; i < laserLength; i++) {
    x += dx * CELL_SIZE * laserStep;
    y += dy * CELL_SIZE * laserStep;

    sandboxCtx.lineTo(x, y);
  }

  sandboxCtx.stroke();
}

// Hook into sandbox frame
document.addEventListener("sandboxFrame", () => {
  const result = castLaser();

  // Handle reflection
  if (result && result.type === "reflect") {
    laserAngle = result.newAngle;
  }

  renderLaser();
});
