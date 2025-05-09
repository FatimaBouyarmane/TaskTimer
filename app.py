import os
import logging
import uuid
from datetime import datetime
from flask import Flask, render_template, request, jsonify, redirect, url_for, flash, session

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "default_secret_key_for_development")

# In-memory data store for tasks
tasks = []

# Task status and priority options
TASK_STATUSES = ["pending", "completed"]
TASK_PRIORITIES = ["high", "medium", "low"]

@app.route('/')
def index():
    """Render the main page with all tasks."""
    return render_template('index.html', tasks=tasks, 
                          statuses=TASK_STATUSES, 
                          priorities=TASK_PRIORITIES)

@app.route('/add_task', methods=['POST'])
def add_task():
    """Add a new task."""
    title = request.form.get('title')
    description = request.form.get('description')
    priority = request.form.get('priority')
    estimated_time = request.form.get('estimated_time')
    
    if not title:
        flash('Task title is required', 'danger')
        return redirect(url_for('index'))
    
    # Create new task
    task = {
        'id': str(uuid.uuid4()),  # Generate unique ID
        'title': title,
        'description': description,
        'priority': priority,
        'estimated_time': estimated_time,
        'status': 'pending',
        'created_at': datetime.now(),
        'elapsed_time': 0,  # Time spent on task in seconds
        'timer_running': False,
        'timer_start': None
    }
    
    tasks.append(task)
    flash('Task added successfully!', 'success')
    return redirect(url_for('index'))

@app.route('/update_task/<task_id>', methods=['POST'])
def update_task(task_id):
    """Update an existing task."""
    for task in tasks:
        if task['id'] == task_id:
            task['title'] = request.form.get('title')
            task['description'] = request.form.get('description')
            task['priority'] = request.form.get('priority')
            task['estimated_time'] = request.form.get('estimated_time')
            flash('Task updated successfully!', 'success')
            break
    
    return redirect(url_for('index'))

@app.route('/delete_task/<task_id>', methods=['POST'])
def delete_task(task_id):
    """Delete a task."""
    global tasks
    tasks = [task for task in tasks if task['id'] != task_id]
    flash('Task deleted successfully!', 'success')
    return redirect(url_for('index'))

@app.route('/toggle_status/<task_id>', methods=['POST'])
def toggle_status(task_id):
    """Toggle the status of a task between pending and completed."""
    for task in tasks:
        if task['id'] == task_id:
            task['status'] = 'completed' if task['status'] == 'pending' else 'pending'
            # Stop timer if task is marked as completed
            if task['status'] == 'completed' and task['timer_running']:
                task['timer_running'] = False
                task['timer_start'] = None
            flash(f'Task marked as {task["status"]}!', 'success')
            break
    
    return redirect(url_for('index'))

@app.route('/api/timer/<task_id>', methods=['POST'])
def update_timer(task_id):
    """API endpoint to update task timer."""
    action = request.json.get('action')
    elapsed = request.json.get('elapsed', 0)
    
    for task in tasks:
        if task['id'] == task_id:
            if action == 'start':
                task['timer_running'] = True
                task['timer_start'] = datetime.now().timestamp()
            elif action == 'stop':
                task['timer_running'] = False
                task['timer_start'] = None
                task['elapsed_time'] = elapsed
            elif action == 'update':
                task['elapsed_time'] = elapsed
            return jsonify({'success': True})
    
    return jsonify({'success': False, 'error': 'Task not found'}), 404

@app.route('/filter_tasks', methods=['GET'])
def filter_tasks():
    """Filter tasks based on status and priority."""
    status_filter = request.args.get('status', 'all')
    priority_filter = request.args.get('priority', 'all')
    
    filtered_tasks = tasks
    
    if status_filter != 'all':
        filtered_tasks = [task for task in filtered_tasks if task['status'] == status_filter]
    
    if priority_filter != 'all':
        filtered_tasks = [task for task in filtered_tasks if task['priority'] == priority_filter]
    
    return render_template('index.html', tasks=filtered_tasks, 
                          statuses=TASK_STATUSES, 
                          priorities=TASK_PRIORITIES,
                          status_filter=status_filter,
                          priority_filter=priority_filter)

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)
