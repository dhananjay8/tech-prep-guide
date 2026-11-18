# AWS EKS Multi-AZ - Runtime + Deployment Sequence

## Deployment flow

```mermaid
sequenceDiagram
    autonumber
    participant Dev as Developer
    participant GH as GitHub repository
    participant GHA as GitHub Actions
    participant ECR as Amazon ECR
    participant K8s as Kubernetes API server
    participant POD as EKS application pods
    participant Obs as Prometheus and CloudWatch

    Dev->>GH: Push commit and tag
    GH->>GHA: Start CI/CD pipeline
    GHA->>GHA: Run tests and security scans
    GHA->>ECR: Push signed images
    GHA->>K8s: Apply Helm release and start canary
    K8s->>POD: Schedule canary pods
    GHA->>Obs: Evaluate canary SLO metrics

    alt SLO gate fails
        Obs-->>GHA: Error rate or latency threshold breached
        GHA->>K8s: Roll back to previous release
        K8s->>POD: Restore stable workload
    else SLO gate passes
        Obs-->>GHA: Canary metrics are healthy
        GHA->>K8s: Promote rollout
        K8s->>POD: Complete deployment
    end
```

## Request flow

```mermaid
sequenceDiagram
    autonumber
    participant User as Application user
    participant R53 as Route 53
    participant CF as CloudFront and WAF
    participant ALB as ALB ingress
    participant POD as EKS application pods
    participant Cache as ElastiCache Redis
    participant DB as Aurora Multi-AZ

    User->>R53: Resolve application hostname
    R53-->>User: Return CloudFront distribution name
    User->>CF: Send HTTPS request
    CF->>ALB: Forward API or UI request
    ALB->>POD: Route to healthy pods by host/path
    POD->>Cache: Read or update cache
    POD->>DB: Read or write using workload IAM identity
    DB-->>POD: Return query result
    POD-->>ALB: Return application response
    ALB-->>CF: Return origin response
    CF-->>User: Return cached or origin response
```

## Autoscaling flow

```mermaid
sequenceDiagram
    autonumber
    participant HPA as Horizontal Pod Autoscaler
    participant MET as Kubernetes Metrics API
    participant K8s as Kubernetes API server
    participant POD as EKS application pods

    HPA->>MET: Read CPU or custom metrics
    MET-->>HPA: Return current utilization
    HPA->>K8s: Increase desired pod replicas
    K8s->>POD: Schedule additional pods
```

## Staff Interview Angles

- Explain why rollout gates use SLO metrics, not only pod health.
- Call out blast-radius control via canary + automated rollback.
- Mention scale loop: queue depth/RPS -> autoscaling -> cost/latency trade-off.
