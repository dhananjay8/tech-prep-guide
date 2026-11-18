# Azure AKS Enterprise — Deployment, Request, and Recovery Flows

These sequences describe one reference design, not automatic Azure behavior. The AKS API is private, so the deployment runner needs network access to it. Front Door Private Link origins require an approved connection and supported origin configuration.

## Deployment flow

```mermaid
sequenceDiagram
    autonumber
    participant Dev as Developer
    participant GH as GitHub repository
    participant GHA as GitHub Actions runner
    participant Entra as Microsoft Entra ID
    participant ACR as Azure Container Registry
    participant AKS as Private AKS API
    participant Rollout as Rollout controller
    participant Mon as Azure Monitor

    Dev->>GH: Merge reviewed change
    GH->>GHA: Start protected pipeline
    GHA->>Entra: Exchange OIDC token for short-lived Azure token
    Entra-->>GHA: Return scoped deployment identity
    GHA->>GHA: Test, scan, generate SBOM, and sign image
    GHA->>ACR: Push immutable image digest
    GHA->>AKS: Apply backward-compatible release
    AKS->>Rollout: Create canary workload
    Rollout->>Mon: Publish rollout and SLO signals

    alt SLO gate fails
        Mon-->>Rollout: Error or latency threshold breached
        Rollout->>AKS: Restore previous stable version
    else SLO gate passes
        Mon-->>Rollout: Canary remains within guardrails
        Rollout->>AKS: Promote the same image digest
    end
```

Use a VNet-connected runner for a private AKS API. Helm applies manifests; a rollout controller and metrics analysis provide canary behavior and automated rollback.

## Request flow

```mermaid
sequenceDiagram
    autonumber
    participant User as Application user
    participant DNS as Azure DNS
    participant FD as Front Door Premium and WAF
    participant PL as Approved Private Link origin
    participant ILB as Internal load balancer
    participant GW as Gateway API ingress
    participant Pod as AKS API pod
    participant PG as PostgreSQL Flexible Server
    participant Redis as Azure Managed Redis

    User->>DNS: Resolve application hostname
    DNS-->>User: Return Front Door endpoint
    User->>FD: Send HTTPS request
    FD->>PL: Apply WAF/routing and forward to private origin
    PL->>ILB: Reach approved internal origin
    ILB->>GW: Route to healthy ingress target
    GW->>Pod: Forward to healthy service endpoint
    Pod->>Redis: Read cache/session with TTL
    Pod->>PG: Read or commit transactional data
    PG-->>Pod: Return query result
    Pod-->>GW: Return application response
    GW-->>ILB: Return origin response
    ILB-->>PL: Return response over private origin
    PL-->>FD: Return origin response
    FD-->>User: Return cached or origin response
```

DNS returns the Front Door hostname; it does not forward the HTTP request. Redis is a cache, not the source of truth.

## Scale and regional recovery

```mermaid
sequenceDiagram
    autonumber
    participant HPA as Kubernetes HPA
    participant Metrics as Metrics API
    participant API as AKS API server
    participant Nodes as Cluster Autoscaler and node pools
    participant Mon as Azure Monitor
    participant OnCall as On-call engineer
    participant Runbook as Regional recovery runbook
    participant PG as PostgreSQL read replica
    participant FD as Front Door
    participant Region2 as Secondary application region

    HPA->>Metrics: Read CPU or custom metrics
    Metrics-->>HPA: Return current utilization
    HPA->>API: Increase desired pod replicas
    API->>Nodes: Schedule pods and request node capacity if needed

    opt Regional recovery is required
        Mon->>OnCall: Alert on regional health and SLO failure
        OnCall->>Runbook: Validate impact and RPO/promotion criteria
        Runbook->>PG: Promote replica using approved procedure
        PG-->>Runbook: Confirm writable endpoint
        Runbook->>FD: Update regional routing after health checks pass
        FD->>Region2: Route new requests to recovered capacity
    end
```

PostgreSQL cross-Region replicas are asynchronous and do not promote themselves. Establish data promotion, connection changes, traffic shift, and failback ownership in advance.
