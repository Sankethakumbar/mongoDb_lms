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
    let practiceQuestions = [];
    let completedLessons = new Set();
    let currentIdx = 0;
    let activeQuestionId = null;
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
            
            // Load Practice Questions
            const prRes = await fetch('http://localhost:8084/api/practice/questions');
            if (prRes.ok) practiceQuestions = await prRes.json();
            
            log('System', `📚 Loaded ${lessons.length} curriculum modules and ${practiceQuestions.length} practice challenges.`);

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
        
        if (currentMode === 'CURRICULUM') {
            const filteredLessons = lessons.filter(l => l.category === currentMode);
            const groups = {};
            filteredLessons.forEach((l) => {
                if (!groups[l.moduleTitle]) groups[l.moduleTitle] = [];
                groups[l.moduleTitle].push(l);
            });

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
                    const div = document.createElement('div');
                    div.className = `lesson-item ${isDone ? 'done' : ''}`;
                    const originalIdx = lessons.findIndex(item => item.id === l.id);
                    div.id = `lesson-${originalIdx}`;
                    div.innerHTML = `<i class="fa-solid ${isDone ? 'fa-circle-check completed' : 'fa-book-open'}"></i> ${l.title.replace(/^\d+_/, '')}`;
                    div.onclick = () => selectLesson(originalIdx);
                    content.appendChild(div);
                });
                container.appendChild(header);
                container.appendChild(content);
                lessonNav.appendChild(container);
            });
        } else {
            // PRACTICE MODE
            const container = document.createElement('div');
            container.className = 'chapter-container open';
            const header = document.createElement('div');
            header.className = 'chapter-header';
            header.innerHTML = `<span>Active Challenges</span><i class="fa-solid fa-code-branch"></i>`;
            const content = document.createElement('div');
            content.className = 'chapter-content';
            
            practiceQuestions.forEach(q => {
                const isDone = completedLessons.has(`PRACTICE_${q.id}`);
                const div = document.createElement('div');
                div.className = `lesson-item ${isDone ? 'done' : ''} difficulty-${q.difficulty}`;
                div.innerHTML = `<i class="fa-solid ${isDone ? 'fa-check-double completed' : 'fa-terminal'}"></i> ${q.title}`;
                div.onclick = () => selectPracticeQuestion(q.id);
                content.appendChild(div);
            });
            container.appendChild(header);
            container.appendChild(content);
            lessonNav.appendChild(container);
        }
        
        updateProgress();
    }

    function selectLesson(i) {
        currentIdx = i;
        activeQuestionId = null;
        const l = lessons[i];
        lastRunResult = null; 
        
        document.querySelectorAll('.lesson-item').forEach(item => item.classList.remove('active'));
        const activeItem = document.getElementById(`lesson-${i}`);
        if (activeItem) activeItem.classList.add('active');

        lessonTitle.innerText = l.moduleTitle;
        lessonBody.innerHTML = l.content;
        queryInput.value = "db.students.find({})"; // Default
        
        updateCompleteButton();
        updateNavButtons();
    }

    function selectPracticeQuestion(id) {
        activeQuestionId = id;
        const q = practiceQuestions.find(item => item.id === id);
        lastRunResult = null;
        
        document.querySelectorAll('.lesson-item').forEach(item => item.classList.remove('active'));
        lessonTitle.innerText = q.title;
        
        lessonBody.innerHTML = `
            <div class="challenge-card">
                <div class="challenge-section">
                    <h3><i class="fa-solid fa-circle-info"></i> The Challenge</h3>
                    <div class="challenge-text">${q.description}</div>
                </div>

                <div class="challenge-section">
                    <h3><i class="fa-solid fa-database"></i> Database Context</h3>
                    <div class="challenge-text">
                        You are working with the <strong>${q.collectionName}</strong> collection. 
                        Each document typically follows this schema:
                    </div>
                    <div class="dataset-preview">
                        {
                            "name": "String",
                            "marks": "Number",
                            "department": "String",
                            "age": "Number",
                            "grade": "String"
                        }
                    </div>
                </div>

                <div class="challenge-section">
                    <h3><i class="fa-solid fa-bullseye"></i> Expected Outcome</h3>
                    <div class="expectation-box">
                        Your query should return the specific documents that match the criteria mentioned in the challenge description above. 
                        The evaluation system will check if your result set matches the expected data exactly.
                    </div>
                </div>

                <div class="solution-container">
                    <button class="btn-solution" onclick="toggleSolution()">
                        <i class="fa-solid fa-lightbulb"></i> <span id="solutionBtnText">Show Answer</span>
                    </button>
                    <div id="solutionBox" class="solution-box">
                        <h4>Correct Solution</h4>
                        <div class="solution-code">${q.solution}</div>
                    </div>
                </div>
            </div>

            <div class="practice-header">
                <span class="difficulty-badge ${q.difficulty}">${q.difficulty.toUpperCase()}</span>
                <span class="collection-badge"><i class="fa-solid fa-terminal"></i> Submission Format: JSON</span>
            </div>
        `;
        
        queryInput.value = q.starterQuery || `db.${q.collectionName}.find({})`;
        
        if (!viewport.classList.contains('editor-open')) {
            viewport.classList.add('editor-open');
            workspaceToggle.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        }
        
        updateCompleteButton();
        updateNavButtons();
    }

    window.toggleSolution = function() {
        const box = document.getElementById('solutionBox');
        const text = document.getElementById('solutionBtnText');
        if (box.classList.contains('visible')) {
            box.classList.remove('visible');
            text.innerText = 'Show Answer';
        } else {
            box.classList.add('visible');
            text.innerText = 'Hide Answer';
        }
    };

    function updateCompleteButton() {
        const id = activeQuestionId ? `PRACTICE_${activeQuestionId}` : (lessons[currentIdx]?.id);
        if (completedLessons.has(id)) {
            completeBtn.classList.add('done');
            completeBtn.innerHTML = '<i class="fa-solid fa-check-double"></i> Completed';
        } else {
            completeBtn.classList.remove('done');
            completeBtn.innerHTML = activeQuestionId ? '<i class="fa-solid fa-vial"></i> Submit Solution' : '<i class="fa-solid fa-check-circle"></i> Mark as Completed';
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
        if (activeQuestionId) {
            // Logic handled by "RUN QUERY" for practice or a separate submission?
            // The user said: On "Run Query" → call submit API. 
            // But we can also use the Complete button for final submission.
            executeCurrentQuery(); 
            return;
        }

        const lesson = lessons[currentIdx];
        if (!lesson || completedLessons.has(lesson.id)) return;

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

    function parseMongoQuery(str) {
        try {
            // Match db.collection.find({filter}) or db.collection.aggregate([pipeline])
            const regex = /^db\.(\w+)\.(\w+)\(([\s\S]*)\)$/;
            const match = str.trim().match(regex);
            
            if (!match) return null;
            
            const collection = match[1];
            const operation = match[2];
            const arg = match[3].trim();
            
            // Use Function to safely evaluate the object/array argument (more flexible than JSON.parse)
            const parsedArg = arg ? new Function(`return (${arg})`)() : (operation === 'aggregate' ? [] : {});
            
            if (operation === 'find') {
                return { operation, collection, filter: parsedArg };
            } else if (operation === 'aggregate') {
                return { operation, collection, pipeline: Array.isArray(parsedArg) ? parsedArg : [parsedArg] };
            }
            return null;
        } catch (e) {
            console.error("Parse error", e);
            return null;
        }
    }

    async function executeCurrentQuery() {
        const q = queryInput.value;
        if (!q.trim()) return;

        runBtn.disabled = true;
        runBtn.innerHTML = '<span>RUNNING...</span><i class="fa-solid fa-spinner fa-spin"></i>';
        
        log('Query', q);
        
        if (activeQuestionId) {
            // PRACTICE EVALUATION
            let payload = parseMongoQuery(q);
            
            // Fallback: If not db.syntax, check if it's raw JSON
            if (!payload) {
                try {
                    payload = JSON.parse(q);
                    // Ensure the raw JSON has the required fields
                    if (!payload.operation || !payload.collection) {
                        throw new Error("Missing operation or collection");
                    }
                } catch (e) {
                    log('Error', 'Invalid MongoDB Syntax. Use db.collection.find({filter}) or db.collection.aggregate([pipeline]). Ensure valid JSON/Objects inside parentheses.', 'error');
                    runBtn.disabled = false;
                    runBtn.innerHTML = '<span>RUN QUERY</span><i class="fa-solid fa-play"></i>';
                    return;
                }
            }

            try {
                payload.questionId = activeQuestionId;
                
                const res = await fetch('http://localhost:8084/api/practice/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.message || 'Server error');
                }

                const result = await res.json();
                if (result.status === 'PASS') {
                    log('Evaluator', '✅ Correct! Dataset matches expected output.', 'success');
                    
                    // Save progress
                    await fetch('http://localhost:8084/api/progress/complete', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userEmail: user.email, lessonId: `PRACTICE_${activeQuestionId}` })
                    });
                    
                    completedLessons.add(`PRACTICE_${activeQuestionId}`);
                    renderNav();
                    updateCompleteButton();
                    
                    // Visual feedback
                    const conf = document.createElement('div');
                    conf.style.cssText = 'position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); font-size:100px; z-index:9999; pointer-events:none; animation: popOut 0.8s ease forwards';
                    conf.innerHTML = '🏆';
                    document.body.appendChild(conf);
                    setTimeout(() => conf.remove(), 1000);
                } else {
                    log('Evaluator', '❌ Incorrect result. Try again.', 'error');
                }
                
                // Show Output
                const pre = document.createElement('pre');
                pre.className = 'console-line';
                pre.style.color = result.status === 'PASS' ? '#00ed64' : '#ff5f56';
                pre.innerText = `[ACTUAL]\n${JSON.stringify(result.actual, null, 2)}\n\n[EXPECTED]\n${JSON.stringify(result.expected, null, 2)}`;
                consoleOutput.appendChild(pre);

            } catch (e) {
                const msg = e.message || '';
                if (msg.includes('MongoDB Service is offline')) {
                    log('CRITICAL', '⚠️ MongoDB server is NOT running. Please open your MongoDB Compass or Terminal and start the service on port 27017.', 'error');
                    // Show a persistent alert in the main body
                    const alert = document.createElement('div');
                    alert.style.cssText = 'background: rgba(255, 95, 86, 0.1); border: 1px solid #ff5f56; color: #ff5f56; padding: 15px; border-radius: 12px; margin-top: 20px; font-weight: 700;';
                    alert.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> MongoDB is Offline! Practice questions cannot be evaluated until you start your MongoDB service.';
                    lessonBody.appendChild(alert);
                } else {
                    log('Error', `Submission failed: ${msg}`, 'error');
                }
            }
        } else {
            // STANDARD CURRICULUM ENGINE
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
                consoleOutput.scrollTop = consoleOutput.scrollHeight;
            }, 300);
        }
        
        runBtn.disabled = false;
        runBtn.innerHTML = '<span>RUN QUERY</span><i class="fa-solid fa-play"></i>';
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
