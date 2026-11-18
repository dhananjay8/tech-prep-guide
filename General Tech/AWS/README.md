# AWS Staff/Principal Interview Preparation

Production-grade deep-dives and scenario guides for AWS staff-level interviews. Start with requirements and failure boundaries; treat examples as design exercises, not service guarantees.

## Topic Deep Dives

- [Compute & Serverless](./AWS-Compute-and-Serverless.md) — EC2/Nitro, Lambda, ECS/EKS/Fargate, Auto Scaling, storage, ElastiCache, Lambda@Edge.
- [Networking, Edge & Content Delivery](./AWS-Networking-Edge-and-Content-Delivery.md) — VPC, subnets, connectivity, Route 53, CloudFront, Global Accelerator, load balancers, WAF, VPC Lattice.
- [DynamoDB Internals](./AWS-DynamoDB-Internals.md) — Write/read lifecycle, partitioning, adaptive capacity, indexes, transactions, Global Tables, modeling anti-patterns.
- [Security, IAM & Governance](./AWS-Security-IAM-and-Governance.md) — IAM policy evaluation, SCPs, KMS, Organizations, federation, threat detection, data perimeter.
- [Resilience, DR & Multi-Region](./AWS-Resilience-DR-and-Multi-Region.md) — HA/DR strategies, replication, Route 53 ARC, FIS/chaos engineering, SLOs, Aurora internals.
- [System Integration & Messaging](./AWS-System-Integration-and-Messaging.md) — SQS, SNS, EventBridge, Kinesis, MSK, Step Functions, sagas, idempotency.

## Scenarios & Case Studies

- [Scenarios & Case Studies](./AWS-Scenarios-and-Case-Studies.md) — E-commerce, ride-hailing, banking ledger, media processing, IoT, flash sales, CI/CD, leaderboards, PrivateLink SaaS, and a staff-level system-design mind map.

## Diagrams & Sequence Walkthroughs

- [AWS Staff-Level Interview Diagram Guide](./aws-staff-interview-diagrams-guide.md) — maps each `.drawio` diagram to interview questions and staff-level talking points.
- [Draw.io architecture diagrams](./aws-staff-interview-diagrams-guide.md#which-diagram-to-use-for-which-interview-question) — open the linked `.drawio` files with diagrams.net or the Draw.io editor.
- Mermaid sequence walkthroughs: [EC2](./aws-ec2-ha-sequence.md), [ECS Fargate](./aws-ecs-fargate-sequence.md), [EKS](./aws-eks-sequence.md), [Serverless](./aws-serverless-sequence.md), [Event-driven](./aws-event-driven-sequence.md), [Multi-region failover](./aws-multi-region-failover-sequence.md).

## How to Use

1. Pick one topic deep-dive and read it end-to-end.
2. Pair it with the corresponding case study and draw.io diagram.
3. Practice explaining the trade-offs in your own words.
4. Before an interview, re-read the staff-level sound bites at the end of each topic file.
5. Use the [cloud architecture interview playbook](../Cloud-Architecture-Interview-Playbook.md) to structure the answer and compare AWS/Azure choices.

## Interview Answer Checklist

- Clarify traffic, SLO, RTO/RPO, consistency, compliance, and operational ownership.
- Draw one request and one async path; call out trust and data-ownership boundaries.
- Explain retries, idempotency, overload behavior, deployment rollback, and tested recovery.
- Verify quotas, service support, and feature constraints in current AWS documentation before quoting exact numbers.
