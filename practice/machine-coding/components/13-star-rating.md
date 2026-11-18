# Build a Star Rating Component

## Requirements
- Display 5 stars (configurable)
- Click to set rating, hover to preview
- Support half-stars (optional), read-only mode
- Accessible (keyboard navigable)

## Implementation

```javascript
import { useRef, useState } from 'react';

function StarRating({ maxStars = 5, value = 0, onChange, readOnly = false, allowClear = true }) {
  const [hoverValue, setHoverValue] = useState(0);
  const starRefs = useRef([]);
  const displayValue = hoverValue || value;

  const handleClick = (rating) => {
    if (readOnly) return;
    onChange?.(allowClear && value === rating ? 0 : rating);
  };

  const handleKeyDown = (event, rating) => {
    if (readOnly) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const next = Math.max(1, Math.min(maxStars, rating + (event.key === 'ArrowRight' ? 1 : -1)));
      onChange?.(next);
      starRefs.current[next - 1]?.focus();
    }
    if (event.key === 'Home') {
      event.preventDefault();
      onChange?.(1);
      starRefs.current[0]?.focus();
    }
    if (event.key === 'End') {
      event.preventDefault();
      onChange?.(maxStars);
      starRefs.current[maxStars - 1]?.focus();
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label="Rating"
      onMouseLeave={() => setHoverValue(0)}
      style={{ display: 'flex', gap: 4, cursor: readOnly ? 'default' : 'pointer' }}
    >
      {Array.from({ length: maxStars }, (_, i) => {
        const starValue = i + 1;
        const filled = starValue <= displayValue;

        return (
          <button
            key={starValue}
            type="button"
            role="radio"
            aria-label={`${starValue} star${starValue > 1 ? 's' : ''}`}
            aria-checked={starValue === value}
            tabIndex={readOnly ? -1 : (starValue === (value || 1) ? 0 : -1)}
            disabled={readOnly}
            ref={node => { starRefs.current[i] = node; }}
            onClick={() => handleClick(starValue)}
            onMouseEnter={() => !readOnly && setHoverValue(starValue)}
            onKeyDown={(event) => handleKeyDown(event, starValue)}
            style={{
              border: 0,
              background: 'transparent',
              fontSize: 24,
              color: filled ? '#fbbf24' : '#d1d5db',
              transition: 'color 0.15s'
            }}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}

// Usage
function App() {
  const [rating, setRating] = useState(0);
  return (
    <div>
      <StarRating value={rating} onChange={setRating} />
      <p>You rated: {rating} / 5</p>
    </div>
  );
}
```

## Key Patterns
- **Controlled component**: value + onChange props
- **Hover preview**: separate hoverValue state
- **Accessibility**: role="radiogroup", keyboard selection, aria-checked
- **Reusable**: maxStars, readOnly, onChange as props
- **Clear support**: clicking selected rating can reset to zero
- **Roving focus**: keep one star in the tab order and move focus with arrow keys.

## Interview Tips
- Simple but tests component design skills
- Discuss controlled vs uncontrolled components
- Accessibility is a differentiator
- Bonus: half-star support (track mouse position within star)
