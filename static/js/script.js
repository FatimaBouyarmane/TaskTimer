document.addEventListener('DOMContentLoaded', function() {
    // Initialize all timers
    initializeTimers();
    
    // Setup event listeners
    setupEventListeners();
});

// Timer functionality
let timers = {};

function initializeTimers() {
    const timerDisplays = document.querySelectorAll('.timer-display');
    
    timerDisplays.forEach(display => {
        const taskId = display.closest('.task-card').dataset.taskId;
        const elapsedTime = parseInt(display.dataset.elapsed) || 0;
        const isRunning = display.dataset.running === 'true';
        
        timers[taskId] = {
            elapsed: elapsedTime,
            running: isRunning,
            startTime: isRunning ? Date.now() - (elapsedTime * 1000) : null,
            displayElement: display.querySelector('.timer-value')
        };
        
        // Update display initially
        updateTimerDisplay(taskId);
        
        // If timer was running, restart it
        if (isRunning) {
            display.classList.add('timer-running');
            startTimer(taskId);
        }
    });
}

function startTimer(taskId) {
    const timer = timers[taskId];
    if (!timer) return;
    
    timer.running = true;
    timer.startTime = Date.now() - (timer.elapsed * 1000);
    
    // Start the interval to update the timer
    updateTimer(taskId);
    
    // Send start action to server
    sendTimerAction(taskId, 'start');
}

function stopTimer(taskId) {
    const timer = timers[taskId];
    if (!timer) return;
    
    timer.running = false;
    
    // Send stop action to server with current elapsed time
    sendTimerAction(taskId, 'stop', timer.elapsed);
}

function updateTimer(taskId) {
    const timer = timers[taskId];
    if (!timer || !timer.running) return;
    
    // Calculate elapsed time
    const currentTime = Date.now();
    timer.elapsed = Math.floor((currentTime - timer.startTime) / 1000);
    
    // Update the display
    updateTimerDisplay(taskId);
    
    // Every 10 seconds, send an update to the server
    if (timer.elapsed % 10 === 0) {
        sendTimerAction(taskId, 'update', timer.elapsed);
    }
    
    // Schedule next update
    setTimeout(() => updateTimer(taskId), 1000);
}

function updateTimerDisplay(taskId) {
    const timer = timers[taskId];
    if (!timer || !timer.displayElement) return;
    
    const hours = Math.floor(timer.elapsed / 3600);
    const minutes = Math.floor((timer.elapsed % 3600) / 60);
    const seconds = timer.elapsed % 60;
    
    timer.displayElement.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function sendTimerAction(taskId, action, elapsed = 0) {
    fetch(`/api/timer/${taskId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: action,
            elapsed: elapsed
        })
    })
    .then(response => response.json())
    .catch(error => console.error('Error updating timer:', error));
}

function setupEventListeners() {
    // Timer toggle buttons
    document.querySelectorAll('.timer-toggle-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const taskCard = this.closest('.task-card');
            const taskId = taskCard.dataset.taskId;
            const timer = timers[taskId];
            const timerDisplay = taskCard.querySelector('.timer-display');
            
            if (timer && timer.running) {
                // Stop the timer
                stopTimer(taskId);
                this.classList.remove('btn-danger');
                this.classList.add('btn-success');
                this.innerHTML = '<i class="fas fa-play"></i>';
                timerDisplay.classList.remove('timer-running');
            } else {
                // Start the timer
                startTimer(taskId);
                this.classList.remove('btn-success');
                this.classList.add('btn-danger');
                this.innerHTML = '<i class="fas fa-pause"></i>';
                timerDisplay.classList.add('timer-running');
            }
        });
    });
    
    // Edit task buttons
    document.querySelectorAll('.edit-task').forEach(btn => {
        btn.addEventListener('click', function() {
            const taskId = this.dataset.taskId;
            const title = this.dataset.taskTitle;
            const description = this.dataset.taskDescription;
            const priority = this.dataset.taskPriority;
            const estimatedTime = this.dataset.taskEstimatedTime;
            
            // Fill the edit form
            document.getElementById('edit_title').value = title;
            document.getElementById('edit_description').value = description;
            document.getElementById('edit_priority').value = priority;
            document.getElementById('edit_estimated_time').value = estimatedTime;
            
            // Set the form action
            document.getElementById('editTaskForm').action = `/update_task/${taskId}`;
        });
    });
    
    // Delete task buttons
    document.querySelectorAll('.delete-task').forEach(btn => {
        btn.addEventListener('click', function() {
            const taskId = this.dataset.taskId;
            document.getElementById('deleteTaskForm').action = `/delete_task/${taskId}`;
        });
    });
    
    // Toggle status links
    document.querySelectorAll('.toggle-status').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const taskId = this.dataset.taskId;
            const form = document.getElementById('toggleStatusForm');
            form.action = `/toggle_status/${taskId}`;
            form.submit();
        });
    });
    
    // Auto-submit filter form when select changes
    document.getElementById('statusFilter')?.addEventListener('change', function() {
        this.closest('form').submit();
    });
    
    document.getElementById('priorityFilter')?.addEventListener('change', function() {
        this.closest('form').submit();
    });
}
