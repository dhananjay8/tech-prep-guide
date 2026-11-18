# Build an Image Carousel / Slider

## Requirements
- Display images one at a time with prev/next buttons
- Auto-play with configurable interval
- Dots/indicators showing current position
- Touch/swipe support, smooth transitions

## Implementation
```javascript
import { useEffect, useRef, useState } from 'react';

function Carousel({ images, autoPlay = true, interval = 3000 }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef(null);

  const goTo = (index) => {
    if (!images.length) return;
    setCurrent((index + images.length) % images.length);
  };

  useEffect(() => {
    if (!autoPlay || paused || images.length < 2) return;
    const timerId = setInterval(() => {
      setCurrent(index => (index + 1) % images.length);
    }, interval);
    return () => clearInterval(timerId);
  }, [autoPlay, paused, interval, images.length]);

  if (!images.length) return <p>No images available.</p>;

  return (
    <div
      className="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
      onTouchStart={event => { touchStartX.current = event.touches[0].clientX; }}
      onTouchEnd={event => {
        if (touchStartX.current === null) return;
        const deltaX = event.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(deltaX) > 40) goTo(current + (deltaX < 0 ? 1 : -1));
        touchStartX.current = null;
      }}
    >
      <div className="slides" style={{ transform: `translateX(-${current * 100}%)`, transition: 'transform 0.5s' }}>
        {images.map((img, i) => <img key={img.id ?? img.src ?? i} src={img.src ?? img} alt={img.alt ?? `Slide ${i + 1}`} style={{ width: '100%', flexShrink: 0 }} />)}
      </div>
      <button className="prev" type="button" onClick={() => goTo(current - 1)} aria-label="Previous image">‹</button>
      <button className="next" type="button" onClick={() => goTo(current + 1)} aria-label="Next image">›</button>
      <div className="dots">
        {images.map((_, i) => (
          <button key={i} type="button" className={i === current ? 'active' : ''} onClick={() => goTo(i)} aria-label={`Show image ${i + 1}`} aria-current={i === current} />
        ))}
      </div>
    </div>
  );
}
```

## Key Patterns
- **CSS transform** (`translateX`) for smooth sliding
- **Modular arithmetic** for infinite loop: `(idx + length) % length`
- **Auto-play**: one interval with cleanup; pause for hover and keyboard focus
- **Touch/swipe**: listen to `touchstart`/`touchend`, detect direction from deltaX
- Pause when the document is hidden and honor `prefers-reduced-motion` in production.
- Use stable image IDs and descriptive alt text; do not make non-semantic dots clickable spans.
