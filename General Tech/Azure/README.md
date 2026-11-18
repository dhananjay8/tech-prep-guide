# Azure Cloud Architecture Interview Preparation

An interview-focused guide to designing, operating, and explaining production Azure systems. The examples are starting points, not universal blueprints: choose services from workload requirements, regional availability, compliance, and operational ownership.

## Start Here

- [Azure architecture interview guide](./Azure-Architecture-Interview-Guide.md) — AKS reference architecture, service choices, security, reliability, and interview drills.
- [AKS enterprise architecture diagram](./Azure-AKS-Enterprise.drawio) — open with diagrams.net or the Draw.io editor.
- [AKS deployment, request, and recovery sequences](./Azure-AKS-Sequence.md) — Mermaid diagrams that render in Markdown viewers that support Mermaid.
- [Shared cloud architecture interview playbook](../Cloud-Architecture-Interview-Playbook.md) — a vendor-neutral way to structure system-design answers and compare AWS/Azure services.

## Recommended Study Path

1. State the requirements and failure boundaries before naming Azure services.
2. Walk the request path, data path, and identity path on the diagram.
3. Explain the deployment, scaling, rollback, and regional recovery sequences.
4. Quantify cost and latency trade-offs; call out assumptions and service limits.
5. Re-check live Microsoft Learn documentation for regional availability, quotas, support lifecycle, and SKU behavior before presenting exact numbers.

No architecture is “foolproof.” Interview-ready designs make their assumptions, residual risks, and recovery tests explicit.
