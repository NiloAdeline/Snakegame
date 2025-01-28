const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const box = 20;
let snake = [{ x: 9 * box, y: 9 * box }];
let direction = 'RIGHT';
let food = { x: Math.floor(Math.random() * 30) * box, y: Math.floor(Math.random() * 30) * box };
let score = 0;
let game;
let baseSpeed = 200;
let currentSpeed = baseSpeed;
let speedBoostActive = false;
let speedBoostFactor = 0.5;
let isPaused = false;
let lives = 3;
let isImmune = false;
let immunityDuration = 2000;
let portals = [];

// Encrypted messages
const encryptedData = {
    2: "SGFwcHkgQmlydGhkYXksIERlYXJv",  // Happy Birthday, Dearo
    3: "SGFwcHkgQmlydGhkYXksIERlYXJv",
    4: "SGFwcHkgQmlydGhkYXksIERlYXJv",
    5: "R29vZCBzdGFydCwgbXVtbXk=",      // Good start, mummy
    10: "R29vZCBwcm9ncmVzcyAh"          // Good progress !
};

// Image paths
const images = {
    5: "images/love1.jpg",
    10: "images/love2.jpg"
};

// Setup portals
function setupPortals() {
    portals = [
        { x: 0, y: Math.floor(Math.random() * 30) * box },
        { x: 29 * box, y: Math.floor(Math.random() * 30) * box },
        { x: Math.floor(Math.random() * 30) * box, y: 0 },
        { x: Math.floor(Math.random() * 30) * box, y: 29 * box },
        { x: Math.floor(Math.random() * 28 + 1) * box, y: Math.floor(Math.random() * 28 + 1) * box }
    ];
}

// Leaderboard functions
function saveScore(newScore) {
    const date = new Date().toLocaleDateString();
    const scores = getScores();
    scores.push({ score: newScore, date: date });
    scores.sort((a, b) => b.score - a.score);
    localStorage.setItem('snakeGameScores', JSON.stringify(scores));
    updateLeaderboard();
}

function getScores() {
    const scores = localStorage.getItem('snakeGameScores');
    return scores ? JSON.parse(scores) : [];
}

function updateLeaderboard() {
    const leaderboardBody = document.querySelector('.leaderboard-table tbody');
    const scores = getScores();
    const top5Scores = scores.slice(0, 5);
    
    let html = '';
    top5Scores.forEach((record, index) => {
        html += `
            <tr>
                <td>${index + 1}</td>
                <td>${record.score}</td>
                <td>${record.date}</td>
            </tr>
        `;
    });
    
    for (let i = top5Scores.length; i < 5; i++) {
        html += `
            <tr>
                <td>${i + 1}</td>
                <td>-</td>
                <td>-</td>
            </tr>
        `;
    }
    
    leaderboardBody.innerHTML = html;
}

function decryptMessage(encrypted) {
    try {
        return atob(encrypted);
    } catch {
        return "Keep going!";
    }
}

function getSegmentLetter(position, score) {
    if (score >= 4) {
        switch (position) {
            case 0: return 'n';
            case 1: return 'i';
            case 2: return 'l';
            case 3: return 'o';
        }
    }
    if (score >= 10) {
        switch (position) {
            case 0: return 'n';
            case 1: return 'i';
            case 2: return 'l';
            case 3: return 'o';
            case 4: return '';
            case 5: return 'l';
            case 6: return 'o';
            case 7: return 'v';
            case 8: return 'e';
        }
    }
    return '';
}

function handleCollision() {
    if (isImmune) return false;
    
    if (lives > 1) {
        lives--;
        updateLivesDisplay();
        activateImmunity();
        return false;
    }
    return true;
}

function activateImmunity() {
    isImmune = true;
    setTimeout(() => {
        isImmune = false;
    }, immunityDuration);
}

function updateLivesDisplay() {
    const hearts = document.querySelectorAll('.life-heart');
    hearts.forEach((heart, index) => {
        heart.style.opacity = index < lives ? '1' : '0.3';
    });
}

function checkPortals(head) {
    for (let i = 0; i < portals.length; i++) {
        if (head.x === portals[i].x && head.y === portals[i].y) {
            const availablePortals = portals.filter((p, idx) => idx !== i);
            const destination = availablePortals[Math.floor(Math.random() * availablePortals.length)];
            return { x: destination.x, y: destination.y };
        }
    }
    return head;
}

function draw() {
    if (isPaused) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw portals
    portals.forEach(portal => {
        ctx.beginPath();
        ctx.arc(portal.x + box/2, portal.y + box/2, box/2, 0, Math.PI * 2);
        ctx.fillStyle = isImmune ? 'rgba(74, 144, 226, 0.5)' : 'rgba(74, 144, 226, 0.8)';
        ctx.fill();
    });

    // Draw food
    ctx.fillStyle = 'red';
    ctx.fillRect(food.x, food.y, box, box);

    // Draw snake
    for (let i = 0; i < snake.length; i++) {
        ctx.fillStyle = (i === 0) ? 'green' : 'lightgreen';
        ctx.fillRect(snake[i].x, snake[i].y, box, box);
        ctx.strokeStyle = 'black';
        ctx.strokeRect(snake[i].x, snake[i].y, box, box);

        const letter = getSegmentLetter(i, score);
        if (letter) {
            ctx.fillStyle = 'white';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(letter, snake[i].x + box/2, snake[i].y + box/2);
        }
    }

    if (isImmune) {
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
        ctx.lineWidth = 2;
        snake.forEach(segment => {
            ctx.strokeRect(segment.x, segment.y, box, box);
        });
    }

    // Move snake
    let snakeX = snake[0].x;
    let snakeY = snake[0].y;

    if (direction === 'LEFT') snakeX -= box;
    if (direction === 'UP') snakeY -= box;
    if (direction === 'RIGHT') snakeX += box;
    if (direction === 'DOWN') snakeY += box;

    // Check portal teleportation
    const teleported = checkPortals({ x: snakeX, y: snakeY });
    snakeX = teleported.x;
    snakeY = teleported.y;

    // Check food collision
    if (snakeX === food.x && snakeY === food.y) {
        food = { x: Math.floor(Math.random() * 30) * box, y: Math.floor(Math.random() * 30) * box };
        score++;
        document.getElementById('scoreDisplay').innerText = `Score: ${score}`;

        if (encryptedData[score]) {
            document.getElementById('message').innerText = decryptMessage(encryptedData[score]);
        }
        if (images[score]) {
            document.getElementById('loveImage').src = images[score];
            document.getElementById('loveImage').classList.remove('hidden');
            setTimeout(() => {
                document.getElementById('message').innerText = "";
            }, 2000);
        }

        baseSpeed = Math.max(150, baseSpeed - 5);
        currentSpeed = speedBoostActive ? baseSpeed * speedBoostFactor : baseSpeed;
        clearInterval(game);
        game = setInterval(draw, currentSpeed);
    } else {
        snake.pop();
    }

    const newHead = { x: snakeX, y: snakeY };
    snake.unshift(newHead);

    // Check collisions
    if (snakeX < 0 || snakeY < 0 || snakeX >= canvas.width || snakeY >= canvas.height || collision(newHead, snake)) {
        if (handleCollision()) {
            clearInterval(game);
            saveScore(score);
            alert('Game Over! Score: ' + score);
        }
    }
}

function collision(head, array) {
    for (let i = 1; i < array.length; i++) {
        if (head.x === array[i].x && head.y === array[i].y) {
            return true;
        }
    }
    return false;
}

// Event listeners
document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' && direction !== 'RIGHT') direction = 'LEFT';
    if (event.key === 'ArrowUp' && direction !== 'DOWN') direction = 'UP';
    if (event.key === 'ArrowRight' && direction !== 'LEFT') direction = 'RIGHT';
    if (event.key === 'ArrowDown' && direction !== 'UP') direction = 'DOWN';

    if (!speedBoostActive && !isPaused) {
        speedBoostActive = true;
        currentSpeed = baseSpeed * speedBoostFactor;
        clearInterval(game);
        game = setInterval(draw, currentSpeed);
    }
});

document.addEventListener('keyup', (event) => {
    if (event.key.startsWith('Arrow')) {
        speedBoostActive = false;
        currentSpeed = baseSpeed;
        if (!isPaused) {
            clearInterval(game);
            game = setInterval(draw, currentSpeed);
        }
    }
});

function startGame() {
    document.getElementById('entryPage').classList.add('hidden');
    document.getElementById('gamePage').classList.remove('hidden');
    setupPortals();
    updateLeaderboard();
    restartGame();
}

function togglePause() {
    isPaused = !isPaused;
    if (isPaused) {
        clearInterval(game);
    } else {
        game = setInterval(draw, currentSpeed);
    }
}

function restartGame() {
    snake = [{ x: 9 * box, y: 9 * box }];
    direction = 'RIGHT';
    food = { x: Math.floor(Math.random() * 30) * box, y: Math.floor(Math.random() * 30) * box };
    score = 0;
    lives = 3;
    isImmune = false;
    baseSpeed = 200;
    currentSpeed = baseSpeed;
    speedBoostActive = false;
    setupPortals();
    clearInterval(game);
    game = setInterval(draw, currentSpeed);
    document.getElementById('message').innerText = "";
    document.getElementById('scoreDisplay').innerText = "Score: 0";
    document.getElementById('loveImage').classList.add('hidden');
    updateLivesDisplay();
}

// Setup button listeners
document.getElementById('startGameBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', restartGame);
document.getElementById('pauseBtn').addEventListener('click', togglePause);

// Initialize the game
setupPortals();
updateLeaderboard();
