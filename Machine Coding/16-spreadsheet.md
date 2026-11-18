# Build a Spreadsheet (like Google Sheets)

## Requirements
- Grid of editable cells (rows × columns)
- Cell references: typing `=A1+B2` evaluates the formula
- Formatting: bold, color, alignment
- Selection, copy/paste, undo/redo

## Data Model
```javascript
// cells stored as { "A1": { value: "Hello", formula: null }, "B1": { value: 10, formula: "=A2+5" } }
const [cells, setCells] = useState({});
const getCellId = (row, col) => `${String.fromCharCode(65 + col)}${row + 1}`; // "A1", "B2"
```

## Core: Formula Evaluation
```javascript
function evaluateArithmetic(source) {
  const tokens = source.match(/\d+(?:\.\d+)?|[()+\-*/]/g) ?? [];
  const compactSource = source.replace(/\s+/g, '');
  if (tokens.join('') !== compactSource) throw new Error('Invalid formula');

  let index = 0;
  const parseExpression = () => {
    let value = parseTerm();
    while (tokens[index] === '+' || tokens[index] === '-') {
      const operator = tokens[index++];
      const right = parseTerm();
      value = operator === '+' ? value + right : value - right;
    }
    return value;
  };
  const parseTerm = () => {
    let value = parseFactor();
    while (tokens[index] === '*' || tokens[index] === '/') {
      const operator = tokens[index++];
      const right = parseFactor();
      value = operator === '*' ? value * right : value / right;
    }
    return value;
  };
  const parseFactor = () => {
    if (tokens[index] === '+' || tokens[index] === '-') {
      const sign = tokens[index++] === '-' ? -1 : 1;
      return sign * parseFactor();
    }
    if (tokens[index] === '(') {
      index += 1;
      const value = parseExpression();
      if (tokens[index++] !== ')') throw new Error('Missing closing parenthesis');
      return value;
    }
    const token = tokens[index++];
    if (!/^\d+(?:\.\d+)?$/.test(token ?? '')) throw new Error('Expected a number');
    return Number(token);
  };

  const result = parseExpression();
  if (index !== tokens.length || !Number.isFinite(result)) throw new Error('Invalid formula');
  return result;
}

function evaluateFormula(formula, cells) {
  if (!formula.startsWith('=')) return formula;
  let expr = formula.slice(1); // remove '='

  try {
    expr = expr.replace(/\b([A-Z]+[1-9]\d*)\b/g, (reference) => {
      const value = Number(cells[reference]?.value ?? 0);
      if (!Number.isFinite(value)) throw new Error('Cell value is not numeric');
      return `(${value})`;
    });
    return evaluateArithmetic(expr);
  } catch {
    return '#ERROR!';
  }
}
```

## Grid Rendering
```javascript
function Spreadsheet({ rows = 50, cols = 26 }) {
  const [cells, setCells] = useState({});
  const [editing, setEditing] = useState(null);

  const updateCell = (id, rawValue) => {
    const value = rawValue.startsWith('=') ? evaluateFormula(rawValue, cells) : rawValue;
    setCells(prev => ({ ...prev, [id]: { value, formula: rawValue } }));
    setEditing(null);
  };

  return (
    <table>
      <tbody>
        {Array.from({ length: rows }, (_, r) => (
          <tr key={r}>
            {Array.from({ length: cols }, (_, c) => {
              const id = getCellId(r, c);
              return (
                <td key={id} onDoubleClick={() => setEditing(id)}>
                  {editing === id ? (
                    <input autoFocus defaultValue={cells[id]?.formula || cells[id]?.value || ''}
                           onBlur={e => updateCell(id, e.target.value)}
                           onKeyDown={e => e.key === 'Enter' && updateCell(id, e.target.value)} />
                  ) : (cells[id]?.value ?? '')}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## Key Patterns
- **Cell as object**: `{ value, formula }` — display value, store formula
- **Formula parsing**: regex to find cell references, replace with values
- **Dependency graph** for reactive updates (when A1 changes, recalculate cells that reference A1)
- **Virtualization** is critical for performance with large grids

## Interview Tips
- Start simple: editable grid → add formulas → add formatting
- Reject circular references and recalculate dependents when a cell changes.
- Keep formulas separate from calculated values and surface parse errors in the UI.
- Never execute user-entered formulas with `eval`; use a restricted parser like the one above.
