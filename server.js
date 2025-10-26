const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const DATA_FILE = path.join(__dirname, 'todos.json');

function readTodos() {
  if (!fs.existsSync(DATA_FILE)) return [];
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  try { return JSON.parse(raw); } catch { return []; }
}

function writeTodos(todos) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(todos, null, 2), 'utf8');
}

// CRUD
app.get('/api/todos', (req, res) => res.json(readTodos()));

app.post('/api/todos', (req, res) => {
  const { text } = req.body;
  if (!text || text.trim() === '') return res.status(400).json({ error: 'text richiesto' });
  const todos = readTodos();
  const newTodo = { id: Date.now(), text, done: false, createdAt: new Date().toISOString(), completedAt: null };
  todos.push(newTodo); writeTodos(todos); res.status(201).json(newTodo);
});

app.patch('/api/todos/:id/done', (req, res) => {
  const id = Number(req.params.id);
  const todos = readTodos();
  const todo = todos.find(t => t.id === id);
  if (!todo) return res.status(404).json({ error: 'todo non trovata' });
  todo.done = !todo.done; todo.completedAt = todo.done ? new Date().toISOString() : null;
  writeTodos(todos); res.json(todo);
});

app.delete('/api/todos/:id', (req, res) => {
  const id = Number(req.params.id);
  let todos = readTodos();
  const before = todos.length;
  todos = todos.filter(t => t.id !== id);
  if (todos.length === before) return res.status(404).json({ error: 'todo non trovata' });
  writeTodos(todos); res.json({ ok: true });
});

// EXPORT JSON
app.get('/api/export', (req, res) => {
  const todos = readTodos();
  const maxId = todos.reduce((m, t) => Math.max(m, Number(t.id) || 0), 0);
  const payload = { todos, nextId: maxId + 1 };
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="todo-list.json"');
  res.send(JSON.stringify(payload, null, 2));
});

// IMPORT JSON
app.post('/api/import', (req, res) => {
  const { data } = req.body;
  if (!data) return res.status(400).json({ error: 'manca campo data con il file JSON' });
  let parsed; try { parsed = JSON.parse(data); } catch { return res.status(400).json({ error: 'JSON non valido' }); }
  let importedTodos;
  if (Array.isArray(parsed)) importedTodos = parsed;
  else if (Array.isArray(parsed.todos)) importedTodos = parsed.todos;
  else return res.status(400).json({ error: 'formato non riconosciuto' });
  const cleaned = importedTodos.map(t => ({
    id: Number(t.id) || Date.now(),
    text: String(t.text ?? t.nome ?? ""),
    done: Boolean(t.done ?? t.stato),
    createdAt: t.createdAt ? String(t.createdAt) : new Date().toISOString(),
    completedAt: t.done || t.stato ? (t.completedAt ? String(t.completedAt) : new Date().toISOString()) : null
  }));
  writeTodos(cleaned); res.json({ ok: true, count: cleaned.length });
});

app.listen(PORT, () => console.log(`Server attivo su http://localhost:${PORT}`));
