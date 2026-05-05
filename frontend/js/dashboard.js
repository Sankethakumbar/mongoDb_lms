document.addEventListener('DOMContentLoaded', async () => {
    const user = AUTH.check();
    if (!user) return;

    // UI Elements
    const lessonNav = document.getElementById('lessonNav');
    const lessonTitle = document.getElementById('lessonTitle');
    const lessonBody = document.getElementById('lessonBody');
    const queryInput = document.getElementById('queryInput');
    const runBtn = document.getElementById('runBtn');
    const completeBtn = document.getElementById('completeBtn');
    const consoleOutput = document.getElementById('consoleOutput');
    const progressFill = document.getElementById('progressFill');
    const progressPercent = document.getElementById('progressPercent');
    const displayUsername = document.getElementById('displayUsername');
    const workspaceToggle = document.getElementById('workspaceToggle');
    const clearConsoleBtn = document.getElementById('clearConsoleBtn');
    const activeModeLabel = document.getElementById('activeModeLabel');
    const currentProgressLabel = document.getElementById('currentProgressLabel');
    const viewport = document.querySelector('.viewport');
    const modeTabs = document.querySelectorAll('.mode-tab');
    
    // Mobile responsive elements
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileOverlay = document.getElementById('mobileOverlay');
    const sidebar = document.querySelector('.sidebar');

    let lessons = [];
    let completedLessons = new Set();
    let currentIdx = 0;
    let currentMode = 'CURRICULUM';
    let lastRunResult = null;

    displayUsername.innerText = user.username;

    async function init() {
        log('System', 'Connecting to MongoAcademy Cluster...');
        
        try {
            // Check connection and sync data
            const synced = await ENGINE.sync();
            if (synced) {
                log('System', '✅ Database cluster synced.', 'success');
            } else {
                log('System', '⚠️ Offline Mode: Practice queries will use fallback data.', 'warning');
            }

            // Load Lessons
            const res = await fetch('http://localhost:8084/api/lessons');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            lessons = await res.json();
            log('System', `📚 Loaded ${lessons.length} modules.`);

            // Load Progress
            try {
                const pRes = await fetch(`http://localhost:8084/api/progress/${user.email}`);
                if (pRes.ok) {
                    const pData = await pRes.json();
                    completedLessons = new Set(pData);
                }
            } catch (e) { 
                console.error("Progress load failed", e); 
                log('System', 'Failed to load progress from server.', 'error');
            }

            renderNav();
            switchToMode('CURRICULUM');
            
        } catch (err) {
            console.error('Initialization failed', err);
            log('Error', 'Could not connect to backend server. Please ensure the Java application is running on port 8084.', 'error');
            lessonBody.innerHTML = `
                <div class="error-state" style="text-align: center; padding: 40px;">
                    <i class="fa-solid fa-triangle-exclamation" style="font-size: 48px; color: var(--accent-primary); margin-bottom: 20px;"></i>
                    <h2>Connection Error</h2>
                    <p>We couldn't reach the MongoAcademy server on port 8084.</p>
                    <p style="color: var(--text-muted); margin-top: 10px;">Please check if your backend is running and refresh the page.</p>
                </div>
            `;
        }
    }

    function renderNav() {
        lessonNav.innerHTML = '';
        const filteredLessons = lessons.filter(l => l.category === currentMode);
        const groups = {};
        filteredLessons.forEach((l) => {
            if (!groups[l.moduleTitle]) groups[l.moduleTitle] = [];
            groups[l.moduleTitle].push(l);
        });

        let lastWasCompleted = true;

        Object.keys(groups).forEach(moduleTitle => {
            const container = document.createElement('div');
            container.className = 'chapter-container open';
            
            const header = document.createElement('div');
            header.className = 'chapter-header';
            header.innerHTML = `<span>${moduleTitle}</span><i class="fa-solid fa-chevron-down"></i>`;
            header.onclick = () => container.classList.toggle('open');
            
            const content = document.createElement('div');
            content.className = 'chapter-content';
            
            groups[moduleTitle].forEach(l => {
                const isDone = completedLessons.has(l.id);
                const isPractice = currentMode === 'PRACTICE';
                const isLocked = isPractice && !lastWasCompleted && !isDone;
                
                const div = document.createElement('div');
                div.className = `lesson-item ${isDone ? 'done' : ''} ${isLocked ? 'locked' : ''}`;
                
                const originalIdx = lessons.findIndex(item => item.id === l.id);
                div.id = `lesson-${originalIdx}`;
                
                // Strip prefix from title for display
                const displayTitle = l.title.replace(/^\d+_/, '');
                
                div.innerHTML = `
                    <i class="fa-solid ${isLocked ? 'fa-lock' : (isDone ? 'fa-circle-check completed' : (isPractice ? 'fa-terminal' : 'fa-book-open'))}"></i> 
                    ${displayTitle}
                `;
                
                if (!isLocked) {
                    div.onclick = (e) => {
                        e.stopPropagation();
                        selectLesson(originalIdx);
                    };
                }

                content.appendChild(div);
                lastWasCompleted = isDone;
            });
            
            container.appendChild(header);
            container.appendChild(content);
            lessonNav.appendChild(container);
        });
        
        updateProgress();
    }

    function selectLesson(i) {
        currentIdx = i;
        const l = lessons[i];
        lastRunResult = null; 
        
        document.querySelectorAll('.lesson-item').forEach((item) => {
            item.classList.remove('active');
        });
        
        const activeItem = document.getElementById(`lesson-${i}`);
        if (activeItem) activeItem.classList.add('active');

        lessonTitle.innerText = l.moduleTitle;
        lessonBody.innerHTML = l.content;
        
        updateCompleteButton();
        updateNavButtons();

        if (l.category === 'PRACTICE' && !viewport.classList.contains('editor-open')) {
            viewport.classList.add('editor-open');
            workspaceToggle.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        }
    }

    function updateCompleteButton() {
        const l = lessons[currentIdx];
        if (completedLessons.has(l.id)) {
            completeBtn.classList.add('done');
            completeBtn.innerHTML = '<i class="fa-solid fa-check-double"></i> Completed';
        } else {
            completeBtn.classList.remove('done');
            if (l.category === 'PRACTICE') {
                completeBtn.innerHTML = '<i class="fa-solid fa-vial"></i> Verify \u0026 Complete';
            } else {
                completeBtn.innerHTML = '<i class="fa-solid fa-check-circle"></i> Mark as Completed';
            }
        }
    }

    function switchToMode(mode) {
        currentMode = mode;
        activeModeLabel.innerText = mode;
        currentProgressLabel.innerText = `${mode.charAt(0) + mode.slice(1).toLowerCase()} Progress`;
        
        modeTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.mode === mode);
        });

        renderNav();
        const firstInMode = lessons.findIndex(l => l.category === mode);
        if (firstInMode !== -1) selectLesson(firstInMode);
    }

    function isResultMatch(userRes, expectedRes) {
        if (!userRes || !expectedRes) return false;
        
        const deepSort = (obj) => {
            if (obj === null || typeof obj !== 'object') return obj;
            if (Array.isArray(obj)) {
                return obj.map(deepSort).sort((a, b) => {
                    const sa = JSON.stringify(a);
                    const sb = JSON.stringify(b);
                    return sa.localeCompare(sb);
                });
            }
            
            const sortedKeys = Object.keys(obj).sort();
            const result = {};
            sortedKeys.forEach(key => {
                result[key] = deepSort(obj[key]);
            });
            return result;
        };

        const nUser = JSON.stringify(deepSort(userRes));
        const nExpected = JSON.stringify(deepSort(expectedRes));

        return nUser === nExpected;
    }

    async function handleComplete() {
        const lesson = lessons[currentIdx];
        if (completedLessons.has(lesson.id)) return;

        if (lesson.category === 'PRACTICE') {
            if (!lesson.solution) {
                log('Warning', 'This challenge is missing a solution tag.', 'error');
                return;
            }

            if (!lastRunResult) {
                log('System', 'Please run your query before verifying.', 'error');
                return;
            }

            const expected = ENGINE.execute(lesson.solution);
            const isCorrect = isResultMatch(lastRunResult, expected.data);

            if (!isCorrect) {
                log('Validator', '\u274c Your answer is wrong.', 'error');
                completeBtn.style.animation = 'none';
                void completeBtn.offsetWidth;
                completeBtn.style.animation = 'shake 0.5s';
                return;
            } else {
                log('Validator', '\u2705 Correct dataset returned!', 'success');
            }
        }

        completeBtn.disabled = true;
        completeBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
        
        try {
            const res = await fetch('http://localhost:8084/api/progress/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail: user.email, lessonId: lesson.id })
            });
            
            if (res.ok) {
                completedLessons.add(lesson.id);
                renderNav();
                selectLesson(currentIdx);
                log('Success', `Task completed!`, 'success');
            }
        } catch (e) {
            log('Error', 'Failed to save progress.', 'error');
        } finally {
            completeBtn.disabled = false;
            updateCompleteButton();
        }
    }

    function updateProgress() {
        const modeLessons = lessons.filter(l => l.category === currentMode);
        const modeCompleted = modeLessons.filter(l => completedLessons.has(l.id));
        const p = modeLessons.length > 0 ? Math.round((modeCompleted.length / modeLessons.length) * 100) : 0;
        progressFill.style.width = `${p}%`;
        progressPercent.innerText = `${p}%`;
    }

    function log(type, msg, cls = 'system') {
        const line = document.createElement('div');
        line.className = `console-line ${cls}`;
        line.innerHTML = `[${type.toUpperCase()}] ${msg}`;
        consoleOutput.appendChild(line);
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }

    modeTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            if (tab.dataset.mode !== currentMode) {
                switchToMode(tab.dataset.mode);
            }
        });
    });

    completeBtn.addEventListener('click', handleComplete);

    workspaceToggle.addEventListener('click', () => {
        viewport.classList.toggle('editor-open');
        const isOpen = viewport.classList.contains('editor-open');
        workspaceToggle.innerHTML = isOpen ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-code"></i>';
    });

    // --- Pagination Logic ---
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    function updateNavButtons() {
        const modeLessons = lessons.filter(l => l.category === currentMode);
        const currentModeIndex = modeLessons.findIndex(l => l.id === lessons[currentIdx].id);

        // Previous Button
        if (currentModeIndex > 0) {
            prevBtn.disabled = false;
        } else {
            prevBtn.disabled = true;
        }

        // Next Button
        if (currentModeIndex < modeLessons.length - 1) {
            const nextLesson = modeLessons[currentModeIndex + 1];
            const originalNextIdx = lessons.findIndex(item => item.id === nextLesson.id);
            const nextElement = document.getElementById(`lesson-${originalNextIdx}`);
            
            // Disable if it's practice and the next element is locked
            if (nextElement && nextElement.classList.contains('locked')) {
                nextBtn.disabled = true;
            } else {
                nextBtn.disabled = false;
            }
        } else {
            nextBtn.disabled = true;
        }
    }

    prevBtn.addEventListener('click', () => {
        const modeLessons = lessons.filter(l => l.category === currentMode);
        const currentModeIndex = modeLessons.findIndex(l => l.id === lessons[currentIdx].id);
        if (currentModeIndex > 0) {
            const prevLesson = modeLessons[currentModeIndex - 1];
            const originalPrevIdx = lessons.findIndex(item => item.id === prevLesson.id);
            selectLesson(originalPrevIdx);
        }
    });

    nextBtn.addEventListener('click', () => {
        const modeLessons = lessons.filter(l => l.category === currentMode);
        const currentModeIndex = modeLessons.findIndex(l => l.id === lessons[currentIdx].id);
        if (currentModeIndex < modeLessons.length - 1) {
            const nextLesson = modeLessons[currentModeIndex + 1];
            const originalNextIdx = lessons.findIndex(item => item.id === nextLesson.id);
            selectLesson(originalNextIdx);
        }
    });

    // Mobile menu toggle logic
    const appShell = document.querySelector('.app-shell');
    mobileMenuToggle.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            sidebar.classList.add('open');
            mobileOverlay.classList.add('active');
        } else {
            appShell.classList.toggle('sidebar-collapsed');
        }
    });

    mobileOverlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        mobileOverlay.classList.remove('active');
    });

    // Override selectLesson to close mobile sidebar
    const originalSelectLesson = selectLesson;
    selectLesson = function(i) {
        originalSelectLesson(i);
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('open');
            mobileOverlay.classList.remove('active');
        }
    };

    clearConsoleBtn.addEventListener('click', () => {
        consoleOutput.innerHTML = '';
        log('System', 'Console cleared.');
    });

    runBtn.addEventListener('click', async () => {
        executeCurrentQuery();
    });

    queryInput.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            executeCurrentQuery();
        }
    });

    async function executeCurrentQuery() {
        const q = queryInput.value;
        if (!q.trim()) return;

        runBtn.disabled = true;
        runBtn.innerHTML = '<span>RUNNING...</span><i class="fa-solid fa-spinner fa-spin"></i>';
        
        log('Query', q);
        
        setTimeout(() => {
            const res = ENGINE.execute(q);
            if (res.success) {
                lastRunResult = res.data; 
                log('Success', `Returned ${res.data.length || 0} docs`, 'success');
                const pre = document.createElement('pre');
                pre.className = 'console-line';
                pre.style.color = 'var(--text-accent)';
                pre.innerText = JSON.stringify(res.data, null, 2);
                consoleOutput.appendChild(pre);
            } else {
                lastRunResult = null;
                log('Error', res.message, 'error');
            }
            
            runBtn.disabled = false;
            runBtn.innerHTML = '<span>RUN QUERY</span><i class="fa-solid fa-play"></i>';
            consoleOutput.scrollTop = consoleOutput.scrollHeight;
        }, 300);
    }

    // --- Sidebar Resize Logic ---
    const resizeHandle = document.getElementById('sidebarResize');

    const savedWidth = localStorage.getItem('sidebarWidth');
    if (savedWidth) sidebar.style.width = savedWidth;

    let isSidebarResizing = false;

    resizeHandle.addEventListener('mousedown', (e) => {
        isSidebarResizing = true;
        resizeHandle.classList.add('dragging');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        e.preventDefault();
    });

    // --- Panel (Content/Editor) Resize Logic ---
    const panelResizeHandle = document.getElementById('panelResize');
    const interactionPanel = document.querySelector('.interaction-panel');

    const savedPanelWidth = localStorage.getItem('editorPanelWidth');
    if (savedPanelWidth) interactionPanel.style.width = savedPanelWidth;

    let isPanelResizing = false;

    panelResizeHandle.addEventListener('mousedown', (e) => {
        isPanelResizing = true;
        panelResizeHandle.classList.add('dragging');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (isSidebarResizing) {
            const newWidth = e.clientX;
            if (newWidth >= 180 && newWidth <= 480) {
                sidebar.style.width = newWidth + 'px';
            }
        }
        if (isPanelResizing) {
            const viewportEl = document.querySelector('.viewport');
            const rect = viewportEl.getBoundingClientRect();
            const newWidth = rect.right - e.clientX;
            if (newWidth >= 200 && newWidth <= rect.width - 250) {
                interactionPanel.style.width = newWidth + 'px';
            }
        }
    });

    document.addEventListener('mouseup', () => {
        if (isSidebarResizing) {
            isSidebarResizing = false;
            resizeHandle.classList.remove('dragging');
            localStorage.setItem('sidebarWidth', sidebar.style.width);
        }
        if (isPanelResizing) {
            isPanelResizing = false;
            panelResizeHandle.classList.remove('dragging');
            localStorage.setItem('editorPanelWidth', interactionPanel.style.width);
        }
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    });

    init();
});
