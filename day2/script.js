class TodoApp {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('todoTasks')) || [];
        this.currentFilter = 'all';
        this.taskIdCounter = this.tasks.length > 0 ? Math.max(...this.tasks.map(t => t.id)) + 1 : 1;
        
        this.initializeElements();
        this.attachEventListeners();
        this.render();
    }

    initializeElements() {
        this.taskInput = document.getElementById('taskInput');
        this.addBtn = document.getElementById('addBtn');
        this.taskList = document.getElementById('taskList');
        this.emptyState = document.getElementById('emptyState');
        this.totalTasks = document.getElementById('totalTasks');
        this.completedTasks = document.getElementById('completedTasks');
        this.clearCompleted = document.getElementById('clearCompleted');
        this.filterBtns = document.querySelectorAll('.filter-btn');
    }

    attachEventListeners() {
        this.addBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });
        
        this.clearCompleted.addEventListener('click', () => this.clearCompletedTasks());
        
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
        });
    }

    addTask() {
        const text = this.taskInput.value.trim();
        if (!text) return;

        const task = {
            id: this.taskIdCounter++,
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.unshift(task);
        this.taskInput.value = '';
        this.saveToLocalStorage();
        this.render();
        
       
        this.taskInput.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.taskInput.style.transform = 'scale(1)';
        }, 100);
    }

    deleteTask(id) {
        const taskElement = document.querySelector(`[data-id="${id}"]`);
        taskElement.classList.add('removing');
        
        setTimeout(() => {
            this.tasks = this.tasks.filter(task => task.id !== id);
            this.saveToLocalStorage();
            this.render();
        }, 300);
    }

    toggleTask(id) {
        const task = this.tasks.find(task => task.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveToLocalStorage();
            this.render();
        }
    }

    editTask(id) {
        const taskElement = document.querySelector(`[data-id="${id}"]`);
        const taskTextElement = taskElement.querySelector('.task-text');
        const currentText = taskTextElement.textContent;
        
        taskElement.classList.add('edit-mode');
        taskTextElement.contentEditable = true;
        taskTextElement.focus();
        
       
        const range = document.createRange();
        range.selectNodeContents(taskTextElement);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        const saveEdit = () => {
            const newText = taskTextElement.textContent.trim();
            if (newText && newText !== currentText) {
                const task = this.tasks.find(task => task.id === id);
                if (task) {
                    task.text = newText;
                    this.saveToLocalStorage();
                }
            }
            taskElement.classList.remove('edit-mode');
            taskTextElement.contentEditable = false;
            this.render();
        };

        const cancelEdit = () => {
            taskTextElement.textContent = currentText;
            taskElement.classList.remove('edit-mode');
            taskTextElement.contentEditable = false;
        };

        taskTextElement.addEventListener('blur', saveEdit, { once: true });
        taskTextElement.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveEdit();
            }
        }, { once: true });
        
        taskTextElement.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                cancelEdit();
            }
        }, { once: true });
    }

    setFilter(filter) {
        this.currentFilter = filter;
        this.filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        this.render();
    }

    getFilteredTasks() {
        switch (this.currentFilter) {
            case 'pending':
                return this.tasks.filter(task => !task.completed);
            case 'completed':
                return this.tasks.filter(task => task.completed);
            default:
                return this.tasks;
        }
    }

    clearCompletedTasks() {
        const completedTaskElements = document.querySelectorAll('.task-item.completed');
        
        completedTaskElements.forEach(element => {
            element.classList.add('removing');
        });

        setTimeout(() => {
            this.tasks = this.tasks.filter(task => !task.completed);
            this.saveToLocalStorage();
            this.render();
        }, 300);
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(task => task.completed).length;
        
        this.totalTasks.textContent = `${total} task${total !== 1 ? 's' : ''}`;
        this.completedTasks.textContent = `${completed} completed`;
        
        this.clearCompleted.disabled = completed === 0;
        this.clearCompleted.style.opacity = completed === 0 ? '0.3' : '1';
    }

    render() {
        const filteredTasks = this.getFilteredTasks();
        
        
        this.taskList.innerHTML = '';
        
      
        this.emptyState.style.display = filteredTasks.length === 0 ? 'block' : 'none';
        
       
        filteredTasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            this.taskList.appendChild(taskElement);
        });
        
        this.updateStats();
    }

    createTaskElement(task) {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.setAttribute('data-id', task.id);
        
        li.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <span class="task-text">${this.escapeHtml(task.text)}</span>
            <div class="task-actions">
                <button class="action-btn edit-btn" title="Edit task">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" title="Delete task">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        // Attach event listeners
        const checkbox = li.querySelector('.task-checkbox');
        const editBtn = li.querySelector('.edit-btn');
        const deleteBtn = li.querySelector('.delete-btn');

        checkbox.addEventListener('change', () => this.toggleTask(task.id));
        editBtn.addEventListener('click', () => this.editTask(task.id));
        deleteBtn.addEventListener('click', () => this.deleteTask(task.id));

        return li;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    saveToLocalStorage() {
        localStorage.setItem('todoTasks', JSON.stringify(this.tasks));
    }
}


document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});


