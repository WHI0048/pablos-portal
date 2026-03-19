// =====================================================
// PLAYER ENGINE — GLOBAL VARIABLES + FUNCTIONS
// =====================================================

let player = {
    x: 50,
    y: 50,
    vx: 0,
    vy: 0,
    w: 10,
    h: 14,
    speed: 1.8,
    jumpForce: -5,
    onGround: false,
    alive: true,
    respawnX: 50,
    respawnY: 50,
    health: 100,
    maxHealth: 100,
    invuln: 0
};

// -----------------------------------------------------
// Movement input (global booleans set in index.html)
// -----------------------------------------------------
let keyLeft = false;
let keyRight = false;
let keyUp = false;

// -----------------------------------------------------
// Apply damage
// -----------------------------------------------------
function damagePlayer(amount) {
    if (player.invuln > 0) return;
    player.health -= amount;
    player.invuln = 20;

    if (player.health <= 0) {
        killPlayer();
    }
}

// -----------------------------------------------------
// Kill + respawn
// -----------------------------------------------------
function killPlayer() {
    player.alive = false;
    setTimeout(() => {
        player.x = player.respawnX;
        player.y = player.respawnY;
        player.vx = 0;
        player.vy = 0;
        player.health = player.maxHealth;
        player.alive = true;
    }, 500);
}

// -----------------------------------------------------
// Collision with sandbox
// -----------------------------------------------------
function isSolidAt(px, py) {
    if (!inBounds(Math.floor(px), Math.floor(py))) return false;
    let p = grid[idx(Math.floor(px), Math.floor(py))];
    if (!p) return false;
    return p.state === SOLID;
}

function isHazardAt(px, py) {
    if (!inBounds(Math.floor(px), Math.floor(py))) return false;
    let p = grid[idx(Math.floor(px), Math.floor(py))];
    if (!p) return false;

    // Lava, fire, poison, etc.
    if (p.temp >= VAPOR_POINT) return true;
    if (p.type === "lava") return true;
    if (p.type === "poison") return true;

    return false;
}

// -----------------------------------------------------
// Update player physics
// -----------------------------------------------------
function updatePlayer() {
    if (!player.alive) return;

    // Horizontal movement
    if (keyLeft) player.vx -= player.speed;
    if (keyRight) player.vx += player.speed;

    // Gravity
    player.vy += 0.25;

    // Jump
    if (keyUp && player.onGround) {
        player.vy = player.jumpForce;
        player.onGround = false;
    }

    // Apply velocity
    let newX = player.x + player.vx;
    let newY = player.y + player.vy;

    // Horizontal collision
    if (!isSolidAt(newX, player.y) && !isSolidAt(newX, player.y + player.h)) {
        player.x = newX;
    } else {
        player.vx = 0;
    }

    // Vertical collision
    if (!isSolidAt(player.x, newY + player.h)) {
        player.y = newY;
        player.onGround = false;
    } else {
        // Land on ground
        player.vy = 0;
