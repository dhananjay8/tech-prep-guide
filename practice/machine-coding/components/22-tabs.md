# Build a Tabs Component

## Requirements

- Render tab labels and active tab panel
- Support controlled and uncontrolled usage
- Keyboard navigation with ArrowLeft, ArrowRight, Home, End
- Keep tab and panel semantics accessible

## Data Model

```javascript
const tabs = [
  { id: 'overview', label: 'Overview', content: <Overview /> },
  { id: 'settings', label: 'Settings', content: <Settings /> }
];
```

## Implementation

```javascript
import { useId, useState } from 'react';

function Tabs({ tabs, value, defaultValue, onChange, label = 'Tabs' }) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? tabs[0]?.id);
  const idPrefix = useId();
  if (!tabs.length) return null;

  const activeValue = value === undefined ? internalValue : value;
  const resolvedValue = tabs.some(tab => tab.id === activeValue) ? activeValue : tabs[0].id;
  const activeIndex = tabs.findIndex(tab => tab.id === resolvedValue);

  const selectTab = (id) => {
    if (value === undefined) setInternalValue(id);
    onChange?.(id);
  };

  const moveFocus = (nextIndex) => {
    const normalizedIndex = (nextIndex + tabs.length) % tabs.length;
    selectTab(tabs[normalizedIndex].id);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      moveFocus(activeIndex + 1);
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      moveFocus(activeIndex - 1);
    }
    if (event.key === 'Home') {
      event.preventDefault();
      selectTab(tabs[0].id);
    }
    if (event.key === 'End') {
      event.preventDefault();
      selectTab(tabs[tabs.length - 1].id);
    }
  };

  return (
    <div>
      <div role="tablist" aria-label={label} onKeyDown={handleKeyDown}>
        {tabs.map(tab => (
          <button
            type="button"
            key={tab.id}
            id={`${idPrefix}-tab-${tab.id}`}
            role="tab"
            aria-selected={tab.id === resolvedValue}
            aria-controls={`${idPrefix}-panel-${tab.id}`}
            tabIndex={tab.id === resolvedValue ? 0 : -1}
            onClick={() => selectTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map(tab => (
        <div
          key={tab.id}
          id={`${idPrefix}-panel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={`${idPrefix}-tab-${tab.id}`}
          tabIndex={0}
          hidden={tab.id !== resolvedValue}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
```

## Key Patterns

- **Controlled support**: `value` + `onChange`
- **Uncontrolled support**: `defaultValue` + internal state
- **Accessibility**: `tablist`, `tab`, `tabpanel`
- **Keyboard UX**: wrap around at first and last tab
- **Empty/invalid state**: handle an empty tab list and fall back when a controlled ID is no longer present.

## Interview Tips

- Clarify whether inactive panels should unmount
- Mention URL-sync for deep-linkable tabs
- Keep tab state independent from panel data
