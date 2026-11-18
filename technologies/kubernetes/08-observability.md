# Kubernetes Observability — Interview Notes

## 1. The Three Pillars on K8s

Observability helps answer three questions: how is the system performing,
what happened, and where did a request slow down?

```text
Metrics   Prometheus (scrape /metrics, PromQL, rules) → Grafana → Alertmanager
Logs      Fluent Bit (DaemonSet) → Elasticsearch/Loki → Kibana/Grafana
Traces    App → OTel collector → Jaeger/Tempo → trace IDs join logs+metrics
```

Pods and nodes can be replaced. Run a log/metric collector on each node with
a DaemonSet, or send data through an OpenTelemetry sidecar or gateway.
Installing agents on a fixed app server is not enough.

## 2. Metrics — Prometheus on K8s

- **kube-state-metrics** reports Kubernetes object state, such as Pod status,
  Deployment replicas, and storage claims. **node-exporter** reports node CPU,
  memory, and disk. Apps expose `/metrics`; ServiceMonitor/PodMonitor tell the
  Prometheus Operator what to scrape.
- For services, track **RED**: request rate, errors, and duration. For
  resources, track **USE**: utilization, saturation, and errors.
- Keep label values limited. A label like `user_id` can create millions of
  time series and overload Prometheus.

```promql
# p95 latency per service
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{job="api"}[5m])) by (le, service))
# crashlooping pods
increase(kube_pod_container_status_restarts_total[1h]) > 3
```

## 3. Logging

- Fluent Bit or Fluentd runs on each node as a DaemonSet and reads container
  logs from stdout/stderr. Apps should not rely on local log files.
- Add Kubernetes details such as namespace and Pod name. Use structured JSON
  so logs are easy to search, then send them to Elasticsearch, Loki, or
  CloudWatch.
- Use a logging sidecar only when the app cannot write to stdout/stderr.
  Pods can disappear quickly, so forward logs promptly.

## 4. Tracing

- Send traces from the OpenTelemetry SDK or agent to a collector, then to a
  tracing system such as Jaeger or Tempo.
- A trace shows where a request spent time as it passed through ingress,
  services, Pods, and databases.
- Put `trace_id` in log lines and connect metric samples to traces. This makes
  it easier to move from a metric alert to the related trace and logs.

### eBPF & agent-less observability (worth a mention)

- **Cilium Hubble** uses eBPF to show network connections and policy drops,
  without changing app code.
- **Pixie / Cilium Tetragon** can show service connections and runtime
  security events using eBPF.
- Kubernetes Events are useful signals. Events such as `FailedScheduling`,
  `Unhealthy`, or `BackOff` may appear before metrics change. An event
  exporter can send them to your alerting system.

## 5. Alerting — Rules, Alertmanager, Fatigue

- Prometheus alert rules send alerts to Alertmanager. Alertmanager groups
  related alerts, suppresses duplicates, supports maintenance silences, and
  routes alerts by severity.
- Make every page actionable. Alert on user impact, such as a rising error
  rate, rather than a possible cause such as high CPU. Fix noisy alerts before
  adding more pages.

```yaml
groups:
- name: api
  rules:
    - alert: HighErrorRate
      expr: sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 0.05
      for: 10m
      labels: { severity: page }
      annotations: { summary: "API 5xx > 5% for 10m", runbook: "https://..." }
```

## 6. Failure → Observe → Fix Loop (interview frame)

```text
Alert → dashboards show which service, Pod, or node is affected
      → metrics show what changed; traces show where; logs show why
      → check Kubernetes details and Events
      → fix the issue, then review what happened
```

### Deployment evidence chain

For a managed release, match the CI run and final check to the reviewed
environment change, deployment result, Kubernetes Pods, and app behavior.
Use the same commit, image, environment, and time at each step. A passing
Jenkins stage, finished deployment job, or `Running` Pod alone does not prove
the whole release works.

Remember that these are different systems: the Jenkins controller schedules
the job, a worker runs the build, a deployment host applies the change,
Kubernetes control-plane components manage cluster objects, and worker nodes
run containers. Use approved read-only access. Do not expose credentials or
customer data in logs.

## 7. Interview Q&A

**Q: Monitor a cluster you've never seen?**
Start with node health and resource use. Then check Kubernetes objects, such
as restarting or Pending Pods and storage claims. Next check service traffic,
errors, and latency, then compare them with service objectives. The order
matters more than the tool.

**Q: Metrics vs logs vs traces?**
Metrics summarize behavior and are useful for alerts. Logs record detailed
events. Traces show a request across services. Use them together.

**Q: Prometheus HA/scale?**
Run multiple Prometheus replicas. Use a system such as Thanos, Cortex, or
Mimir for deduplication, longer retention, or multiple clusters. Remote-write
sends metrics to a central store. Federation can combine summaries.

**Q: How do you know alerts are good?**
Give every page an owner and a runbook. Track page volume and false alarms,
then remove alerts that are not useful.

---

## 8. Recall — Sound Bites

- "Metrics show a change, logs explain it, and traces locate it."
- "Run node-level collectors as DaemonSets."
- "Use RED for services and USE for resources."
- "Limit metric labels so Prometheus stays healthy."
- "Alert on user impact, not just a possible cause."
