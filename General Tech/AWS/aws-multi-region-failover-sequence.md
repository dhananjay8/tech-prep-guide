# AWS Multi-Region Active-Active - Failure and Recovery Sequence

## Normal traffic

```mermaid
sequenceDiagram
    autonumber
    participant User as Global user
    participant R53 as Route 53 DNS
    participant GA as AWS Global Accelerator
    participant R1 as Region 1 application
    participant R2 as Region 2 application
    participant ADB1 as Aurora primary cluster
    participant ADB2 as Aurora secondary cluster
    participant DDB as DynamoDB Global Tables

    User->>R53: Resolve application hostname
    R53-->>User: Return Global Accelerator address
    User->>GA: Send HTTPS request
    GA->>R1: Route to a healthy endpoint
    R1->>ADB1: Read or write transactional data
    R1->>DDB: Read or write global profile/session
    R1-->>User: Return application response

    opt Request is routed to Region 2
        User->>GA: Send HTTPS request
        GA->>R2: Route to a healthy endpoint
        R2->>ADB2: Read transactional data from secondary
        R2->>DDB: Read or write global profile/session
        R2-->>User: Return application response
    end
```

## Failover and recovery

```mermaid
sequenceDiagram
    autonumber
    participant Obs as Regional health alarms
    participant OnCall as On-call SRE
    participant Runbook as Failover runbook
    participant ADB1 as Aurora primary cluster
    participant ADB2 as Aurora secondary cluster
    participant GA as AWS Global Accelerator
    participant R1 as Region 1 application
    participant R2 as Region 2 application

    Note over R1,Obs: Region 1 becomes unhealthy
    Obs->>OnCall: Alert on health-check and SLO failures
    OnCall->>Runbook: Validate impact, RPO, and promotion criteria
    Runbook->>ADB2: Promote secondary if policy allows
    ADB2-->>Runbook: Confirm new writer is ready
    Runbook->>GA: Drain Region 1 and shift traffic
    GA->>R2: Route new requests to healthy endpoint
    R2->>ADB2: Read or write after promotion

    opt Region 1 recovery
        Obs-->>OnCall: Region 1 health restored
        OnCall->>Runbook: Check capacity and data consistency before failback
        Runbook->>ADB1: Rejoin and synchronize recovered cluster
        Runbook->>GA: Gradually restore traffic after validation
        GA->>R1: Route traffic after health checks pass
    end
```

## Architect Interview Angles

- Describe failover trigger source (health checks + SLO burn rate).
- State RTO/RPO assumptions before discussing writer promotion.
- Explain controlled failback to avoid second outage during recovery.
