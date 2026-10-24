// Pure game rules and saved-data checks. No DOM access.

export const WINNING_COMBINATIONS = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

const MAX_NAME_LENGTH = 20;
const MAX_STORED_JSON_LENGTH = 10000;
const MAX_SCORE = 1000000;

export function findWinningCombination(board) {
    for (const combination of WINNING_COMBINATIONS) {
        const [a, b, c] = combination;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return combination;
        }
    }
    return null;
}

export function checkDraw(board) {
    return board.every((cell) => cell !== '');
}

export function getRecommendedMove(board, currentPlayer) {
    for (const combination of WINNING_COMBINATIONS) {
        const [a, b, c] = combination;
        if (board[a] === currentPlayer && board[b] === currentPlayer && board[c] === '') return c;
        if (board[a] === currentPlayer && board[c] === currentPlayer && board[b] === '') return b;
        if (board[b] === currentPlayer && board[c] === currentPlayer && board[a] === '') return a;
    }

    const opponent = currentPlayer === 'X' ? 'O' : 'X';
    for (const combination of WINNING_COMBINATIONS) {
        const [a, b, c] = combination;
        if (board[a] === opponent && board[b] === opponent && board[c] === '') return c;
        if (board[a] === opponent && board[c] === opponent && board[b] === '') return b;
        if (board[b] === opponent && board[c] === opponent && board[a] === '') return a;
    }

    if (board[4] === '') return 4;

    const corners = [0, 2, 6, 8];
    for (const corner of corners) {
        if (board[corner] === '') return corner;
    }

    for (let i = 0; i < 9; i++) {
        if (board[i] === '') return i;
    }

    return -1;
}

export function sanitizeName(value, fallback) {
    if (typeof value !== 'string') return fallback;
    const cleaned = value.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, MAX_NAME_LENGTH);
    return cleaned || fallback;
}

export function sanitizeScore(value) {
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > MAX_SCORE) {
        return 0;
    }
    return value;
}

export function sanitizeTheme(value) {
    return value === 'light' || value === 'dark' ? value : 'dark';
}

export function parseStoredGame(raw) {
    if (typeof raw !== 'string' || raw.length === 0 || raw.length > MAX_STORED_JSON_LENGTH) {
        return null;
    }

    let data;
    try {
        data = JSON.parse(raw);
    } catch {
        return null;
    }

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return null;
    }

    const scores = data.scores && typeof data.scores === 'object' && !Array.isArray(data.scores)
        ? data.scores
        : {};

    return {
        player1Name: sanitizeName(data.player1Name, 'Player 1'),
        player2Name: sanitizeName(data.player2Name, 'Player 2'),
        scores: {
            player1: sanitizeScore(scores.player1),
            player2: sanitizeScore(scores.player2),
            draws: sanitizeScore(scores.draws)
        }
    };
}
