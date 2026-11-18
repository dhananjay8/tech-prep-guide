# AWS ECS Fargate HA - Runtime + Deployment Sequence

## Deployment flow

```mermaid
sequenceDiagram
    autonumber
    participant Dev as Developer
    participant GH as GitHub repository
    participant GHA as GitHub Actions
    participant ECR as Amazon ECR
    participant CD as AWS CodeDeploy
    participant ECS as ECS Fargate service
    participant ALB as Application Load Balancer
    participant Obs as CloudWatch alarms

    Dev->>GH: Push commit
    GH->>GHA: Trigger CI/CD
    GHA->>GHA: Run tests, security scans, and generate SBOM
    GHA->>ECR: Push signed container image
    GHA->>CD: Create deployment from new task definition
    CD->>ECS: Start replacement task set
    ECS-->>CD: Report healthy tasks on test listener
    CD->>ALB: Shift canary traffic
    GHA->>Obs: Publish deployment annotation

    alt SLO gate fails
        Obs-->>CD: Error rate or latency threshold breached
        CD->>ALB: Shift traffic back to previous task set
        CD->>ECS: Stop replacement task set
    else SLO gate passes
        Obs-->>CD: Canary alarms remain clear
        CD->>ALB: Complete traffic shift
        CD->>ECS: Retire previous task set
    end
```

## Request flow

```mermaid
sequenceDiagram
    autonumber
    participant User as Application user
    participant R53 as Route 53
    participant CF as CloudFront and WAF
    participant ALB as Application Load Balancer
    participant ECS as ECS Fargate service
    participant Redis as ElastiCache Redis
    participant DB as Aurora
    participant Obs as CloudWatch and X-Ray

    User->>R53: Resolve application hostname
    R53-->>User: Return CloudFront distribution name
    User->>CF: Send HTTPS request
    CF->>ALB: Forward request to configured origin
    ALB->>ECS: Route to a healthy task
    ECS->>Redis: Read or update cache/session

    alt Database available
        ECS->>DB: Read or write business data
        DB-->>ECS: Return query result
    else Database timeout
        ECS->>Redis: Serve bounded stale data when allowed
        Redis-->>ECS: Return cached response
    end

    ECS-->>ALB: Return application response
    ALB-->>CF: Return origin response
    CF-->>User: Return cached or origin response
    ECS->>Obs: Publish logs, traces, and metrics
```

## Staff Interview Angles

- Explain ECS deployment safety using task sets and metric gates.
- Discuss degraded-read path to preserve availability during DB stress.
- Mention cost/performance trade-off versus EKS operational flexibility.
