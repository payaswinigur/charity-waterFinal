const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Load background image
const backgroundImg = new Image();
backgroundImg.src = "assets/images/Level_1.png";

const timerEl = document.getElementById("timer");
const scoreboardEl = document.getElementById("scoreboard");
const progressBar = document.getElementById("progress-bar");
const menu = document.getElementById("menu");
const resumeBtn = document.getElementById("resumeBtn");
const restartBtn = document.getElementById("restartBtn");

let gameRunning = true;
let elapsedTime = 0;
let canteensCollected = 0;
let totalCanteens = 3;
let distanceTraveled = 0;
let distanceGoal = 37;
let currentLevel = 0; // 0-indexed (Level 1 → 0, Level 2 → 1, Level 3 → 2)

const gravity = 0.6;
const groundY = 440;

// --- Player ---
const playerImg = new Image();
playerImg.src = "assets/images/player.png";
const player = { x: 80, y: groundY - 60, width: 50, height: 60, vy: 0, speed: 4, jumping: false };

// --- Levels --- //
const levels = [
  {
    background: "assets/images/Level_1.png",
    rocks: [
      { x: 100, y: groundY - 25, width: 50, height: 40 },
      { x: 700, y: groundY - 25, width: 50, height: 40 },
    ],
    logs: [
      { x: 450, y: groundY - 60, width: 70, height: 80 },
      { x: 700, y: groundY - 225, width: 70, height: 80 },
    ],
    canteens: [
      { x: 265, y: groundY - 80, collected: false },
      { x: 110, y: groundY - 350, collected: false },
      { x: 900, y: groundY - 220, collected: false },
    ],
  },

  {
    background: "assets/images/Level_2.png",
    rocks: [
      { x: 200, y: groundY - 40, width: 70, height: 40 },
      { x: 600, y: groundY - 50, width: 80, height: 50 },
      { x: 850, y: groundY - 40, width: 60, height: 40 },
    ],
    logs: [
      { x: 350, y: groundY - 120, width: 120, height: 20 },
      { x: 750, y: groundY - 180, width: 100, height: 20 },
    ],
    canteens: [
      { x: 400, y: groundY - 150, collected: false },
      { x: 700, y: groundY - 200, collected: false },
      { x: 950, y: groundY - 60, collected: false },
    ],
  },

  {
    background: "assets/images/Level_3.png",
    rocks: [
      { x: 150, y: groundY - 35, width: 50, height: 35 },
      { x: 450, y: groundY - 40, width: 80, height: 40 },
      { x: 800, y: groundY - 50, width: 90, height: 50 },
    ],
    logs: [
      { x: 300, y: groundY - 140, width: 100, height: 20 },
      { x: 600, y: groundY - 200, width: 100, height: 20 },
      { x: 900, y: groundY - 100, width: 120, height: 20 },
    ],
    canteens: [
      { x: 350, y: groundY - 160, collected: false },
      { x: 620, y: groundY - 220, collected: false },
      { x: 950, y: groundY - 130, collected: false },
    ],
  },
];

let rocks = levels[currentLevel].rocks;
let logs = levels[currentLevel].logs;
let canteens = levels[currentLevel].canteens;
backgroundImg.src = levels[currentLevel].background;

const water = { x: 0, y: groundY + 20, width: canvas.width, height: 100, color: "#4682b4" };

// --- Timer ---
setInterval(() => {
  if (gameRunning) {
    elapsedTime++;
    const min = Math.floor(elapsedTime / 60);
    const sec = (elapsedTime % 60).toString().padStart(2, "0");
    timerEl.textContent = `Time: ${min}:${sec}`;
  }
}, 1000);

// --- Input ---
const keys = {};
document.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;
  if (e.key === "Escape" || e.key.toLowerCase() === "x") toggleMenu();
});
document.addEventListener("keyup", e => (keys[e.key.toLowerCase()] = false));

// Toggle instructions sidebar with "I"
document.addEventListener("keydown", e => {
  if (e.key.toLowerCase() === "i") {
    document.getElementById("instructions").classList.toggle("hidden");
  }
});

// --- Main Loop ---
function update() {
  if (!gameRunning) return;

  if (keys["arrowright"]) player.x += player.speed;
  if (keys["arrowleft"]) player.x -= player.speed;
  if (keys["arrowup"] && !player.jumping) {
    player.vy = -10;
    player.jumping = true;
  }

  player.y += player.vy;
  player.vy += gravity;

  // Ground
  if (player.y + player.height >= groundY) {
    player.y = groundY - player.height;
    player.vy = 0;
    player.jumping = false;
  }

  // Logs (standable)
  logs.forEach(log => {
    const horizontallyAligned = player.x + player.width > log.x && player.x < log.x + log.width;
    const fallingOnTop =
      player.vy >= 0 &&
      player.y + player.height <= log.y + 10 &&
      player.y + player.height + player.vy >= log.y;

    if (horizontallyAligned && fallingOnTop) {
      player.y = log.y - player.height;
      player.vy = 0;
      player.jumping = false;
    }
  });

  // Rocks (solid)
  rocks.forEach(rock => {
    if (
      player.x < rock.x + rock.width &&
      player.x + player.width > rock.x &&
      player.y + player.height > rock.y &&
      player.y < rock.y + rock.height
    ) {
      if (player.x < rock.x) player.x = rock.x - player.width;
      else player.x = rock.x + rock.width;
    }
  });

  // Water (death)
  if (player.y + player.height > water.y) loseLevel();

  // Collect canteens
  if (keys["a"]) {
    canteens.forEach(c => {
      if (
        !c.collected &&
        player.x < c.x + 20 &&
        player.x + player.width > c.x &&
        player.y < c.y + 20 &&
        player.y + player.height > c.y
      ) {
        c.collected = true;
        canteensCollected++;
        scoreboardEl.textContent = `Canteens: ${canteensCollected} / ${totalCanteens}`;
      }
    });
  }

  // Check level completion
  if (canteens.every(c => c.collected)) nextLevel();

  // Progress bar
  distanceTraveled = Math.min(distanceGoal, distanceTraveled + 0.03);
  progressBar.style.width = `${(distanceTraveled / distanceGoal) * 100}%`;

  draw();
  requestAnimationFrame(update);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);

  // Rocks
  rocks.forEach(r => {
    const img = new Image();
    img.src = "assets/images/rock.png";
    ctx.drawImage(img, r.x, r.y, r.width, r.height);
  });

  // Logs
  logs.forEach(l => {
    const img = new Image();
    img.src = "assets/images/log.png";
    ctx.drawImage(img, l.x, l.y, l.width, l.height);
  });

  // Canteens
  canteens.forEach(c => {
    if (!c.collected) {
      const img = new Image();
      img.src = "assets/images/canteen.png";
      ctx.drawImage(img, c.x, c.y, c.width || 50, c.height || 50);
    }
  });

  // Player
  ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
}

// --- Level Management ---
function nextLevel() {
  if (currentLevel < levels.length - 1) {
    currentLevel++;
    alert(`Level ${currentLevel} complete!`);
    loadLevel(currentLevel);
  } else {
    alert("🎉 Congratulations! You’ve completed all levels!");
    window.location.reload();
  }
}

function loadLevel(index) {
  const lvl = levels[index];
  rocks = lvl.rocks;
  logs = lvl.logs;
  canteens = lvl.canteens.map(c => ({ ...c })); // reset collected flags
  canteensCollected = 0;
  scoreboardEl.textContent = `Canteens: 0 / ${totalCanteens}`;
  backgroundImg.src = lvl.background;
  player.x = 80;
  player.y = groundY - 60;
}

// --- Menu + Controls ---
function toggleMenu() {
  gameRunning = !gameRunning;
  menu.classList.toggle("hidden");
  if (gameRunning) requestAnimationFrame(update);
}

resumeBtn.onclick = toggleMenu;
restartBtn.onclick = () => window.location.reload();

function loseLevel() {
  gameRunning = false;
  alert("You fell into dirty water! Restarting level...");
  loadLevel(currentLevel);
  gameRunning = true;
  requestAnimationFrame(update);
}

// --- Start ---
update();
