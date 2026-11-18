# Build a Tree View / Nested Menu

## Interview Prompt
Render nested folders or navigation items with expand/collapse, selection, and keyboard support.

## Data Model
```javascript
const nodes = [
  {
    id: 'src',
    label: 'src',
    children: [{ id: 'app', label: 'App.js' }]
  }
];
```

## Recursive Rendering
```javascript
function TreeNode({ node, expandedIds, onToggle, onSelect }) {
  const hasChildren = Boolean(node.children?.length);
  const expanded = expandedIds.has(node.id);

  return (
    <li role="treeitem" aria-expanded={hasChildren ? expanded : undefined}>
      <button
        type="button"
        onClick={() => hasChildren ? onToggle(node.id) : onSelect(node.id)}
      >
        {node.label}
      </button>
      {hasChildren && expanded && (
        <ul role="group">
          {node.children.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
```

## Interview Answer
- Use stable node IDs and store expanded IDs in a `Set`; derive visible rows from the tree.
- Separate expansion from selection so clicking a folder does not accidentally select a file.
- Add ArrowUp/ArrowDown navigation and ArrowRight/ArrowLeft expand/collapse behavior for a complete tree widget.
- Define whether selection is single or multiple and expose it through controlled props when reusable.
- For very deep or large trees, consider iterative flattening, virtualization, lazy child loading, and cycle/depth protection.
