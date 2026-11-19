# Docker & Kubernetes Troubleshooting Interview Guide

This guide helps developers and on-call engineers find the cause of a
Kubernetes problem. Start with read-only checks, find the failing part, and
make one safe change at a time. For longer examples, see
[Docker/Kubernetes Case Studies](./Docker-Kubernetes-Case-Studies-and-Scenarios.md).

## 1. Universal Troubleshooting Sequence

Follow these steps before changing anything:

1. **Describe the problem**: record the namespace, service, Pod, node, version,
   time, user impact, and how many replicas are affected.
2. **Check current state and events**:

   ```bash
   kubectl get pods -n <namespace> -o wide
   kubectl describe pod <pod> -n <namespace>
   kubectl get events -n <namespace> --sort-by=.metadata.creationTimestamp
   ```

3. **Read current and previous logs**:

   ```bash
   kubectl logs <pod> -n <namespace> -c <container>
   kubectl logs <pod> -n <namespace> -c <container> --previous
   ```

   `--previous` is useful only when a prior container instance exists.
   A container that never started may have no application logs.
4. **Check the controller and Pod settings**: Deployment, StatefulSet, or
   Job; configuration; probes; resource limits; image; volumes; and identity.
   Do not print Secret values in terminals or shared logs.
5. **Check the network path**: Pod readiness, Service labels and addresses,
   DNS, network policies, ingress/load balancer, and the next service.
6. **Check the node and cluster**: resources, quota, storage, runtime,
   networking, admission webhooks, and control-plane health.
7. **Make one reversible change**, then check user impact and watch for the
   problem to return.

Change one thing at a time so you can tell what fixed the issue. Use
privileged debug tools only when authorized and only for the required scope.

## 2. Status and Error Taxonomy

Pod status messages are clues, not a full diagnosis. Some are Kubernetes
states; others are errors reported by the container runtime.

- **`ErrImagePull`**: Kubernetes could not download the image. Check Pod
  events for the image name, registry response, credentials, TLS, DNS, and
  network access.
- **`ImagePullBackOff`**: Kubernetes is backing off after failed pulls.
  Check the same things as for `ErrImagePull`; the backoff is not the cause.
- **`InvalidImageName`**: The configured image reference is malformed or
  cannot be found. Check the final Kubernetes settings and image name.
- **Registry unavailable**: The registry, network, DNS, TLS, or login may
  have failed. Check the node's connection and the Pod events.
- **`CrashLoopBackOff`**: A container repeatedly exits and is restarted
  after a delay. Check previous logs, exit reason, probes, settings,
  dependencies, and memory.
- **`CreateContainerConfigError`**: A required config reference or
  container setting is invalid. Events may name the missing item.
- **`CreateContainerError`**: The runtime could not start the container.
  Check mounts, startup command, permissions, and runtime events.
- **`Pending`**: The Pod is not yet running; it may be unscheduled or
  waiting for setup. Check events, storage claims, and image status.
- **`OOMKilled`**: The container was killed after memory enforcement.
  Check its last state, memory use, and memory limit.
- **Container stop error**: Kubernetes could not stop the container.
  Check node, kubelet, and container-runtime logs.

**Note:** `RegistryUnavailable`, `InvalidImageName`, and `KillContainerError`
may appear in messages, but they are not standard Pod phases.
`CrashLoopBackOff` describes repeated restarts; it does not tell you why the
app exits.

## 3. Image Build and Pull Failures

### Q1. A Pod reports `ErrImagePull` and then `ImagePullBackOff`. What do you do?

1. Read the event and check the image name Kubernetes is using:

   ```bash
   kubectl describe pod <pod> -n <namespace>
   kubectl get pod <pod> -n <namespace> -o jsonpath='{.spec.containers[*].image}'
   ```

2. Use the message to narrow the cause:
   - `manifest unknown` / not found: check the repository and tag/digest.
   - `unauthorized` / `denied`: check the Pod's registry access.
   - timeout / connection refused: check DNS, proxy, firewall, registry, and
     node network access.
   - certificate error: check registry certificates and node trust settings.
   - unsupported platform: the image may not support the node's CPU type.
3. Check registry access from the node. Kubernetes downloads the image from
   the node, not from a developer's laptop.
4. Fix the image name or registry access, then use the normal deployment
   process. Use a digest to identify production images.

Do not put a registry password directly on a shared command line; it may
appear in shell history or process listings. Use the approved secret workflow.
Do not print Secret values while debugging.

### Q2. The image name looks like a URL or contains an unexpanded variable

**Cause:** An image name must point to a registry and repository, not an
arbitrary web URL. `${VERSION}` may be sent literally if the build did not
replace it.

**Fix:** Check the final Kubernetes settings and image name. Validate the
tag or digest in CI, and fail the build if a required variable is missing.
Use an image digest or a tag the registry cannot change.

### Q3. Image builds succeed locally but fail in cluster on architecture

**Cause:** Your computer and the Kubernetes nodes may use different CPU
types, base images, libraries, or certificates.

**Fix**:

- Publish an image for each supported CPU type or build for the cluster's
  target.
- Inspect node architecture and image manifest.
- Test the final image on a matching platform.
- Do not rely on files or cached layers that exist only on a developer's
  machine.

For Kubernetes node-level inspection, use the supported CRI tooling (for
example `crictl`) rather than assuming Docker Engine is installed.

## 4. Container Starts, Then Exits

### Q4. How do you debug `CrashLoopBackOff`?

1. Check the last exit, exit code, restart count, and events:

   ```bash
   kubectl describe pod <pod> -n <namespace>
   kubectl logs <pod> -n <namespace> -c <container> --previous
   ```

2. Use the exit reason to guide the search:
   - `OOMKilled`: investigate cgroup memory and allocation.
   - `OOMKilled`: check memory use and the container limit.
   - exit `1`: check app errors, settings, and dependencies.
   - exit `126`/`127`: check permissions, command, and file path.
   - exit `0` with repeated restarts: a one-time task may be running as a
     long-running service.
   - `137` or `143`: also check events and termination details. The code
     alone does not prove an OOM or clean shutdown.
3. Check probe type and timing. A liveness probe may restart a slow but
   healthy app before it finishes starting. Use a `startupProbe` when needed.
4. Check environment variables and mounted settings, without showing secret
   values. Confirm required settings exist.
5. Check dependencies. Use limited retries at startup; a brief dependency
   outage should not restart every replica.
6. Make one change, then confirm the app stays healthy under normal traffic.

### Q5. The Pod restarts, but logs appear empty

Check `--previous`, the container name, event times, and exit reason. The
app may have exited before logging started, or a probe may have stopped it
before logs were written. Also check memory events. If it never started,
check the image entrypoint, `command`, `args`, permissions, and mounted files.

### Q6. What does exit code 137 mean? Is it always OOM?

No. `137` often means the process received `SIGKILL`. This can happen after
an OOM, a forced stop, eviction, or another kill. Check the Pod's reason and
events, cgroup memory events, node pressure, and runtime logs. `143` often
means `SIGTERM`; check the shutdown details before calling it graceful.

### Q7. A Pod is OOMKilled while application heap metrics look healthy

**Why:** The container limit includes more than the app's Java or language
heap. Threads, direct buffers, native code, runtime overhead, and file cache
also use memory. A working-set or RSS metric may differ from the value used
to enforce the limit.

**Investigate**:

- Compare container/cgroup memory, process RSS, runtime heap, and OOM events.
- Check whether large requests, concurrency, buffers, queues, caches, or
  native libraries increased memory use.
- Decide whether the limit is too low or work is accumulating without bounds.

**Fix:** Limit concurrent work and queue size. Stream large requests, close
resources, and fix leaks. Size memory using realistic load and leave headroom.
Simply raising the limit may only delay another OOM.

## 5. Scheduling and Resource Problems

### Q8. A Pod is `Pending` despite free CPU on some nodes

Start with scheduler events:

```bash
kubectl describe pod <pod> -n <namespace>
kubectl get nodes
```

The Pod may need more resources than eligible nodes have, lack a matching
toleration, affinity, or topology, exceed quota, wait for storage, or require
a particular GPU/CPU type. The cluster may also have reached its Pod/IP
limit. Compare the Pod's requests with the resources available on nodes it
can use. Free CPU on an ineligible node will not help. Fix the constraint;
do not lower requests without understanding the impact.

### Q9. Nodes show pressure and Pods are evicted

Check node conditions, eviction events, disk and memory use, inodes, logs,
`emptyDir`, and image cleanup. Review requests/limits, QoS class, system
reservations, and the process using the resources. Correct requests and
capacity plans help protect critical apps, but QoS does not prevent every
failure. Confirm cleanup and autoscaling after the fix.

### Q10. HPA shows unknown metrics or does not scale

Check HPA status/events, metrics availability, target metric, resource
requests, replica limits, quotas, and whether new Pods can schedule. CPU
utilization is calculated from the Pod's request. For external metrics,
check the adapter's data and units. Also confirm the node autoscaler and
downstream databases can handle more replicas.

## 6. Networking and Service Discovery

### Q11. Service is unreachable although the Pods are running

Check each part of the connection:

1. Is the Pod Ready, and is the app listening on the right port?
2. Do the Service labels match the Pod labels?
3. Does the Service have ready Pod addresses in its EndpointSlices?

   ```bash
   kubectl get svc <service> -n <namespace> -o yaml
   kubectl get endpointslices -n <namespace> \
     -l kubernetes.io/service-name=<service>
   ```

4. Do Service `port` and `targetPort` match the app's port?
5. Does DNS return the expected Service address?
6. Could a network policy, CNI, service mesh, firewall, or cloud route block
   the connection?
7. Can the response get back to the client, using the right protocol?

When allowed, test from an approved diagnostic Pod. `Running` does not mean
the Pod is Ready or reachable.

### Q12. DNS lookups fail or take several seconds inside Pods

- Check `/etc/resolv.conf`, search domains, `ndots`, CoreDNS health/logs,
  DNS policy, and network access to UDP/TCP port 53.
- Compare lookups for Kubernetes service names and external names.
- If CoreDNS looks healthy, check node-local DNS cache, connection tracking,
  packet drops, and upstream DNS.
- Do not change cluster-wide DNS settings based on one Pod. Test with
  typical names over both IPv4 and IPv6.

For a repeatable delay, compare DNS timing with packet captures and node
logs. Connection tracking or UDP handling may be involved, but timing alone
does not prove a kernel problem. Check packet loss, software versions, DNS
retries, `ndots`, and CoreDNS/upstream health before changing DNS settings.

### Q13. Only some clients see 502/504 or uneven traffic

Compare the request route, load-balancer target, Pod/zone, protocol,
connection reuse, timeouts, and recent endpoint changes. Long-lived HTTP/2
or WebSocket connections may stay on one backend. During shutdown, endpoint
updates and app termination take time. Drain connections gracefully and use
measured timeouts. Compare ingress logs with app traces; a 502 is not always
a probe problem.

## 7. Storage and Stateful Workloads

### Q14. PVC is Pending or volume mount fails

Check storage-claim events, the StorageClass, storage drivers, access mode,
capacity, zone, quota, and volume attachment. Find whether the failure is
during disk creation, attach, mount, or app startup. Do not delete a claim,
volume, or cloud disk until you understand its backup and reclaim behavior.
After repair, check the files and application data.

### Q15. StatefulSet Pod does not recover after node failure

Check whether the old node and Pod are really gone, whether the volume is
still attached, and how the storage driver handles reattachment. Check the
StatefulSet identity, storage claim, zone, and app replication. Do not
force-delete the Pod or detach the volume until you understand the risk of
two copies using the same data. Follow the storage/app recovery guide.

## 8. Node, Runtime, and Control-Plane Failures

### Q16. A Pod is stuck in `Terminating`

Check finalizers, deletion time, `preStop`, shutdown grace period, ongoing
work, node/runtime health, and volume detach events. Fix the controller or
app shutdown problem. Removing finalizers or force-deleting can leave data
or resources behind; do it only when you understand the impact.

### Q17. Container runtime reports it cannot stop a container

`KillContainerError` is not a standard Pod phase. Check Pod events, node
status, kubelet/runtime logs, and the container ID. Find out whether the
process is stuck, the node is unhealthy, or the runtime cannot communicate.

If the node needs repair, coordinate with the app owner and capacity team.
Only cordon/drain it when disruption budgets, local storage, and cluster
quorum are safe. Restarting the runtime can affect every container on that
node; follow the platform guide.

### Q18. The API server accepts reads but rejects writes

Check API server health and logs, admission webhooks, permissions, API
Priority and Fairness, etcd health/disk/quorum, and provider status. Working
reads do not prove that etcd has lost quorum. If etcd recovery may be needed,
save logs and snapshots and follow the provider's recovery guide. Do not
remove etcd members or restore snapshots without an approved recovery point.

### Q19. Admission webhook blocks Pod creation

Check API server events/logs and the webhook's Service, endpoints,
certificates, timeout, `failurePolicy`, selectors, and namespace rules.
Check whether the webhook needs a Pod that it is blocking from starting.
Restore the webhook or follow the approved emergency process. Do not turn
off admission checks cluster-wide as a first response.

For important webhooks, run multiple replicas and spread them across nodes.
Set appropriate priority and capacity, and keep selectors narrow. Excluding
system namespaces may help startup, but must be approved. `failurePolicy:
Ignore` lets requests continue during an outage but skips that webhook; use
it only when that risk is acceptable.

### Q20. Kubernetes control-plane or node symptom: where do you start?

- **`kubectl` hangs or cannot connect to `:6443`**: Check the API endpoint,
  load balancer, and provider status. For self-managed clusters, check API
  server health and logs.
- **Reads work but writes fail**: Check API errors, permissions, admission
  webhooks, request limits, etcd, and control-plane storage.
- **`x509: certificate has expired`**: Find which certificate expired and
  follow the provider or kubeadm renewal guide.
- **Pods stay Pending across the cluster**: Check scheduler events, nodes,
  networking, quotas, and available IPs.
- **Node is `NotReady` or reports runtime errors**: Check kubelet and
  container-runtime health, node pressure, networking, and events. Do not
  restart the runtime without a maintenance plan.
- **Pods fail after a node upgrade**: Compare node, runtime, and network
  versions. Check IP capacity and required DaemonSets. Pause upgrades while
  investigating.
- **Pod stays Terminating**: Check finalizers and volume detach. Remove
  finalizers only as a documented last resort.

For self-managed etcd, use the secured `etcdctl` setup and recovery guide.
Do not remove members or restore snapshots as a generic fix.

### Q21. A managed deployment reports failure, but some Pods are still healthy

Some running Pods do not prove that the rollout succeeded. Check the
platform's release record and runner logs, then compare the intended image
and settings with each Deployment, ReplicaSet, and Pod. Check readiness,
restarts, and current/previous logs. Events may be empty or may have expired.

If the logs show a database migration error, such as a column that already
exists, check the migration history and database schema with the database
owner. This is not an image-pull or scheduling problem. Do not rerun the
migration blindly, change shared data, or bypass the reviewed deployment
process with direct Helm/Kubernetes changes.

Keep each timeline separate: CI, deployment, and Pod health may refer to
different runs or versions. Match the build ID, reviewed change, image,
release record, Pod start time, and log times before deciding on a cause.

## 9. Safe Debugging Tools

### Read-only first

```bash
kubectl get pod <pod> -n <namespace> -o wide
kubectl describe pod <pod> -n <namespace>
kubectl get events -n <namespace> --sort-by=.metadata.creationTimestamp
kubectl get deploy,rs,svc -n <namespace>
kubectl top pod <pod> -n <namespace>
kubectl describe node <node>
# Qualys managed environments only; use the platform equivalent elsewhere.
kubectl get qhelm -n <namespace>
kubectl describe qhelm <release-slot> -n <namespace>
```

`kubectl top` needs a working metrics service and shows current use, not
history. Compare it with monitoring and container memory data.

### When the image is distroless or has no shell

Use an approved temporary debug container or node-debug process, with only
the access you need. Check what the debug container can see: it may share
the Pod's network, but access to its processes depends on configuration.
Capture only the needed data and remove temporary resources through the
approved process.

Example commands; available options and permissions vary by cluster:

```bash
kubectl debug pod/<pod> -n <namespace> -it \
  --image=<approved-debug-image> \
  --target=<container>
kubectl debug node/<node> -it \
  --image=<approved-node-debug-image>
```

Node tools such as `crictl`, `nsenter`, packet capture, and cgroup checks
need special access and may expose other tenants' data. Use the audited
emergency process. Confirm the container, process ID, and cgroup before
inspecting it. Do not run a generic `nsenter` command in production without
checking the runtime, namespaces, and authorization.

### Exit code quick reference

- `0`: Process exited successfully. Check workload type and restart policy.
- `1`: Application error. Check logs and application diagnostics.
- `126`: Command found but not executable. Check file mode, interpreter,
  and mount options.
- `127`: Command not found. Check entrypoint, `command`, `args`, and image.
- `137`: Often killed by `SIGKILL`. Check termination reason, cgroup OOM
  events, eviction, and force-kill context.
- `143`: Often terminated by `SIGTERM`. Check rollout, shutdown logs, and
  grace-period timing.

## 10. Interview Sound Bites

- "`describe` and Events show what Kubernetes saw; logs show what the app did."
- "`ImagePullBackOff` is retry state, not the root cause."
- "For `CrashLoopBackOff`, check previous logs, probes, and exit reason
  before changing delays."
- "`137` means SIGKILL commonly, not automatically OOM."
- "Running is not Ready; Ready is not proof that the full user journey
  works."
- "The same image can behave differently because its node, settings,
  identity, network, storage, or traffic differs."
- "Protect data and quorum before force-deleting Pods, detaching storage,
  or restarting a runtime."

## 11. Supporting-Source Coverage

These source documents informed the guide but are not included in this repository.

- `Docker_Kubernetes (1).md`: `ErrImagePull`, `ImagePullBackOff`,
  registry reachability, invalid image references, `CrashLoopBackOff`,
  and container stop/runtime failures.
- `Docker_Kubernetes.md`: OOMKilled and image-pull failures,
  Services/traffic, autoscaling, monitoring, etcd, persistent storage,
  and common design mistakes.
- `DevOps_ General Notes (1).md`: Cluster capacity,
  same-image/different-Pod diagnosis, and scenario-oriented answers.
- `DevOps_ General Notes (2).md`: Retry storms, noisy neighbors,
  dependency bootstrap failures, and outbound proxy/pool exhaustion.
