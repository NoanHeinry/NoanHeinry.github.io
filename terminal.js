/* NoanOS — fenêtre Terminal : quelques commandes pour parcourir le portfolio au clavier */
(function () {
    'use strict';

    const win = document.getElementById('terminal');
    if (!win) return;

    const EN = document.documentElement.lang === 'en';
    const out = win.querySelector('.term-output');
    const form = win.querySelector('.term-line');
    const input = win.querySelector('.term-input');
    const CV = EN ? 'documents/CV_Noan_EN.pdf' : 'documents/CV_Noan_HEINRY.pdf';
    const OTHER_LANG = EN ? 'index.html' : 'index_en.html';

    // Fenêtres ouvrables, avec leurs alias FR et EN
    const APPS = {
        summary: ['summary', 'resume', 'résumé'],
        about: ['about', 'apropos', 'info'],
        projects: ['projects', 'projets', 'projet', 'project'],
        stage: ['stage', 'internship'],
        skills: ['skills', 'competences', 'compétences'],
        'but-info': ['but', 'but-info', 'degree'],
        contact: ['contact'],
        life: ['life', 'vie', 'jeu-de-la-vie', 'gameoflife']
    };

    const T = EN ? {
        welcome: 'NoanOS 3.0 terminal. Type help to list the commands.',
        help: [
            ['help', 'list the commands'],
            ['whoami', 'who I am, in one sentence'],
            ['ls', 'list the apps you can open'],
            ['open <app>', 'open an app (or just type its name)'],
            ['cv', 'download my resume'],
            ['contact', 'email, LinkedIn and GitHub'],
            ['neofetch', 'system information'],
            ['date', 'current date and time'],
            ['echo <text>', 'print some text'],
            ['history', 'previous commands'],
            ['lang', 'switch to French'],
            ['clear', 'clear the screen'],
            ['exit', 'close the terminal']
        ],
        whoami: 'Noan Heinry, third-year Computer Science student (BUT) at IUT de Laval, looking for a 12 to 16 week internship from March 22nd, 2027 in Rennes, Laval or nearby.',
        apps: 'Apps:',
        ls: ['summary', 'about', 'projects', 'internship', 'skills', 'degree', 'contact', 'life'],
        opening: 'Opening ',
        unknownApp: 'unknown app: ',
        notFound: 'command not found: ',
        tryHelp: '. Type help.',
        cv: 'Resume: ',
        sudo: 'Permission denied. Try contact instead, it works better.',
        empty: 'nothing yet',
        info: [['OS', 'NoanOS 3.0'], ['Host', 'GitHub Pages'], ['User', 'Noan Heinry'], ['Degree', 'BUT Informatique, 3rd year'],
            ['Stack', 'PHP · JavaScript · React · Python · Java · SQL'], ['Internship', 'from March 22nd, 2027'], ['Location', 'Rennes · Laval'], ['Status', 'open to opportunities']]
    } : {
        welcome: 'Terminal NoanOS 3.0. Tapez help pour voir les commandes.',
        help: [
            ['help', 'liste des commandes'],
            ['whoami', 'qui je suis, en une phrase'],
            ['ls', 'liste des applications'],
            ['open <app>', 'ouvrir une application (ou tapez juste son nom)'],
            ['cv', 'télécharger mon CV'],
            ['contact', 'e-mail, LinkedIn et GitHub'],
            ['neofetch', 'informations système'],
            ['date', 'date et heure'],
            ['echo <texte>', 'afficher un texte'],
            ['history', 'commandes précédentes'],
            ['lang', 'passer en anglais'],
            ['clear', 'effacer l’écran'],
            ['exit', 'fermer le terminal']
        ],
        whoami: 'Noan Heinry, étudiant en 3e année de BUT Informatique à l’IUT de Laval, à la recherche d’un stage de 12 à 16 semaines dès le 22 mars 2027 à Rennes, à Laval ou dans les alentours.',
        apps: 'Applications :',
        ls: ['resume', 'apropos', 'projets', 'stage', 'competences', 'but', 'contact', 'vie'],
        opening: 'Ouverture de ',
        unknownApp: 'application inconnue : ',
        notFound: 'commande introuvable : ',
        tryHelp: '. Tapez help.',
        cv: 'CV : ',
        sudo: 'Permission refusée. Essayez plutôt contact, ça marche mieux.',
        empty: 'rien pour l’instant',
        info: [['OS', 'NoanOS 3.0'], ['Hôte', 'GitHub Pages'], ['Utilisateur', 'Noan Heinry'], ['Formation', 'BUT Informatique, 3e année'],
            ['Stack', 'PHP · JavaScript · React · Python · Java · SQL'], ['Stage', 'dès le 22 mars 2027'], ['Lieu', 'Rennes · Laval'], ['Statut', 'ouvert aux opportunités']]
    };

    const history = [];
    let cursor = 0;

    /* ---------- Affichage ---------- */

    function line(cls) {
        const p = document.createElement('div');
        p.className = 'term-row' + (cls ? ' ' + cls : '');
        out.appendChild(p);
        return p;
    }

    function print(text, cls) {
        line(cls).textContent = text;
    }

    function link(label, href, external) {
        const a = document.createElement('a');
        a.href = href;
        a.textContent = label;
        if (external) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
        return a;
    }

    function printPairs(pairs, keyCls) {
        const width = Math.max.apply(null, pairs.map(function (p) { return p[0].length; })) + 2;
        pairs.forEach(function (p) {
            const row = line();
            const k = document.createElement('span');
            k.className = keyCls;
            k.textContent = p[0].padEnd(width, ' ');
            row.appendChild(k);
            row.appendChild(document.createTextNode(p[1]));
        });
    }

    function scrollDown() {
        const content = win.querySelector('.window-content');
        content.scrollTop = content.scrollHeight;
    }

    function findApp(name) {
        const n = (name || '').toLowerCase();
        return Object.keys(APPS).find(function (id) { return APPS[id].indexOf(n) !== -1; });
    }

    /* ---------- Commandes ---------- */

    const COMMANDS = {
        help: function () { printPairs(T.help, 'term-key'); },
        whoami: function () { print(T.whoami); },
        ls: function () {
            print(T.apps, 'term-muted');
            print(T.ls.join('   '), 'term-key');
        },
        open: function (args) {
            const id = findApp(args[0]);
            if (!id) { print(T.unknownApp + (args[0] || ''), 'term-error'); return; }
            print(T.opening + id + '…', 'term-muted');
            window.openWindow(id);
        },
        cv: function () {
            const row = line();
            row.appendChild(document.createTextNode(T.cv));
            row.appendChild(link(CV.split('/').pop(), CV, true));
            window.open(CV, '_blank', 'noopener');
        },
        contact: function () {
            [['E-mail', 'heinry.noan16@gmail.com', 'mailto:heinry.noan16@gmail.com'],
                ['LinkedIn', 'linkedin.com/in/noan-heinry-bb180b357', 'https://www.linkedin.com/in/noan-heinry-bb180b357'],
                ['GitHub', 'github.com/NoanHeinry', 'https://github.com/NoanHeinry']].forEach(function (c) {
                const row = line();
                const k = document.createElement('span');
                k.className = 'term-key';
                k.textContent = c[0].padEnd(10, ' ');
                row.appendChild(k);
                row.appendChild(link(c[1], c[2], c[2].indexOf('http') === 0));
            });
        },
        neofetch: function () {
            const row = line('term-fetch');
            const logo = document.createElement('pre');
            logo.className = 'term-logo';
            logo.textContent = [
                ' _  _  ___    _   _  _ ',
                '| \\| |/ _ \\  /_\\ | \\| |',
                '| .` | (_) |/ _ \\| .` |',
                '|_|\\_|\\___//_/ \\_\\_|\\_|'
            ].join('\n');
            row.appendChild(logo);
            const box = document.createElement('div');
            const title = document.createElement('div');
            title.className = 'term-key';
            title.textContent = 'noan@noanos';
            box.appendChild(title);
            T.info.forEach(function (p) {
                const d = document.createElement('div');
                const k = document.createElement('span');
                k.className = 'term-accent';
                k.textContent = p[0] + ': ';
                d.appendChild(k);
                d.appendChild(document.createTextNode(p[1]));
                box.appendChild(d);
            });
            row.appendChild(box);
        },
        date: function () {
            print(new Date().toLocaleString(EN ? 'en-GB' : 'fr-FR', { dateStyle: 'full', timeStyle: 'short' }));
        },
        echo: function (args, raw) { print(raw.replace(/^\s*echo\s?/i, '')); },
        history: function () {
            if (!history.length) { print(T.empty, 'term-muted'); return; }
            history.forEach(function (h, i) { print(String(i + 1).padStart(3, ' ') + '  ' + h); });
        },
        lang: function () { window.location.href = OTHER_LANG + '#terminal'; },
        clear: function () { out.textContent = ''; },
        exit: function () { window.closeWindow('terminal'); },
        sudo: function () { print(T.sudo, 'term-error'); }
    };
    COMMANDS.cls = COMMANDS.clear;
    COMMANDS.aide = COMMANDS.help;

    function run(raw) {
        const echo = line('term-echo');
        const prompt = document.createElement('span');
        prompt.className = 'term-prompt';
        prompt.textContent = 'noan@noanos:~$ ';
        echo.appendChild(prompt);
        echo.appendChild(document.createTextNode(raw));

        const parts = raw.trim().split(/\s+/);
        const cmd = (parts.shift() || '').toLowerCase();
        if (!cmd) return;
        history.push(raw.trim());
        if (COMMANDS[cmd]) COMMANDS[cmd](parts, raw);
        else if (findApp(cmd)) COMMANDS.open([cmd]);
        else print(T.notFound + cmd + T.tryHelp, 'term-error');
    }

    /* ---------- Saisie ---------- */

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        run(input.value);
        input.value = '';
        cursor = history.length;
        scrollDown();
    });

    input.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowUp' && history.length) {
            e.preventDefault();
            cursor = Math.max(0, cursor - 1);
            input.value = history[cursor];
        } else if (e.key === 'ArrowDown' && history.length) {
            e.preventDefault();
            cursor = Math.min(history.length, cursor + 1);
            input.value = history[cursor] || '';
        } else if (e.key === 'Tab') {
            // Complétion du nom de commande ou d'application
            const v = input.value.toLowerCase();
            if (!v || v.indexOf(' ') !== -1) return;
            const names = Object.keys(COMMANDS).concat([].concat.apply([], Object.keys(APPS).map(function (id) { return APPS[id]; })));
            const match = names.filter(function (n) { return n.indexOf(v) === 0; });
            if (match.length) {
                e.preventDefault();
                if (match.length === 1) input.value = match[0] + ' ';
                else print(match.join('   '), 'term-muted');
                scrollDown();
            }
        } else if (e.key === 'l' && e.ctrlKey) {
            e.preventDefault();
            COMMANDS.clear();
        }
    });

    // Un clic n'importe où dans le terminal place le curseur dans la saisie
    win.querySelector('.window-content').addEventListener('click', function (e) {
        if (!e.target.closest('a') && !window.getSelection().toString()) input.focus({ preventScroll: true });
    });

    // Message d'accueil, puis focus à chaque ouverture (sauf sur mobile pour ne pas ouvrir le clavier)
    print(T.welcome, 'term-muted');
    new MutationObserver(function () {
        const visible = win.classList.contains('is-open') && !win.classList.contains('is-minimized');
        if (visible && !window.matchMedia('(max-width: 768px)').matches) {
            requestAnimationFrame(function () { input.focus({ preventScroll: true }); });
        }
    }).observe(win, { attributes: true, attributeFilter: ['class'] });
})();
