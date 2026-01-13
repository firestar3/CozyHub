document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Clock & Date ---
    const updateTime = () => {
        const now = new Date();
        const timeEl = document.getElementById('clock-time');
        const dateEl = document.getElementById('clock-date');

        let hh = now.getHours();
        const mm = String(now.getMinutes()).padStart(2, '0');
        const ampm = hh >= 12 ? 'PM' : 'AM';

        hh = hh % 12 || 12; // 12-hour format

        timeEl.innerHTML = `${hh}:${mm} <span class="ampm">${ampm}</span>`;
        dateEl.innerText = now.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' });
    };
    setInterval(updateTime, 1000);
    updateTime();


    // --- 2. Tasks Widget ---
    // State
    const tasks = JSON.parse(localStorage.getItem('cozy_tasks')) || {
        homework: [],
        general: [],
        ec: []
    };
    let currentTab = 'homework';

    // render
    const renderTasks = () => {
        ['homework', 'general', 'ec'].forEach(cat => {
            const listEl = document.getElementById(`list-${cat}`);
            listEl.innerHTML = '';

            tasks[cat].forEach((task, index) => {
                const li = document.createElement('li');
                li.className = `task-item ${task.done ? 'done' : ''}`;
                li.innerHTML = `
                    <div class="task-checkbox ${task.done ? 'checked' : ''}" onclick="toggleTask('${cat}', ${index})"></div>
                    <span class="task-text">${task.text}</span>
                    <i class="fa-solid fa-trash task-delete" onclick="deleteTask('${cat}', ${index})"></i>
                `;
                listEl.appendChild(li);
            });
        });
    };

    // actions
    window.toggleTask = (cat, index) => {
        tasks[cat][index].done = !tasks[cat][index].done;
        saveTasks();
        renderTasks();
    };

    window.deleteTask = (cat, index) => {
        tasks[cat].splice(index, 1);
        saveTasks();
        renderTasks();
    };

    const saveTasks = () => {
        localStorage.setItem('cozy_tasks', JSON.stringify(tasks));
    };

    // UI Handlers
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update UI
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Switch List
            document.querySelectorAll('.task-list').forEach(l => l.classList.remove('active'));
            currentTab = btn.getAttribute('data-tab');
            document.getElementById(`list-${currentTab}`).classList.add('active');
        });
    });

    const addTaskBtn = document.getElementById('add-task-btn');
    const taskInput = document.getElementById('new-task-input');

    const handleAddTask = () => {
        const text = taskInput.value.trim();
        if (!text) return;

        tasks[currentTab].push({ text, done: false });
        saveTasks();
        renderTasks();
        taskInput.value = '';
    };

    addTaskBtn.addEventListener('click', handleAddTask);
    taskInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleAddTask();
    });

    renderTasks();


    // --- 3. Shortcuts Widget ---
    const scList = document.getElementById('shortcuts-container');
    const scAddBtn = document.getElementById('add-shortcut-sub-btn');
    const scModal = document.getElementById('shortcut-add-modal');

    let shortcuts = JSON.parse(localStorage.getItem('cozy_shortcuts')) || [
        { name: 'Gmail', url: 'https://mail.google.com' },
        { name: 'YouTube', url: 'https://youtube.com' },
        { name: 'Canvas', url: 'https://canvas.instructure.com' }
    ];

    const getFavicon = (url) => {
        try {
            const domain = new URL(url).hostname;
            return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
        } catch {
            return 'https://www.google.com/s2/favicons?domain=example.com';
        }
    };

    const renderShortcuts = () => {
        scList.innerHTML = '';
        shortcuts.forEach((sc, idx) => {
            const a = document.createElement('a');
            a.className = 'sc-item';
            a.href = sc.url;
            a.target = '_blank';
            a.innerHTML = `
                <img src="${getFavicon(sc.url)}" class="sc-icon">
                <span class="sc-name">${sc.name}</span>
                <i class="fa-solid fa-times sc-delete" onclick="deleteShortcut(event, ${idx})"></i>
            `;
            scList.appendChild(a);
        });
    };

    window.deleteShortcut = (e, idx) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm('Delete shortcut?')) {
            shortcuts.splice(idx, 1);
            localStorage.setItem('cozy_shortcuts', JSON.stringify(shortcuts));
            renderShortcuts();
        }
    };

    // Modal logic
    scAddBtn.addEventListener('click', () => scModal.showModal());

    scModal.querySelector('form').addEventListener('submit', () => {
        const name = document.getElementById('sc-name').value;
        let url = document.getElementById('sc-url').value;

        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        shortcuts.push({ name, url });
        localStorage.setItem('cozy_shortcuts', JSON.stringify(shortcuts));
        renderShortcuts();
        document.getElementById('sc-name').value = '';
        document.getElementById('sc-url').value = '';
    });

    renderShortcuts();


    // --- 4. Config: Calendar & Spotify ---
    const configBtn = document.getElementById('settings-trigger');
    const configModal = document.getElementById('config-modal');
    const spotifyFrame1 = document.getElementById('spotify-frame-1');
    const spotifyFrame2 = document.getElementById('spotify-frame-2');
    const calendarFrame = document.getElementById('calendar-frame');

    // Load from storage or default
    let spotifyUrl1 = localStorage.getItem('cozy_spotify') || 'https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M?utm_source=generator';
    let spotifyUrl2 = localStorage.getItem('cozy_spotify_2') || '';
    let calendarId = localStorage.getItem('cozy_calendar') || 'en.usa%23holiday%40group.v.calendar.google.com';

    // Helper to format Spotify URL for embed
    const formatSpotifyUrl = (url) => {
        if (!url) return '';
        if (url.includes('open.spotify.com') && !url.includes('/embed/')) {
            return url.replace('open.spotify.com/', 'open.spotify.com/embed/');
        }
        return url;
    };

    const loadSpotify = () => {
        // Frame 1
        const src1 = formatSpotifyUrl(spotifyUrl1);
        if (src1) {
            spotifyFrame1.src = src1;
            spotifyFrame1.style.display = 'block';
            // If only one is present, maybe make it full height? 
            // Requirement says "Add a second album". implies 2 slots.
            // If 2nd is empty, maybe hiding it gives more space to 1st?
            if (!spotifyUrl2) {
                spotifyFrame1.style.height = '100%';
                spotifyFrame2.style.display = 'none';
            } else {
                spotifyFrame1.style.height = '50%';
                spotifyFrame2.style.display = 'block';
                spotifyFrame2.style.height = '50%';
                spotifyFrame2.src = formatSpotifyUrl(spotifyUrl2);
            }
        } else {
            // No spotify 1? weird but ok.
            spotifyFrame1.style.display = 'none';
        }

        // Frame 2 is handled in the if/else logic above for layout purposes
    };

    const loadCalendar = () => {
        let src = calendarId;
        if (!src.includes('calendar.google.com')) {
            // It's just an ID
            src = `https://calendar.google.com/calendar/embed?src=${src}&ctz=America%2FLos_Angeles`;
        }
        calendarFrame.src = src;
    };

    loadSpotify();
    loadCalendar();

    configBtn.addEventListener('click', () => {
        document.getElementById('cfg-spotify-1').value = spotifyUrl1;
        document.getElementById('cfg-spotify-2').value = spotifyUrl2;
        document.getElementById('cfg-calendar').value = decodeURIComponent(calendarId);
        configModal.showModal();
    });

    configModal.querySelector('form').addEventListener('submit', () => {
        const sVal1 = document.getElementById('cfg-spotify-1').value;
        const sVal2 = document.getElementById('cfg-spotify-2').value;
        const cVal = document.getElementById('cfg-calendar').value;

        // Update 1
        spotifyUrl1 = sVal1;
        localStorage.setItem('cozy_spotify', spotifyUrl1);

        // Update 2
        spotifyUrl2 = sVal2;
        localStorage.setItem('cozy_spotify_2', spotifyUrl2);

        loadSpotify();

        if (cVal) {
            calendarId = encodeURIComponent(cVal);
            localStorage.setItem('cozy_calendar', calendarId);
            loadCalendar();
        }
    });

    // Close logic for all modals
    document.querySelectorAll('.btn-cancel').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('dialog').close();
        });
    });

    // Outside click
    [configModal, scModal].forEach(d => {
        d.addEventListener('click', (e) => {
            const rect = d.getBoundingClientRect();
            if (rect.left > e.clientX || rect.right < e.clientX || rect.top > e.clientY || rect.bottom < e.clientY) {
                d.close();
            }
        });
    });

});
