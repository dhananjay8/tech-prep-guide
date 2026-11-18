# AWS Staff-Level Interview Diagram Guide

Use the diagram set in this folder to discuss architecture choices using tradeoffs, not just components.

Open a diagram's **Preview + notes** page, then press `Cmd+Shift+V` in VS Code on
macOS to see the rendered image. No extension is needed for the PNG preview.
To edit a source, open it with diagrams.net or VS Code's Draw.io Integration
(`hediet.vscode-drawio`). If it opens as XML, run **Reopen Editor With…** from
the Command Palette and select the Draw.io editor.

The `.drawio` file is the source of truth. After editing, export a fresh PNG
alongside it using the same filename stem. Sources, previews, notes and related
sequence diagrams live together in `diagrams/<use-case>/`.

Difficulty is a suggested interview starting point, not an AWS certification
rating. Foundation diagrams can still support advanced trade-off discussions.

## Which Diagram to Use for Which Interview Question

| Use case | Level | Preview + notes | Editable | Interview prompt |
| --- | --- | --- | --- | --- |
| Compute | Foundation | [EC2 high availability](./diagrams/compute/aws-ec2-ha.md) | [Draw.io](./diagrams/compute/aws-ec2-ha.drawio) | How do you survive an AZ failure? |
| Compute | Advanced | [EKS multi-AZ](./diagrams/compute/aws-eks-multi-az.md) | [Draw.io](./diagrams/compute/aws-eks-multi-az.drawio) | How do you scale without zonal dependencies? |
| Compute | Foundation | [Serverless Lambda](./diagrams/compute/aws-serverless-lambda.md) | [Draw.io](./diagrams/compute/aws-serverless-lambda.drawio) | How do API, static and background paths differ? |
| Networking | Advanced | [Hybrid connectivity](./diagrams/networking/aws-hybrid-connectivity-dx-vpn.md) | [Draw.io](./diagrams/networking/aws-hybrid-connectivity-dx-vpn.drawio) | How do Direct Connect and VPN fail over? |
| Networking | Advanced | [Cross-account PrivateLink](./diagrams/networking/aws-privatelink-cross-account.md) | [Draw.io](./diagrams/networking/aws-privatelink-cross-account.drawio) | How do you expose a private SaaS API? |
| Reliability | Advanced | [Multi-Region applications](./diagrams/reliability/aws-multi-region-active-active.md) | [Draw.io](./diagrams/reliability/aws-multi-region-active-active.drawio) | What fails over when the writer Region is lost? |
| Reliability | Advanced | [Aurora global recovery](./diagrams/reliability/aws-aurora-global-disaster-recovery.md) | [Draw.io](./diagrams/reliability/aws-aurora-global-disaster-recovery.drawio) | How do you recover a single writer and reconcile lost writes? |
| Security | Advanced | [Private EKS](./diagrams/security/aws-zero-trust-private-eks.md) | [Draw.io](./diagrams/security/aws-zero-trust-private-eks.drawio) | How do you protect private cluster ingress and deployment? |
| Security | Advanced | [Multi-account landing zone](./diagrams/security/aws-multi-account-landing-zone.md) | [Draw.io](./diagrams/security/aws-multi-account-landing-zone.drawio) | How do you separate guardrails and account ownership? |
| Security | Advanced | [Identity and secrets](./diagrams/security/aws-centralized-identity-secrets.md) | [Draw.io](./diagrams/security/aws-centralized-identity-secrets.drawio) | How do you federate and rotate credentials? |
| Security | Advanced | [SaaS tenant isolation](./diagrams/security/aws-saas-tenant-isolation.md) | [Draw.io](./diagrams/security/aws-saas-tenant-isolation.drawio) | Where do you enforce tenant isolation? |
| Integration | Advanced | [Event-driven microservices](./diagrams/integration/aws-event-driven-microservices.md) | [Draw.io](./diagrams/integration/aws-event-driven-microservices.drawio) | How do you handle duplicates and replay? |
| Data | Advanced | [Governed data lake](./diagrams/data/aws-governed-data-lake.md) | [Draw.io](./diagrams/data/aws-governed-data-lake.drawio) | How do you share and govern data across accounts? |

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

- [EC2 deployment and request flow](./diagrams/compute/aws-ec2-ha-sequence.md)
- [EKS deployment and request flow](./diagrams/compute/aws-eks-sequence.md)
- [Serverless request and event flow](./diagrams/compute/aws-serverless-sequence.md)
- [Event-driven order processing](./diagrams/integration/aws-event-driven-sequence.md)
- [Multi-region failover and recovery](./diagrams/reliability/aws-multi-region-failover-sequence.md)
