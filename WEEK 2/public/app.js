let todos = [];
let currentFilter = 'all';
let editingId = null;

const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const addBtn = document.getElementById('add-btn');
const todoList = document.getElementById('todo-list');
const emptyState = document.getElementById('empty-state');
const emptyText = document.getElementById('empty-text');
const remainingCount = document.getElementById('remaining-count');
const filterButtons = document.querySelectorAll('.filter-btn');
const errorBanner = document.getElementById('error-banner');
const errorMessage = document.getElementById('error-message');
const dismissErrorBtn = document.getElementById('dismiss-error');
const loadingState = document.getElementById('loading-state');
const loadingText = document.getElementById('loading-text');

async function getTodos() {
  const res = await fetch('/api/todos');
  if (!res.ok) {
    throw new Error('Failed to load todos from server');
  }
  return res.json();
}

async function addTodo(text) {
  const res = await fetch('/api/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || 'Failed to add todo');
  }

  return res.json();
}

async function updateTodo(id, updates) {
  const res = await fetch(`/api/todos/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || 'Failed to update todo');
  }

  return res.json();
}

async function deleteTodo(id) {
  const res = await fetch(`/api/todos/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || 'Failed to delete todo');
  }
}

function setLoading(isLoading, text = 'Loading...') {
  if (isLoading) {
    loadingText.textContent = text;
    loadingState.hidden = false;
    addBtn.disabled = true;
  } else {
    loadingState.hidden = true;
    addBtn.disabled = false;
  }
}

function showError(msg) {
  errorMessage.textContent = msg;
  errorBanner.hidden = false;
}

function clearError() {
  errorBanner.hidden = true;
}

function render() {
  const activeCount = todos.filter(t => !t.completed).length;
  remainingCount.textContent = `${activeCount} ${activeCount === 1 ? 'item' : 'items'} left`;

  let filtered = todos;
  if (currentFilter === 'active') {
    filtered = todos.filter(t => !t.completed);
  } else if (currentFilter === 'completed') {
    filtered = todos.filter(t => t.completed);
  }

  todoList.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.hidden = false;
    if (todos.length === 0) {
      emptyText.textContent = 'No tasks yet. Add one above to get started!';
    } else if (currentFilter === 'active') {
      emptyText.textContent = 'No active tasks.';
    } else if (currentFilter === 'completed') {
      emptyText.textContent = 'No completed tasks yet.';
    }
    return;
  }

  emptyState.hidden = true;

  filtered.forEach(todo => {
    const li = document.createElement('li');
    li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
    li.dataset.id = todo.id;

    if (editingId === todo.id) {
      const form = document.createElement('form');
      form.className = 'edit-form';

      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'edit-input';
      input.value = todo.text;
      input.required = true;

      const saveBtn = document.createElement('button');
      saveBtn.type = 'submit';
      saveBtn.className = 'edit-save-btn';
      saveBtn.textContent = 'Save';

      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'edit-cancel-btn';
      cancelBtn.textContent = 'Cancel';
      cancelBtn.onclick = () => {
        editingId = null;
        render();
      };

      form.onsubmit = async (e) => {
        e.preventDefault();
        const newText = input.value.trim();
        if (!newText) return;

        setLoading(true, 'Saving...');
        clearError();
        try {
          const updated = await updateTodo(todo.id, { text: newText });
          const idx = todos.findIndex(t => t.id === todo.id);
          if (idx !== -1) todos[idx] = updated;
          editingId = null;
          render();
        } catch (err) {
          showError(err.message);
        } finally {
          setLoading(false);
        }
      };

      form.appendChild(input);
      form.appendChild(saveBtn);
      form.appendChild(cancelBtn);
      li.appendChild(form);

      setTimeout(() => input.focus(), 0);
      todoList.appendChild(li);
      return;
    }

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'todo-checkbox';
    checkbox.checked = todo.completed;
    checkbox.setAttribute('aria-label', `Mark "${todo.text}" as ${todo.completed ? 'incomplete' : 'complete'}`);

    const span = document.createElement('span');
    span.className = 'todo-text';
    span.textContent = todo.text;

    const actions = document.createElement('div');
    actions.className = 'item-actions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'action-btn edit-btn';
    editBtn.textContent = 'Edit';
    editBtn.setAttribute('aria-label', `Edit "${todo.text}"`);

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'action-btn delete-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.setAttribute('aria-label', `Delete "${todo.text}"`);

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(actions);

    todoList.appendChild(li);
  });
}

async function loadInitialTodos() {
  setLoading(true, 'Loading todos...');
  clearError();
  try {
    todos = await getTodos();
    render();
  } catch (err) {
    showError(err.message);
  } finally {
    setLoading(false);
  }
}

todoForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = todoInput.value.trim();
  if (!text) {
    showError('Please enter a task description.');
    todoInput.focus();
    return;
  }

  setLoading(true, 'Adding...');
  clearError();

  try {
    const newTodo = await addTodo(text);
    todos.push(newTodo);
    todoInput.value = '';
    render();
  } catch (err) {
    showError(err.message);
  } finally {
    setLoading(false);
  }
});

todoList.addEventListener('click', async (e) => {
  const item = e.target.closest('.todo-item');
  if (!item) return;
  const id = item.dataset.id;

  if (e.target.matches('.todo-checkbox')) {
    const completed = e.target.checked;
    setLoading(true, 'Updating...');
    clearError();
    try {
      const updated = await updateTodo(id, { completed });
      const idx = todos.findIndex(t => t.id === id);
      if (idx !== -1) todos[idx] = updated;
      render();
    } catch (err) {
      showError(err.message);
      render();
    } finally {
      setLoading(false);
    }
    return;
  }

  if (e.target.matches('.edit-btn')) {
    editingId = id;
    render();
    return;
  }

  if (e.target.matches('.delete-btn')) {
    setLoading(true, 'Deleting...');
    clearError();
    try {
      await deleteTodo(id);
      todos = todos.filter(t => t.id !== id);
      render();
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  }
});

filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    filterButtons.forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
    currentFilter = btn.dataset.filter;
    render();
  });
});

dismissErrorBtn.addEventListener('click', clearError);

loadInitialTodos();
