# AWS Event-Driven Microservices - Order Processing Sequence

## Order acceptance and event publication

```mermaid
sequenceDiagram
    autonumber
    participant User as Customer
    participant API as API Gateway
    participant CMD as Order command service
    participant DB as Orders database
    participant RELAY as Outbox relay
    participant BUS as EventBridge event bus

    User->>API: POST /orders
    API->>CMD: Forward command request
    CMD->>DB: Commit order and outbox row in one transaction
    DB-->>CMD: Commit successful
    CMD-->>API: Return 201 Created
    API-->>User: Confirm order accepted

    RELAY->>DB: Read unpublished outbox rows
    DB-->>RELAY: Return OrderCreated event
    RELAY->>BUS: Publish event with schema version and event ID
```

## Asynchronous fan-out and recovery

```mermaid
sequenceDiagram
    autonumber
    participant BUS as EventBridge event bus
    participant BILLQ as Billing SQS queue
    participant BILL as Billing consumer
    participant NOTIFQ as Notification SQS queue
    participant NOTIF as Notification consumer
    participant READ as Read-model consumer
    participant DLQ as Billing dead-letter queue
    participant Ops as Redrive operator

    BUS->>BILLQ: Route matching event
    BUS->>NOTIFQ: Route matching event
    BUS->>READ: Invoke read-model consumer
    READ->>READ: Update query model idempotently

    BILL->>BILLQ: Poll and receive message
    BILL->>BILL: Charge payment with idempotency key
    NOTIF->>NOTIFQ: Poll and receive message
    NOTIF->>NOTIF: Send confirmation idempotently

    alt Billing succeeds
        BILL-->>BILLQ: Delete processed message
    else Billing repeatedly fails
        BILL-->>BILLQ: Leave message for retry
        BILLQ->>DLQ: Redrive after max receives
    end

    opt Operator replays failed event
        Ops->>DLQ: Start redrive to source queue
        DLQ-->>BILLQ: Return message for reprocessing
        BILL->>BILLQ: Receive redriven message
    end
```

## Staff Interview Angles

- Mention transactional outbox to avoid dual-write inconsistency.
- Explain schema versioning compatibility across producers/consumers.
- Show why replay safety depends on idempotent consumer behavior.
