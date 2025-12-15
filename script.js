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

// Winning combinations
const winningCombinations = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

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

    // Load saved data from localStorage
    loadGameData();
    updateScoreDisplay();
    updateGameStatus();
    startInactivityTimer();
}

// Handle cell click
function handleCellClick(e) {
    const cell = e.target;
    const index = parseInt(cell.getAttribute('data-index'));

    if (board[index] !== '' || !gameActive) {
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

    if (checkWin()) {
        handleWin();
    } else if (checkDraw()) {
        handleDraw();
    } else {
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        updateGameStatus();
    }
}

// Check for win
function checkWin() {
    return winningCombinations.some(combination => {
        const [a, b, c] = combination;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            highlightWinningCells(combination);
            return true;
        }
        return false;
    });
}

// Check for draw
function checkDraw() {
    return board.every(cell => cell !== '');
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
    player1ScoreEl.textContent = scores.player1;
    player2ScoreEl.textContent = scores.player2;
    drawScoreEl.textContent = scores.draws;
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
    // Confirm before resetting
    if (!confirm('Are you sure you want to reset all scores and player names? This cannot be undone.')) {
        return;
    }

    // Reset scores
    scores = {
        player1: 0,
        player2: 0,
        draws: 0
    };

    // Reset player names
    player1Name = 'Player 1';
    player2Name = 'Player 2';
    player1NameEl.textContent = player1Name;
    player2NameEl.textContent = player2Name;

    // Update display
    updateScoreDisplay();
    updateGameStatus();

    // Clear localStorage
    localStorage.removeItem('noughtsAndCrossesData');

    // Also reset the game board
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
    const recommendedMove = getRecommendedMove();
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

// Get recommended move (simple AI)
function getRecommendedMove() {
    // First, try to win
    for (let combination of winningCombinations) {
        const [a, b, c] = combination;
        if (board[a] === currentPlayer && board[b] === currentPlayer && board[c] === '') return c;
        if (board[a] === currentPlayer && board[c] === currentPlayer && board[b] === '') return b;
        if (board[b] === currentPlayer && board[c] === currentPlayer && board[a] === '') return a;
    }

    // Then, try to block opponent
    const opponent = currentPlayer === 'X' ? 'O' : 'X';
    for (let combination of winningCombinations) {
        const [a, b, c] = combination;
        if (board[a] === opponent && board[b] === opponent && board[c] === '') return c;
        if (board[a] === opponent && board[c] === opponent && board[b] === '') return b;
        if (board[b] === opponent && board[c] === opponent && board[a] === '') return a;
    }

    // Take center if available
    if (board[4] === '') return 4;

    // Take corners
    const corners = [0, 2, 6, 8];
    for (let corner of corners) {
        if (board[corner] === '') return corner;
    }

    // Take any available space
    for (let i = 0; i < 9; i++) {
        if (board[i] === '') return i;
    }

    return -1;
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

    function saveName() {
        const newName = input.value.trim() || currentName;
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
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
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

    localStorage.setItem('theme', newTheme);
}

// Save game data to localStorage
function saveGameData() {
    const data = {
        player1Name,
        player2Name,
        scores
    };
    localStorage.setItem('noughtsAndCrossesData', JSON.stringify(data));
}

// Load game data from localStorage
function loadGameData() {
    const savedData = localStorage.getItem('noughtsAndCrossesData');
    if (savedData) {
        const data = JSON.parse(savedData);
        player1Name = data.player1Name || 'Player 1';
        player2Name = data.player2Name || 'Player 2';
        scores = data.scores || { player1: 0, player2: 0, draws: 0 };

        player1NameEl.textContent = player1Name;
        player2NameEl.textContent = player2Name;
    }

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.body.setAttribute('data-theme', savedTheme);
        const themeIcon = themeToggle.querySelector('.theme-icon');
        themeIcon.textContent = savedTheme === 'light' ? '🌙' : '☀️';
    } else {
        // Default to dark theme
        document.body.setAttribute('data-theme', 'dark');
    }
}

// Initialize the game when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
