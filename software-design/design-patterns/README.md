# Design Patterns — Interview Reference

Use the [interview guide](./interview-guide.md) to choose patterns by design
pressure, compare commonly confused patterns, and explain their trade-offs.
The [GoF catalog](./GoF-catalog.md) summarizes all 23 Gang of Four patterns;
the examples below use JavaScript (Node.js), Python, and Java.

| Pattern | Family / category | Use it when | Doc |
|---------|-------------------|------------|-----|
| Singleton | Creational | One scoped instance is a real requirement | [Read](./creational/01-singleton.md) |
| Factory (simple factory example) | Creational technique | Creation choice should be centralized | [Read](./creational/02-factory.md) |
| Builder | Creational | Construction has meaningful steps or invariants | [Read](./creational/03-builder.md) |
| Observer | Behavioral | Subscribers need notification of changes | [Read](./behavioral/04-observer.md) |
| Strategy | Behavioral | Algorithms should be interchangeable | [Read](./behavioral/05-strategy.md) |
| Decorator | Structural | Compose optional behavior around an object | [Read](./structural/06-decorator.md) |
| Adapter | Structural | Translate between incompatible interfaces | [Read](./structural/07-adapter.md) |
| Proxy | Structural | Control access to an object with the same contract | [Read](./structural/08-proxy.md) |
| Command | Behavioral | Represent requests for queuing, logging, or undo | [Read](./behavioral/09-command.md) |
| Iterator | Behavioral | Traverse a collection through a stable interface | [Read](./behavioral/10-iterator.md) |
| Dependency Injection | Technique / principle | Supply collaborators instead of constructing them internally | [Read](./principles/11-dependency-injection.md) |
| MVC / MVVM | Architectural patterns | Separate UI, presentation state, and domain behavior | [Read](./principles/12-mvc-mvvm.md) |

This is a focused selection, not the complete Gang of Four catalog. In
particular, the local Factory example is a **simple factory**, not a complete
Factory Method implementation. Dependency Injection and MVC/MVVM are included
as useful related design concepts, but are not GoF patterns.

## Start with these comparisons

- Factory vs Builder: choose the product vs construct it step by step.
- Strategy vs State: select an algorithm vs model behavior-changing state.
- Adapter vs Facade: translate a contract vs simplify a subsystem.
- Decorator vs Proxy: compose responsibilities vs control access/lifecycle.
- Observer vs Pub/Sub: direct subject-to-listener relationship vs brokered
  communication.

For the complete comparison table and interview talk track, see the
[interview guide](./interview-guide.md).
