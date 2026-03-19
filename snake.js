/* ============================================================
   snake.js — Neon Snake Mini‑Game for Pablo's Portal
   - Runs inside its own canvas panel
   - Neon cyber‑arcade glow
   - Smooth movement + grid logic
   - No interference with sandbox engine
============================================================ */

console.log("%c[Snake] Loaded snake.js", "color:#0f9");

// Canvas
const snakeCanvas = document.getElementById("snake-canvas");
const snakeCtx = snakeCanvas.getContext("2d");

// Grid
const SNAKE_SIZE = 20;
const SNAKE_COLS = 20;
const SNAKE_ROWS = 20;

// Game state
let snake = [{ x: 10, y: 10 }];
let snakeDir = { x: 1, y: 0 };
let snakeFood = { x: 5, y: 5 };
let snakeSpeed = 140; // ms per move
let snakeTimer = 0;
let snakeAlive = true;

// Input
document.addEventListener("keydown", e => {
  if (!snakeAlive) return;

  if (e.key === "ArrowUp" && snakeDir.y !== 1) snakeDir = { x: 0, y: -1 };
  if (e.key === "ArrowDown" && snakeDir.y !== -1) snakeDir = { x: 0, y: 1 };
  if (e.key === "ArrowLeft" && snakeDir.x !== 1) snakeDir = { x: -1, y: 0 };
  if (e.key === "ArrowRight" && snakeDir.x !== -1) snakeDir = { x: 1, y: 0 };
});

// Random food
function spawnFood() {
  snakeFood.x = Math.floor(Math.random() * SNAKE_COLS);
  snakeFood.y = Math.floor(Math.random() * SNAKE_ROWS);
}

// Update
function updateSnake(dt) {
  if (!snakeAlive) return;

  snakeTimer += dt;
  if (snakeTimer < snakeSpeed) return;
  snakeTimer = 0;

  const head = snake[0];
  const newHead = {
    x: head.x + snakeDir.x,
    y: head.y + snakeDir.y
  };

  // Wall collision
  if (
    newHead.x < 0 ||
    newHead.y < 0 ||
    newHead.x >= SNAKE_COLS ||
    newHead.y >= SNAKE_ROWS
  ) {
    snakeAlive = false;
    return;
  }

  // Self collision
  for (let s of snake) {
    if (s.x === newHead.x && s.y === newHead.y) {
      snakeAlive = false;
      return;
    }
  }

  snake.unshift(newHead);

  // Food
  if (newHead.x === snakeFood.x && newHead.y === snakeFood.y) {
    spawnFood();
  } else {
    snake.pop();
  }
}

// Render
function renderSnake() {
  snakeCtx.clearRect(0, 0, snakeCanvas.width, snakeCanvas.height);

  // Background glow
  snakeCtx.fillStyle = "#000000";
  snakeCtx.fillRect(0, 0, snakeCanvas.width, snakeCanvas.height);

  // Food
  snakeCtx.fillStyle = "#ff00ff";
  snakeCtx.shadowColor = "#ff00ff";
  snakeCtx.shadowBlur = 10;
  snakeCtx.fillRect(
    snakeFood.x * SNAKE_SIZE,
    snakeFood.y * SNAKE_SIZE,
    SNAKE_SIZE,
    SNAKE_SIZE
  );

  // Snake
  snakeCtx.fillStyle = "#00ffff";
  snakeCtx.shadowColor = "#00ffff";
  snakeCtx.shadowBlur = 12;

  for (let s of snake) {
    snakeCtx.fillRect(
      s.x * SNAKE_SIZE,
      s.y * SNAKE_SIZE,
      SNAKE_SIZE,
      SNAKE_SIZE
    );
  }

  // Game over text
  if (!snakeAlive) {
    snakeCtx.shadowBlur = 20;
    snakeCtx.fillStyle = "#ff4444";
    snakeCtx.font = "24px monospace";
    snakeCtx.fillText("GAME OVER", 40, 200);
  }
}

// Main loop
let lastSnakeTime = performance.now();

function snakeLoop(timestamp) {
  const dt = timestamp - lastSnakeTime;
  lastSnakeTime = timestamp;

  updateSnake(dt);
  renderSnake();

  requestAnimationFrame(snakeLoop);
}

// Init
function initSnake() {
  snakeCanvas.width = SNAKE_COLS * SNAKE_SIZE;
  snakeCanvas.height = SNAKE_ROWS * SNAKE_SIZE;

  spawnFood();
  requestAnimationFrame(snakeLoop);
}

window.addEventListener("load", initSnake);
