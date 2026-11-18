# Qualys Microservice Deployment Guide

This guide explains how a microservice moves from code to a running service in
a managed Qualys Kubernetes environment. The exact repositories, build checks,
and deployment steps vary by service and pod, so check the service's own
configuration before applying these examples. CI (continuous integration)
builds and checks the code.

## 1. The end-to-end picture

```text
Service source + tests
  -> CI pipeline on Jenkins worker(s)
  -> application package, container image, scan reports, and versioned config
  -> shared configuration package (where the service uses one)
  -> reviewed change to the environment settings
  -> controlled deployment pipeline / Ansible
       -> publish ordinary configuration to Consul
       -> apply least-privilege Vault policy and secret references
       -> process the ordered release list through qhelm / Helm
  -> Kubernetes creates or updates Pods
  -> startup/readiness checks, service endpoints, ingress, and quick user-flow tests
  -> monitored release decision or reviewed rollback
```

A Pod is one running copy of the service inside Kubernetes.

Check three things:

1. **Did CI build and check it?** Check the logs, tests, scans, and built
   packages/images.
2. **Was a version approved for this pod?** Check the environment change and
   its review status.
3. **Does it work in the pod?** Check deployment status, Kubernetes health,
   application signals, and a quick user-flow test (smoke test).

Passing one check does not mean the other two passed.

## 2. Ownership model

Many Qualys services use three repositories. Some combine these roles or use
only some of the listed artifacts. Check the service's build and deployment
files before making a change.

| Repository | What it owns | Examples |
| --- | --- | --- |
| Service | The application and its build | Source, tests, image build, CI files, and optional config/chart files |
| Shared configuration | Defaults used across environments | Service versions, base Helm values, and any packaged Consul/Helm/Ansible files |
| Environment/deployment | Settings for one environment or pod | Release list, image versions, pod values, endpoints, Consul settings, and Vault policy |

Put each change in the right repository:

- Application code, probes, and image build: service repository.
- Shared defaults and shared config versions: shared configuration repository.
- Pod endpoints, image version, release order, and pod policy:
  environment/deployment repository.

Not every service packages Consul or Helm files into the shared artifact. The
build must include those files as dependencies. A file in the repository does
not prove it was included in the published package.

## 3. Phase A — prepare the service

Before changing the service, identify its owner, API/message contracts,
dependencies, target environments, database changes, support contacts, and
rollback limits.

Prepare the service for production:

- Build a standard container image (OCI format) from a supported, patched
  base image. Run as a non-root user when the platform allows it.
- Set clear application and management ports. Kubernetes port names must be
  15 characters or fewer.
- Add three probes: startup checks whether initialization has finished;
  liveness checks whether the process is stuck; readiness checks whether it
  should receive traffic.
- Set CPU and memory requests/limits. Handle `SIGTERM` so the service can
  shut down cleanly. Set timeouts and retry limits for dependencies.
- Write structured logs to stdout/stderr. Add request IDs, useful metrics, and
  health endpoints. Keep secrets and customer data out of logs.
- Keep normal settings outside the image. Fetch secrets at runtime; never
  commit credentials or bake them into an image.
- Keep APIs, messages, and database changes compatible while old and new
  versions run together. For databases, add new fields first, migrate data,
  then remove old fields after older code is gone.
- Package config and charts using the service's actual build setup.

For Java services, leave container memory for the Java Virtual Machine (JVM),
not just the Java heap. For asynchronous services, document message ordering,
retries, duplicate handling, and what happens to messages that keep failing.

## 4. Phase B — CI and artifact production

Jenkins has a **controller** that schedules and tracks jobs, and **workers**
that run the build commands. Check the job's console and stage results. A
controller log does not replace the worker's build log.

CI usually does these steps:

1. Check out the code and record its commit, branch, and build number.
2. Install the pinned dependencies and check lockfiles.
3. Compile, run tests, and run code analysis.
4. Build the application package, container image, and any required config
   packages.
5. Run security and policy checks. Produce a software bill of materials
   (SBOM) or build record if required.
6. Publish only the artifacts allowed by the pipeline's gates.

Record the result of every check. A build can compile, publish an image, and
pass an image scan, then fail a later software or policy check. An image in a
registry does not mean the full build passed or that the image is approved for
deployment. Report the failed check and its findings.

For each package or image, record:

- The source commit and build number.
- The exact package version or image reference. Use an image digest when
  available.
- Test/scan results and the final build status.
- Confirmation that the image exists in the registry (the artifact store).
  A JAR or config ZIP is not a container image.

An image tag is immutable only if the registry prevents it from changing.
Build once and promote the same checked artifact; do not rebuild it for each
environment.

## 5. Phase C — shared and environment settings

Configuration usually has two layers:

1. **Shared defaults**: settings used by more than one environment, such as
   resource limits and standard probes.
2. **Environment settings**: the image version, hostnames, ingress, service
   endpoints, and other pod-specific values.

The order in which these settings override each other depends on the
platform. This is a starting point, not a guarantee:

```text
chart defaults -> shared base values -> environment/pod values
               -> external runtime configuration -> secret provider
```

Check which value wins if the same setting appears in more than one place.
Do not copy another pod's values without checking its hostnames, ports, proxy,
storage, identity, and secret access.

In the Qualys pattern:

- `quadfile.yaml` lists releases, their order, Helm chart, namespace, timeouts,
  and options such as `wait_for_success`.
- `qhelm` applies the shared and pod-specific Helm values.
- Consul stores ordinary runtime settings. Pod files may override shared
  settings when the service's packaging supports it.
- Vault stores secrets. `qvaultsi` policies control which secrets a service
  can read. Give each service only the access it needs.

Keep these roles separate. Do not put ordinary settings in Vault, or secret
values in Consul, Helm values, CI logs, or Git.

`wait_for_success` applies to one release at a time. It can make the runner
wait for that release before continuing. It does not make the whole release
list one all-or-nothing change. If a later release fails, earlier ones may
already be updated. Check each release's wait, timeout, and
`rollback_on_failure` settings; do not assume the whole deployment rolls back.

## 6. Phase D — review and version selection

Before proposing a deployment change:

1. Find the right branch and environment directory.
2. Check the working tree. Keep unrelated edits untouched.
3. Confirm the image and required config packages exist in their registries.
4. Change only the files owned by that environment. Run the supported
   validation or build.
5. Review the final values: release order, namespace, probes, ports,
   resources, endpoints, and secret-policy references.
6. Submit the change for review using the team's required process. Wait for
   approval and merge.

A local build checks configuration; it does not deploy. A review submission
is not a merge. A merge does not prove the deployment pipeline ran. An image
push does not prove the service rolled out.

## 7. Phase E — controlled deployment

In the inspected Qualys pattern, a controlled pipeline—often using
Jenkins/Ansible and `qhelm`—applies approved changes. Do not assume Argo CD or
Flux is installed. Those tools continuously watch and reconcile Git; a
pipeline that applies a reviewed change does not do that by itself.

The runner selects the chart and config versions, updates applicable Consul
settings, applies Vault policy, and processes the release list. Helm turns the
chart into Kubernetes settings and sends them to the Kubernetes API server.
Controllers create ReplicaSets and Pods. The scheduler chooses a node for
each Pod, and that node downloads the image and starts the container. Probes
and Service selectors control when a Pod can receive traffic.

The full process may not succeed or fail as one unit. Check every release and
group of Pods:

- The deployment slot (the platform's release record) can fail while older
  or unrelated Pods are still running.
- An empty Kubernetes Events list is not proof of success. Check the release
  record and runner logs too.
- `Running` does not mean `Ready`. Old and new versions may exist at the same
  time during a rollout.
- A passing readiness probe does not prove the user's workflow works.

## 8. Phase F — post-deploy verification

Start with read-only checks. Match each result to the correct deployment run,
environment, release slot, image, and time.

```bash
# Replace placeholders with the approved namespace and actual resource names.
kubectl get qhelm -n <namespace>
kubectl describe qhelm <release-slot> -n <namespace>
kubectl get deployments,replicasets,pods -n <namespace> -o wide
kubectl get services,endpointslices -n <namespace>
kubectl get events -n <namespace> --sort-by=.metadata.creationTimestamp
kubectl describe pod <pod> -n <namespace>
kubectl logs <pod> -n <namespace> -c <container> --tail=100
kubectl logs <pod> -n <namespace> -c <container> --previous --tail=100
```

`qhelm` is specific to Qualys. Other environments may have a different
release resource. `--previous` works only when the container has restarted.

Check in this order:

1. Did the deployment runner and deployment slot pass?
2. Are the expected replicas ready and using the right image?
3. Are there probe, mount, resource, or scheduling errors?
4. What do the current and previous container logs show?
5. Do Services point to the expected Pods? Check EndpointSlices (the list of
   Pod addresses), DNS, network, and ingress (the external traffic route).
6. Are dependencies and service metrics healthy?
7. Does a safe user-facing smoke test pass? Do error and latency signals
   remain healthy?

Do not put Secret objects, credentials, tokens, cookies, customer data, or
unredacted logs in tickets or shared documents. Use approved read-only host
access. Remember that the Jenkins controller, build worker, deployment host,
Kubernetes control plane, and worker node are different systems.

## 9. Troubleshooting by symptom

| Symptom | Check first | Possible cause |
| --- | --- | --- |
| Jenkins ends `FAILURE` after build/scan output | Final stage and policy results | A later check failed after artifacts were made |
| Deployment slot fails, but Events are empty | Release record and runner logs | A render, settings, pre-deploy, or chart step failed |
| Pod is `Pending` | Pod events, quota, node capacity, and storage claims | The cluster cannot schedule or start it |
| Pod restarts or shows `CrashLoopBackOff` | Previous logs, exit reason, probes, and dependency settings | Startup, configuration, or dependency failure |
| Pod is `Running` but not `Ready` | Readiness probe and dependencies | It should not receive traffic yet |
| One replica fails while others are ready | Per-Pod image, logs, and rollout status | The rollout may be only partly complete |
| Startup fails during a database change | Migration history and database schema; involve the DB owner | The migration and database may be out of sync |
| Health is green but async work is missing | Producer, topic, consumer, response, and storage steps | An accepted request may not have completed |

Follow the evidence from one system to the next. Change one thing at a time.
Save the first error and its timestamp before retrying. Ask the right owner
for help with host, control-plane, registry, or shared-service problems.

## 10. Rollback and recovery

For Qualys, roll back by changing the environment repository to a previously
approved image or config version, then run the same review and deployment
process. Do not bypass it with a direct `helm rollback`, `kubectl apply`,
`kubectl delete`, or manual cluster edit.

Before rolling back, check database and message compatibility. Old and new
application versions may run at the same time during rollout. If a separate
emergency procedure allows a direct action, update the repository and record
the action afterward.

## 11. Release checklist

- [ ] Correct service, environment, branch, and repository.
- [ ] Tests and each security check have a recorded result.
- [ ] Image and config packages exist and match this build.
- [ ] Settings, endpoints, probes, ports, resources, and secret access checked.
- [ ] Release order and wait/rollback options checked.
- [ ] Environment change passed review and validation.
- [ ] Deployment run and every release checked.
- [ ] All expected replicas are ready with the intended image and config.
- [ ] Health, ingress, dependencies, metrics, and logs look good.
- [ ] Rollback plan and database compatibility are understood; shared evidence is redacted.

## 12. Interview summary

> “I check three things separately: the build passed, the environment approved
> the right version, and the service works after deployment. The deployment
> pipeline applies the reviewed settings, and Kubernetes starts the Pods. I
> check the release result, replicas, image, health checks, dependencies, and
> a user-facing test. A passed test stage, pushed image, or `Running` Pod alone
> does not prove the release succeeded.”
