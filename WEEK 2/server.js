const express = require('express');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let todos = [];

app.get('/api/todos', (req, res) => {
  res.status(200).json(todos);
});

app.post('/api/todos', (req, res) => {
  const { text } = req.body;

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({
      error: 'Task text is required and cannot be empty or whitespace only.'
    });
  }

  const newTodo = {
    id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
    text: text.trim(),
    completed: false
  };

  todos.push(newTodo);
  res.status(201).json(newTodo);
});

app.patch('/api/todos/:id', (req, res) => {
  const { id } = req.params;
  const todo = todos.find(t => t.id === id);

  if (!todo) {
    return res.status(404).json({ error: `Todo with id ${id} not found.` });
  }

  const { text, completed } = req.body;

  if (text === undefined && completed === undefined) {
    return res.status(400).json({
      error: "Provide at least 'text' or 'completed' to update."
    });
  }

  if (text !== undefined) {
    if (typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({
        error: 'Task text cannot be empty or whitespace only.'
      });
    }
    todo.text = text.trim();
  }

  if (completed !== undefined) {
    if (typeof completed !== 'boolean') {
      return res.status(400).json({
        error: 'completed must be a boolean.'
      });
    }
    todo.completed = completed;
  }

  res.status(200).json(todo);
});

app.delete('/api/todos/:id', (req, res) => {
  const { id } = req.params;
  const index = todos.findIndex(t => t.id === id);

  if (index === -1) {
    return res.status(404).json({ error: `Todo with id ${id} not found.` });
  }

  todos.splice(index, 1);
  res.status(204).send();
});

app.all('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Malformed JSON payload.' });
  }
  next(err);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

module.exports = app;
