import {
    checkDraw,
    findWinningCombination,
    getRecommendedMove,
    parseStoredGame,
    sanitizeName,
    sanitizeTheme
} from './game.js';

// Game state
let board = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';
let gameActive = true;
let player1Name = 'Player 1';
let player2Name = 'Player 2';
let scores = {
    player1: 0,
    player2: 0,
    draws: 0
};

// Timer for inactivity recommendation
let inactivityTimer = null;
let lastMoveTime = Date.now();
const INACTIVITY_THRESHOLD = 10000; // 10 seconds

// DOM elements
const cells = document.querySelectorAll('.cell');
const gameStatus = document.getElementById('gameStatus');
const recommendationEl = document.getElementById('recommendation');
const resetBtn = document.getElementById('resetBtn');
const resetAllBtn = document.getElementById('resetAllBtn');
const themeToggle = document.getElementById('themeToggle');
const player1NameEl = document.getElementById('player1Name');
const player2NameEl = document.getElementById('player2Name');
const editPlayer1Btn = document.getElementById('editPlayer1');
const editPlayer2Btn = document.getElementById('editPlayer2');
const player1ScoreEl = document.getElementById('player1Score');
const player2ScoreEl = document.getElementById('player2Score');
const drawScoreEl = document.getElementById('drawScore');

// Initialize game
function init() {
    cells.forEach(cell => {
        cell.addEventListener('click', handleCellClick);
    });

    resetBtn.addEventListener('click', resetGame);
    resetAllBtn.addEventListener('click', resetAll);
    themeToggle.addEventListener('click', toggleTheme);
    editPlayer1Btn.addEventListener('click', () => editPlayerName(1));
    editPlayer2Btn.addEventListener('click', () => editPlayerName(2));

    loadGameData();
    updateScoreDisplay();
    updateGameStatus();
    startInactivityTimer();
}

// Handle cell click
function handleCellClick(e) {
    const cell = e.target.closest('.cell');
    if (!cell) return;
    const index = parseInt(cell.getAttribute('data-index'), 10);

    if (Number.isNaN(index) || board[index] !== '' || !gameActive) {
        return;
    }

    makeMove(index);
}

// Make a move
function makeMove(index) {
    board[index] = currentPlayer;
    cells[index].textContent = currentPlayer;
    cells[index].classList.add('taken');

    lastMoveTime = Date.now();
    hideRecommendation();
    resetInactivityTimer();

    const winningCombination = findWinningCombination(board);
    if (winningCombination) {
        highlightWinningCells(winningCombination);
        handleWin();
    } else if (checkDraw(board)) {
        handleDraw();
    } else {
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        updateGameStatus();
    }
}

// Highlight winning cells
function highlightWinningCells(combination) {
    combination.forEach(index => {
        cells[index].classList.add('winning');
    });
}

// Handle win
function handleWin() {
    gameActive = false;
    const winner = currentPlayer === 'X' ? player1Name : player2Name;
    gameStatus.textContent = `${winner} wins!`;

    if (currentPlayer === 'X') {
        scores.player1++;
    } else {
        scores.player2++;
    }

    updateScoreDisplay();
    saveGameData();
    stopInactivityTimer();
}

// Handle draw
function handleDraw() {
    gameActive = false;
    gameStatus.textContent = "It's a draw!";
    scores.draws++;
    updateScoreDisplay();
    saveGameData();
    stopInactivityTimer();
}

// Update game status
function updateGameStatus() {
    if (gameActive) {
        const currentPlayerName = currentPlayer === 'X' ? player1Name : player2Name;
        gameStatus.textContent = `${currentPlayerName}'s turn`;
    }
}

// Update score display
function updateScoreDisplay() {
    player1ScoreEl.textContent = String(scores.player1);
    player2ScoreEl.textContent = String(scores.player2);
    drawScoreEl.textContent = String(scores.draws);
}

// Reset game
function resetGame() {
    board = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = 'X';
    gameActive = true;

    cells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('taken', 'winning');
    });

    updateGameStatus();
    hideRecommendation();
    resetInactivityTimer();
}

// Reset all (scores and names)
function resetAll() {
    if (!confirm('Are you sure you want to reset all scores and player names? This cannot be undone.')) {
        return;
    }

    scores = {
        player1: 0,
        player2: 0,
        draws: 0
    };

    player1Name = 'Player 1';
    player2Name = 'Player 2';
    player1NameEl.textContent = player1Name;
    player2NameEl.textContent = player2Name;

    updateScoreDisplay();
    updateGameStatus();

    try {
        localStorage.removeItem('noughtsAndCrossesData');
    } catch {
        // Storage can be unavailable. The in-memory reset still stands.
    }

    resetGame();
}

// Inactivity timer functions
function startInactivityTimer() {
    inactivityTimer = setInterval(checkInactivity, 1000);
}

function stopInactivityTimer() {
    if (inactivityTimer) {
        clearInterval(inactivityTimer);
        inactivityTimer = null;
    }
}

function resetInactivityTimer() {
    lastMoveTime = Date.now();
    hideRecommendation();
}

function checkInactivity() {
    if (!gameActive) return;

    const timeSinceLastMove = Date.now() - lastMoveTime;

    if (timeSinceLastMove >= INACTIVITY_THRESHOLD) {
        showRecommendation();
    }
}

// Show recommendation
function showRecommendation() {
    const recommendedMove = getRecommendedMove(board, currentPlayer);
    if (recommendedMove !== -1) {
        const row = Math.floor(recommendedMove / 3) + 1;
        const col = (recommendedMove % 3) + 1;
        recommendationEl.textContent = `Hint: Try placing your marker at row ${row}, column ${col}`;
        recommendationEl.classList.remove('hidden');
    }
}

// Hide recommendation
function hideRecommendation() {
    recommendationEl.classList.add('hidden');
}

// Edit player name
function editPlayerName(playerNum) {
    const nameEl = playerNum === 1 ? player1NameEl : player2NameEl;
    const currentName = playerNum === 1 ? player1Name : player2Name;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'name-input';
    input.value = currentName;
    input.maxLength = 20;

    nameEl.classList.add('editing');
    nameEl.parentNode.insertBefore(input, nameEl);
    input.focus();
    input.select();

    let saved = false;
    function saveName() {
        if (saved) return;
        saved = true;

        const fallback = playerNum === 1 ? 'Player 1' : 'Player 2';
        const newName = sanitizeName(input.value, currentName || fallback);
        if (playerNum === 1) {
            player1Name = newName;
            player1NameEl.textContent = newName;
        } else {
            player2Name = newName;
            player2NameEl.textContent = newName;
        }

        nameEl.classList.remove('editing');
        input.remove();
        updateGameStatus();
        saveGameData();
    }

    input.addEventListener('blur', saveName);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveName();
        }
    });
}

// Theme toggle
function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    document.body.setAttribute('data-theme', newTheme);

    const themeIcon = themeToggle.querySelector('.theme-icon');
    themeIcon.textContent = newTheme === 'light' ? '🌙' : '☀️';

    try {
        localStorage.setItem('theme', newTheme);
    } catch {
        // Ignore storage failures. The theme still applies for this visit.
    }
}

// Save game data to localStorage
function saveGameData() {
    const data = {
        player1Name,
        player2Name,
        scores
    };
    try {
        localStorage.setItem('noughtsAndCrossesData', JSON.stringify(data));
    } catch {
        // Ignore storage failures. The in-memory game still works.
    }
}

// Load game data from localStorage
function loadGameData() {
    let savedData = null;
    let savedTheme = null;
    try {
        savedData = localStorage.getItem('noughtsAndCrossesData');
        savedTheme = localStorage.getItem('theme');
    } catch {
        savedData = null;
        savedTheme = null;
    }

    const data = savedData ? parseStoredGame(savedData) : null;
    if (data) {
        player1Name = data.player1Name;
        player2Name = data.player2Name;
        scores = data.scores;
        player1NameEl.textContent = player1Name;
        player2NameEl.textContent = player2Name;
    }

    const theme = sanitizeTheme(savedTheme);
    document.body.setAttribute('data-theme', theme);
    const themeIcon = themeToggle.querySelector('.theme-icon');
    themeIcon.textContent = theme === 'light' ? '🌙' : '☀️';
}

// Initialize the game when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
