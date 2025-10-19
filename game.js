const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// NEW: Load background image
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

const gravity = 0.6;
const groundY = 440;

// --- Player ---
const playerImg = new Image();
playerImg.src = "assets/images/player.png";
const player = { x: 80, y: groundY - 60, width: 50, height: 60, vy: 0, speed: 4, jumping: false };

// --- Objects ---
const rocks = [
  { x: 250, y: groundY - 30, width: 50, height: 30 },
  { x: 700, y: groundY - 40, width: 60, height: 40 }
];
const logs = [
  { x: 450, y: groundY - 100, width: 100, height: 20 },
  { x: 850, y: groundY - 160, width: 100, height: 20 }
];
const canteens = [
  { x: 300, y: groundY - 80, collected: false },
  { x: 500, y: groundY - 130, collected: false },
  { x: 900, y: groundY - 190, collected: false, charity: true }
];
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
  if (e.key === "Escape" || e.key === "x" || e.key === "X") toggleMenu();
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
 // --- Logs (standable platforms) ---
logs.forEach(log => {
  // check horizontal overlap
  const horizontallyAligned =
    player.x + player.width > log.x &&
    player.x < log.x + log.width;

  // check if player is falling onto the top of the log
  const fallingOnTop =
    player.vy >= 0 &&
    player.y + player.height <= log.y + 10 &&
    player.y + player.height + player.vy >= log.y;

  if (horizontallyAligned && fallingOnTop) {
    player.y = log.y - player.height; // stand on top
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

  // Collect canteens with A
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

  // Progress bar
  distanceTraveled = Math.min(distanceGoal, distanceTraveled + 0.03);
  progressBar.style.width = `${(distanceTraveled / distanceGoal) * 100}%`;

  draw();
  requestAnimationFrame(update);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw background image
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
      ctx.drawImage(img, c.x, c.y, 25, 25);
    }
  });

  // Player
  ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
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
  window.location.reload();
}

// --- Start ---
update();
