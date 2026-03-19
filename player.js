/* ============================================================
   player.js — Player Controller for Pablo's Portal
   - WASD movement
   - Collision with sandbox particles
   - Fire / lava / poison damage
   - Explosion knockback
   - Death + respawn
============================================================ */

console.log("%c[Player] Loaded player.js", "color:#0ff");

// Player state
const player = {
  x: 20,
  y: 20,
  vx: 0,
  vy: 0,
  speed: 0.15,
  maxSpeed: 0.6,
  width: 0.6,
  height: 0.9,
  health: 100,
  alive: true,
  invincible: false,
  invTimer: 0
};

// Movement keys
const keys = {
  w: false,
  a: false,
  s: false,
  d: false
};

document.addEventListener("keydown", e => {
  if (e.key === "w") keys.w = true;
  if (e.key === "a") keys.a = true;
  if (e.key === "s") keys.s = true;
  if (e.key === "d") keys.d = true;
});

document.addEventListener("keyup", e => {
  if (e.key === "w") keys.w = false;
  if (e.key === "a") keys.a = false;
  if (e.key === "s") keys.s = false;
  if (e.key === "d") keys.d = false;
});

// Damage helpers
function damagePlayer(amount) {
  if (!player.alive || player.invincible) return;
  player.health -= amount;
  if (player.health <= 0) killPlayer();
}

function killPlayer() {
  player.alive = false;
  player.health = 0;
  player.invincible = true;

  setTimeout(() => respawnPlayer(), 1200);
}

function respawnPlayer() {
  player.x = 10;
  player.y = 10;
  player.vx = 0;
  player.vy = 0;
  player.health = 100;
  player.alive = true;

  // brief invincibility
  player.invTimer = 60;
  player.invincible = true;
}

// Explosion knockback
document.addEventListener("explosionPulse", e => {
  const { x, y, power } = e.detail;
  const dx = player.x - x;
  const dy = player.y - y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < 8) {
    const force = (8 - dist) * power * 0.04;
    player.vx += (dx / dist) * force;
    player.vy += (dy / dist) * force;
  }
});

// Collision with sandbox materials
function checkPlayerDamage() {
  const cx = Math.floor(player.x);
  const cy = Math.floor(player.y);

  const cell = getCell(cx, cy);

  if (cell.fire) damagePlayer(0.6);
  if (cell.hot) damagePlayer(0.8);
  if (cell.poison) damagePlayer(0.4);
}

// Player update loop
function updatePlayer(dt) {
  if (!player.alive) return;

  // Movement input
  if (keys.w) player.vy -= player.speed * dt;
  if (keys.s) player.vy += player.speed * dt;
  if (keys.a) player.vx -= player.speed * dt;
  if (keys.d) player.vx += player.speed * dt;

  // Clamp speed
  const spd = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
  if (spd > player.maxSpeed) {
    player.vx = (player.vx / spd) * player.maxSpeed;
    player.vy = (player.vy / spd) * player.maxSpeed;
  }

  // Apply movement
  player.x += player.vx;
  player.y += player.vy;

  // Friction
  player.vx *= 0.85;
  player.vy *= 0.85;

  // Boundaries
  if (player.x < 1) player.x = 1;
  if (player.y < 1) player.y = 1;
  if (player.x > GRID_WIDTH - 2) player.x = GRID_WIDTH - 2;
  if (player.y > GRID_HEIGHT - 2) player.y = GRID_HEIGHT - 2;

  // Damage from environment
  checkPlayerDamage();

  // Invincibility timer
  if (player.invTimer > 0) {
    player.invTimer--;
    if (player.invTimer <= 0) player.invincible = false;
  }
}

// Rendering
function renderPlayer() {
  const px = player.x * CELL_SIZE;
  const py = player.y * CELL_SIZE;

  sandboxCtx.fillStyle = player.invincible ? "#00ffff" : "#ffffff";
  sandboxCtx.fillRect(px - 3, py - 6, 6, 12);
}

// Hook into sandbox loop
document.addEventListener("sandboxFrame", e => {
  const dt = e.detail.dt;
  updatePlayer(dt);
  renderPlayer();
});

// Reset
document.addEventListener("sandboxReset", () => {
  respawnPlayer();
});
