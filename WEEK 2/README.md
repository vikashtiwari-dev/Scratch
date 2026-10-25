# Week 2 Todo App with Express API

A simple, responsive Todo application built with vanilla HTML, CSS, and JavaScript connected to an Express REST API. Built as part of the Week 2 Mentorship Program.

All todos are stored in server memory (RAM) and synchronized with the frontend using the browser Fetch API.

---

## Features

- Add task: Create a new task with validation (empty or whitespace-only inputs are rejected).
- View tasks: View the current list of tasks fetched from the Express API on page load.
- Toggle completion: Click the checkbox to mark a task complete or active (sends a PATCH request).
- Edit task: Edit task descriptions inline without reloading the page.
- Delete task: Remove tasks with the delete button (sends a DELETE request).
- Filters: Filter views by All, Active, or Completed.
- Task counter: Shows the number of remaining active tasks.
- Responsive design: Works well on both mobile screens and desktops.
- Accessible: Built with semantic HTML, label associations, keyboard focus rings, and readable contrast.

---

## Project Structure

```text
WEEK 2/
├── package.json
├── server.js
├── README.md
├── .gitignore
└── public/
    ├── index.html
    ├── styles.css
    └── app.js
```

---

## Setup & Running the App

### Prerequisites
- Node.js
- npm

### Quick Start

1. Open your terminal in this directory:
   ```bash
   cd "/Users/vikashkumartiwari/Scratch/WEEK 2"
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```

4. Open your browser and visit:
   ```
   http://localhost:3000
   ```

---

## API Documentation

All routes exchange JSON and are available under `/api/todos`.

| Method | Endpoint | Description | Status Codes | Payload Example |
| :--- | :--- | :--- | :--- | :--- |
| GET | `/api/todos` | Return all todos in memory | 200 | None |
| POST | `/api/todos` | Create a new todo | 201, 400 | `{ "text": "Walk the dog" }` |
| PATCH | `/api/todos/:id` | Update text or completed status | 200, 400, 404 | `{ "completed": true }` |
| DELETE | `/api/todos/:id` | Remove a todo | 204, 404 | None |

### Todo Object Schema
```json
{
  "id": "1",
  "text": "Review Fetch documentation on MDN",
  "completed": false
}
```

### Validation & Errors
- POST /api/todos: Returns status 400 if text is missing, not a string, or contains only whitespace.
- PATCH /api/todos/:id: Returns status 404 if the todo ID is not found. Returns status 400 if text is empty whitespace or completed is not a boolean.
- DELETE /api/todos/:id: Returns status 404 if the todo ID is not found, and 204 on successful deletion.

---

## Storage Limitation (Important)

All todos are kept in memory on the server:
- The list is stored in a JavaScript array (`let todos = []`) inside `server.js`.
- If you refresh your browser tab, your tasks will remain because the Node.js server process is still running.
- If you restart the server (`Ctrl+C` and restart), all stored todos will be reset to an empty list.
- No database or client-side localStorage is used, as per the assignment requirements.

---

## Mentor Review Questions & Answers

### 1. Explain the todos array
The todos array is declared as `let todos = []` in `server.js`. It lives in the server's Node.js process memory (RAM). Each item in the array is an object containing `id`, `text`, and `completed`. Because it is stored in volatile memory, restarting the process clears the array.

### 2. Walk through one route handler (POST /api/todos)
```javascript
app.post('/api/todos', (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'Task text is required...' });
  }
  const newTodo = {
    id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
    text: text.trim(),
    completed: false
  };
  todos.push(newTodo);
  res.status(201).json(newTodo);
});
```
When a POST request arrives, `express.json()` middleware parses the JSON body into `req.body`. We validate that `text` is a non-empty string. If invalid, we return status 400 immediately. If valid, we create a new todo object, append it to `todos` with `.push()`, and return status 201 with the new object as JSON.

### 3. Walk through one Fetch call (addTodo)
```javascript
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
```
The client calls `fetch('/api/todos', { ... })` with HTTP method POST and `Content-Type: application/json`. We check `res.ok` (which is true for 2xx status codes). If the server responds with an error, we parse the server's error message and throw an Error to display it to the user. On success, we parse and return the created todo object.

### 4. How the page is rendered
When the page loads (`loadInitialTodos()`), it fetches the todos from the backend and calls `render()`.
Inside `render()`:
1. It updates the remaining active items counter.
2. It filters the in-memory array depending on whether the user selected All, Active, or Completed.
3. If there are no items to show, it displays a simple empty state message.
4. Otherwise, it clears the list and dynamically constructs list items using `document.createElement()`, setting text with `.textContent` to prevent script injection.

### 5. Why data disappears after a server restart
JavaScript variables stored in a Node.js process only exist while that process is actively running in system RAM. When the server restarts, that process is destroyed and all RAM allocated to it is reclaimed by the operating system. Starting the server again executes `server.js` from the top, initializing `todos` as a new empty array.
