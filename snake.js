// =====================================================
// NEON SNAKE — GLOBAL VARIABLES + FUNCTIONS
// =====================================================

let snakeCanvas, snakeCtx;
let snakeGrid = 20;
let snakeSpeed = 120; // ms per step
let snakeTimer = 0;

let snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 }
];

let snakeDir = { x: 1, y: 0 };
let snakeFood = { x: 15, y: 10 };
let snakeAlive = true;

// -----------------------------------------------------
// Initialize snake game
// -----------------------------------------------------
function initSnakeGame(canvas) {
    snakeCanvas = canvas;
    snakeCtx = canvas.getContext("2d");

    snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];

    snakeDir = { x: 1, y: 0 };
    snakeFood = randomFood();
    snakeAlive = true;
    snakeTimer = performance.now();
}

// -----------------------------------------------------
// Random food position
// -----------------------------------------------------
function randomFood() {
    return {
        x: Math.floor(Math.random() * (snakeCanvas.width / snakeGrid)),
        y: Math.floor(Math.random() * (snakeCanvas.height / snakeGrid))
    };
}

// -----------------------------------------------------
// Handle input (global keys set in index.html)
// -----------------------------------------------------
function updateSnakeInput() {
    if (keyLeft && snakeDir.x !== 1) snakeDir = { x: -1, y: 0 };
    if (keyRight && snakeDir.x !== -1) snakeDir = { x: 1, y: 0 };
    if (keyUp && snakeDir.y !== 1) snakeDir = { x: 0, y: -1 };
    if (keyDown && snakeDir.y !== -1) snakeDir = { x: 0, y: 1 };
}

// -----------------------------------------------------
// Update snake logic
// -----------------------------------------------------
function updateSnake() {
    if (!snakeAlive) return;

    let now = performance.now();
    if (now - snakeTimer < snakeSpeed) return;
    snakeTimer = now;

    updateSnakeInput();

    // New head
    let head = {
        x: snake[0].x + snakeDir.x,
        y: snake[0].y + snakeDir.y
    };

    // Wall wrapping
    let maxX = snakeCanvas.width / snakeGrid;
    let maxY = snakeCanvas.height / snakeGrid;

    if (head.x < 0) head.x = maxX - 1;
    if (head.x >= maxX) head.x = 0;
    if (head.y < 0) head.y = maxY - 1;
    if (head.y >= maxY) head.y = 0;

    // Self collision
    for (let s of snake) {
        if (s.x === head.x && s.y === head.y) {
            snakeAlive = false;
            return;
        }
    }

    snake.unshift(head);

    // Eat food
    if (head.x === snakeFood.x && head.y === snakeFood.y) {
        snakeFood = randomFood();
    } else {
        snake.pop();
    }
}

// -----------------------------------------------------
// Draw snake game
// -----------------------------------------------------
function drawSnake() {
    if (!snakeCtx) return;

    snakeCtx.clearRect(0, 0, snakeCanvas.width, snakeCanvas.height);

    // Food
    snakeCtx.fillStyle = "#ff00ff";
    snakeCtx.shadowColor = "#ff00ff";
    snakeCtx.shadowBlur = 10;
    snakeCtx.fillRect(
        snakeFood.x * snakeGrid,
        snakeFood.y * snakeGrid,
        snakeGrid,
        snakeGrid
    );

    // Snake
    snakeCtx.fillStyle = "#00ffee";
    snakeCtx.shadowColor = "#00ffee";
    snakeCtx.shadowBlur = 12;

    for (let s of snake) {
        snakeCtx.fillRect(
            s.x * snakeGrid,
            s.y * snakeGrid,
            snakeGrid,
            snakeGrid
        );
    }

    // Game over text
    if (!snakeAlive) {
        snakeCtx.shadowBlur = 0;
        snakeCtx.fillStyle = "#ff0066";
        snakeCtx.font = "24px sans-serif";
        snakeCtx.fillText("GAME OVER", 20, 40);
    }
}
