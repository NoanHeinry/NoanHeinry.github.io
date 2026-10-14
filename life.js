/* Jeu de la vie de Conway — version jouable, look écran cathodique */
(function () {
    'use strict';

    const win = document.getElementById('life');
    if (!win) return;

    const EN = document.documentElement.lang === 'en';
    const TXT = EN
        ? { play: '▶ Run', pause: '❚❚ Pause' }
        : { play: '▶ Lancer', pause: '❚❚ Pause' };

    const COLS = 64;
    const ROWS = 40;
    const COLORS = { bg: '#031a0b', grid: '#0a3418', cell: '#41ff7f', born: '#c8ffd9' };

    // Motifs classiques (O = cellule vivante)
    const PATTERNS = {
        glider: ['.O.', '..O', 'OOO'],
        lwss: ['.O..O', 'O....', 'O...O', 'OOOO.'],
        pulsar: [
            '..OOO...OOO..', '.............', 'O....O.O....O', 'O....O.O....O',
            'O....O.O....O', '..OOO...OOO..', '.............', '..OOO...OOO..',
            'O....O.O....O', 'O....O.O....O', 'O....O.O....O', '.............',
            '..OOO...OOO..'
        ],
        gun: [
            '........................O...........',
            '......................O.O...........',
            '............OO......OO............OO',
            '...........O...O....OO............OO',
            'OO........O.....O...OO..............',
            'OO........O...O.OO....O.O...........',
            '..........O.....O.......O...........',
            '...........O...O....................',
            '............OO......................'
        ]
    };

    const canvas = win.querySelector('.life-canvas');
    const ctx = canvas.getContext('2d');
    const toggleBtn = win.querySelector('[data-life="toggle"]');
    const genOut = win.querySelector('[data-life-gen]');
    const popOut = win.querySelector('[data-life-pop]');
    const patternSel = win.querySelector('[data-life-pattern]');
    const speedInput = win.querySelector('[data-life-speed]');

    let grid = new Uint8Array(COLS * ROWS);
    let next = new Uint8Array(COLS * ROWS);
    let born = new Uint8Array(COLS * ROWS);
    let running = false;
    let generation = 0;
    let lastTick = 0;
    let rafId = 0;

    const idx = function (x, y) { return y * COLS + x; };

    /* ---------- Simulation ---------- */

    function step() {
        for (let y = 0; y < ROWS; y++) {
            const up = ((y - 1 + ROWS) % ROWS) * COLS;
            const mid = y * COLS;
            const down = ((y + 1) % ROWS) * COLS;
            for (let x = 0; x < COLS; x++) {
                const l = (x - 1 + COLS) % COLS;
                const r = (x + 1) % COLS;
                const n = grid[up + l] + grid[up + x] + grid[up + r] +
                          grid[mid + l] + grid[mid + r] +
                          grid[down + l] + grid[down + x] + grid[down + r];
                const alive = grid[mid + x];
                const live = n === 3 || (alive && n === 2) ? 1 : 0;
                next[mid + x] = live;
                born[mid + x] = live && !alive ? 1 : 0;
            }
        }
        const tmp = grid; grid = next; next = tmp;
        generation++;
    }

    function population() {
        let count = 0;
        for (let i = 0; i < grid.length; i++) count += grid[i];
        return count;
    }

    function clear() {
        grid.fill(0);
        born.fill(0);
        generation = 0;
    }

    function randomize() {
        clear();
        for (let i = 0; i < grid.length; i++) grid[i] = Math.random() < 0.22 ? 1 : 0;
    }

    function place(name) {
        if (name === 'random') { randomize(); return; }
        const rows = PATTERNS[name];
        if (!rows) return;
        clear();
        const h = rows.length;
        const w = rows[0].length;
        const ox = Math.floor((COLS - w) / 2);
        const oy = Math.floor((ROWS - h) / 2);
        rows.forEach(function (row, y) {
            for (let x = 0; x < row.length; x++) {
                if (row[x] === 'O') grid[idx(ox + x, oy + y)] = 1;
            }
        });
    }

    /* ---------- Affichage ---------- */

    let cellSize = 10;

    function resize() {
        const width = canvas.clientWidth;
        if (!width) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        cellSize = width / COLS;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(cellSize * ROWS * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        draw();
    }

    function draw() {
        const w = cellSize * COLS;
        const h = cellSize * ROWS;
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, w, h);

        // Quadrillage discret
        ctx.strokeStyle = COLORS.grid;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 1; x < COLS; x++) {
            const px = Math.round(x * cellSize) + 0.5;
            ctx.moveTo(px, 0); ctx.lineTo(px, h);
        }
        for (let y = 1; y < ROWS; y++) {
            const py = Math.round(y * cellSize) + 0.5;
            ctx.moveTo(0, py); ctx.lineTo(w, py);
        }
        ctx.stroke();

        // Cellules : les nouvelles naissances brillent un peu plus
        const pad = Math.max(1, cellSize * 0.12);
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const i = idx(x, y);
                if (!grid[i]) continue;
                ctx.fillStyle = born[i] ? COLORS.born : COLORS.cell;
                ctx.fillRect(x * cellSize + pad, y * cellSize + pad, cellSize - pad * 2, cellSize - pad * 2);
            }
        }

        genOut.textContent = String(generation).padStart(4, '0');
        popOut.textContent = String(population()).padStart(4, '0');
    }

    /* ---------- Boucle ---------- */

    function interval() {
        return 1000 / Number(speedInput.value || 10);
    }

    function loop(t) {
        if (!running) return;
        if (t - lastTick >= interval()) {
            lastTick = t;
            step();
            draw();
        }
        rafId = requestAnimationFrame(loop);
    }

    function setRunning(on) {
        running = on;
        toggleBtn.textContent = on ? TXT.pause : TXT.play;
        toggleBtn.setAttribute('aria-pressed', String(on));
        win.classList.toggle('life-running', on);
        cancelAnimationFrame(rafId);
        if (on) {
            lastTick = 0;
            rafId = requestAnimationFrame(loop);
        }
    }

    /* ---------- Commandes ---------- */

    win.querySelectorAll('[data-life]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const action = btn.dataset.life;
            if (action === 'toggle') setRunning(!running);
            if (action === 'step') { setRunning(false); step(); draw(); }
            if (action === 'random') { randomize(); draw(); }
            if (action === 'clear') { setRunning(false); clear(); draw(); }
        });
    });

    patternSel.addEventListener('change', function () {
        place(patternSel.value);
        draw();
    });

    // Dessin à la souris ou au doigt
    let painting = false;
    let paintValue = 1;

    function cellAt(e) {
        const r = canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - r.left) / (r.width / COLS));
        const y = Math.floor((e.clientY - r.top) / (r.height / ROWS));
        if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return -1;
        return idx(x, y);
    }

    canvas.addEventListener('pointerdown', function (e) {
        const i = cellAt(e);
        if (i < 0) return;
        painting = true;
        paintValue = grid[i] ? 0 : 1;
        grid[i] = paintValue;
        born[i] = 0;
        canvas.setPointerCapture(e.pointerId);
        draw();
    });

    canvas.addEventListener('pointermove', function (e) {
        if (!painting) return;
        const i = cellAt(e);
        if (i < 0 || grid[i] === paintValue) return;
        grid[i] = paintValue;
        born[i] = 0;
        draw();
    });

    ['pointerup', 'pointercancel'].forEach(function (type) {
        canvas.addEventListener(type, function () { painting = false; });
    });

    // Raccourcis clavier quand la fenêtre a le focus
    win.addEventListener('keydown', function (e) {
        if (e.target.closest('select, input')) return;
        const key = e.key.toLowerCase();
        if (key === ' ') { e.preventDefault(); setRunning(!running); }
        else if (key === 'n') { setRunning(false); step(); draw(); }
        else if (key === 'r') { randomize(); draw(); }
        else if (key === 'c') { setRunning(false); clear(); draw(); }
    });

    // Pause automatique quand la fenêtre se ferme ou que l'onglet est masqué
    new MutationObserver(function () {
        const visible = win.classList.contains('is-open') && !win.classList.contains('is-minimized');
        if (!visible && running) setRunning(false);
        if (visible) requestAnimationFrame(resize);
    }).observe(win, { attributes: true, attributeFilter: ['class'] });

    document.addEventListener('visibilitychange', function () {
        if (document.hidden && running) setRunning(false);
    });

    if ('ResizeObserver' in window) {
        new ResizeObserver(function () { resize(); }).observe(canvas);
    } else {
        window.addEventListener('resize', resize);
    }

    place('gun');
    setRunning(false);
    resize();
})();
