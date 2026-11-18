# Design Patterns Interview Guide

Patterns are names for recurring design trade-offs, not a checklist to force
into every solution. Start from the change or coupling problem; choose the
simplest design that addresses it.

## Pattern chooser

| Design pressure | Pattern to consider | Core idea |
|---|---|---|
| Construction has many optional steps or invariants | [Builder](./03-builder.md) | Assemble a valid object through a controlled API |
| Creation depends on configuration or a product family | [Factory](./02-factory.md) | Centralize which concrete object is created |
| One algorithm should be replaceable independently | [Strategy](./05-strategy.md) | Inject interchangeable behavior |
| Multiple consumers react to a state change | [Observer](./04-observer.md) | Publish a change to registered listeners |
| A caller and an existing API use different contracts | [Adapter](./07-adapter.md) | Translate one interface into another |
| A complex subsystem needs a smaller entry point | Facade | Offer a simple interface over coordinated components |
| Access, creation, or expensive work must be controlled | [Proxy](./08-proxy.md) | Stand in for an object while keeping its contract |
| Add optional behavior around an object | [Decorator](./06-decorator.md) | Wrap and compose behavior without changing the wrapped type |
| A request must be queued, logged, retried, or undone | [Command](./09-command.md) | Represent the request and its data as an object |
| Traverse a collection without exposing its representation | [Iterator](./10-iterator.md) | Separate traversal from storage |
| A class is hard to test because it creates its own collaborators | [Dependency injection](./11-dependency-injection.md) | Supply dependencies from the composition boundary |
| UI state/presentation is tangled with domain behavior | [MVC / MVVM](./12-mvc-mvvm.md) | Separate presentation responsibilities |

The [GoF catalog](./GoF-catalog.md) lists all 23 patterns and marks which have
local code examples. Dependency Injection is a technique/principle, and
MVC/MVVM are architectural patterns, not GoF patterns.

## Distinctions interviewers often probe

| Compare | Distinction |
|---|---|
| Simple Factory vs Factory Method vs Abstract Factory | A simple factory selects a product; Factory Method delegates creation to subclasses; Abstract Factory creates a related family of products. The local factory example is a simple factory. |
| Factory vs Builder | Factory chooses *which* object to create; Builder controls *how* a complex object is assembled. |
| Strategy vs State | Strategy selects an algorithm from outside; State changes behavior as an object's internal state transitions. |
| Adapter vs Facade | Adapter translates a mismatched contract; Facade presents a simpler contract over a subsystem. |
| Decorator vs Proxy | Decorator primarily composes additional responsibilities; Proxy primarily controls access/lifecycle. Both wrap an object and can look similar in code. |
| Observer vs Publish/Subscribe | Observer commonly connects a subject directly to observers; Pub/Sub adds a broker/channel boundary so publishers need not know subscribers. |
| Command vs Strategy | Command represents a request (often with history/lifecycle); Strategy represents a replaceable algorithm. |
| Dependency Injection vs Service Locator | Injection makes dependencies explicit at construction/call time; a service locator hides lookup behind a global registry. |

## A concise interview walkthrough

1. **Name the pressure:** describe the requirement that is changing or the
   dependency that is too tightly coupled.
2. **Identify roles:** name the caller/context, abstraction, concrete
   implementations, and who creates or owns them.
3. **Trace one request:** follow the call/event and state where errors,
   cancellation, ownership, or cleanup occur.
4. **State the trade-off:** mention added indirection, object count, runtime
   configuration, lifecycle, or test complexity.
5. **Test the boundary:** replace a dependency, add a new variant, remove a
   listener, or verify behavior for an invalid input.

## Principles that help choose well

- Prefer composition and explicit dependencies when they reduce change
  coupling; inheritance is not required to implement a pattern.
- Keep abstractions aligned with actual variation. One implementation and no
  foreseeable variation may need no pattern.
- Depend on stable interfaces at boundaries, but do not create an interface for
  every class without a reason.
- Keep object creation at a clear composition boundary; avoid hidden global
  state and service-locator lookups.
- Explain the smallest useful design first, then show how it accommodates a
  second implementation.

## Common pitfalls

- Calling every `switch` a Factory or every callback list an Observer pattern.
- Claiming a pattern automatically satisfies SOLID or makes code extensible;
  explain which dependency changes and what remains unchanged.
- Confusing a code-level pattern with a distributed-systems guarantee. An
  in-process Observer/EventEmitter does not provide durable delivery, retries,
  or cross-process fan-out.
- Omitting lifecycle details: unsubscribe observers, release resources, bound
  caches, and make command retries safe where side effects are involved.
- Applying a pattern before the variation or coupling problem is clear.

## Practice path

Read the [pattern index](./README.md), explain one pattern without notes, then
implement a small example. The [Machine Coding questions](../Machine%20Coding/README.md)
provide places to apply Observer, Strategy, Command, and composition in a
larger feature.
