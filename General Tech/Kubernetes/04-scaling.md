# Kubernetes Autoscaling — Interview Notes

## 1. The Three Layers (plus Karpenter)

| | HPA | VPA | Cluster Autoscaler | Karpenter |
| --- | ----- | ----- | -------------------- | ----------- |
| Scales | Pod **count** | Pod **size** (requests) | **Node count** | Node count |
| Driven by | Metrics (CPU/mem/custom) | Historical usage → recommends/updates | **Unschedulable pods** / underutilization | Unschedulable pods; provisions from workload constraints |
| Restart pods? | No | Sometimes; depends on update mode and support | May evict pods during scale-down | May evict pods during consolidation |
| Ownership | Kubernetes SIG | Kubernetes SIG | Cloud/provider integrations | Open-source project with provider-specific integrations |
| Use when | Load is variable, app is stateless | Pods over/under-requested | HPA alone stalls on capacity | Provision from workload constraints and consolidate underused nodes |

**Avoid-when cheatsheet**: HPA—no when app is stateful/single-replica or metrics lie (JVM warmup); VPA—don't mix with HPA on the *same* metric (CPU/mem) — combine VPA(memory recommendations) + HPA(custom metrics) or use VPA in recommendation-only mode; CA/Karpenter—pods with local storage/PDB constraints block node drains.

---

## 2. HPA — Horizontal Pod Autoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api
spec:
  scaleTargetRef: { apiVersion: apps/v1, kind: Deployment, name: api }
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target: { type: Utilization, averageUtilization: 70 }
    - type: Pods                                   # custom metric
      pods: { metric: { name: queue_depth },
              target: { type: AverageValue, averageValue: "100" } }
  behavior:                                       # v2: control scale speed
    scaleDown:
      stabilizationWindowSeconds: 300             # avoid flapping
      policies: [{ type: Percent, value: 50, periodSeconds: 60 }]
```

- Formula: `desiredReplicas = ceil(currentReplicas × currentMetric / target)` per metric; the **largest** wins.
- **Prerequisites**: metrics-server (CPU/mem); prometheus-adapter / KEDA for custom/external metrics (queue length, lag).
- **Scaling on requests**: utilization % is computed against `resources.requests` — **no requests = no HPA**.
- Gotchas: CPU-based HPA misfires for I/O-bound apps (queue depth is better); scale-down stabilization to prevent thrash; startup CPU spikes → use startupProbe + scale-up delay behavior.

### KEDA — Event-Driven Autoscaling & Scale-to-Zero

- Standard HPA **cannot scale to `0` replicas** (`minReplicas >= 1`) and requires complex `prometheus-adapter` wiring for external metrics.
- **KEDA (`ScaledObject` / `ScaledJob`)** acts as both:
  1. **Controller**: scales deployments **`0 ↔ 1`** based on 60+ external scalers (Kafka consumer lag, RabbitMQ/SQS queue depth, Redis list length, Cron schedules, Prometheus queries).
  2. **Metrics Server**: exposes the external metric to native K8s HPA, which drives **`1 ↔ N`** scaling.

## 3. VPA — Vertical Pod Autoscaler & In-Place Pod Resize

Modes include `Off` (recommendations only), `Initial` (apply when a Pod is
created), and `Recreate` (evict and replace the Pod). Supported VPA versions
also offer `InPlaceOrRecreate`, which tries an in-place resize and falls back
to recreating the Pod when needed. Check the installed VPA and Kubernetes
versions before relying on in-place updates. Right-size requests and limits
from observed usage; use a `LimitRange` to set namespace defaults and bounds.
Avoid eviction-based updates on single-replica workloads unless availability
is protected.

- **In-place Pod resize:** Kubernetes introduced the feature as alpha in
  v1.27, beta in v1.33, and stable in v1.35. On supported clusters, the kubelet
  can change CPU or memory resources without replacing the Pod. The container's
  `resizePolicy` affects whether a container restart is needed; if a resize
  cannot be applied in place, VPA may recreate the Pod instead.

## 4. Cluster Autoscaler & Karpenter

- **CA** sequence: pending pod (no node fits) → pick a node-group template → grow ASG/MIG → pod schedules. Scale-down: a node stays below the utilization threshold (often around 50% for about 10 minutes, but configurable) → drain respecting **PDBs** → terminate.
- **Blocks**: pods with local storage/emptyDir-as-state, strict PDBs, pods without controllers, pod anti-affinity pinning.
- **Karpenter**: its AWS provider can provision nodes directly from workload constraints without preconfigured autoscaling groups. It can consolidate underused nodes; instance selection follows the configured constraints and provider, not a guarantee to choose the cheapest option.

## 5. PodDisruptionBudget

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: api
spec:
  minAvailable: 2                    # or maxUnavailable: 1
  selector: { matchLabels: { app: api } }
```

PDBs constrain **voluntary** disruptions only (drain, upgrade, CA scale-down, VPA evictions) — never crashes or node failures. They *can* make drains hang forever (favorite: "node won't drain? check PDBs first").

---

## 6. Interview Q&A

**Q: Vertical vs horizontal?**
Horizontal = more pods, needs statelessness, zero-downtime. Vertical = bigger pods, may restart, fits monoliths/stateful — but hits node-size ceiling.

**Q: HPA + VPA together?**
Not both on CPU/memory (fight each other). Safe combos: VPA `Off` for right-sizing + HPA on custom metrics; or VPA on memory while HPA on CPU with different boundaries — keep it simple in the answer.

**Q: Cluster scales up but pods still pending?**
Quota/limits hit in cloud account, wrong instance types (no GPU/large nodes), taints, pod anti-affinity, PVC in wrong AZ.

**Q: Metric is fine but HPA won't scale up?**
`maxReplicas` reached, metrics-server down (`kubectl top pods` empty), target mis-set (Utilization vs Absolute), scale-up behavior policies too strict.

---

## 7. Recall — Sound Bites

- "HPA = more pods, VPA = fatter pods, CA/Karpenter = more nodes."
- "No resource requests → HPA is blind."
- "KEDA when the metric lives outside the cluster (queue lag)."
- "PDBs protect against *voluntary* evictions — and can block your drain."
- "Scale down slowly, scale up fast; `behavior` is your friend."
