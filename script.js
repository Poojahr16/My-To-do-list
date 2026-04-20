document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('taskInput');
    const categorySelect = document.getElementById('categorySelect');
    const prioritySelect = document.getElementById('prioritySelect');
    const dueDateInput = document.getElementById('dueDateInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');
    const searchInput = document.getElementById('searchInput');
    const themeToggle = document.getElementById('themeToggle');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const clearCompletedBtn = document.getElementById('clearCompletedBtn');
    const taskCount = document.getElementById('taskCount');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');

    let currentFilter = 'all';
    let isDarkMode = localStorage.getItem('darkMode') === 'true';

    // Initialize theme
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        themeToggle.textContent = '☀️';
    }

    // Load tasks from localStorage
    loadTasks();

    // Add task event
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });

    // Search event
    searchInput.addEventListener('input', filterTasks);

    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);

    // Filter events
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            filterTasks();
        });
    });

    // Clear completed
    clearCompletedBtn.addEventListener('click', clearCompletedTasks);

    function addTask() {
        const taskText = taskInput.value.trim();
        const category = categorySelect.value;
        const priority = prioritySelect.value;
        const dueDate = dueDateInput.value;
        if (taskText === '') return;

        const taskItem = createTaskElement(taskText, category, priority, dueDate);
        taskItem.classList.add('fade-in');
        taskList.appendChild(taskItem);
        saveTasks();
        updateStats();
        updateProgress();
        taskInput.value = '';
        dueDateInput.value = '';
    }

    function createTaskElement(text, category, priority, dueDate) {
        const li = document.createElement('li');
        const dueDateObj = dueDate ? new Date(dueDate) : null;
        const today = new Date();
        const isOverdue = dueDateObj && dueDateObj < today && dueDateObj.toDateString() !== today.toDateString();
        const isDueToday = dueDateObj && dueDateObj.toDateString() === today.toDateString();

        li.innerHTML = `
            <span>
                <span class="task-text">${text}</span>
                <span class="category-badge category-${category}">${category}</span>
                <span class="priority-badge priority-${priority}">${priority}</span>
                ${dueDate ? `<span class="due-date ${isOverdue ? 'overdue' : isDueToday ? 'today' : ''}" data-date="${dueDate}">${formatDate(dueDate)}</span>` : ''}
            </span>
            <div class="task-actions">
                <button class="edit-btn">Edit</button>
                <button class="delete-btn">Delete</button>
            </div>
        `;

        // Toggle completed
        li.addEventListener('click', (e) => {
            if (!e.target.classList.contains('edit-btn') && !e.target.classList.contains('delete-btn') && !e.target.classList.contains('edit-input')) {
                li.classList.toggle('completed');
                saveTasks();
                updateStats();
                updateProgress();
                filterTasks();
            }
        });

        // Edit task
        li.querySelector('.edit-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            editTask(li);
        });

        // Delete task
        li.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            li.remove();
            saveTasks();
            updateStats();
            updateProgress();
        });

        return li;
    }

    function editTask(li) {
        const taskText = li.querySelector('.task-text');
        const currentText = taskText.textContent;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentText;
        input.className = 'edit-input';

        taskText.replaceWith(input);
        input.focus();
        input.select();

        const saveEdit = () => {
            const newText = input.value.trim();
            if (newText) {
                taskText.textContent = newText;
                input.replaceWith(taskText);
                saveTasks();
            } else {
                input.replaceWith(taskText);
            }
        };

        input.addEventListener('blur', saveEdit);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                saveEdit();
            } else if (e.key === 'Escape') {
                input.replaceWith(taskText);
            }
        });
    }

    function filterTasks() {
        const tasks = taskList.querySelectorAll('li');
        const searchTerm = searchInput.value.toLowerCase();

        tasks.forEach(task => {
            const taskText = task.querySelector('.task-text').textContent.toLowerCase();
            const category = task.querySelector('.category-badge').textContent.toLowerCase();
            const isCompleted = task.classList.contains('completed');
            const dueDate = task.querySelector('.due-date');
            const dueDateText = dueDate ? dueDate.textContent : '';
            const today = new Date().toDateString();

            let show = true;

            // Search filter
            if (searchTerm && !taskText.includes(searchTerm) && !category.includes(searchTerm)) {
                show = false;
            }

            // Status filter
            if (show) {
                switch (currentFilter) {
                    case 'all':
                        break;
                    case 'active':
                        if (isCompleted) show = false;
                        break;
                    case 'completed':
                        if (!isCompleted) show = false;
                        break;
                    case 'today':
                        if (!dueDate || !dueDateText.includes(today)) show = false;
                        break;
                }
            }

            task.style.display = show ? 'flex' : 'none';
        });
    }

    function clearCompletedTasks() {
        const completedTasks = taskList.querySelectorAll('li.completed');
        completedTasks.forEach(task => task.remove());
        saveTasks();
        updateStats();
        updateProgress();
    }

    function updateStats() {
        const totalTasks = taskList.querySelectorAll('li').length;
        const completedTasks = taskList.querySelectorAll('li.completed').length;
        const remainingTasks = totalTasks - completedTasks;
        taskCount.textContent = `${remainingTasks} task${remainingTasks !== 1 ? 's' : ''} remaining`;
    }

    function updateProgress() {
        const totalTasks = taskList.querySelectorAll('li').length;
        const completedTasks = taskList.querySelectorAll('li.completed').length;
        const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        progressFill.style.width = `${percentage}%`;
        progressText.textContent = `${percentage}% Complete`;
    }

    function toggleTheme() {
        isDarkMode = !isDarkMode;
        document.body.classList.toggle('dark-mode');
        themeToggle.textContent = isDarkMode ? '☀️' : '🌙';
        localStorage.setItem('darkMode', isDarkMode);
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    function saveTasks() {
        const tasks = [];
        taskList.querySelectorAll('li').forEach(li => {
            const taskText = li.querySelector('.task-text').textContent;
            const category = li.querySelector('.category-badge').textContent.toLowerCase();
            const priority = li.querySelector('.priority-badge').textContent.toLowerCase();
            const dueDateElement = li.querySelector('.due-date');
            const dueDate = dueDateElement ? dueDateElement.dataset.date : '';
            const completed = li.classList.contains('completed');
            tasks.push({
                text: taskText,
                category: category,
                priority: priority,
                dueDate: dueDate,
                completed: completed
            });
        });
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function loadTasks() {
        const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        tasks.forEach(task => {
            const taskItem = createTaskElement(task.text, task.category, task.priority || 'medium', task.dueDate || '');
            if (task.completed) {
                taskItem.classList.add('completed');
            }
            taskList.appendChild(taskItem);
        });
        updateStats();
        updateProgress();
        filterTasks();
    }
});