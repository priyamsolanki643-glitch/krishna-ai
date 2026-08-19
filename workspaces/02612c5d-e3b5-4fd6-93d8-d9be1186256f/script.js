document.addEventListener('DOMContentLoaded', () => {
  // --- State Management ---
  const STORAGE_KEY = 'taskflow_tasks';
  let tasks = [];
  let currentFilter = 'all';

  // --- DOM Elements ---
  const taskForm = document.getElementById('task-form');
  const taskInput = document.getElementById('task-input');
  const taskList = document.getElementById('task-list');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const statsEl = document.getElementById('stats');
  const clearCompletedBtn = document.getElementById('clear-completed');
  const emptyState = document.getElementById('empty-state');

  // --- Initialization & Persistence ---
  function init() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      tasks = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(tasks)) tasks = [];
    } catch (e) {
      console.warn('Failed to load tasks from localStorage', e);
      tasks = [];
    }
    renderTasks();
    updateStats();
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.warn('Failed to save tasks to localStorage', e);
    }
  }

  // --- Core Logic ---
  function addTask(text) {
    const trimmed = text.trim();
    if (!trimmed) return;

    const newTask = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      text: trimmed,
      completed: false,
      createdAt: Date.now()
    };

    tasks.unshift(newTask);
    saveTasks();
    renderTasks();
    updateStats();
    taskInput.value = '';
    taskInput.focus();
  }

  function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      saveTasks();
      renderTasks();
      updateStats();
    }
  }

  function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
    updateStats();
  }

  function clearCompletedTasks() {
    const completedCount = tasks.filter(t => t.completed).length;
    if (completedCount === 0) return;
    
    if (confirm(`Delete ${completedCount} completed task(s)?`)) {
      tasks = tasks.filter(t => !t.completed);
      saveTasks();
      renderTasks();
      updateStats();
    }
  }

  function setFilter(filter) {
    currentFilter = filter;
    filterBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    renderTasks();
  }

  // --- Rendering ---
  function getFilteredTasks() {
    switch (currentFilter) {
      case 'active': return tasks.filter(t => !t.completed);
      case 'completed': return tasks.filter(t => t.completed);
      default: return tasks;
    }
  }

  function renderTasks() {
    const filtered = getFilteredTasks();
    taskList.innerHTML = '';

    if (filtered.length === 0) {
      emptyState.classList.remove('hidden');
      const msg = currentFilter === 'all' 
        ? 'No tasks yet. Add one above!' 
        : currentFilter === 'active' 
          ? 'No active tasks. Great job!' 
          : 'No completed tasks yet.';
      emptyState.querySelector('p').textContent = msg;
      return;
    }

    emptyState.classList.add('hidden');

    filtered.forEach(task => {
      const li = document.createElement('li');
      li.className = `task-item group flex items-center justify-between p-4 mb-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50 hover:border-slate-600/50 transition-all duration-200 ${task.completed ? 'task-completed' : ''}`;
      
      li.innerHTML = `
        <div class="flex items-center gap-4 flex-1 min-w-0">
          <input type="checkbox" class="flex-shrink-0 cursor-pointer" ${task.completed ? 'checked' : ''} aria-label="Mark as ${task.completed ? 'incomplete' : 'complete'}">
          <span class="text-slate-200 font-medium truncate select-none cursor-pointer transition-colors duration-200">${escapeHtml(task.text)}</span>
        </div>
        <button class="delete-btn opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-slate-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-400/10 focus:outline-none focus:ring-2 focus:ring-red-400/50" aria-label="Delete task">
          <i class="fas fa-trash-alt"></i>
        </button>
      `;

      // Event Delegation Handlers
      const checkbox = li.querySelector('input[type="checkbox"]');
      checkbox.addEventListener('change', () => toggleTask(task.id));

      const textSpan = li.querySelector('span');
      textSpan.addEventListener('click', () => toggleTask(task.id));

      const deleteBtn = li.querySelector('.delete-btn');
      deleteBtn.addEventListener('click', () => deleteTask(task.id));

      taskList.appendChild(li);
    });
  }

  function updateStats() {
    const total = tasks.length;
    const active = tasks.filter(t => !t.completed).length;
    const completed = total - active;
    statsEl.textContent = `${active} active / ${completed} completed`;
    clearCompletedBtn.classList.toggle('hidden', completed === 0);
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // --- Event Listeners ---
  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    addTask(taskInput.value);
  });

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => setFilter(btn.dataset.filter));
  });

  clearCompletedBtn.addEventListener('click', clearCompletedTasks);

  // Keyboard shortcut: Ctrl/Cmd + Enter to add
  taskInput.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      addTask(taskInput.value);
    }
  });

  // --- Start ---
  init();
});