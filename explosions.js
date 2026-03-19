/* ============================================================
   explosions.js — Explosion Engine for Pablo's Portal
   - Shockwaves
   - Fire + smoke generation
   - Chain reactions
   - Player knockback event
============================================================ */

console.log("%c[Explosions] Loaded explosions.js", "color:#fa0");

// Explosion settings
const EXPLOSION = {
  baseRadius: 6,
  fireChance: 0.7,
  smokeChance: 0.3,
  shockPower: 1.0
};

// Trigger explosion from sandbox or other modules
function triggerExplosionAt(x, y, radius = EXPLOSION.baseRadius) {
  if (!inBounds(x, y)) return;

  // Notify player.js for knockback
  document.dispatchEvent(new CustomEvent("explosionPulse", {
    detail: { x, y, power: EXPLOSION.shockPower }
  }));

  // Expand explosion outward
  for (let oy = -radius; oy <= radius; oy++) {
    for (let ox = -radius; ox <= radius; ox++) {
      if (ox * ox + oy * oy > radius * radius) continue;

      const gx = x + ox;
      const gy = y + oy;
      if (!inBounds(gx, gy)) continue;

      const cell = getCell(gx, gy);

      // Chain reaction
      if (cell.explosive && !(gx === x && gy === y)) {
        triggerExplosionAt(gx, gy, Math.max(2, radius - 1));
      }

      // Fire or smoke
      if (Math.random() < EXPLOSION.fireChance) {
        setCell(gx, gy, MATERIALS.fire);
      } else if (Math.random() < EXPLOSION.smokeChance) {
        setCell(gx, gy, MATERIALS.smoke);
      } else {
        setCell(gx, gy, MATERIALS.empty);
      }
    }
  }

  // Count explosion for UI
  explosionCount++;
}

// Listen for sandbox requests
document.addEventListener("sandboxExplosion", e => {
  const { x, y, radius } = e.detail;
  triggerExplosionAt(x, y, radius);
});

// Optional: external modules can call this directly
window.triggerExplosionAt = triggerExplosionAt;
