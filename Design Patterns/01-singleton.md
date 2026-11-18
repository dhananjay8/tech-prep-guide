# Singleton Pattern

**Intent:** Ensure one instance within a clearly defined scope and provide a
shared access point to it. "One" must be scoped (for example, one application
process), not assumed to mean one instance across workers or machines.

**When to use:** Database connections, config managers, logging, caches, thread pools.

---

## JavaScript (Node.js)
```javascript
class Database {
  constructor() {
    if (Database.instance) return Database.instance;
    this.connection = "connected"; // simulate DB connection
    Database.instance = this;
  }
  query(sql) { return `Executing: ${sql}`; }
}

const db1 = new Database();
const db2 = new Database();
console.log(db1 === db2); // true — same instance

// Module-level singleton (most common in Node.js)
// db.js
let instance = null;
function getDB() {
  if (!instance) instance = { connection: "connected" };
  return instance;
}
module.exports = { getDB };
```

## Python
```python
class Database:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.connection = "connected"
        return cls._instance

    def query(self, sql):
        return f"Executing: {sql}"

db1 = Database()
db2 = Database()
assert db1 is db2  # True — same instance

# Decorator-based singleton
def singleton(cls):
    instances = {}
    def get_instance(*args, **kwargs):
        if cls not in instances:
            instances[cls] = cls(*args, **kwargs)
        return instances[cls]
    return get_instance

@singleton
class Config:
    def __init__(self):
        self.settings = {}
```

## Java
```java
public class Database {
    private static volatile Database instance;
    private String connection;

    private Database() { this.connection = "connected"; }

    // Double-checked locking (thread-safe)
    public static Database getInstance() {
        if (instance == null) {
            synchronized (Database.class) {
                if (instance == null) {
                    instance = new Database();
                }
            }
        }
        return instance;
    }

    public String query(String sql) { return "Executing: " + sql; }
}
```

## Interview Talking Points
- **Thread safety**: The Java example uses `volatile` with double-checked locking. The JavaScript and Python examples are not safe against concurrent initialization in every runtime.
- **Lazy vs Eager**: Lazy = create on first use; Eager = create at class load
- **Drawbacks**: Global state, hard to unit test (use dependency injection instead)
- **In Node.js**: A module is cached per resolved module path in a process; duplicate package copies, workers, and separate processes can each have their own instance.
- **Python caveat**: The decorator example replaces the class name with a factory function and is not thread-safe as written; prefer an explicit provider when preserving the class type or lifecycle matters.
- Use this only when a single scoped instance is a real invariant. A dependency-injection container or module-level provider is often easier to test.
