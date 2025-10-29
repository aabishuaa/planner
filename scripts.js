
const taskInput = document.getElementById('task-input');
const taskCategory = document.getElementById('task-category');
const taskPriority = document.getElementById('task-priority');
const addTaskBtn = document.getElementById('add-task-btn');
const taskList = document.getElementById('task-list');
const emptyTasksEl = document.getElementById('empty-tasks');
const themeToggle = document.getElementById('theme-toggle');
const timerDisplay = document.getElementById('timer-display');
const timerStartBtn = document.getElementById('timer-start');
const timerPauseBtn = document.getElementById('timer-pause');
const timerResetBtn = document.getElementById('timer-reset');
const timerModes = document.querySelectorAll('.timer-mode');
const statsBtn = document.getElementById('stats-btn');
const statsSection = document.getElementById('stats-section');
const tasksCompletedEl = document.getElementById('tasks-completed');
const focusSessionsEl = document.getElementById('focus-sessions');
const focusMinutesEl = document.getElementById('focus-minutes');
const completionProgressEl = document.getElementById('completion-progress');
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const editTaskModal = document.getElementById('edit-task-modal');
const notificationEl = document.getElementById('notification');
const notificationMessageEl = document.getElementById('notification-message');
const taskCompleteSound = document.getElementById('task-complete-sound');
const timerEndSound = document.getElementById('timer-end-sound');
const categoryTags = document.querySelectorAll('.category-tag');

// App State
let tasks = [];
let timer;
let timerMode = 'pomodoro';
let timerRunning = false;
let timeLeft = 25 * 60; // 25 minutes in seconds
let currentTaskId = null;
let stats = {
  tasksCompleted: 0,
  focusSessions: 0,
  focusMinutes: 0,
  tasksCreated: 0
};

// Settings
let settings = {
  darkMode: false,
  soundEnabled: true,
  notificationsEnabled: true,
  autoStartBreaks: false,
  pomodoroDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15
  // Settings (continued)
};

// Initialize App
function init() {
loadTasks();
loadStats();
loadSettings();
updateTimerDisplay();
checkEmptyState();
setupEventListeners();
}

// Event Listeners
function setupEventListeners() {
// Add task
addTaskBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', e => {
if (e.key === 'Enter') addTask();
});

// Filter tasks
categoryTags.forEach(tag => {
tag.addEventListener('click', () => {
  categoryTags.forEach(t => t.classList.remove('active'));
  tag.classList.add('active');
  filterTasks(tag.getAttribute('data-filter'));
});
});

// Timer controls
timerStartBtn.addEventListener('click', startTimer);
timerPauseBtn.addEventListener('click', pauseTimer);
timerResetBtn.addEventListener('click', resetTimer);

// Timer modes
timerModes.forEach(mode => {
mode.addEventListener('click', () => {
  timerModes.forEach(m => m.classList.remove('active'));
  mode.classList.add('active');
  timerMode = mode.getAttribute('data-mode');
  resetTimer();
});
});

// Stats button
statsBtn.addEventListener('click', toggleStats);

// Settings
settingsBtn.addEventListener('click', () => {
openModal(settingsModal);
populateSettingsForm();
});

// Theme toggle
themeToggle.addEventListener('click', toggleTheme);

// Close modals
document.querySelectorAll('.modal-close').forEach(btn => {
btn.addEventListener('click', () => {
  closeAllModals();
});
});

// Save settings
document.getElementById('save-settings').addEventListener('click', saveSettings);

// Update task
document.getElementById('update-task-btn').addEventListener('click', updateTask);
}

// Task Functions
function addTask() {
const text = taskInput.value.trim();
if (!text) return;

const task = {
id: Date.now(),
text,
category: taskCategory.value,
priority: taskPriority.value,
completed: false,
createdAt: new Date().toISOString()
};

tasks.push(task);
saveTasks();
renderTask(task);
checkEmptyState();

// Update stats
stats.tasksCreated++;
saveStats();
updateStatsDisplay();

// Clear input
taskInput.value = '';
taskInput.focus();

// Show notification
showNotification('Task added successfully!');
}

function renderTask(task) {
const li = document.createElement('li');
li.className = `task-item priority-${task.priority}`;
li.id = `task-${task.id}`;
if (task.completed) li.classList.add('completed');

const categoryEmoji = getCategoryEmoji(task.category);
const priorityLabel = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);

li.innerHTML = `
<input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
<div class="task-content">
  <div class="task-text">${task.text}</div>
  <div class="task-meta">
    <span class="task-category">${categoryEmoji} ${task.category}</span>
    <span>${priorityLabel} Priority</span>
  </div>
</div>
<div class="task-actions">
  <button class="task-btn edit">
    <i class="fas fa-edit"></i>
  </button>
  <button class="task-btn delete">
    <i class="fas fa-trash"></i>
  </button>
</div>
`;

taskList.prepend(li);

// Add event listeners
const checkbox = li.querySelector('.task-checkbox');
checkbox.addEventListener('change', () => {
toggleTaskCompletion(task.id);
});

const editBtn = li.querySelector('.edit');
editBtn.addEventListener('click', () => {
editTask(task.id);
});

const deleteBtn = li.querySelector('.delete');
deleteBtn.addEventListener('click', () => {
deleteTask(task.id);
});
}

function toggleTaskCompletion(taskId) {
const taskIndex = tasks.findIndex(task => task.id === taskId);
if (taskIndex === -1) return;

tasks[taskIndex].completed = !tasks[taskIndex].completed;

const taskEl = document.getElementById(`task-${taskId}`);
if (tasks[taskIndex].completed) {
taskEl.classList.add('completed');
// Update stats
stats.tasksCompleted++;
if (settings.soundEnabled) taskCompleteSound.play();
showNotification('Task completed!');
} else {
taskEl.classList.remove('completed');
// Update stats
stats.tasksCompleted--;
}

saveTasks();
saveStats();
updateStatsDisplay();
}

function editTask(taskId) {
const task = tasks.find(task => task.id === taskId);
if (!task) return;

document.getElementById('edit-task-id').value = task.id;
document.getElementById('edit-task-text').value = task.text;
document.getElementById('edit-task-category').value = task.category;
document.getElementById('edit-task-priority').value = task.priority;

openModal(editTaskModal);
}

function updateTask() {
const taskId = parseInt(document.getElementById('edit-task-id').value);
const taskIndex = tasks.findIndex(task => task.id === taskId);
if (taskIndex === -1) return;

tasks[taskIndex].text = document.getElementById('edit-task-text').value;
tasks[taskIndex].category = document.getElementById('edit-task-category').value;
tasks[taskIndex].priority = document.getElementById('edit-task-priority').value;

saveTasks();

// Update UI
const taskEl = document.getElementById(`task-${taskId}`);
taskEl.querySelector('.task-text').textContent = tasks[taskIndex].text;

const categoryEmoji = getCategoryEmoji(tasks[taskIndex].category);
taskEl.querySelector('.task-category').textContent = `${categoryEmoji} ${tasks[taskIndex].category}`;

const priorityLabel = tasks[taskIndex].priority.charAt(0).toUpperCase() + tasks[taskIndex].priority.slice(1);
taskEl.querySelector('.task-meta span:nth-child(2)').textContent = `${priorityLabel} Priority`;

taskEl.className = `task-item priority-${tasks[taskIndex].priority}`;
if (tasks[taskIndex].completed) taskEl.classList.add('completed');

closeAllModals();
showNotification('Task updated successfully!');
}

function deleteTask(taskId) {
const taskEl = document.getElementById(`task-${taskId}`);

// Animation
taskEl.classList.add('crumble');
taskEl.addEventListener('animationend', () => {
// Remove from array
tasks = tasks.filter(task => task.id !== taskId);
saveTasks();

// Remove from DOM
taskEl.remove();
checkEmptyState();
showNotification('Task deleted');
});
}

function filterTasks(category) {
const taskItems = document.querySelectorAll('.task-item');

if (category === 'all') {
taskItems.forEach(item => {
  item.style.display = 'flex';
});
} else {
taskItems.forEach(item => {
  const taskId = parseInt(item.id.replace('task-', ''));
  const task = tasks.find(t => t.id === taskId);
  
  if (task && task.category === category) {
    item.style.display = 'flex';
  } else {
    item.style.display = 'none';
  }
});
}
}

function checkEmptyState() {
if (tasks.length === 0) {
emptyTasksEl.style.display = 'block';
taskList.style.display = 'none';
} else {
emptyTasksEl.style.display = 'none';
taskList.style.display = 'block';
}
}

// Timer Functions
function startTimer() {
if (timerRunning) return;

timerRunning = true;
timerStartBtn.disabled = true;
timerPauseBtn.disabled = false;

if (timerMode === 'pomodoro') {
stats.focusSessions++;
saveStats();
updateStatsDisplay();
}

timer = setInterval(() => {
timeLeft--;

if (timerMode === 'pomodoro') {
  // Count focused minutes
  if (timeLeft % 60 === 0) {
    stats.focusMinutes++;
    saveStats();
    updateStatsDisplay();
  }
}

updateTimerDisplay();

if (timeLeft <= 0) {
  clearInterval(timer);
  timerRunning = false;
  
  // Play sound
  if (settings.soundEnabled) {
    timerEndSound.play();
  }
  
  // Show notification
  if (timerMode === 'pomodoro') {
    showNotification('Focus session completed! Take a break.');
    
    // Auto start break if enabled
    if (settings.autoStartBreaks) {
      timerModes.forEach(mode => {
        if (mode.getAttribute('data-mode') === 'short-break') {
          mode.click();
          startTimer();
        }
      });
    }
  } else {
    showNotification('Break time is over. Ready to focus?');
  }
  
  resetTimer();
}
}, 1000);
}

function pauseTimer() {
clearInterval(timer);
timerRunning = false;
timerStartBtn.disabled = false;
timerPauseBtn.disabled = true;
}

function resetTimer() {
clearInterval(timer);
timerRunning = false;
timerStartBtn.disabled = false;
timerPauseBtn.disabled = true;

// Set time based on mode
switch (timerMode) {
case 'pomodoro':
  timeLeft = settings.pomodoroDuration * 60;
  break;
case 'short-break':
  timeLeft = settings.shortBreakDuration * 60;
  break;
case 'long-break':
  timeLeft = settings.longBreakDuration * 60;
  break;
}

updateTimerDisplay();
}

function updateTimerDisplay() {
const minutes = Math.floor(timeLeft / 60);
const seconds = timeLeft % 60;

timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
document.title = `(${timerDisplay.textContent}) Focus Flow`;
}

// Stats Functions
function toggleStats() {
if (statsSection.style.display === 'none') {
statsSection.style.display = 'block';
updateStatsDisplay();
} else {
statsSection.style.display = 'none';
}
}

function updateStatsDisplay() {
tasksCompletedEl.textContent = stats.tasksCompleted;
focusSessionsEl.textContent = stats.focusSessions;
focusMinutesEl.textContent = stats.focusMinutes;

// Calculate completion rate
const completionRate = stats.tasksCreated > 0 
? Math.round((stats.tasksCompleted / stats.tasksCreated) * 100) 
: 0;

completionProgressEl.style.width = `${completionRate}%`;
}

// Settings Functions
function populateSettingsForm() {
document.getElementById('dark-mode-toggle').checked = settings.darkMode;
document.getElementById('sound-toggle').checked = settings.soundEnabled;
document.getElementById('notification-toggle').checked = settings.notificationsEnabled;
document.getElementById('auto-break-toggle').checked = settings.autoStartBreaks;
document.getElementById('pomodoro-duration').value = settings.pomodoroDuration;
document.getElementById('short-break-duration').value = settings.shortBreakDuration;
document.getElementById('long-break-duration').value = settings.longBreakDuration;
}

function saveSettings() {
settings.darkMode = document.getElementById('dark-mode-toggle').checked;
settings.soundEnabled = document.getElementById('sound-toggle').checked;
settings.notificationsEnabled = document.getElementById('notification-toggle').checked;
settings.autoStartBreaks = document.getElementById('auto-break-toggle').checked;
settings.pomodoroDuration = parseInt(document.getElementById('pomodoro-duration').value);
settings.shortBreakDuration = parseInt(document.getElementById('short-break-duration').value);
settings.longBreakDuration = parseInt(document.getElementById('long-break-duration').value);

saveSettingsToStorage();

// Apply settings
applyTheme();
resetTimer();

closeAllModals();
showNotification('Settings saved');
}

function toggleTheme() {
settings.darkMode = !settings.darkMode;
saveSettingsToStorage();
applyTheme();
}

function applyTheme() {
if (settings.darkMode) {
document.body.classList.add('dark');
themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
} else {
document.body.classList.remove('dark');
themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
}
}

// Modal Functions
function openModal(modal) {
closeAllModals();
modal.classList.add('active');
}

function closeAllModals() {
document.querySelectorAll('.modal').forEach(modal => {
modal.classList.remove('active');
});
}

// Notification Functions
function showNotification(message) {
notificationMessageEl.textContent = message;
notificationEl.classList.add('show');

setTimeout(() => {
notificationEl.classList.remove('show');
}, 3000);

// Desktop notification
if (settings.notificationsEnabled && "Notification" in window) {
if (Notification.permission === "granted") {
  new Notification("Focus Flow", { body: message });
} else if (Notification.permission !== "denied") {
  Notification.requestPermission().then(permission => {
    if (permission === "granted") {
      new Notification("Focus Flow", { body: message });
    }
  });
}
}
}

// Helper Functions
function getCategoryEmoji(category) {
switch (category) {
case 'work': return '💼';
case 'personal': return '👤';
case 'health': return '💪';
case 'study': return '📚';
case 'other': return '🔄';
default: return '🔄';
}
}

// Storage Functions
function saveTasks() {
localStorage.setItem('focus-flow-tasks', JSON.stringify(tasks));
}

function loadTasks() {
const storedTasks = localStorage.getItem('focus-flow-tasks');
if (storedTasks) {
tasks = JSON.parse(storedTasks);
tasks.forEach(task => renderTask(task));
}
}

function saveStats() {
localStorage.setItem('focus-flow-stats', JSON.stringify(stats));
}

function loadStats() {
const storedStats = localStorage.getItem('focus-flow-stats');
if (storedStats) {
stats = JSON.parse(storedStats);
}
}

function saveSettingsToStorage() {
localStorage.setItem('focus-flow-settings', JSON.stringify(settings));
}

function loadSettings() {
const storedSettings = localStorage.getItem('focus-flow-settings');
if (storedSettings) {
settings = JSON.parse(storedSettings);
}
applyTheme();
}

// Initialize the app
init();
