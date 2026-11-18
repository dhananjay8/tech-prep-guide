# Build Undo / Redo History

## Interview Prompt
Add undo and redo to an editor or drawing tool. New edits after undo must discard the obsolete redo branch.

## State Model
Use immutable snapshots with one current value and two history stacks:

```javascript
{ past: [], present: initialDocument, future: [] }
```

## Reducer
```javascript
function historyReducer(state, action) {
  switch (action.type) {
    case 'UPDATE': {
      const next = action.update(state.present);
      if (next === state.present) return state;
      return {
        past: [...state.past, state.present],
        present: next,
        future: []
      };
    }
    case 'UNDO': {
      if (!state.past.length) return state;
      const present = state.past[state.past.length - 1];
      return {
        past: state.past.slice(0, -1),
        present,
        future: [state.present, ...state.future]
      };
    }
    case 'REDO': {
      if (!state.future.length) return state;
      const present = state.future[0];
      return {
        past: [...state.past, state.present],
        present,
        future: state.future.slice(1)
      };
    }
    default:
      return state;
  }
}
```

## Interview Answer
- Route every document edit through one reducer/action boundary.
- Keep the history bounded (for example, the most recent 100 snapshots) to control memory.
- Coalesce rapid edits such as typing into a single history entry instead of snapshotting each keystroke.
- Treat undo/redo as state transitions; derive button disabled state from whether `past` or `future` is empty.
- For large documents, store reversible commands or structural diffs rather than cloning the entire document.
