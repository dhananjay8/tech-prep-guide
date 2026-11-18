# Cloud Architecture Interview Playbook

Use this framework for AWS, Azure, or another provider. The goal is to show how requirements drive architecture—not to recite service names.

## A 7-Step Design Answer

1. **Clarify:** users/tenants, critical journeys, traffic profile, data shape, latency, availability, residency, compliance, RTO/RPO, and team ownership.
2. **State assumptions:** write down estimates and constraints; invite correction before optimizing.
3. **Set boundaries:** accounts/subscriptions, Regions, zones, networks, trust boundaries, data ownership, and blast radius.
4. **Draw one request:** client/DNS/edge, ingress, service, data, async work, identity, and telemetry. Mark synchronous versus asynchronous edges.
5. **Prove failure behavior:** pod/instance, AZ, Region, dependency timeout, overload, bad deploy, credential/key issue, and operator error.
6. **Explain operations:** delivery, rollback, migrations, scaling signals, SLO alerts, runbooks, backup restore, and capacity/quota ownership.
7. **Compare options:** name one simpler or more scalable alternative and quantify its cost, latency, consistency, and operational trade-offs.

## Cloud Service Vocabulary (Not 1:1 Equivalents)

| Concern | AWS examples | Azure examples |
|---|---|---|
| Account/organization governance | Organizations, OUs, Control Tower | Management groups, subscriptions, Azure Policy |
| Identity and workload access | IAM, STS, IAM Identity Center | Microsoft Entra ID, Azure RBAC, managed identity, Workload ID |
| Virtual network | VPC, subnets, security groups | VNet, subnets, NSGs |
| Private service connectivity | PrivateLink, VPC endpoints | Private Link, private endpoints, private DNS |
| Global HTTP edge | CloudFront, Global Accelerator, Route 53 | Front Door, Azure DNS |
| Kubernetes platform | EKS | AKS |
| Managed relational database | RDS/Aurora | Azure SQL, PostgreSQL Flexible Server |
| Object storage | S3 | Blob Storage |
| Queue / event / stream | SQS, SNS, EventBridge, Kinesis, MSK | Service Bus, Event Grid, Event Hubs |
| Observability | CloudWatch, X-Ray | Azure Monitor, Application Insights, Log Analytics |

Treat this as a conversation aid. Product semantics, feature limits, network paths, and availability models differ; verify the actual service contract.

## What Strong Answers Make Explicit

- State which component owns each write and what consistency users observe.
- Assume delivery can repeat; make consumers idempotent and retries bounded.
- Separate health probes, user SLOs, autoscaling signals, and failover triggers.
- Draw identity and network controls as independent layers.
- Distinguish in-Region zone redundancy from cross-Region disaster recovery.
- Describe backup retention, restore testing, and data-promotion ownership—not only replication.
- Explain how a private control plane is reached by operators and deployment automation.
- Quote RTO/RPO, quotas, and availability only with scope, configuration, and a source.
- Describe cost drivers: idle capacity, cross-zone/Region traffic, NAT/egress, logs, replicas, and managed-service tiers.

## 90-Second Opening Template

“I’ll first confirm the traffic, latency/SLO, RTO/RPO, data consistency, and compliance assumptions. I’ll draw the smallest design that meets them, then trace one request and one asynchronous workflow. I’ll make the write owner and failure boundaries explicit, cover identity/network controls and deployment rollback, and finish with the main cost/operational trade-off. I’ll call out any service limits that need validation rather than treating them as guarantees.”

## Interview Drill Checklist

- Can you explain every arrow and trust boundary in your diagram?
- Can you remove one service and explain what capability or failure mode changes?
- What happens if a dependency is slow rather than fully unavailable?
- How do retries avoid overload and duplicate side effects?
- What is the degraded mode, and which operations are rejected?
- How do you prove the recovery objective with a game day or restore test?
- Which assumption would change your architecture first?

## Study Guides

- [AWS interview preparation](./aws/README.md)
- [Azure interview preparation](./azure/README.md)
