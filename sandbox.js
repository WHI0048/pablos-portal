/* ============================================================
   sandbox.js — Upgraded Physics Sandbox Engine (Option B)
   - Grid + particles
   - Original materials + new ones (metal, wood, ice, steam, smoke, liquid metal)
   - Fire, poison, lava, acid, explosions
   - Player / laser hooks via events
============================================================ */

console.log("%c[Sandbox] Loaded upgraded sandbox.js", "color:#0f0");

// Canvas + context
const sandboxCanvas = document.getElementById("sandbox-canvas");
const sandboxCtx = sandboxCanvas.getContext("2d");

// Status elements
const fpsEl = document.getElementById("status-fps");
const particlesEl = document.getElementById("status-particles");
const explosionsEl = document.getElementById("status-explosions");
const debugLogEl = document.getElementById("debug-log");

// Grid config
const GRID_WIDTH = 180;
const GRID_HEIGHT = 100;
let CELL_SIZE = 6;

// Simulation state
let grid = [];
let lastTime = performance.now();
let fps = 0;
let explosionCount = 0;
let running = true;

// Brush
let currentMaterial = "sand";
let brushSize = 5;

// Tools
let rulerEnabled = false;
let laserEnabled = false;
let lighterEnabled = false;

// Materials
const MATERIALS = {
  empty:      { id: 0,  name: "empty",      color: "#000000", type: "empty" },

  // Original set
  sand:       { id: 1,  name: "sand",       color: "#f4d06f", type: "solid",  density: 3 },
  stone:      { id: 2,  name: "stone",      color: "#888888", type: "solid",  density: 5, static: true },
  water:      { id: 3,  name: "water",      color: "#3fa9f5", type: "liquid", density: 2 },
  oil:        { id: 4,  name: "oil",        color: "#553311", type: "liquid", density: 1, flammable: true },
  acid:       { id: 5,  name: "acid",       color: "#7fff00", type: "liquid", density: 2, corrosive: true },
  lava:       { id: 6,  name: "lava",       color: "#ff4500", type: "liquid", density: 3, hot: true },
  poison:     { id: 7,  name: "poison",     color: "#8f00ff", type: "liquid", density: 2, poison: true },
  poisonGas:  { id: 8,  name: "poisonGas",  color: "#b266ff", type: "gas",    density: 0, poison: true },
  fire:       { id: 9,  name: "fire",       color: "#ffdd55", type: "gas",    density: 0, fire: true },
  explosive:  { id: 10, name: "explosive",  color: "#ff0066", type: "solid",  density: 3, explosive: true },
  mirror:     { id: 11, name: "mirror",     color: "#c0ffff", type: "solid",  density: 5, mirror: true },

  // New solids
  metal:      { id: 12, name: "metal",      color: "#b0b0c0", type: "solid",  density: 6, static: true, conductsHeat: true },
  wood:       { id: 13, name: "wood",       color: "#8b5a2b", type: "solid",  density: 3, flammable: true },
  ice:        { id: 14, name: "ice",        color: "#aee6ff", type: "solid",  density: 3, melts: true },

  // New gases
  steam:      { id: 15, name: "steam",      color: "#d0f0ff", type: "gas",    density: -1, coolsTo: "water" },
  smoke:      { id: 16, name: "smoke",      color: "#555555", type: "gas",    density: 0 },

  // New liquids
  liquidMetal:{ id: 17, name: "liquidMetal",color: "#ffd700", type: "liquid", density: 4, hot: true, coolsTo: "metal" }
};

const MATERIAL_LIST = Object.values(MATERIALS);

// Helpers
function logDebug(msg) {
  if (!debugLogEl) return;
  debugLogEl.textContent = (msg + "\n" + debugLogEl.textContent).slice(0, 2000);
}

function index(x, y) {
  return y * GRID_WIDTH + x;
}

function inBounds(x, y) {
  return x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT;
}

function getCell(x, y) {
  if (!inBounds(x, y)) return MATERIALS.stone;
  return grid[index(x, y)];
}

function setCell(x, y, mat) {
  if (!inBounds(x, y)) return;
  grid[index(x, y)] = mat;
}

function randFloat() {
  return Math.random();
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Init grid
function initGrid() {
  grid = new Array(GRID_WIDTH * GRID_HEIGHT).fill(MATERIALS.empty);
}

// Resize canvas
function resizeCanvas() {
  const rect = sandboxCanvas.parentElement.getBoundingClientRect();
  const scaleX = Math.floor(rect.width / GRID_WIDTH);
  const scaleY = Math.floor(rect.height / GRID_HEIGHT);
  CELL_SIZE = Math.max(3, Math.min(scaleX, scaleY));
  sandboxCanvas.width = GRID_WIDTH * CELL_SIZE;
  sandboxCanvas.height = GRID_HEIGHT * CELL_SIZE;
}

// Placement
function placeCircleMaterial(cx, cy, radius, matKey) {
  const mat = MATERIALS[matKey] || MATERIALS.sand;
  for (let y = -radius; y <= radius; y++) {
    for (let x = -radius; x <= radius; x++) {
      if (x * x + y * y <= radius * radius) {
        const gx = cx + x;
        const gy = cy + y;
        if (inBounds(gx, gy)) {
          setCell(gx, gy, mat);
        }
      }
    }
  }
}

// Mouse
let isMouseDown = false;
let isRightDown = false;

sandboxCanvas.addEventListener("mousedown", e => {
  const rect = sandboxCanvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
  const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);

  if (e.button === 0) {
    isMouseDown = true;
    placeCircleMaterial(x, y, brushSize, currentMaterial);
  } else if (e.button === 2) {
    isRightDown = true;
    placeCircleMaterial(x, y, brushSize, "empty");
  }
});

sandboxCanvas.addEventListener("mousemove", e => {
  if (!isMouseDown && !isRightDown) return;
  const rect = sandboxCanvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
  const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);

  if (isMouseDown) {
    placeCircleMaterial(x, y, brushSize, currentMaterial);
  } else if (isRightDown) {
    placeCircleMaterial(x, y, brushSize, "empty");
  }
});

["mouseup", "mouseleave"].forEach(ev =>
  sandboxCanvas.addEventListener(ev, () => {
    isMouseDown = false;
    isRightDown = false;
  })
);

sandboxCanvas.addEventListener("contextmenu", e => e.preventDefault());

// Brush size
const brushSlider = document.getElementById("brush-size");
if (brushSlider) {
  brushSlider.addEventListener("input", () => {
    brushSize = parseInt(brushSlider.value, 10) || 5;
  });
}

// Material buttons
const materialButtons = document.querySelectorAll("#material-buttons .tool-button");
materialButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    materialButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentMaterial = btn.dataset.material || "sand";
  });
});

/* ============================================================
   PHYSICS
============================================================ */

function swapCells(x1, y1, x2, y2) {
  const a = getCell(x1, y1);
  const b = getCell(x2, y2);
  setCell(x1, y1, b);
  setCell(x2, y2, a);
}

function tryMove(x, y, nx, ny, cell) {
  const target = getCell(nx, ny);
  if (target.type === "empty") {
    swapCells(x, y, nx, ny);
    return true;
  }
  if (target.type !== "solid" && target.density < cell.density) {
    swapCells(x, y, nx, ny);
    return true;
  }
  return false;
}

function updateSolid(x, y, cell) {
  if (cell.static) return;

  if (tryMove(x, y, x, y + 1, cell)) return;

  const dir = randFloat() < 0.5 ? -1 : 1;
  if (tryMove(x, y, x + dir, y + 1, cell)) return;
}

function updateLiquid(x, y, cell) {
  if (tryMove(x, y, x, y + 1, cell)) return;

  const dir = randFloat() < 0.5 ? -1 : 1;
  if (tryMove(x, y, x + dir, y + 1, cell)) return;
  if (tryMove(x, y, x + dir, y, cell)) return;
}

function updateGas(x, y, cell) {
  if (tryMove(x, y, x, y - 1, cell)) return;

  const dir = randFloat() < 0.5 ? -1 : 1;
  if (tryMove(x, y, x + dir, y - 1, cell)) return;
  if (tryMove(x, y, x + dir, y, cell)) return;
}

/* ---------- Special behaviors ---------- */

function neighbors4(x, y) {
  return [
    [x, y + 1],
    [x, y - 1],
    [x - 1, y],
    [x + 1, y]
  ];
}

function updateFire(x, y, cell) {
  if (randFloat() < 0.02) {
    setCell(x, y, MATERIALS.smoke);
    return;
  }

  neighbors4(x, y).forEach(([nx, ny]) => {
    const n = getCell(nx, ny);
    if (n.flammable && randFloat() < 0.4) {
      setCell(nx, ny, MATERIALS.fire);
    }
    if (n.type === "liquid" && n !== MATERIALS.oil && randFloat() < 0.3) {
      setCell(x, y, MATERIALS.smoke);
    }
  });
}

function updateAcid(x, y, cell) {
  neighbors4(x, y).forEach(([nx, ny]) => {
    const n = getCell(nx, ny);
    if (n === MATERIALS.empty) return;
    if (n.corrosive || n.type === "gas") return;
    if (randFloat() < 0.25) {
      setCell(nx, ny, MATERIALS.empty);
    }
  });
}

function triggerExplosion(cx, cy, radius) {
  explosionCount++;
  for (let y = -radius; y <= radius; y++) {
    for (let x = -radius; x <= radius; x++) {
      if (x * x + y * y > radius * radius) continue;
      const gx = cx + x;
      const gy = cy + y;
      if (!inBounds(gx, gy)) continue;

      const cell = getCell(gx, gy);
      if (cell.explosive && !(gx === cx && gy === cy)) {
        triggerExplosion(gx, gy, Math.max(2, radius - 1));
      }

      if (randFloat() < 0.7) {
        setCell(gx, gy, MATERIALS.fire);
      } else {
        setCell(gx, gy, MATERIALS.smoke);
      }
    }
  }
}

function updateExplosive(x, y, cell) {
  let ignite = false;
  neighbors4(x, y).forEach(([nx, ny]) => {
    const n = getCell(nx, ny);
    if (n.fire || n.hot) ignite = true;
  });
  if (ignite) triggerExplosion(x, y, 7);
}

function updateLava(x, y, cell) {
  neighbors4(x, y).forEach(([nx, ny]) => {
    const n = getCell(nx, ny);

    if (n === MATERIALS.water && randFloat() < 0.4) {
      setCell(nx, ny, MATERIALS.steam);
    }

    if (n.melts && randFloat() < 0.3) {
      setCell(nx, ny, MATERIALS.water);
    }

    if (n.flammable && randFloat() < 0.5) {
      setCell(nx, ny, MATERIALS.fire);
    }
  });

  if (randFloat() < 0.003) {
    setCell(x, y, MATERIALS.stone);
  }
}

function updatePoison(x, y, cell) {
  if (cell.type === "liquid" && randFloat() < 0.01) {
    setCell(x, y, MATERIALS.poisonGas);
  }
}

function updateSteam(x, y, cell) {
  if (randFloat() < 0.01) {
    setCell(x, y, MATERIALS.water);
    return;
  }
  updateGas(x, y, cell);
}

function updateSmoke(x, y, cell) {
  if (randFloat() < 0.01) {
    setCell(x, y, MATERIALS.empty);
    return;
  }
  updateGas(x, y, cell);
}

function updateIce(x, y, cell) {
  neighbors4(x, y).forEach(([nx, ny]) => {
    const n = getCell(nx, ny);
    if ((n.hot || n.fire) && randFloat() < 0.2) {
      setCell(x, y, MATERIALS.water);
    }
  });
}

function updateLiquidMetal(x, y, cell) {
  neighbors4(x, y).forEach(([nx, ny]) => {
    const n = getCell(nx, ny);
    if (!n.hot && !n.fire && randFloat() < 0.01) {
      setCell(x, y, MATERIALS.metal);
    }
  });
  updateLiquid(x, y, cell);
}

function updateCell(x, y) {
  const cell = getCell(x, y);
  if (cell === MATERIALS.empty || cell.static) return;

  if (cell.type === "solid") {
    if (cell === MATERIALS.ice) {
      updateIce(x, y, cell);
    }
    updateSolid(x, y, cell);
  } else if (cell.type === "liquid") {
    if (cell === MATERIALS.liquidMetal) {
      updateLiquidMetal(x, y, cell);
    } else {
      updateLiquid(x, y, cell);
    }
  } else if (cell.type === "gas") {
    if (cell === MATERIALS.steam) {
      updateSteam(x, y, cell);
    } else if (cell === MATERIALS.smoke) {
      updateSmoke(x, y, cell);
    } else {
      updateGas(x, y, cell);
    }
  }

  if (cell.fire) updateFire(x, y, cell);
  if (cell.corrosive) updateAcid(x, y, cell);
  if (cell.explosive) updateExplosive(x, y, cell);
  if (cell.hot && cell !== MATERIALS.lava && cell !== MATERIALS.liquidMetal) {
    neighbors4(x, y).forEach(([nx, ny]) => {
      const n = getCell(nx, ny);
      if (n.flammable && randFloat() < 0.3) {
        setCell(nx, ny, MATERIALS.fire);
      }
    });
  }
  if (cell === MATERIALS.lava) updateLava(x, y, cell);
  if (cell.poison) updatePoison(x, y, cell);
}

/* ============================================================
   RENDERING
============================================================ */

function render() {
  const img = sandboxCtx.createImageData(GRID_WIDTH, GRID_HEIGHT);
  const data = img.data;

  let count = 0;
  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      const cell = getCell(x, y);
      const idx = (y * GRID_WIDTH + x) * 4;
      const col = cell.color || "#000000";
      const r = parseInt(col.slice(1, 3), 16);
      const g = parseInt(col.slice(3, 5), 16);
      const b = parseInt(col.slice(5, 7), 16);
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
      if (cell !== MATERIALS.empty) count++;
    }
  }

  particlesEl.textContent = count.toString();
  explosionsEl.textContent = explosionCount.toString();

  const offCanvas = document.createElement("canvas");
  offCanvas.width = GRID_WIDTH;
  offCanvas.height = GRID_HEIGHT;
  const offCtx = offCanvas.getContext("2d");
  offCtx.putImageData(img, 0, 0);

  sandboxCtx.imageSmoothingEnabled = false;
  sandboxCtx.clearRect(0, 0, sandboxCanvas.width, sandboxCanvas.height);
  sandboxCtx.drawImage(offCanvas, 0, 0, sandboxCanvas.width, sandboxCanvas.height);
}

/* ============================================================
   MAIN LOOP
============================================================ */

function step(timestamp) {
  if (!running) return;

  const dt = timestamp - lastTime;
  lastTime = timestamp;
  fps = 1000 / dt;
  if (fpsEl) fpsEl.textContent = fps.toFixed(0);

  for (let y = GRID_HEIGHT - 1; y >= 0; y--) {
    const dir = y % 2 === 0 ? 1 : -1;
    if (dir === 1) {
      for (let x = 0; x < GRID_WIDTH; x++) updateCell(x, y);
    } else {
      for (let x = GRID_WIDTH - 1; x >= 0; x--) updateCell(x, y);
    }
  }

  render();
  requestAnimationFrame(step);
}

/* ============================================================
   EVENTS
============================================================ */

document.addEventListener("sandboxReset", () => {
  initGrid();
  explosionCount = 0;
  logDebug("[Sandbox] Reset");
});

document.addEventListener("toolToggle", e => {
  const { tool, enabled } = e.detail;
  if (tool === "ruler") rulerEnabled = enabled;
  if (tool === "laser") laserEnabled = enabled;
  if (tool === "lighter") lighterEnabled = enabled;
});

/* ============================================================
   INIT
============================================================ */

function initSandbox() {
  if (!sandboxCanvas) {
    console.error("[Sandbox] Canvas not found");
    return;
  }
  resizeCanvas();
  initGrid();
  lastTime = performance.now();
  requestAnimationFrame(step);
  logDebug("[Sandbox] Initialized (Option B)");
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("load", initSandbox);
