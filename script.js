
class TaskManager {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.currentTaskId = this.tasks.length > 0 ? Math.max(...this.tasks.map(t => t.id)) + 1 : 1;
        this.editMode = false;
        this.currentEditId = null;
        this.currentFilter = 'all';
        
        this.initializeElements();
        this.attachEventListeners();
        this.renderTasks();
        this.updateStats();
    }
    
    initializeElements() {
        this.taskForm = document.getElementById('task-form');
        this.taskIdInput = document.getElementById('task-id');
        this.taskTitleInput = document.getElementById('task-title');
        this.taskDescriptionInput = document.getElementById('task-description');
        this.taskPriorityInput = document.getElementById('task-priority');
        this.taskDueDateInput = document.getElementById('task-due-date');
        this.submitBtn = document.getElementById('submit-btn');
        this.cancelBtn = document.getElementById('cancel-btn');
        this.formTitle = document.getElementById('form-title');
        this.tasksContainer = document.getElementById('tasks-container');
        this.searchInput = document.getElementById('search-input');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.totalTasksEl = document.getElementById('total-tasks');
        this.pendingTasksEl = document.getElementById('pending-tasks');
        this.completedTasksEl = document.getElementById('completed-tasks');
    }
    
    attachEventListeners() {
       
        this.taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });
        
 
        this.cancelBtn.addEventListener('click', () => {
            this.resetForm();
        });
        

        this.searchInput.addEventListener('input', () => {
            this.renderTasks();
        });
        
   
        this.filterButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.filterButtons.forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.renderTasks();
            });
        });
        
  
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                this.taskForm.dispatchEvent(new Event('submit'));
            }
        });
    }
    
    handleFormSubmit() {
        const title = this.taskTitleInput.value.trim();
        const description = this.taskDescriptionInput.value.trim();
        const priority = this.taskPriorityInput.value;
        const dueDate = this.taskDueDateInput.value;
        
        if (!title) {
            alert('Please enter a task title');
            return;
        }
        
        if (this.editMode) {
            this.updateTask(this.currentEditId, { title, description, priority, dueDate });
        } else {
            this.addTask({ title, description, priority, dueDate });
        }
        
        this.resetForm();
    }
    
    addTask(taskData) {
        const task = {
            id: this.currentTaskId++,
            ...taskData,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        this.tasks.push(task);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
    
        this.showNotification('Task added successfully!', 'success');
    }
    
    updateTask(id, updatedData) {
        const taskIndex = this.tasks.findIndex(task => task.id === id);
        if (taskIndex !== -1) {
            this.tasks[taskIndex] = { ...this.tasks[taskIndex], ...updatedData };
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            
         
            this.showNotification('Task updated successfully!', 'success');
        }
    }
    
    deleteTask(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(task => task.id !== id);
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            
          
            this.showNotification('Task deleted successfully!', 'success');
        }
    }
    
    toggleTaskCompletion(id) {
        const task = this.tasks.find(task => task.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            
            
            const message = task.completed ? 'Task marked as completed!' : 'Task marked as pending!';
            this.showNotification(message, 'info');
        }
    }
    
    editTask(id) {
        const task = this.tasks.find(task => task.id === id);
        if (task) {
            this.taskIdInput.value = task.id;
            this.taskTitleInput.value = task.title;
            this.taskDescriptionInput.value = task.description || '';
            this.taskPriorityInput.value = task.priority;
            this.taskDueDateInput.value = task.dueDate || '';
            
            this.formTitle.textContent = 'Edit Task';
            this.submitBtn.textContent = 'Update Task';
            this.submitBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Update Task';
            
            this.editMode = true;
            this.currentEditId = id;
            
       
            document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
        }
    }
    
    resetForm() {
        this.taskForm.reset();
        this.taskIdInput.value = '';
        this.formTitle.textContent = 'Add New Task';
        this.submitBtn.textContent = 'Add Task';
        this.submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add Task';
        this.editMode = false;
        this.currentEditId = null;
    }
    
    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }
    
    filterTasks(tasks) {
        let filteredTasks = tasks;
        if (this.currentFilter === 'pending') {
            filteredTasks = tasks.filter(task => !task.completed);
        } else if (this.currentFilter === 'completed') {
            filteredTasks = tasks.filter(task => task.completed);
        }
        
        const searchTerm = this.searchInput.value.toLowerCase();
        if (searchTerm) {
            filteredTasks = filteredTasks.filter(task => 
                task.title.toLowerCase().includes(searchTerm) || 
                (task.description && task.description.toLowerCase().includes(searchTerm))
            );
        }
        
        return filteredTasks;
    }
    
    renderTasks() {
        const filteredTasks = this.filterTasks(this.tasks);
        
        if (filteredTasks.length === 0) {
            this.tasksContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <h3>No tasks found</h3>
                    <p>${this.searchInput.value ? 'Try a different search term' : 'Add your first task to get started!'}</p>
                </div>
            `;
            return;
        }
        
       
        const sortedTasks = [...filteredTasks].sort((a, b) => {
          
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            
           
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            }
           
            if (a.dueDate && b.dueDate) {
                return new Date(a.dueDate) - new Date(b.dueDate);
            }
            
           
            if (a.dueDate && !b.dueDate) return -1;
            if (!a.dueDate && b.dueDate) return 1;
            
            
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
        
        this.tasksContainer.innerHTML = sortedTasks.map(task => this.createTaskElement(task)).join('');
        
      
        this.tasksContainer.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const taskId = parseInt(e.target.closest('.task-card').dataset.id);
                this.editTask(taskId);
            });
        });
        
        this.tasksContainer.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const taskId = parseInt(e.target.closest('.task-card').dataset.id);
                this.deleteTask(taskId);
            });
        });
        
        this.tasksContainer.querySelectorAll('.complete-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const taskId = parseInt(e.target.closest('.task-card').dataset.id);
                this.toggleTaskCompletion(taskId);
            });
        });
    }
    
    createTaskElement(task) {
        const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date';
        const priorityClass = `priority-${task.priority}`;
        const completedClass = task.completed ? 'completed' : '';
        
        return `
            <div class="task-card ${completedClass}" data-id="${task.id}">
                <div class="task-header">
                    <h3 class="task-title">${this.escapeHtml(task.title)}</h3>
                    <span class="task-priority ${priorityClass}">${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</span>
                </div>
                <p class="task-description">${this.escapeHtml(task.description || '')}</p>
                <div class="task-footer">
                    <div class="task-date">
                        <i class="far fa-calendar-alt"></i> ${dueDate}
                    </div>
                    <div class="task-actions">
                        <button class="action-btn complete-btn" title="${task.completed ? 'Mark as pending' : 'Mark as completed'}">
                            <i class="fas fa-${task.completed ? 'undo' : 'check'}"></i>
                        </button>
                        <button class="action-btn edit-btn" title="Edit task">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" title="Delete task">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(task => task.completed).length;
        const pending = total - completed;
        
        this.totalTasksEl.textContent = total;
        this.pendingTasksEl.textContent = pending;
        this.completedTasksEl.textContent = completed;
    }
    
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '<',
            '>': '>',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
    
    showNotification(message, type = 'info') {
        
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
    
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
   
        document.body.appendChild(notification);
        
  
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}


document.addEventListener('DOMContentLoaded', () => {
    window.taskManager = new TaskManager();
    
    
    if (window.taskManager.tasks.length === 0) {
        const sampleTasks = [
            {
                title: 'Complete project proposal',
                description: 'Finish the project proposal document and send it to the client for review.',
                priority: 'high',
                dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                completed: false
            },
            {
                title: 'Team meeting',
                description: 'Weekly team sync to discuss project progress and upcoming tasks.',
                priority: 'medium',
                dueDate: new Date().toISOString().split('T')[0],
                completed: true
            },
            {
                title: 'Research new technologies',
                description: 'Research and evaluate new frontend frameworks for future projects.',
                priority: 'low',
                dueDate: '',
                completed: false
            }
        ];
        
        sampleTasks.forEach(task => {
            window.taskManager.addTask(task);
        });
    }
});