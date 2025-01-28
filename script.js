// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const box = 20;

// Game state
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

// Encrypted messages and milestones
const _0xi5p6 = {
    4: "TmlsbyBhcHBlYXJzISBZb3UgYXJlIGRvaW5nIGdyZWF0IQ==",  // "Nilo appears! You are doing great!"
    9: "TmlsbyBsb3ZlcyEgS2VlcCBnb2luZywgbXkgZGVhciE=",      // "Nilo loves! Keep going, my dear!"
    18: "TmlsbyBsb3ZlcyBBZGVsaW5lISBZb3UgYXJlIGFtYXppbmch", // "Nilo loves Adeline!"
    23: "5a6D6LSt5YWz77yM5Yqg5rK577yB",                      // "宝贝兔，加油哦"
    28: "5LuK5aSp5pivMjjlj7fvvIznlJ/ml6Xlv6vkuZDlk77vvIzluIzmnJvkvaDllpzmrKLov5nkuKrlsI/spbw=", // "今天是28号，生日快乐哦，希望你喜欢这个小蛇"
    39: "QnJvd25pZSBsb3ZlcyBDb255"                          // "Brownie loves Cony"
};

// Extended image mappings
const _0xj6q7 = {
    5: "images/love1.jpg",
    6: "images/love2.jpg",
    7: "images/love3.jpg",
    8: "images/love4.jpg",
    9: "images/love5.jpg",
    10: "images/love6.jpg",
    11: "images/love7.jpg",
    12: "images/love8.jpg",
    13: "images/love9.jpg",
    14: "images/love10.jpg",
    15: "images/love11.jpg",
    16: "images/love12.jpg",
    17: "images/love13.jpg",
    18: "images/love14.jpg",
    19: "images/love15.jpg",
    20: "images/love16.jpg"
};

function decryptMessage(encrypted) {
    try {
        return atob(encrypted);
    } catch {
        return "Keep going!";
    }
}

function getSegmentLetter(position, score) {
    // 4-8: "nilo"
    if (score >= 4 && score < 9) {
        const pattern = 'nilo';
        return position < pattern.length ? pattern[position] : '';
    }
    
    // 9-17: "nilo loves"
    if (score >= 9 && score < 18) {
        const pattern = 'nilo loves';
        return position < pattern.length ? pattern[position] : '';
    }
    
    // 18-22: "nilo loves adeline"
    if (score >= 18 && score < 23) {
        const pattern = 'nilo loves adeline';
        return position < pattern.length ? pattern[position] : '';
    }
    
    // 23-27: "宝贝兔，加油哦" - Centered
    if (score >= 23 && score < 28) {
        const pattern = ['宝', '贝', '兔', '，', '加', '油', '哦'];
        const totalLength = pattern.length;
        const startPos = Math.floor((snake.length - totalLength) / 2);
        if (position >= startPos && position < startPos + totalLength) {
            return pattern[position - startPos];
        }
        return '';
    }
    
    // 28-38: "今天是28号，生日快乐哦，希望你喜欢这个小蛇"
    if (score >= 28 && score < 39) {
        const pattern = ['今', '天', '是', '2', '8', '号', '，', '生', '日', '快', '乐', '哦', '，', '希', '望', '你', '喜', '欢', '这', '个', '小', '蛇', '❤️', '❤️', '❤️'];
        return position < pattern.length ? pattern[position] : '';
    }
    
    // 39+: "Brownie loves Cony"
    if (score >= 39) {
        const pattern = 'Brownie loves Cony';
        return position < pattern.length ? pattern[position] : '';
    }
    
    return '';
}

function setupPortals() {
    portals = [
        { x: 0, y: Math.floor(Math.random() * 30) * box },
        { x: 29 * box, y: Math.floor(Math.random() * 30) * box },
        { x: Math.floor(Math.random() * 30) * box, y: 0 },
        { x: Math.floor(Math.random() * 30) * box, y: 29 * box },
        { x: Math.floor(Math.random() * 28 + 1) * box, y: Math.floor(Math.random() * 28 + 1) * box }
    ];
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

function showGameOverModal(score) {
    const modal = document.createElement('div');
    modal.className = 'game-over-modal';
    modal.innerHTML = `
        <div class="game-over-text">宝贝，没关系，加油再试！</div>
        <div class="game-over-score">得分: ${score}</div>
        <button class="game-over-button" onclick="restartGame()">再试一次</button>
        <button class="game-over-button" onclick="goHome()">回主页</button>
    `;
    document.body.appendChild(modal);
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
        // Special pink color for birthday message
        if (score >= 28 && score < 39) {
            ctx.fillStyle = (i === 0) ? '#FFB6C1' : '#FFC0CB';
        } else {
            ctx.fillStyle = (i === 0) ? 'green' : 'lightgreen';
        }
        
        ctx.fillRect(snake[i].x, snake[i].y, box, box);
        ctx.strokeStyle = 'black';
        ctx.strokeRect(snake[i].x, snake[i].y, box, box);

        const letter = getSegmentLetter(i, score);
        if (letter) {
            if (score >= 28 && score < 39) {
                ctx.fillStyle = 'black';
            } else {
                ctx.fillStyle = 'white';
            }

            if (score >= 23 && score < 39) {
                ctx.font = '18px "Microsoft YaHei", "SimHei", Arial';
            } else {
                ctx.font = '14px Arial';
            }
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(letter, snake[i].x + box/2, snake[i].y + box/2);
        }
    }

    // Immunity effect
    if (isImmune) {
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
        ctx.lineWidth = 2;
        snake.forEach(segment => {
            ctx.strokeRect(segment.x, segment.y, box, box);
        });
    }

    // Snake movement
    let snakeX = snake[0].x;
    let snakeY = snake[0].y;

    if (direction === 'LEFT') snakeX -= box;
    if (direction === 'UP') snakeY -= box;
    if (direction === 'RIGHT') snakeX += box;
    if (direction === 'DOWN') snakeY += box;

    const teleported = checkPortals({ x: snakeX, y: snakeY });
    snakeX = teleported.x;
    snakeY = teleported.y;

    // Food collision
    if (snakeX === food.x && snakeY === food.y) {
        food = { 
            x: Math.floor(Math.random() * 30) * box, 
            y: Math.floor(Math.random() * 30) * box 
        };
        score++;
        document.getElementById('scoreDisplay').innerText = `Score: ${score}`;

        if (_0xi5p6[score]) {
            document.getElementById('message').innerText = decryptMessage(_0xi5p6[score]);
        }
        if (_0xj6q7[score]) {
            document.getElementById('loveImage').src = _0xj6q7[score];
            document.getElementById('loveImage').classList.remove('hidden');
        }

        baseSpeed = Math.max(150, baseSpeed - 5);
        currentSpeed = speedBoostActive ? baseSpeed * speedBoostFactor : baseSpeed;
        clearInterval(game);
        game = setInterval(draw, currentSpeed);
    } else {
        snake.pop();
    }

    const newHead = { x: snakeX, y: snakeY };
    
    if (snakeX < 0 || snakeY < 0 || snakeX >= canvas.width || snakeY >= canvas.height || collision(newHead, snake)) {
        if (handleCollision()) {
            clearInterval(game);
            saveScore(score);
            showGameOverModal(score);
            return;
        }
    }

    snake.unshift(newHead);
}

function collision(head, array) {
    for (let i = 1; i < array.length; i++) {
        if (head.x === array[i].x && head.y === array[i].y) {
            return true;
        }
    }
    return false;
}

// Game Control Functions
function saveScore(finalScore) {
    const date = new Date().toLocaleDateString();
    const scores = getScores();
    scores.push({ score: finalScore, date: date });
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

function startGame() {
    document.getElementById('entryPage').classList.add('hidden');
    document.getElementById('gamePage').classList.remove('hidden');
    setupPortals();
    updateLeaderboard();
    restartGame();
}

function goHome() {
    clearInterval(game);
    const modal = document.querySelector('.game-over-modal');
    if (modal) modal.remove();
    document.getElementById('gamePage').classList.add('hidden');
    document.getElementById('entryPage').classList.remove('hidden');
    snake = [{ x: 9 * box, y: 9 * box }];
    direction = 'RIGHT';
    score = 0;
    lives = 3;
    isPaused = false;
    document.getElementById('pauseBtn').textContent = 'Pause';
    document.getElementById('message').innerText = "";
    document.getElementById('scoreDisplay').innerText = "Score: 0";
    document.getElementById('loveImage').classList.add('hidden');
    updateLivesDisplay();
}

function togglePause() {
    isPaused = !isPaused;
    document.getElementById('pauseBtn').textContent = isPaused ? 'Resume' : 'Pause';
if (isPaused) {
        clearInterval(game);
    } else {
        game = setInterval(draw, currentSpeed);
    }
}

function restartGame() {
    const modal = document.querySelector('.game-over-modal');
    if (modal) modal.remove();
    
    snake = [{ x: 9 * box, y: 9 * box }];
    direction = 'RIGHT';
    food = { x: Math.floor(Math.random() * 30) * box, y: Math.floor(Math.random() * 30) * box };
    score = 0;
    lives = 3;
    isImmune = false;
    baseSpeed = 200;
    currentSpeed = baseSpeed;
    speedBoostActive = false;
    isPaused = false;
    document.getElementById('pauseBtn').textContent = 'Pause';
    setupPortals();
    clearInterval(game);
    game = setInterval(draw, currentSpeed);
    document.getElementById('message').innerText = "";
    document.getElementById('scoreDisplay').innerText = "Score: 0";
    document.getElementById('loveImage').classList.add('hidden');
    updateLivesDisplay();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Keyboard controls
    document.addEventListener('keydown', (event) => {
        const directions = {
            'ArrowLeft': 'LEFT',
            'ArrowUp': 'UP',
            'ArrowRight': 'RIGHT',
            'ArrowDown': 'DOWN'
        };

        const newDirection = directions[event.key];
        if (newDirection) {
            const opposites = {
                'LEFT': 'RIGHT',
                'RIGHT': 'LEFT',
                'UP': 'DOWN',
                'DOWN': 'UP'
            };
            
            if (direction !== opposites[newDirection]) {
                direction = newDirection;
            }

            if (!speedBoostActive && !isPaused) {
                speedBoostActive = true;
                currentSpeed = baseSpeed * speedBoostFactor;
                clearInterval(game);
                game = setInterval(draw, currentSpeed);
            }
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

    // Touch/Click controls for arrow buttons
    document.querySelectorAll('.arrow-btn').forEach(button => {
        // Mouse events
        button.addEventListener('mousedown', (e) => {
            const newDirection = button.dataset.direction;
            const opposites = {
                'LEFT': 'RIGHT',
                'RIGHT': 'LEFT',
                'UP': 'DOWN',
                'DOWN': 'UP'
            };
            
            if (direction !== opposites[newDirection]) {
                direction = newDirection;
            }

            if (!speedBoostActive && !isPaused) {
                speedBoostActive = true;
                currentSpeed = baseSpeed * speedBoostFactor;
                clearInterval(game);
                game = setInterval(draw, currentSpeed);
            }
        });

        button.addEventListener('mouseup', () => {
            speedBoostActive = false;
            currentSpeed = baseSpeed;
            if (!isPaused) {
                clearInterval(game);
                game = setInterval(draw, currentSpeed);
            }
        });

        // Touch events
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const newDirection = button.dataset.direction;
            const opposites = {
                'LEFT': 'RIGHT',
                'RIGHT': 'LEFT',
                'UP': 'DOWN',
                'DOWN': 'UP'
            };
            
            if (direction !== opposites[newDirection]) {
                direction = newDirection;
            }

            if (!speedBoostActive && !isPaused) {
                speedBoostActive = true;
                currentSpeed = baseSpeed * speedBoostFactor;
                clearInterval(game);
                game = setInterval(draw, currentSpeed);
            }
        });

        button.addEventListener('touchend', (e) => {
            e.preventDefault();
            speedBoostActive = false;
            currentSpeed = baseSpeed;
            if (!isPaused) {
                clearInterval(game);
                game = setInterval(draw, currentSpeed);
            }
        });

        // Handle touch/mouse leave
        ['mouseleave', 'touchcancel'].forEach(eventType => {
            button.addEventListener(eventType, () => {
                speedBoostActive = false;
                currentSpeed = baseSpeed;
                if (!isPaused) {
                    clearInterval(game);
                    game = setInterval(draw, currentSpeed);
                }
            });
        });
    });

    // Game control buttons
    document.getElementById('startGameBtn').addEventListener('click', startGame);
    document.getElementById('homeBtn').addEventListener('click', goHome);
    document.getElementById('restartBtn').addEventListener('click', restartGame);
    document.getElementById('pauseBtn').addEventListener('click', togglePause);

    // Initialize game
    setupPortals();
    updateLeaderboard();
});
