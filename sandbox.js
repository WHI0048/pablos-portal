// =====================================================
// SANDBOX ENGINE — GLOBAL VARIABLES + FUNCTIONS
// =====================================================

// States
const SOLID = 1;
const LIQUID = 2;
const GAS = 3;
const POWDER = 4;

// Temperature thresholds
const MELT_POINT = 60;
const VAPOR_POINT = 120;
const FREEZE_POINT = 20;

// Grid
let grid;
let width;
let height;

// -----------------------------------------------------
// Initialize sandbox grid
// -----------------------------------------------------
function initSandbox(w, h) {
    width = w;
    height = h;
    grid = new Array(w * h).fill(null);
}

// -----------------------------------------------------
// Helpers
// -----------------------------------------------------
function idx(x, y) {
    return y * width + x;
}

function inBounds(x, y) {
    return x >= 0 && y >= 0 && x < width && y < height;
}

// -----------------------------------------------------
// Create a particle
// -----------------------------------------------------
function createParticle(x, y, type, temp = 25) {
    if (!inBounds(x, y)) return;
    grid[idx(x, y)] = {
        type,
        state: type.state || SOLID,
        temp,
        vx: 0,
        vy: 0
    };
}

// -----------------------------------------------------
// State conversion logic
// -----------------------------------------------------
function updateState(p) {
    if (!p) return;

    if (p.temp >= VAPOR_POINT) {
        p.state = GAS;
        return;
    }
    if (p.temp >= MELT_POINT) {
        p.state = LIQUID;
        return;
    }
    if (p.temp <= FREEZE_POINT) {
        p.state = SOLID;
        return;
    }
}

// -----------------------------------------------------
// Powder physics
// -----------------------------------------------------
function updatePowder(x, y, p) {
    // Fall straight down
    if (tryMove(x, y, x, y + 1)) return;

    // Slide diagonally
    if (tryMove(x, y, x - 1, y + 1)) return;
    if (tryMove(x, y, x + 1, y + 1)) return;

    // Drift slightly (advanced powder)
    if (Math.random() < 0.1) {
        if (tryMove(x, y, x + (Math.random() < 0.5 ? -1 : 1), y)) return;
    }
}

// -----------------------------------------------------
// Liquid physics
// -----------------------------------------------------
function updateLiquid(x, y, p) {
    if (tryMove(x, y, x, y + 1)) return;

    if (tryMove(x, y, x - 1, y + 1)) return;
    if (tryMove(x, y, x + 1, y + 1)) return;

    if (tryMove(x, y, x - 1, y)) return;
    if (tryMove(x, y, x + 1, y)) return;
}

// -----------------------------------------------------
// Gas physics
// -----------------------------------------------------
function updateGas(x, y, p) {
    let nx = x + (Math.random() < 0.5 ? -1 : 1);
    let ny = y + (Math.random() < 0.5 ? -1 : 1);
    tryMove(x, y, nx, ny);
}

// -----------------------------------------------------
// Solid physics
// -----------------------------------------------------
function updateSolid(x, y, p) {
    // Solids don’t move unless pushed by explosions
}

// -----------------------------------------------------
// Try to move particle
// -----------------------------------------------------
function tryMove(x1, y1, x2, y2) {
    if (!inBounds(x2, y2)) return false;
    if (grid[idx(x2, y2)] !== null) return false;

    grid[idx(x2, y2)] = grid[idx(x1, y1)];
    grid[idx(x1, y1)] = null;
    return true;
}

// -----------------------------------------------------
// Main sandbox update
// -----------------------------------------------------
function updateSandbox() {
    for (let y = height - 1; y >= 0; y--) {
        for (let x = 0; x < width; x++) {
            let p = grid[idx(x, y)];
            if (!p) continue;

            updateState(p);

            switch (p.state) {
                case POWDER: updatePowder(x, y, p); break;
                case LIQUID: updateLiquid(x, y, p); break;
                case GAS: updateGas(x, y, p); break;
                case SOLID: updateSolid(x, y, p); break;
            }
        }
    }
}
