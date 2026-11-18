# AWS Staff-Level Interview Diagram Guide

Use the diagram set in this folder to discuss architecture choices using tradeoffs, not just components.

## Which Diagram to Use for Which Interview Question

- Scale stateless web/API quickly:
  - [EC2 high availability](aws-ec2-ha.drawio)
  - [ECS Fargate high availability](aws-ecs-fargate-ha.drawio)
  - [EKS multi-AZ](aws-eks-multi-az.drawio)

- Minimize ops overhead and ship fast:
  - [Serverless Lambda](aws-serverless-lambda.drawio)

- Extreme resilience and global traffic:
  - [Multi-region active-active](aws-multi-region-active-active.drawio)

- High-security/regulated environments:
  - [Zero-trust private EKS](aws-zero-trust-private-eks.drawio)

- Decoupled systems and asynchronous reliability:
  - [Event-driven microservices](aws-event-driven-microservices.drawio)

- Platform governance and enterprise scale:
  - [Multi-account landing zone](aws-multi-account-landing-zone.drawio)

- Hybrid enterprise networking and migration scenarios:
  - [Hybrid connectivity: Direct Connect + VPN](aws-hybrid-connectivity-dx-vpn.drawio)

- Identity and secrets at enterprise scale:
  - [Centralized identity and secrets](aws-centralized-identity-secrets.drawio)

## Staff-Level Talking Points

- Define SLOs first, then choose architecture shape.
- Explain blast-radius boundaries and failure domains.
- Quantify tradeoffs: latency, consistency, availability, and cost.
- Show deployment safety: progressive rollout, rollback, and observability gates.
- Show data safety: backups, replication, and tested restore paths.
- Show security posture: identity model, key management, traffic controls, and auditability.

## Networking Concepts to Explicitly Mention

- Public vs private subnet boundaries and least privilege routes.
- NAT per AZ to avoid zonal egress dependency.
- Security groups vs NACL responsibilities.
- Route 53 routing policies and health checks.
- CloudFront + WAF + Shield edge protections.
- VPC endpoints/PrivateLink for private service access.
- Transit Gateway for hub-and-spoke multi-VPC topologies.

## Sequence Walkthrough References

- [EC2 deployment and request flow](aws-ec2-ha-sequence.md)
- [ECS Fargate deployment and request flow](aws-ecs-fargate-sequence.md)
- [EKS deployment and request flow](aws-eks-sequence.md)
- [Serverless request and event flow](aws-serverless-sequence.md)
- [Event-driven order processing](aws-event-driven-sequence.md)
- [Multi-region failover and recovery](aws-multi-region-failover-sequence.md)
