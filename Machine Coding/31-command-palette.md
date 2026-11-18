# Build a Command Palette

## Interview Prompt
Build a keyboard-first command palette (for example, `Cmd/Ctrl + K`) that searches commands, supports arrow-key selection, runs the active command, and closes on Escape or outside click.

## Clarify First
- Are commands local, server-backed, or both?
- Should shortcuts work while typing in an input?
- Does selecting a command navigate, invoke a callback, or open another dialog?

## Data Model
```javascript
const commands = [
  { id: 'new-file', label: 'Create new file', keywords: ['file', 'create'], run: createFile },
  { id: 'settings', label: 'Open settings', keywords: ['preferences'], run: openSettings }
];
```

## Core Implementation
```javascript
import { useEffect, useMemo, useState } from 'react';

function CommandPalette({ commands, onClose }) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    return commands.filter(command =>
      `${command.label} ${command.keywords?.join(' ') ?? ''}`.toLowerCase().includes(term)
    );
  }, [commands, query]);

  useEffect(() => setActiveIndex(0), [query]);

  const handleKeyDown = event => {
    if (event.key === 'Escape') onClose();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex(index => Math.min(index + 1, results.length - 1));
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex(index => Math.max(index - 1, 0));
    }
    if (event.key === 'Enter' && results[activeIndex]) {
      results[activeIndex].run();
      onClose();
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Command palette">
      <input
        autoFocus
        role="combobox"
        aria-expanded="true"
        aria-controls="command-results"
        aria-activedescendant={results[activeIndex] ? `command-${results[activeIndex].id}` : undefined}
        value={query}
        onChange={event => setQuery(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      <ul id="command-results" role="listbox">
        {results.map((command, index) => (
          <li
            id={`command-${command.id}`}
            key={command.id}
            role="option"
            aria-selected={index === activeIndex}
            onMouseEnter={() => setActiveIndex(index)}
            onMouseDown={() => { command.run(); onClose(); }}
          >
            {command.label}
          </li>
        ))}
      </ul>
      {results.length === 0 && <p>No commands found.</p>}
    </div>
  );
}
```

## Interview Answer
- Keep the command registry independent from the palette UI.
- Derive filtered results from the query; keep only the active index as mutable UI state.
- Register the global shortcut in an effect and clean it up; ignore it when focus is in an editable field.
- Make the dialog focus-trapped and restore focus to the trigger when it closes.
- For large or remote registries, debounce requests and cancel stale searches.
