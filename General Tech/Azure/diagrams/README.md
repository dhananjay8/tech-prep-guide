# Azure Architecture Diagram Gallery

Choose an interview scenario below. Each preview page contains an image,
design discussion, and a link to its editable `.drawio` source. Open the
Markdown preview in VS Code with `Cmd+Shift+V` on macOS. To edit the diagram,
use diagrams.net or the Draw.io Integration extension; if XML opens, choose
**Reopen Editor With…** and select the Draw.io editor.

Files are grouped by use case. PNG previews sit next to their editable
sources; export an updated PNG with the same stem after editing. Difficulty is
a suggested interview starting point, not a certification classification.

| Use case | Level | Preview + notes | Editable | Interview prompt |
| --- | --- | --- | --- | --- |
| Compute | Advanced | [Private AKS](./compute/Azure-AKS-Enterprise.md) | [Draw.io](./compute/Azure-AKS-Enterprise.drawio) | How do you secure ingress and deployment to AKS? |
| Networking | Advanced | [Hub-spoke private DNS](./networking/azure-hub-spoke-private-dns.md) | [Draw.io](./networking/azure-hub-spoke-private-dns.drawio) | How do on-premises workloads reach private endpoints? |
| Reliability | Advanced | [Regional recovery](./reliability/azure-front-door-regional-recovery.md) | [Draw.io](./reliability/azure-front-door-regional-recovery.drawio) | How do traffic and database failover differ? |
| Security | Advanced | [Landing zone governance](./security/azure-landing-zone-governance.md) | [Draw.io](./security/azure-landing-zone-governance.drawio) | How do you govern many subscriptions safely? |
| Integration | Advanced | [Service Bus workflows](./integration/azure-service-bus-reliable-workflows.md) | [Draw.io](./integration/azure-service-bus-reliable-workflows.drawio) | How do you prevent lost and duplicate side effects? |

Pair the AKS architecture with its [deployment, request, and recovery
sequences](./compute/Azure-AKS-Sequence.md). Check current provider
documentation for regional availability, features, and service limits.
