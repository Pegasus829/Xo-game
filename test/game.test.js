import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import {
    checkDraw,
    findWinningCombination,
    getRecommendedMove,
    parseStoredGame,
    sanitizeName,
    sanitizeScore,
    sanitizeTheme
} from '../game.js';

const emptyBoard = () => ['', '', '', '', '', '', '', '', ''];

test('detects every winning line and ignores a partial line', () => {
    const rows = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6]
    ];

    for (const line of rows) {
        const board = emptyBoard();
        for (const index of line) board[index] = 'X';
        assert.deepEqual(findWinningCombination(board), line);
    }

    const board = emptyBoard();
    board[0] = 'X';
    board[1] = 'X';
    board[2] = 'O';
    assert.equal(findWinningCombination(board), null);
});

test('draw requires every cell to be filled', () => {
    assert.equal(checkDraw(['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X']), true);
    const board = emptyBoard();
    board[0] = 'X';
    assert.equal(checkDraw(board), false);
});

test('recommendation prefers a win, then a block, then center and corners', () => {
    const win = emptyBoard();
    win[0] = 'X';
    win[1] = 'X';
    assert.equal(getRecommendedMove(win, 'X'), 2);

    const block = emptyBoard();
    block[0] = 'O';
    block[1] = 'O';
    assert.equal(getRecommendedMove(block, 'X'), 2);

    assert.equal(getRecommendedMove(emptyBoard(), 'X'), 4);

    const centerTaken = emptyBoard();
    centerTaken[4] = 'O';
    assert.equal(getRecommendedMove(centerTaken, 'X'), 0);

    assert.equal(getRecommendedMove(['X', 'O', 'X', 'O', 'X', 'O', 'O', 'X', 'X'], 'O'), -1);
});

test('stored names stay strings with a length cap and control characters removed', () => {
    assert.equal(sanitizeName('  Ada  ', 'Player 1'), 'Ada');
    assert.equal(sanitizeName('A'.repeat(30), 'Player 1').length, 20);
    assert.equal(sanitizeName('Ann\u0000a\nb', 'Player 1'), 'Annab');
    assert.equal(sanitizeName('   ', 'Player 1'), 'Player 1');
    assert.equal(sanitizeName(12, 'Player 1'), 'Player 1');
    assert.equal(sanitizeName({ toString: () => 'nope' }, 'Player 1'), 'Player 1');
});

test('stored scores accept only safe integers', () => {
    assert.equal(sanitizeScore(3), 3);
    assert.equal(sanitizeScore(0), 0);
    assert.equal(sanitizeScore(-1), 0);
    assert.equal(sanitizeScore(1.5), 0);
    assert.equal(sanitizeScore('3'), 0);
    assert.equal(sanitizeScore(1000001), 0);
    assert.equal(sanitizeScore(Number.NaN), 0);
});

test('theme is only light or dark', () => {
    assert.equal(sanitizeTheme('light'), 'light');
    assert.equal(sanitizeTheme('dark'), 'dark');
    assert.equal(sanitizeTheme('"><script>'), 'dark');
    assert.equal(sanitizeTheme(null), 'dark');
});

test('corrupt saved games are ignored and valid ones are narrowed', () => {
    assert.equal(parseStoredGame('{'), null);
    assert.equal(parseStoredGame('[]'), null);
    assert.equal(parseStoredGame('null'), null);
    assert.equal(parseStoredGame(''), null);
    assert.equal(parseStoredGame('x'.repeat(10001)), null);

    const parsed = parseStoredGame(JSON.stringify({
        player1Name: '<img src=x onerror=alert(1)>',
        player2Name: 5,
        scores: { player1: 2, player2: '9', draws: -4 }
    }));

    assert.deepEqual(parsed, {
        player1Name: '<img src=x onerror=a',
        player2Name: 'Player 2',
        scores: { player1: 2, player2: 0, draws: 0 }
    });
});

test('the page keeps a strict CSP and does not inject HTML', async () => {
    const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
    const script = await readFile(new URL('../script.js', import.meta.url), 'utf8');

    assert.match(html, /http-equiv="Content-Security-Policy"/);
    assert.match(html, /script-src 'self'/);
    assert.match(html, /style-src 'self'/);
    assert.match(html, /object-src 'none'/);
    assert.doesNotMatch(html, /unsafe-inline|unsafe-eval|frame-ancestors/);
    assert.match(html, /<script type="module" src="script\.js"><\/script>/);
    assert.equal(html.includes('<script>') || html.includes('onclick='), false);

    for (const sink of ['innerHTML', 'outerHTML', 'insertAdjacentHTML', 'document.write', 'eval(']) {
        assert.equal(script.includes(sink), false, sink);
    }
    assert.match(script, /textContent/);
});

test('workflow pins actions to commit SHAs and deploy waits for ci', async () => {
    const yml = await readFile(new URL('../.github/workflows/deploy.yml', import.meta.url), 'utf8');
    const uses = [...yml.matchAll(/^\s*uses:\s*(\S+)/gm)].map((match) => match[1]);

    assert.ok(uses.length >= 5);
    for (const use of uses) {
        assert.match(use, /^[\w.-]+\/[\w.-]+@[0-9a-f]{40}$/);
    }

    assert.match(yml, /^name:\s*ci\s*$/m);
    assert.match(yml, /^\s*name:\s*ci\s*$/m);
    assert.match(yml, /needs:\s*ci/);
    assert.match(yml, /npm run build/);
    assert.match(yml, /npm test/);
    assert.match(yml, /npm audit/);
    assert.match(yml, /gitleaks detect/);
    assert.match(yml, /path:\s*dist/);

    const deployBlock = yml.slice(yml.indexOf('deploy:'));
    const ciBlock = yml.slice(yml.indexOf('\n  ci:'), yml.indexOf('\n  deploy:'));
    assert.match(deployBlock, /pages:\s*write/);
    assert.match(deployBlock, /id-token:\s*write/);
    assert.doesNotMatch(ciBlock, /pages:\s*write/);
    assert.doesNotMatch(ciBlock, /id-token:\s*write/);
});
