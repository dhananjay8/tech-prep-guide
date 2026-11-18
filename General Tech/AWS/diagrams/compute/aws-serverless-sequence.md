# AWS Serverless (Lambda) - Runtime + Deployment Sequence

## Deployment flow

```mermaid
sequenceDiagram
    autonumber
    participant Dev as Developer
    participant GH as GitHub repository
    participant GHA as GitHub Actions
    participant S3 as S3 static-site bucket
    participant CF as CloudFront
    participant L as API Lambda

    Dev->>GH: Push commit
    GH->>GHA: Trigger CI/CD
    GHA->>GHA: Run tests and security scans
    GHA->>S3: Upload versioned frontend assets
    GHA->>CF: Invalidate changed asset paths
    GHA->>L: Publish function version and update alias
```

## Web and API request flow

```mermaid
sequenceDiagram
    autonumber
    participant User as Application user
    participant R53 as Route 53
    participant CF as CloudFront and WAF
    participant S3 as S3 static-site bucket
    participant APIGW as API Gateway
    participant L as API Lambda
    participant DDB as DynamoDB
    participant Proxy as RDS Proxy
    participant AUR as Aurora Serverless

    User->>R53: Resolve application hostname
    R53-->>User: Return CloudFront distribution name
    User->>CF: Request page or /api/* resource
    alt Static asset request
        CF->>S3: Fetch SPA asset from origin
        S3-->>CF: Return asset
        CF-->>User: Return cached or origin asset
    else API request
        CF->>APIGW: Forward request using API behavior
        APIGW->>L: Invoke API function
        alt Key-value access
            L->>DDB: Read or write item
            DDB-->>L: Return item or write result
        else Relational access
            L->>Proxy: Borrow database connection
            Proxy->>AUR: Execute query
            AUR-->>Proxy: Return query result
            Proxy-->>L: Return query result
        end
        L-->>APIGW: Return API response
        APIGW-->>CF: Return origin response
        CF-->>User: Return cached or origin response
    end
```

## Asynchronous processing and retries

```mermaid
sequenceDiagram
    autonumber
    participant L as API Lambda
    participant BUS as EventBridge
    participant SQS as SQS queue
    participant ESM as Lambda event source mapping
    participant CON as Async consumer Lambda
    participant DLQ as Dead-letter queue

    L->>BUS: Publish event with idempotency key
    BUS->>SQS: Route matching event to queue
    ESM->>SQS: Poll for messages
    SQS-->>ESM: Return message batch
    ESM->>CON: Invoke consumer with batch
    CON->>CON: Process idempotently
    alt Processing succeeds
        CON-->>ESM: Report successful items
        ESM->>SQS: Delete successful messages
    else Processing repeatedly fails
        CON-->>ESM: Report failed item
        ESM->>SQS: Retry after visibility timeout
        SQS->>DLQ: Redrive after max receives
    end
```

## Staff Interview Angles

- Show where idempotency is introduced before async fan-out.
- Discuss Lambda concurrency controls and downstream protection.
- Explain DLQ replay operations and failure triage ownership.
