# Gang of Four Patterns — Compact Catalog

The GoF book names 23 object-oriented patterns. The entries marked **example**
link to a local implementation; the other entries are concise revision notes,
not full implementation guides. The local [Factory](./02-factory.md) page is a
simple factory example, not the GoF Factory Method pattern.

## Creational

| Pattern | Recognize it when... | Main trade-off / caution |
|---|---|---|
| Abstract Factory | A client must create a compatible family of products without naming concrete classes. | Adds product/factory types; awkward when new product kinds are frequent. |
| Builder — [example](./03-builder.md) | A product has multiple construction steps or invariants. | Can be ceremony for a simple object. |
| Factory Method | A base workflow delegates which product to create to a subclass or overridable creator. | Inheritance-based variation can be heavier than a simple factory or injected function. |
| Prototype | New objects are made by cloning a configured instance. | Define shallow/deep-copy and shared-reference semantics explicitly. |
| Singleton — [example](./01-singleton.md) | Exactly one instance is required within a stated scope. | Hidden global state complicates tests, lifecycle, and concurrency. |

## Structural

| Pattern | Recognize it when... | Main trade-off / caution |
|---|---|---|
| Adapter — [example](./07-adapter.md) | A client-facing contract differs from an existing API. | Translation failures and semantic mismatches still need handling. |
| Bridge | Two dimensions of variation should evolve independently (abstraction and implementation). | Adds indirection; distinguish it from interface conversion in Adapter. |
| Composite | Clients should treat a leaf and a tree of children uniformly. | Tree-wide operations and parent/child ownership need clear rules. |
| Decorator — [example](./06-decorator.md) | Behavior should be composed around an object without changing its class. | Wrapper order matters and can make debugging harder. |
| Facade | Callers need a simpler entry point to a coordinated subsystem. | Keep it a convenience boundary, not a new god object. |
| Flyweight | Many objects share large immutable intrinsic state while keeping small per-use state external. | Identity and state separation add complexity; measure memory first. |
| Proxy — [example](./08-proxy.md) | Access, creation, or lifecycle of an object must be controlled. | Preserve the subject contract and account for caching/security limits. |

## Behavioral

| Pattern | Recognize it when... | Main trade-off / caution |
|---|---|---|
| Chain of Responsibility | A request should pass through handlers until one handles or terminates it. | A request may be unhandled; ordering and short-circuit behavior matter. |
| Command — [example](./09-command.md) | A request needs to be stored, queued, logged, retried, or reversed. | Undo requires enough prior state and a safe inverse; retries can repeat side effects. |
| Interpreter | A small language or grammar needs direct representation/evaluation. | Often grows poorly for complex grammars; parser tools may be more appropriate. |
| Iterator — [example](./10-iterator.md) | Traversal should be independent of collection representation. | Mutation during traversal needs defined semantics. |
| Mediator | Many peers communicate through a coordinator instead of knowing each other. | The mediator can become a central god object. |
| Memento | A prior state must be captured and restored without exposing internals. | Snapshots may be expensive; define retention and version compatibility. |
| Observer — [example](./04-observer.md) | Many listeners react to a subject's state/event. | Unsubscription, ordering, errors, and delivery guarantees require policy. |
| State | An object's behavior and valid transitions depend on its current state. | State classes add structure; a small explicit state machine may be simpler. |
| Strategy — [example](./05-strategy.md) | One of several algorithms can be selected or injected. | Avoid one-class-per-trivial-branch when a function or simple conditional is clearer. |
| Template Method | A fixed algorithm skeleton has steps customized by subclasses/hooks. | Inheritance couples subclasses to the base workflow. |
| Visitor | New operations must be added over a stable set of element types. | Adding element types is costly and often requires changing visitors. |

## Fast contrasts

- **Abstract Factory vs Factory Method:** related product families vs one
  delegated creation point.
- **Bridge vs Adapter:** separate two design dimensions up front vs adapt an
  already-existing incompatible interface.
- **Composite vs Decorator:** represent part-whole trees vs wrap one object
  with added responsibilities.
- **Facade vs Mediator:** simplify subsystem access vs coordinate peer
  interactions.
- **State vs Strategy:** internal state drives transitions vs caller selects
  an interchangeable algorithm.
- **Visitor vs Strategy:** add operations over stable element types vs swap
  one behavior for a context.

For implementation examples and a step-by-step interview explanation, see the
[pattern index](./README.md) and [interview guide](./interview-guide.md).
