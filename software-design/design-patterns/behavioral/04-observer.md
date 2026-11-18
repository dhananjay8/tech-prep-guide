# Observer Pattern

**Intent:** Define a one-to-many dependency so that when one object changes state, all dependents are notified.

**When to use:** Event systems, UI updates, notifications, real-time data feeds, webhooks.

This is an in-process event-emitter example. Observer commonly connects a
subject directly to listeners; publish/subscribe usually adds a broker or
channel boundary between publishers and subscribers.

---

## JavaScript
```javascript
class EventEmitter {
  constructor() { this.listeners = new Map(); }

  on(event, callback) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    const listeners = this.listeners.get(event);
    if (!listeners) return;
    listeners.delete(callback);
    if (listeners.size === 0) this.listeners.delete(event);
  }

  emit(event, ...args) {
    // Snapshot so listeners may unsubscribe safely while handling an event.
    for (const callback of [...(this.listeners.get(event) || [])]) callback(...args);
  }
}

// Usage
const emitter = new EventEmitter();
emitter.on("userSignup", (user) => console.log(`Welcome email to ${user.email}`));
emitter.on("userSignup", (user) => console.log(`Analytics: new user ${user.id}`));
emitter.emit("userSignup", { id: 1, email: "a@b.com" });
// "Welcome email to a@b.com"
// "Analytics: new user 1"

// Node.js built-in: const { EventEmitter } = require('events');
```

## Python
```python
class EventEmitter:
    def __init__(self):
        self._listeners = {}

    def on(self, event, callback):
        self._listeners.setdefault(event, []).append(callback)
        return lambda: self.off(event, callback)

    def off(self, event, callback):
        listeners = self._listeners.get(event)
        if listeners and callback in listeners:
            listeners.remove(callback)
            if not listeners:
                del self._listeners[event]

    def emit(self, event, *args, **kwargs):
        for cb in tuple(self._listeners.get(event, [])):
            cb(*args, **kwargs)

emitter = EventEmitter()
emitter.on("order_placed", lambda order: print(f"Send receipt for order {order['id']}"))
emitter.emit("order_placed", {"id": 123, "total": 99.99})
```

## Java
```java
import java.util.*;
import java.util.function.Consumer;

public class EventEmitter<T> {
    private final Map<String, List<Consumer<T>>> listeners = new HashMap<>();

    public void on(String event, Consumer<T> callback) {
        listeners.computeIfAbsent(event, k -> new ArrayList<>()).add(callback);
    }

    public void off(String event, Consumer<T> callback) {
        List<Consumer<T>> eventListeners = listeners.get(event);
        if (eventListeners == null) return;
        eventListeners.remove(callback);
        if (eventListeners.isEmpty()) listeners.remove(event);
    }

    public void emit(String event, T data) {
        List.copyOf(listeners.getOrDefault(event, List.of()))
            .forEach(cb -> cb.accept(data));
    }
}
```

## Interview Talking Points
- **Loose coupling**: Publisher doesn't know who subscribes
- Node.js `EventEmitter` is the built-in implementation
- **Memory leaks**: Always clean up listeners (`.off()`) to prevent leaks
- Decide whether a listener exception should stop delivery to later listeners or be isolated and reported.
- **Async variant**: a queue/broker can decouple delivery, but then delivery guarantees, ordering, retries, and duplicate handling must be designed separately.
- Related patterns: Mediator, Event Bus, Reactive Streams (RxJS)
