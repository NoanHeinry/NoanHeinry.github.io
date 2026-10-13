/* NoanOS — scripts communs aux versions FR et EN */
(function () {
    'use strict';

    const LANG = document.documentElement.lang === 'en' ? 'en' : 'fr';
    const LOCALE = LANG === 'en' ? 'en-GB' : 'fr-FR';
    const TXT = {
        fr: {
            noResult: 'Aucun résultat',
            boot: ['Démarrage de NoanOS v3.0', 'Chargement du profil… ok', 'Montage des projets… ok', 'Connexion au réseau… ok', 'Bienvenue.'],
            restore: 'Restaurer', maximize: 'Agrandir'
        },
        en: {
            noResult: 'No result',
            boot: ['Booting NoanOS v3.0', 'Loading profile… ok', 'Mounting projects… ok', 'Connecting to network… ok', 'Welcome.'],
            restore: 'Restore', maximize: 'Maximize'
        }
    }[LANG];

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobileQuery = window.matchMedia('(max-width: 768px)');
    const isMobile = function () { return mobileQuery.matches; };

    const storage = {
        get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
        set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* stockage indisponible */ } }
    };

    const initialHash = location.hash;
    const windows = Array.prototype.slice.call(document.querySelectorAll('.window'));
    const taskbar = document.querySelector('.taskbar');
    let zTop = 20;

    /* ---------- OUTILS ---------- */

    function windowIdFrom(el) {
        const m = (el.getAttribute('onclick') || '').match(/openWindow\('([^']+)'\)/);
        return m ? m[1] : (el.dataset.open || null);
    }

    function taskButtonsFor(id) {
        return document.querySelectorAll('.task-btn[data-window="' + id + '"]');
    }

    function taskbarHeight() {
        return taskbar ? taskbar.getBoundingClientRect().height : 0;
    }

    function setHash(id) {
        if (!window.history || !history.replaceState) return;
        const url = location.pathname + location.search + (id ? '#' + id : '');
        try { history.replaceState(null, '', url); } catch (e) { /* file:// */ }
    }

    function isOpen(win) { return win.classList.contains('is-open'); }
    function isVisible(win) { return isOpen(win) && !win.classList.contains('is-minimized'); }

    function topVisibleWindow() {
        let best = null;
        windows.forEach(function (w) {
            if (isVisible(w) && (!best || (+w.style.zIndex || 0) > (+best.style.zIndex || 0))) best = w;
        });
        return best;
    }

    function syncTaskbar() {
        const top = topVisibleWindow();
        windows.forEach(function (w) {
            taskButtonsFor(w.id).forEach(function (b) {
                b.classList.toggle('is-open', isOpen(w));
                b.classList.toggle('is-active', w === top);
                if (w === top) b.setAttribute('aria-current', 'true');
                else b.removeAttribute('aria-current');
            });
            w.classList.toggle('is-focused', w === top);
        });
        setHash(top ? top.id : '');
    }

    /* ---------- ANIMATIONS (Web Animations API) ---------- */

    function animate(el, frames, opts) {
        if (reduceMotion || !el.animate) return Promise.resolve();
        const a = el.animate(frames, Object.assign({ duration: 260, easing: 'cubic-bezier(.2,.8,.2,1)' }, opts));
        return a.finished.catch(function () {});
    }

    // Déplacement relatif d'un point (origine) par rapport au centre de la fenêtre
    function offsetFrom(win, originEl) {
        if (!originEl || !originEl.getBoundingClientRect) return null;
        const o = originEl.getBoundingClientRect();
        const w = win.getBoundingClientRect();
        if (!o.width && !o.height) return null;
        return {
            x: (o.left + o.width / 2) - (w.left + w.width / 2),
            y: (o.top + o.height / 2) - (w.top + w.height / 2)
        };
    }

    function zoomFrames(off, scale) {
        const from = off
            ? 'translate(' + off.x + 'px,' + off.y + 'px) scale(' + scale + ')'
            : 'translateY(16px) scale(.96)';
        return [{ transform: from, opacity: 0 }, { transform: 'none', opacity: 1 }];
    }

    function sheetFrames() {
        return [{ transform: 'translateY(100%)', opacity: 1 }, { transform: 'none', opacity: 1 }];
    }

    /* ---------- POSITIONNEMENT ---------- */

    function centerWindow(win) {
        if (isMobile() || win.classList.contains('is-max')) return;
        const vw = window.innerWidth;
        const vh = window.innerHeight - taskbarHeight();
        const r = win.getBoundingClientRect();
        // Petit décalage en cascade quand plusieurs fenêtres sont ouvertes
        const openCount = windows.filter(function (w) { return isVisible(w) && w !== win; }).length;
        const shift = Math.min(openCount, 4) * 28;
        const left = Math.max(8, Math.min((vw - r.width) / 2 + shift, vw - r.width - 8));
        const top = Math.max(8, Math.min((vh - r.height) / 2 + shift, vh - r.height - 8));
        win.style.left = Math.round(left) + 'px';
        win.style.top = Math.round(top) + 'px';
    }

    function clampWindow(win) {
        if (isMobile() || win.classList.contains('is-max') || !isVisible(win)) return;
        const r = win.getBoundingClientRect();
        const maxL = window.innerWidth - Math.min(r.width, 120);
        const maxT = window.innerHeight - taskbarHeight() - 40;
        win.style.left = Math.round(Math.max(Math.min(r.width, 120) - r.width, Math.min(r.left, maxL))) + 'px';
        win.style.top = Math.round(Math.max(0, Math.min(r.top, maxT))) + 'px';
    }

    /* ---------- GESTION DES FENÊTRES ---------- */

    function focusWindow(win) {
        if (!win) return;
        zTop += 1;
        win.style.zIndex = zTop;
        syncTaskbar();
    }

    function openWindow(id, originEl) {
        const win = document.getElementById(id);
        if (!win) return;
        closeStartMenu();
        originEl = originEl || (window.event && window.event.currentTarget) || null;
        if (originEl === window || originEl === document) originEl = null;

        if (isOpen(win) && !win.classList.contains('is-minimized')) {
            focusWindow(win);
            return;
        }

        const wasMinimized = win.classList.contains('is-minimized');
        win.classList.add('is-open');
        win.classList.remove('is-minimized');
        win.style.display = 'flex';
        if (!wasMinimized) {
            const content = win.querySelector('.window-content');
            if (content) content.scrollTop = 0;
            centerWindow(win);
        }
        focusWindow(win);

        if (isMobile()) {
            animate(win, sheetFrames(), { duration: 320 });
        } else {
            const origin = wasMinimized ? taskButtonsFor(id)[0] : originEl;
            animate(win, zoomFrames(offsetFrom(win, origin), 0.15), { duration: 320 });
        }

        const closeBtn = win.querySelector('.close-btn');
        if (closeBtn && !isMobile()) closeBtn.focus({ preventScroll: true });
        else if (closeBtn) win.focus({ preventScroll: true });
    }

    function hideWindow(win, frames, after) {
        win.classList.add('is-leaving');
        animate(win, frames, { duration: 200, easing: 'cubic-bezier(.4,0,1,1)' }).then(function () {
            win.classList.remove('is-leaving');
            after();
            syncTaskbar();
            const next = topVisibleWindow();
            if (next) {
                const btn = next.querySelector('.close-btn');
                if (btn) btn.focus({ preventScroll: true });
            }
        });
    }

    function closeWindow(id) {
        const win = document.getElementById(id);
        if (!win || !isOpen(win)) return;
        const frames = isMobile()
            ? [{ transform: 'none' }, { transform: 'translateY(100%)' }]
            : [{ transform: 'none', opacity: 1 }, { transform: 'scale(.96)', opacity: 0 }];
        win.classList.remove('is-open');
        hideWindow(win, frames, function () {
            if (!isOpen(win)) {
                win.style.display = 'none';
                win.classList.remove('is-max', 'is-minimized');
                updateMaxButton(win);
            }
        });
    }

    function minimizeWindow(id) {
        const win = document.getElementById(id);
        if (!win || !isVisible(win)) return;
        const btn = taskButtonsFor(id)[0];
        const off = offsetFrom(win, btn);
        const frames = off && !isMobile()
            ? [{ transform: 'none', opacity: 1 }, { transform: 'translate(' + off.x + 'px,' + off.y + 'px) scale(.1)', opacity: 0 }]
            : [{ transform: 'none' }, { transform: 'translateY(100%)' }];
        win.classList.add('is-minimized');
        hideWindow(win, frames, function () {
            if (win.classList.contains('is-minimized')) win.style.display = 'none';
        });
    }

    function updateMaxButton(win) {
        const btn = win.querySelector('[data-action="maximize"]');
        if (!btn) return;
        const max = win.classList.contains('is-max');
        btn.setAttribute('aria-label', max ? TXT.restore : TXT.maximize);
        btn.setAttribute('aria-pressed', String(max));
    }

    function toggleMaximize(id) {
        const win = document.getElementById(id);
        if (!win || isMobile()) return;
        const before = win.getBoundingClientRect();
        win.classList.toggle('is-max');
        if (!win.classList.contains('is-max')) clampWindow(win);
        updateMaxButton(win);
        focusWindow(win);
        // Transition fluide entre les deux tailles (technique FLIP)
        const after = win.getBoundingClientRect();
        if (after.width && after.height) {
            animate(win, [{
                transformOrigin: 'top left',
                transform: 'translate(' + (before.left - after.left) + 'px,' + (before.top - after.top) + 'px) scale(' +
                    (before.width / after.width) + ',' + (before.height / after.height) + ')'
            }, { transformOrigin: 'top left', transform: 'none' }], { duration: 240 });
        }
    }

    // Exposées pour les attributs onclick existants
    window.openWindow = openWindow;
    window.closeWindow = closeWindow;

    windows.forEach(function (win) {
        win.setAttribute('tabindex', '-1');
        win.addEventListener('pointerdown', function () {
            if (win !== topVisibleWindow()) focusWindow(win);
        });
        win.querySelectorAll('[data-action]').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                if (btn.dataset.action === 'minimize') minimizeWindow(win.id);
                if (btn.dataset.action === 'maximize') toggleMaximize(win.id);
            });
        });

        // Déplacement par la barre de titre
        const bar = win.querySelector('.title-bar');
        if (!bar) return;
        bar.addEventListener('dblclick', function (e) {
            if (!e.target.closest('button')) toggleMaximize(win.id);
        });
        bar.addEventListener('pointerdown', function (e) {
            if (e.button !== 0 || e.target.closest('button') || isMobile() || win.classList.contains('is-max')) return;
            const r = win.getBoundingClientRect();
            const dx = e.clientX - r.left;
            const dy = e.clientY - r.top;
            let moved = false;
            bar.setPointerCapture(e.pointerId);
            function move(ev) {
                if (!moved) { moved = true; win.classList.add('is-dragging'); }
                const maxT = window.innerHeight - taskbarHeight() - 40;
                const left = Math.min(Math.max(ev.clientX - dx, 120 - r.width), window.innerWidth - 120);
                const top = Math.min(Math.max(ev.clientY - dy, 0), maxT);
                win.style.left = Math.round(left) + 'px';
                win.style.top = Math.round(top) + 'px';
            }
            function up() {
                win.classList.remove('is-dragging');
                bar.removeEventListener('pointermove', move);
                bar.removeEventListener('pointerup', up);
                bar.removeEventListener('pointercancel', up);
            }
            bar.addEventListener('pointermove', move);
            bar.addEventListener('pointerup', up);
            bar.addEventListener('pointercancel', up);
        });
    });

    window.addEventListener('resize', function () { windows.forEach(clampWindow); });

    // Barre des tâches : identifier chaque bouton, réduire la fenêtre active au clic
    document.querySelectorAll('.task-btn').forEach(function (btn) {
        const id = windowIdFrom(btn);
        if (!id) return;
        btn.dataset.window = id;
        btn.removeAttribute('onclick');
        btn.addEventListener('click', function () {
            const win = document.getElementById(id);
            if (win && win === topVisibleWindow()) minimizeWindow(id);
            else openWindow(id, btn);
        });
    });

    // Icônes du bureau : clic, Entrée / Espace
    document.querySelectorAll('.desktop-icons .icon').forEach(function (icon) {
        const id = windowIdFrom(icon);
        icon.dataset.window = id;
        icon.removeAttribute('onclick');
        icon.addEventListener('click', function () { openWindow(id, icon); });
        icon.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openWindow(id, icon);
            }
        });
    });

    /* ---------- MENU DÉMARRER ---------- */

    const startBtn = document.querySelector('.start-btn');
    const startMenu = document.getElementById('start-menu');
    const startApps = document.getElementById('start-apps');

    if (startApps) {
        document.querySelectorAll('.desktop-icons .icon').forEach(function (icon) {
            const id = icon.dataset.window || '';
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'start-app';
            b.innerHTML = icon.querySelector('.icon-img').innerHTML;
            const label = document.createElement('span');
            label.textContent = icon.textContent.trim();
            b.appendChild(label);
            b.addEventListener('click', function () { openWindow(id, startBtn); });
            startApps.appendChild(b);
        });
    }

    function openStartMenu() {
        if (!startMenu) return;
        startMenu.hidden = false;
        startBtn.setAttribute('aria-expanded', 'true');
        animate(startMenu, [{ transform: 'translateY(12px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 220 });
        const first = startMenu.querySelector('button, a');
        if (first) first.focus({ preventScroll: true });
    }

    function closeStartMenu() {
        if (!startMenu || startMenu.hidden) return;
        startMenu.hidden = true;
        startBtn.setAttribute('aria-expanded', 'false');
    }

    if (startBtn && startMenu) {
        startBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (startMenu.hidden) openStartMenu(); else closeStartMenu();
        });
        document.addEventListener('pointerdown', function (e) {
            if (!startMenu.hidden && !startMenu.contains(e.target) && !startBtn.contains(e.target)) closeStartMenu();
        });
    }

    /* ---------- HORLOGE ---------- */

    const taskClock = document.getElementById('clock');
    const widgetTime = document.getElementById('widget-time');
    const widgetDate = document.getElementById('widget-date');
    let lastMinute = '';

    function updateClock() {
        const now = new Date();
        const timeString = now.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' });
        if (timeString === lastMinute) return;
        lastMinute = timeString;
        const dateString = now.toLocaleDateString(LOCALE, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        if (taskClock) taskClock.textContent = timeString;
        if (widgetTime) widgetTime.textContent = timeString;
        if (widgetDate) widgetDate.textContent = dateString.charAt(0).toUpperCase() + dateString.slice(1);
    }
    updateClock();
    setInterval(updateClock, 1000);

    /* ---------- CHANGEMENT DE LANGUE ---------- */

    const langToggle = document.getElementById('lang-toggle');
    if (langToggle) {
        langToggle.addEventListener('change', function () {
            const target = langToggle.dataset.href;
            if (target) window.location.href = target + location.hash;
        });
        window.addEventListener('pageshow', function () {
            langToggle.checked = langToggle.defaultChecked;
        });
    }
    document.querySelectorAll('[data-lang-link]').forEach(function (a) {
        a.addEventListener('click', function () {
            a.href = a.getAttribute('href').split('#')[0] + location.hash;
        });
    });

    /* ---------- FOND : HALO QUI SUIT LA SOURIS ---------- */

    const desktop = document.querySelector('.desktop');
    if (desktop && !reduceMotion && window.matchMedia('(pointer: fine)').matches) {
        let raf = 0, px = 50, py = 50;
        window.addEventListener('pointermove', function (e) {
            px = (e.clientX / window.innerWidth) * 100;
            py = (e.clientY / window.innerHeight) * 100;
            if (raf) return;
            raf = requestAnimationFrame(function () {
                raf = 0;
                desktop.style.setProperty('--mx', px.toFixed(1) + '%');
                desktop.style.setProperty('--my', py.toFixed(1) + '%');
            });
        }, { passive: true });
    }

    /* ---------- TERMINAL DU WIDGET ---------- */

    function typeWidgetLines() {
        const lines = document.querySelectorAll('.typewriter-container p');
        lines.forEach(function (p, i) {
            p.style.setProperty('--chars', p.textContent.length);
            p.style.animationDelay = (i * 0.75) + 's';
            p.classList.add('typed');
        });
    }

    /* ---------- DÉMARRAGE ---------- */

    const boot = document.getElementById('boot');

    function finishBoot() {
        document.body.classList.remove('is-booting');
        document.body.classList.add('is-ready');
        typeWidgetLines();
        if (boot && !boot.hidden) {
            animate(boot, [{ opacity: 1 }, { opacity: 0 }], { duration: 350 }).then(function () { boot.hidden = true; });
        }
        openWindowFromHash();
    }

    function runBoot() {
        if (!boot || reduceMotion || storage.get('noanos-booted')) {
            if (boot) boot.hidden = true;
            finishBoot();
            return;
        }
        storage.set('noanos-booted', '1');
        document.body.classList.add('is-booting');
        boot.hidden = false;
        const log = document.getElementById('boot-log');
        let i = 0, done = false, timer = 0;
        function skip() {
            if (done) return;
            done = true;
            clearTimeout(timer);
            window.removeEventListener('keydown', skip);
            boot.removeEventListener('pointerdown', skip);
            finishBoot();
        }
        function next() {
            if (done) return;
            if (i < TXT.boot.length) {
                const line = document.createElement('p');
                line.textContent = '> ' + TXT.boot[i++];
                log.appendChild(line);
                timer = setTimeout(next, 260);
            } else {
                timer = setTimeout(skip, 300);
            }
        }
        window.addEventListener('keydown', skip);
        boot.addEventListener('pointerdown', skip);
        next();
    }

    /* ---------- RECHERCHE (CTRL + K) ---------- */

    const searchBar = document.querySelector('.search-bar');
    const searchInput = searchBar && searchBar.querySelector('input');
    const results = document.getElementById('search-results');

    function normalize(str) {
        return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
    }

    function buildIndex() {
        const entries = [];
        const seen = new Set();
        const windowTitles = {};

        document.querySelectorAll('.desktop-icons .icon').forEach(function (icon) {
            const id = icon.dataset.window;
            if (id) windowTitles[id] = icon.textContent.trim();
        });

        function add(label, win, extra) {
            label = (label || '').replace(/\s+/g, ' ').trim();
            if (!label || !document.getElementById(win)) return;
            const key = win + '|' + label;
            if (seen.has(key)) return;
            seen.add(key);
            entries.push({
                label: label,
                win: win,
                section: windowTitles[win] || win,
                haystack: normalize(label + ' ' + (extra || '') + ' ' + (windowTitles[win] || ''))
            });
        }

        // Mots-clés supplémentaires (FR + EN) pour retrouver chaque fenêtre
        const aliases = {
            about: 'cv resume profil profile qualites interets',
            projects: 'projet project portfolio pdf',
            stage: 'stage internship r2 agence agency entreprise company experience wordpress react spot yao alternance',
            skills: 'competences skills langages languages outils tools',
            'but-info': 'but iut diplome degree competences ac apprentissages',
            contact: 'contact email mail linkedin github message'
        };
        Object.keys(windowTitles).forEach(function (win) { add(windowTitles[win], win, aliases[win]); });

        const rules = [
            ['#projects .project-item', 'projects', 'h3', 'p'],
            ['#stage .stage-mission', 'stage', 'h3', 'p'],
            ['#skills .skill-card', 'skills', 'span', ''],
            ['#skills .skill-category', 'skills', 'h3', ''],
            ['#but-info .but-section', 'but-info', 'h3', '.but-subtitle'],
            ['#contact .action-card', 'contact', '.action-title', '.action-desc'],
            ['#about h3', 'about', null, '']
        ];
        rules.forEach(function (r) {
            document.querySelectorAll(r[0]).forEach(function (el) {
                const labelEl = r[2] ? el.querySelector(r[2]) : el;
                const extraEl = r[3] ? el.querySelector(r[3]) : null;
                add(labelEl && labelEl.textContent, r[1], extraEl && extraEl.textContent);
            });
        });
        return entries;
    }

    if (searchBar && searchInput && results) {
        const index = buildIndex();
        let matches = [];
        let active = -1;

        searchInput.disabled = false;

        function render() {
            results.innerHTML = '';
            if (!matches.length) {
                if (searchInput.value.trim()) {
                    const li = document.createElement('li');
                    li.className = 'search-empty';
                    li.textContent = TXT.noResult;
                    results.appendChild(li);
                    results.hidden = false;
                } else {
                    results.hidden = true;
                }
                searchInput.setAttribute('aria-expanded', String(!results.hidden));
                return;
            }
            matches.forEach(function (m, i) {
                const li = document.createElement('li');
                li.id = 'search-opt-' + i;
                li.setAttribute('role', 'option');
                li.setAttribute('aria-selected', String(i === active));
                if (i === active) li.classList.add('active');
                const label = document.createElement('span');
                label.textContent = m.label;
                const section = document.createElement('small');
                section.textContent = m.section;
                li.appendChild(label);
                li.appendChild(section);
                li.addEventListener('mousedown', function (e) {
                    e.preventDefault();
                    choose(i);
                });
                results.appendChild(li);
            });
            results.hidden = false;
            searchInput.setAttribute('aria-expanded', 'true');
            if (active >= 0) searchInput.setAttribute('aria-activedescendant', 'search-opt-' + active);
            else searchInput.removeAttribute('aria-activedescendant');
        }

        function search() {
            const q = normalize(searchInput.value);
            active = -1;
            if (!q) { matches = []; render(); return; }
            const terms = q.split(/\s+/);
            matches = index
                .filter(function (e) { return terms.every(function (t) { return e.haystack.indexOf(t) !== -1; }); })
                .sort(function (a, b) {
                    const sa = normalize(a.label).indexOf(q) === 0 ? 0 : 1;
                    const sb = normalize(b.label).indexOf(q) === 0 ? 0 : 1;
                    return sa - sb;
                })
                .slice(0, 6);
            if (matches.length) active = 0;
            render();
        }

        function hide() {
            results.hidden = true;
            searchInput.setAttribute('aria-expanded', 'false');
        }

        function choose(i) {
            const m = matches[i];
            if (!m) return;
            hide();
            searchInput.value = '';
            matches = [];
            searchInput.blur();
            openWindow(m.win, searchBar);
            const win = document.getElementById(m.win);
            const target = Array.prototype.find.call(
                win.querySelectorAll('h2, h3, .skill-card span, .action-title'),
                function (el) { return el.textContent.replace(/\s+/g, ' ').trim() === m.label; }
            );
            if (target) {
                const block = target.closest('.skill-card, .project-item, .stage-mission, .but-section, .action-card, .skill-category') || target;
                setTimeout(function () {
                    block.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
                    block.classList.remove('search-hit');
                    void block.offsetWidth;
                    block.classList.add('search-hit');
                }, 200);
            }
        }

        searchInput.addEventListener('input', search);
        searchInput.addEventListener('focus', function () { if (searchInput.value) search(); });
        searchInput.addEventListener('blur', hide);
        searchInput.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowDown' && matches.length) {
                e.preventDefault();
                active = (active + 1) % matches.length;
                render();
            } else if (e.key === 'ArrowUp' && matches.length) {
                e.preventDefault();
                active = (active - 1 + matches.length) % matches.length;
                render();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                choose(active >= 0 ? active : 0);
            } else if (e.key === 'Escape') {
                searchInput.value = '';
                matches = [];
                hide();
                searchInput.blur();
                e.stopPropagation();
            }
        });
    }

    /* ---------- RACCOURCIS CLAVIER ---------- */

    document.addEventListener('keydown', function (e) {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            if (searchInput) {
                e.preventDefault();
                closeStartMenu();
                windows.forEach(function (w) { if (isVisible(w)) minimizeWindow(w.id); });
                searchInput.focus();
                searchInput.select();
            }
        } else if (e.key === 'Escape') {
            if (startMenu && !startMenu.hidden) {
                closeStartMenu();
                startBtn.focus();
                return;
            }
            const top = topVisibleWindow();
            if (top) closeWindow(top.id);
        }
    });

    function openWindowFromHash() {
        const id = decodeURIComponent((location.hash || initialHash).slice(1));
        const win = id && document.getElementById(id);
        if (win && win.classList.contains('window')) openWindow(id, null);
    }
    window.addEventListener('hashchange', openWindowFromHash);

    runBoot();
})();
