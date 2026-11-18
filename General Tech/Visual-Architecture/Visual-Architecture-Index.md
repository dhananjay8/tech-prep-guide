# Architecture Diagram Pack (Interview Edition)

Production-style architecture diagrams for deployment, reliability, security, and event-driven design discussions.

## Quick Start

1. Pick one primary architecture from **Draw.io Blueprints**.
2. Use one matching **Sequence Diagram** to explain runtime and failure behavior.
3. Use docs in `General Tech/Visual-Architecture/` for Staff-level trade-off talking points.

## Draw.io Blueprints

- [AWS architecture diagram gallery](../AWS/aws-staff-interview-diagrams-guide.md) — editable diagrams organized by use case and difficulty.
- [Azure architecture diagram gallery](../Azure/diagrams/README.md) — private networking, AKS, recovery, governance, and messaging scenarios.

Open a preview Markdown file and press `Cmd+Shift+V` in VS Code on macOS.
The PNG needs no extension; editing `.drawio` requires Draw.io Integration or diagrams.net.

## Sequence Diagrams

| # | Sequence | Location | Focus |
|---|---|---|---|
| 1 | [Azure-AKS-Sequence.md](../Azure/diagrams/compute/Azure-AKS-Sequence.md) | `General Tech/Azure/diagrams/compute/` | AKS deployment, request, autoscaling, and regional recovery |
| 2 | [FortiRecon-Event-Pipeline-Sequence.md](../companies/FortiRecon/FortiRecon-Event-Pipeline-Sequence.md) | `General Tech/companies/FortiRecon/` | FortiRecon EASM/DRP discovery to alert pipeline |

## Companion Docs

- [Diagram-Presentation-Playbook.md](./Diagram-Presentation-Playbook.md)
- [Production-Controls-Checklist.md](./Production-Controls-Checklist.md)
- [Sequence-Diagram-Guide.md](./Sequence-Diagram-Guide.md)

## Interview Topics Covered

- Monorepo deployment options (VMs, containers, serverless, Kubernetes)
- Multi-region trade-offs (latency, consistency, blast radius, cost)
- Zero-trust architecture (private networking, policy, workload identity)
- Event-driven reliability (idempotency, retries, dead-letter handling, replay)
- Governance and security (multi-account controls, OIDC federation, encryption key policies)

## Diagram Rendering Tips

- Prefer Mermaid-safe labels without complex unquoted symbols.
- If a Mermaid label includes `(` or `)`, wrap it in quotes.
- Keep node labels concise and move detailed explanations to bullets below diagrams.
