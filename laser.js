// =====================================================
// LASER ENGINE — GLOBAL VARIABLES + FUNCTIONS
// =====================================================

// Laser state
let laser = {
    x: 100,
    y: 100,
    angle: 0,          // radians
    rotationSpeed: 0.08,
    length: 300,
    active: true
};

// -----------------------------------------------------
// Rotate laser with Q/E
// -----------------------------------------------------
function updateLaserRotation() {
    if (keyQ) laser.angle -= laser.rotationSpeed;
    if (keyE) laser.angle += laser.rotationSpeed;
}

// -----------------------------------------------------
// Cast a ray and destroy particles
// -----------------------------------------------------
function castLaser() {
    if (!laser.active) return;

    let dx = Math.cos(laser.angle);
    let dy = Math.sin(laser.angle);

    let x = laser.x;
    let y = laser.y;

    for (let i = 0; i < laser.length; i++) {
        x += dx;
        y += dy;

        let gx = Math.floor(x);
        let gy = Math.floor(y);

        if (!inBounds(gx, gy)) break;

        let p = grid[idx(gx, gy)];

        // Destroy particle
        if (p) {
            grid[idx(gx, gy)] = null;
            break;
        }
    }
}

// -----------------------------------------------------
// Update laser
// -----------------------------------------------------
function updateLaser() {
    updateLaserRotation();
    castLaser();
}

// -----------------------------------------------------
// Draw laser beam
// -----------------------------------------------------
function drawLaser(ctx) {
    if (!laser.active) return;

    ctx.strokeStyle = "#ff00ff";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(laser.x, laser.y);
    ctx.lineTo(
        laser.x + Math.cos(laser.angle) * laser.length,
        laser.y + Math.sin(laser.angle) * laser.length
    );
    ctx.stroke();
}
