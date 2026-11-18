# Build a Todo / Task Management App

## Requirements
- Add, edit, delete tasks
- Mark tasks complete/incomplete
- Filter: All / Active / Completed
- Persist data (localStorage)
- Bonus: drag-and-drop reorder, due dates, priorities

## Architecture

```
App
├── Header (title, input)
├── TodoList
│   └── TodoItem (checkbox, text, edit, delete)
├── Footer (count, filters, clear completed)
└── State Management (useState / useReducer / Redux)
```

## Key Data Structure
```javascript
const todo = {
  id: crypto.randomUUID(),     // unique ID
  text: "Buy groceries",
  completed: false,
  createdAt: Date.now(),
  priority: "medium"           // low | medium | high
};
```

## Core Implementation (React)

```javascript
// Hydrate once; guard browser storage because it can be unavailable or invalid.
const [todos, setTodos] = useState(() => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = JSON.parse(window.localStorage.getItem('todos') ?? '[]');
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
});
const [filter, setFilter] = useState('all'); // all | active | completed

// Add todo
const addTodo = (text) => {
  const normalizedText = text.trim();
  if (!normalizedText) return;
  setTodos(prev => [
    ...prev,
    { id: crypto.randomUUID(), text: normalizedText, completed: false, createdAt: Date.now() }
  ]);
};

// Toggle complete
const toggleTodo = (id) => {
  setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
};

// Delete todo
const deleteTodo = (id) => setTodos(prev => prev.filter(t => t.id !== id));
const clearCompleted = () => setTodos(prev => prev.filter(t => !t.completed));

// Filter logic
const filteredTodos = todos.filter(t => {
  if (filter === 'active') return !t.completed;
  if (filter === 'completed') return t.completed;
  return true;
});

// Persist to localStorage
useEffect(() => {
  try {
    window.localStorage.setItem('todos', JSON.stringify(todos));
  } catch {
    // The UI still works when storage is disabled or full.
  }
}, [todos]);
```

## Optimizations
- **Debounce** edits to reduce re-renders
- **Virtual list** (react-window) for large lists
- **Memoization**: `React.memo` for TodoItem, `useMemo` for filtered list
- **Keyboard shortcuts**: Enter to add, Escape to cancel edit

## Interview Tips
- Start with data model, then component tree
- Show clean state management (useReducer for complex state)
- Handle empty input and clarify whether duplicate task titles are allowed.
- CSS: Show you can style responsively
- Time: Aim for working MVP in 45 min
- Keep the visible list derived from `todos` and `filter`; do not store a second filtered copy.
- For server-rendered apps, hydrate storage after mount to avoid server/client markup mismatch.
