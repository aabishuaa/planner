// Life Planner Application
// Organized planner for managing work, personal tasks, schedules, and deadlines

class LifePlanner {
    constructor() {
        // Data storage
        this.workTasks = [];
        this.personalTasks = [];
        this.scheduleItems = [];
        this.weeklyRoutines = {
            Monday: [],
            Tuesday: [],
            Wednesday: [],
            Thursday: [],
            Friday: [],
            Saturday: [],
            Sunday: []
        };
        this.deadlines = [];

        // UI state
        this.currentTab = 'work';
        this.editingItem = null;

        // Calendar state
        this.currentCalendarDate = new Date();

        // Initialize
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.updateUI();
        this.updateDate();
        this.checkDeadlines();
    }

    // Event Listeners Setup
    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.closest('.tab-btn').dataset.tab));
        });

        // Work Tasks
        document.getElementById('addWorkTaskBtn')?.addEventListener('click', () => this.addWorkTask());
        document.getElementById('workTaskTitle')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) this.addWorkTask();
        });

        // Personal Tasks
        document.getElementById('addPersonalTaskBtn')?.addEventListener('click', () => this.addPersonalTask());
        document.getElementById('personalTaskTitle')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) this.addPersonalTask();
        });

        // Schedule
        document.getElementById('addScheduleBtn')?.addEventListener('click', () => this.addScheduleItem());

        // Weekly Routines
        document.getElementById('addRoutineBtn')?.addEventListener('click', () => this.addWeeklyRoutine());

        // Modal controls
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
        });

        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal();
            });
        });

        // Theme toggle
        document.getElementById('themeToggle')?.addEventListener('click', () => this.toggleTheme());

        // Calendar navigation
        document.getElementById('prevMonthBtn')?.addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('nextMonthBtn')?.addEventListener('click', () => this.changeMonth(1));
        document.getElementById('todayBtn')?.addEventListener('click', () => this.goToToday());
    }

    // Tab Management
    switchTab(tabName) {
        this.currentTab = tabName;

        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}Tab`);
        });

        this.updateUI();
    }

    // Work Tasks Management
    addWorkTask() {
        const titleInput = document.getElementById('workTaskTitle');
        const descInput = document.getElementById('workTaskDesc');
        const deadlineInput = document.getElementById('workTaskDeadline');
        const prioritySelect = document.getElementById('workTaskPriority');

        const title = titleInput?.value.trim();
        if (!title) {
            this.showNotification('Please enter a task title', 'warning');
            return;
        }

        const task = {
            id: Date.now(),
            title,
            description: descInput?.value.trim() || '',
            deadline: deadlineInput?.value || null,
            priority: prioritySelect?.value || 'medium',
            completed: false,
            createdAt: new Date().toISOString(),
            type: 'work'
        };

        this.workTasks.push(task);
        this.saveData();
        this.renderWorkTasks();

        // Clear inputs
        if (titleInput) titleInput.value = '';
        if (descInput) descInput.value = '';
        if (deadlineInput) deadlineInput.value = '';
        if (prioritySelect) prioritySelect.value = 'medium';

        this.showNotification('Work task added successfully!');

        // Add to deadlines if deadline is set
        if (task.deadline) {
            this.addToDeadlines(task);
        }
    }

    renderWorkTasks() {
        const container = document.getElementById('workTasksList');
        if (!container) return;

        if (this.workTasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-briefcase"></i>
                    <h3>No work tasks yet</h3>
                    <p>Add your first work task to get organized!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.workTasks
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .map(task => this.renderTaskItem(task, 'work'))
            .join('');

        this.attachTaskListeners('work');
    }

    // Personal Tasks Management
    addPersonalTask() {
        const titleInput = document.getElementById('personalTaskTitle');
        const descInput = document.getElementById('personalTaskDesc');
        const deadlineInput = document.getElementById('personalTaskDeadline');
        const prioritySelect = document.getElementById('personalTaskPriority');

        const title = titleInput?.value.trim();
        if (!title) {
            this.showNotification('Please enter a task title', 'warning');
            return;
        }

        const task = {
            id: Date.now(),
            title,
            description: descInput?.value.trim() || '',
            deadline: deadlineInput?.value || null,
            priority: prioritySelect?.value || 'medium',
            completed: false,
            createdAt: new Date().toISOString(),
            type: 'personal'
        };

        this.personalTasks.push(task);
        this.saveData();
        this.renderPersonalTasks();

        // Clear inputs
        if (titleInput) titleInput.value = '';
        if (descInput) descInput.value = '';
        if (deadlineInput) deadlineInput.value = '';
        if (prioritySelect) prioritySelect.value = 'medium';

        this.showNotification('Personal task added successfully!');

        // Add to deadlines if deadline is set
        if (task.deadline) {
            this.addToDeadlines(task);
        }
    }

    renderPersonalTasks() {
        const container = document.getElementById('personalTasksList');
        if (!container) return;

        if (this.personalTasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-heart"></i>
                    <h3>No personal tasks yet</h3>
                    <p>Add your first personal task to stay organized!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.personalTasks
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .map(task => this.renderTaskItem(task, 'personal'))
            .join('');

        this.attachTaskListeners('personal');
    }

    // Generic Task Renderer
    renderTaskItem(task, type) {
        const isOverdue = task.deadline && new Date(task.deadline) < new Date() && !task.completed;
        const deadlineText = task.deadline ? new Date(task.deadline).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }) : '';

        return `
            <div class="item ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''} priority-${task.priority}" data-id="${task.id}" data-type="${type}">
                <input type="checkbox" class="item-checkbox" ${task.completed ? 'checked' : ''}
                       onchange="planner.toggleTaskComplete('${type}', ${task.id})">
                <div class="item-content">
                    <div class="item-title">${this.escapeHtml(task.title)}</div>
                    ${task.description ? `<div class="item-description">${this.escapeHtml(task.description)}</div>` : ''}
                    <div class="item-meta">
                        <span class="meta-badge ${type}">${type === 'work' ? '<i class="fas fa-briefcase"></i> Work' : '<i class="fas fa-heart"></i> Personal'}</span>
                        <span class="meta-badge">Priority: ${task.priority}</span>
                        ${task.deadline ? `<span class="meta-badge deadline ${isOverdue ? 'overdue-badge' : ''}">
                            <i class="fas fa-calendar"></i> ${deadlineText}
                            ${isOverdue ? ' - OVERDUE' : ''}
                        </span>` : ''}
                    </div>
                </div>
                <div class="item-actions">
                    <button class="action-btn edit-btn" onclick="planner.editTask('${type}', ${task.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="planner.deleteTask('${type}', ${task.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    // Task Operations
    toggleTaskComplete(type, id) {
        const tasks = type === 'work' ? this.workTasks : this.personalTasks;
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveData();
            this.updateUI();
            this.showNotification(task.completed ? 'Task completed!' : 'Task marked incomplete');
        }
    }

    editTask(type, id) {
        const tasks = type === 'work' ? this.workTasks : this.personalTasks;
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        // Populate modal
        const modal = document.getElementById('editTaskModal');
        document.getElementById('editTaskId').value = id;
        document.getElementById('editTaskType').value = type;
        document.getElementById('editTaskTitle').value = task.title;
        document.getElementById('editTaskDesc').value = task.description || '';
        document.getElementById('editTaskDeadline').value = task.deadline || '';
        document.getElementById('editTaskPriority').value = task.priority;

        modal.classList.add('active');

        // Setup save button
        const saveBtn = document.getElementById('saveTaskBtn');
        saveBtn.onclick = () => this.saveEditedTask();
    }

    saveEditedTask() {
        const id = parseInt(document.getElementById('editTaskId').value);
        const type = document.getElementById('editTaskType').value;
        const tasks = type === 'work' ? this.workTasks : this.personalTasks;
        const task = tasks.find(t => t.id === id);

        if (task) {
            task.title = document.getElementById('editTaskTitle').value.trim();
            task.description = document.getElementById('editTaskDesc').value.trim();
            task.deadline = document.getElementById('editTaskDeadline').value;
            task.priority = document.getElementById('editTaskPriority').value;

            this.saveData();
            this.updateUI();
            this.closeModal();
            this.showNotification('Task updated successfully!');

            // Update deadlines
            this.checkDeadlines();
        }
    }

    async deleteTask(type, id) {
        const confirmed = await this.showConfirm(
            'Are you sure you want to delete this task?',
            'Delete Task'
        );

        if (!confirmed) return;

        if (type === 'work') {
            this.workTasks = this.workTasks.filter(t => t.id !== id);
        } else {
            this.personalTasks = this.personalTasks.filter(t => t.id !== id);
        }

        this.saveData();
        this.updateUI();
        this.showNotification('Task deleted');
    }

    attachTaskListeners(type) {
        // Event listeners are handled inline via onclick attributes for simplicity
    }

    // Schedule Management
    addScheduleItem() {
        const titleInput = document.getElementById('scheduleTitle');
        const dateInput = document.getElementById('scheduleDate');
        const timeInput = document.getElementById('scheduleTime');
        const descInput = document.getElementById('scheduleDesc');

        const title = titleInput?.value.trim();
        const date = dateInput?.value;

        if (!title || !date) {
            this.showNotification('Please enter title and date', 'warning');
            return;
        }

        const item = {
            id: Date.now(),
            title,
            date,
            time: timeInput?.value || '',
            description: descInput?.value.trim() || '',
            createdAt: new Date().toISOString()
        };

        this.scheduleItems.push(item);
        this.saveData();
        this.renderSchedule();
        this.renderCalendar();

        // Clear inputs
        if (titleInput) titleInput.value = '';
        if (dateInput) dateInput.value = '';
        if (timeInput) timeInput.value = '';
        if (descInput) descInput.value = '';

        this.showNotification('Schedule item added!');
    }

    renderSchedule() {
        const container = document.getElementById('scheduleList');
        if (!container) return;

        if (this.scheduleItems.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-alt"></i>
                    <h3>No scheduled items</h3>
                    <p>Add your commitments and appointments here!</p>
                </div>
            `;
            return;
        }

        // Sort by date
        const sorted = [...this.scheduleItems].sort((a, b) => {
            const dateA = new Date(a.date + ' ' + (a.time || '00:00'));
            const dateB = new Date(b.date + ' ' + (b.time || '00:00'));
            return dateA - dateB;
        });

        container.innerHTML = sorted.map(item => {
            const itemDate = new Date(item.date);
            const isPast = itemDate < new Date() && itemDate.toDateString() !== new Date().toDateString();

            return `
                <div class="item ${isPast ? 'completed' : ''}" data-id="${item.id}">
                    <div class="item-content" style="flex: 1;">
                        <div class="item-title">${this.escapeHtml(item.title)}</div>
                        ${item.description ? `<div class="item-description">${this.escapeHtml(item.description)}</div>` : ''}
                        <div class="item-meta">
                            <span class="meta-badge deadline">
                                <i class="fas fa-calendar"></i> ${itemDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            ${item.time ? `<span class="meta-badge"><i class="fas fa-clock"></i> ${item.time}</span>` : ''}
                        </div>
                    </div>
                    <div class="item-actions">
                        <button class="action-btn delete-btn" onclick="planner.deleteScheduleItem(${item.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    async deleteScheduleItem(id) {
        const confirmed = await this.showConfirm(
            'Are you sure you want to delete this schedule item?',
            'Delete Schedule Item'
        );

        if (!confirmed) return;

        this.scheduleItems = this.scheduleItems.filter(item => item.id !== id);
        this.saveData();
        this.renderSchedule();
        this.renderCalendar();
        this.showNotification('Schedule item deleted');
    }

    // Weekly Routines Management
    addWeeklyRoutine() {
        const daySelect = document.getElementById('routineDay');
        const titleInput = document.getElementById('routineTitle');
        const timeInput = document.getElementById('routineTime');

        const day = daySelect?.value;
        const title = titleInput?.value.trim();

        if (!day || !title) {
            this.showNotification('Please select day and enter title', 'warning');
            return;
        }

        const routine = {
            id: Date.now(),
            title,
            time: timeInput?.value || '',
            day
        };

        this.weeklyRoutines[day].push(routine);
        this.saveData();
        this.renderWeeklyRoutines();

        // Clear inputs
        if (titleInput) titleInput.value = '';
        if (timeInput) timeInput.value = '';

        this.showNotification('Weekly routine added!');
    }

    renderWeeklyRoutines() {
        const container = document.getElementById('weeklyRoutinesList');
        if (!container) return;

        const allRoutines = Object.values(this.weeklyRoutines).flat();
        if (allRoutines.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-sync-alt"></i>
                    <h3>No weekly routines</h3>
                    <p>Add recurring tasks that happen every week!</p>
                </div>
            `;
            return;
        }

        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

        container.innerHTML = days.map(day => {
            const routines = this.weeklyRoutines[day];
            if (routines.length === 0) return '';

            return `
                <div class="day-schedule">
                    <div class="day-header">
                        <span><i class="fas fa-calendar-day"></i> ${day}</span>
                        <span>${routines.length} routine${routines.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div class="day-items">
                        ${routines.map(routine => `
                            <div class="item" data-id="${routine.id}" style="margin-bottom: 12px;">
                                <div class="item-content" style="flex: 1;">
                                    <div class="item-title">${this.escapeHtml(routine.title)}</div>
                                    ${routine.time ? `<div class="item-meta">
                                        <span class="meta-badge"><i class="fas fa-clock"></i> ${routine.time}</span>
                                    </div>` : ''}
                                </div>
                                <div class="item-actions">
                                    <button class="action-btn delete-btn" onclick="planner.deleteWeeklyRoutine('${day}', ${routine.id})">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    async deleteWeeklyRoutine(day, id) {
        const confirmed = await this.showConfirm(
            'Are you sure you want to delete this weekly routine?',
            'Delete Routine'
        );

        if (!confirmed) return;

        this.weeklyRoutines[day] = this.weeklyRoutines[day].filter(r => r.id !== id);
        this.saveData();
        this.renderWeeklyRoutines();
        this.showNotification('Routine deleted');
    }

    // Deadline Management
    addToDeadlines(task) {
        this.checkDeadlines();
    }

    checkDeadlines() {
        // Collect all items with deadlines
        const allDeadlines = [
            ...this.workTasks.filter(t => t.deadline && !t.completed),
            ...this.personalTasks.filter(t => t.deadline && !t.completed)
        ];

        // Sort by deadline
        allDeadlines.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

        this.renderDeadlines(allDeadlines);
    }

    renderDeadlines(deadlines) {
        const container = document.getElementById('deadlinesList');
        if (!container) return;

        if (deadlines.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-flag-checkered"></i>
                    <h3>No upcoming deadlines</h3>
                    <p>Add deadlines to your tasks to track them here!</p>
                </div>
            `;
            return;
        }

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        container.innerHTML = deadlines.map(item => {
            const deadline = new Date(item.deadline);
            const daysRemaining = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

            let urgencyClass = 'comfortable';
            let urgencyText = `${daysRemaining} days remaining`;

            if (daysRemaining < 0) {
                urgencyClass = 'urgent';
                urgencyText = `${Math.abs(daysRemaining)} days overdue`;
            } else if (daysRemaining === 0) {
                urgencyClass = 'urgent';
                urgencyText = 'Due today!';
            } else if (daysRemaining <= 3) {
                urgencyClass = 'urgent';
            } else if (daysRemaining <= 7) {
                urgencyClass = 'soon';
            }

            return `
                <div class="deadline-card ${urgencyClass}">
                    <div class="deadline-title">${this.escapeHtml(item.title)}</div>
                    <div class="deadline-date">
                        <i class="fas fa-calendar"></i> ${deadline.toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                        })}
                    </div>
                    <div class="days-remaining ${urgencyClass}">
                        ${urgencyText}
                    </div>
                    <div style="margin-top: 8px;">
                        <span class="meta-badge ${item.type}">${item.type === 'work' ? 'Work' : 'Personal'}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Calendar Methods
    changeMonth(delta) {
        this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() + delta);
        this.renderCalendar();
    }

    goToToday() {
        this.currentCalendarDate = new Date();
        this.renderCalendar();
        this.showNotification('Jumped to current month');
    }

    renderCalendar() {
        const year = this.currentCalendarDate.getFullYear();
        const month = this.currentCalendarDate.getMonth();

        // Update header
        const monthYearEl = document.getElementById('calendarMonthYear');
        if (monthYearEl) {
            monthYearEl.textContent = new Date(year, month).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric'
            });
        }

        const grid = document.getElementById('calendarGrid');
        if (!grid) return;

        // Clear grid
        grid.innerHTML = '';

        // Add day headers
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayHeaders.forEach(day => {
            const header = document.createElement('div');
            header.className = 'calendar-day-header';
            header.textContent = day;
            grid.appendChild(header);
        });

        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        // Get today for highlighting
        const today = new Date();
        const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

        // Add previous month's trailing days
        for (let i = firstDay - 1; i >= 0; i--) {
            const day = daysInPrevMonth - i;
            const dayEl = this.createCalendarDay(day, month - 1, year, true);
            grid.appendChild(dayEl);
        }

        // Add current month's days
        for (let day = 1; day <= daysInMonth; day++) {
            const isToday = isCurrentMonth && day === today.getDate();
            const dayEl = this.createCalendarDay(day, month, year, false, isToday);
            grid.appendChild(dayEl);
        }

        // Add next month's leading days
        const totalCells = grid.children.length - 7; // Subtract headers
        const remainingCells = 42 - totalCells; // 6 rows * 7 days
        for (let day = 1; day <= remainingCells; day++) {
            const dayEl = this.createCalendarDay(day, month + 1, year, true);
            grid.appendChild(dayEl);
        }
    }

    createCalendarDay(day, month, year, isOtherMonth, isToday = false) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';

        if (isOtherMonth) {
            dayEl.classList.add('other-month');
        }
        if (isToday) {
            dayEl.classList.add('today');
        }

        // Get events and deadlines for this day
        const dateStr = this.formatDateForComparison(year, month, day);
        const events = this.getEventsForDate(dateStr);
        const deadlines = this.getDeadlinesForDate(dateStr);

        if (events.length > 0) {
            dayEl.classList.add('has-event');
        }
        if (deadlines.length > 0) {
            dayEl.classList.add('has-deadline');
        }

        // Day number
        const numberEl = document.createElement('div');
        numberEl.className = 'calendar-day-number';
        numberEl.textContent = day;
        dayEl.appendChild(numberEl);

        // Event indicators
        if (!isOtherMonth && (events.length > 0 || deadlines.length > 0)) {
            const eventsContainer = document.createElement('div');
            eventsContainer.className = 'calendar-day-events';

            // Add event dots
            for (let i = 0; i < Math.min(events.length, 2); i++) {
                const dot = document.createElement('div');
                dot.className = 'calendar-event-dot';
                eventsContainer.appendChild(dot);
            }

            // Add deadline dots
            for (let i = 0; i < Math.min(deadlines.length, 2); i++) {
                const dot = document.createElement('div');
                dot.className = 'calendar-deadline-dot';
                eventsContainer.appendChild(dot);
            }

            dayEl.appendChild(eventsContainer);

            // Count indicator
            const total = events.length + deadlines.length;
            if (total > 2) {
                const countEl = document.createElement('div');
                countEl.className = 'calendar-day-count';
                countEl.textContent = `+${total - 2}`;
                dayEl.appendChild(countEl);
            }
        }

        // Click handler to select date
        dayEl.addEventListener('click', () => {
            const selectedDate = this.formatDateForInput(year, month, day);
            const dateInput = document.getElementById('scheduleDate');
            if (dateInput) {
                dateInput.value = selectedDate;
                document.getElementById('scheduleTitle')?.focus();
            }
        });

        return dayEl;
    }

    formatDateForComparison(year, month, day) {
        const date = new Date(year, month, day);
        return date.toISOString().split('T')[0];
    }

    formatDateForInput(year, month, day) {
        const y = year;
        const m = String(month + 1).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    getEventsForDate(dateStr) {
        return this.scheduleItems.filter(item => item.date === dateStr);
    }

    getDeadlinesForDate(dateStr) {
        return [
            ...this.workTasks.filter(t => t.deadline === dateStr && !t.completed),
            ...this.personalTasks.filter(t => t.deadline === dateStr && !t.completed)
        ];
    }

    // UI Updates
    updateUI() {
        this.renderWorkTasks();
        this.renderPersonalTasks();
        this.renderSchedule();
        this.renderWeeklyRoutines();
        this.renderCalendar();
        this.checkDeadlines();
        this.updateHeaderStats();
    }

    updateDate() {
        const dateEl = document.getElementById('currentDate');
        if (dateEl) {
            const now = new Date();
            dateEl.textContent = now.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    }

    updateHeaderStats() {
        // Count active tasks
        const activeTasks = this.workTasks.filter(t => !t.completed).length +
                          this.personalTasks.filter(t => !t.completed).length;

        // Count upcoming events (future events)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const upcomingEvents = this.scheduleItems.filter(item => {
            const eventDate = new Date(item.date);
            return eventDate >= today;
        }).length;

        // Count urgent deadlines (within 3 days or overdue)
        const threeDaysFromNow = new Date(today);
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

        const urgentDeadlines = [
            ...this.workTasks.filter(t => t.deadline && !t.completed),
            ...this.personalTasks.filter(t => t.deadline && !t.completed)
        ].filter(task => {
            const deadline = new Date(task.deadline);
            return deadline <= threeDaysFromNow;
        }).length;

        // Update DOM
        const activeTasksEl = document.getElementById('activeTasksCount');
        const upcomingEventsEl = document.getElementById('upcomingEventsCount');
        const urgentDeadlinesEl = document.getElementById('urgentDeadlinesCount');

        if (activeTasksEl) activeTasksEl.textContent = activeTasks;
        if (upcomingEventsEl) upcomingEventsEl.textContent = upcomingEvents;
        if (urgentDeadlinesEl) urgentDeadlinesEl.textContent = urgentDeadlines;
    }

    // Theme Management
    toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDark);
        this.showNotification(`${isDark ? 'Dark' : 'Light'} mode enabled`);
    }

    // Modal Management
    closeModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    // Custom Confirmation Modal
    showConfirm(message, title = 'Confirm Action') {
        return new Promise((resolve) => {
            const modal = document.getElementById('confirmModal');
            const messageEl = document.getElementById('confirmModalMessage');
            const titleEl = document.getElementById('confirmModalTitle');
            const okBtn = document.getElementById('confirmOkBtn');
            const cancelBtn = document.getElementById('confirmCancelBtn');

            // Set content
            messageEl.textContent = message;
            titleEl.textContent = title;

            // Show modal
            modal.classList.add('active');

            // Handle button clicks
            const handleOk = () => {
                modal.classList.remove('active');
                cleanup();
                resolve(true);
            };

            const handleCancel = () => {
                modal.classList.remove('active');
                cleanup();
                resolve(false);
            };

            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    handleCancel();
                }
            };

            const cleanup = () => {
                okBtn.removeEventListener('click', handleOk);
                cancelBtn.removeEventListener('click', handleCancel);
                document.removeEventListener('keydown', handleEscape);
            };

            // Add event listeners
            okBtn.addEventListener('click', handleOk);
            cancelBtn.addEventListener('click', handleCancel);
            document.addEventListener('keydown', handleEscape);

            // Close on backdrop click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    handleCancel();
                }
            }, { once: true });
        });
    }

    // Notifications
    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        if (!notification) return;

        notification.querySelector('.notification-message').textContent = message;
        notification.classList.add('show');

        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    // Data Persistence
    saveData() {
        const data = {
            workTasks: this.workTasks,
            personalTasks: this.personalTasks,
            scheduleItems: this.scheduleItems,
            weeklyRoutines: this.weeklyRoutines
        };
        localStorage.setItem('lifePlannerData', JSON.stringify(data));
    }

    loadData() {
        try {
            const saved = localStorage.getItem('lifePlannerData');
            if (saved) {
                const data = JSON.parse(saved);
                this.workTasks = data.workTasks || [];
                this.personalTasks = data.personalTasks || [];
                this.scheduleItems = data.scheduleItems || [];
                this.weeklyRoutines = data.weeklyRoutines || {
                    Monday: [], Tuesday: [], Wednesday: [], Thursday: [],
                    Friday: [], Saturday: [], Sunday: []
                };
            }

            // Load theme preference
            const darkMode = localStorage.getItem('darkMode') === 'true';
            if (darkMode) {
                document.body.classList.add('dark-mode');
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    // Utility Functions
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app when DOM is loaded
let planner;
document.addEventListener('DOMContentLoaded', () => {
    planner = new LifePlanner();
});
