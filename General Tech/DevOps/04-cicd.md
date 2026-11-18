# CI/CD, GitOps & Production Deployment — Interview Notes

## 1. CI, Delivery, and Deployment

| | Continuous integration (CI) | Continuous delivery | Continuous deployment |
| --- | --- | --- | --- |
| What it means | Build and test each change | Keep each passing change ready to release | Automatically release approved changes |
| Production release | Not included | Usually needs approval | Happens automatically under set rules |
| Main concern | Does the code pass? | Is the release ready? | Can production accept it safely? |

Think of three separate parts: CI builds and checks the software, an artifact
store keeps the versioned package, and CD deploys it. Keeping these steps
separate lets you roll back without rebuilding the software.

---

## 2. End-to-End Production Flow

```text
git push / PR merge
  → CI: checkout → dependencies → tests/analysis/scans → binary + OCI image
  → publish versioned artifacts and reports (subject to each gate)
  → reviewed environment change selects the artifact
  → CD handoff is platform-specific:
       ArgoCD/Flux pull reconciliation
       OR controlled deployment runner (Qualys-style Jenkins/Ansible + qhelm)
  → chart/overlay render → Kubernetes API → controllers → Pods
  → startup/readiness checks → Service endpoints → ingress
  → smoke tests, metrics/log validation, and release decision
```

Track the source commit through the build, image, and deployment. Prefer an
image digest or a tag the registry prevents from changing. Do not use
`latest` as the production version; it is not a reliable rollback target.

---

## 3. CI Pipeline Anatomy

| Stage | Examples | Common failure |
| ------- | ---------- | ------------------ |
| Get the code | `git checkout <sha>` | Wrong or unavailable revision |
| Install dependencies | `npm ci`, `pip install`, `mvn`, `go mod download` | Lockfile or download error |
| Test | `npm test`, `pytest`, `go test`, `mvn test` | A test fails |
| Check code | SonarQube, ESLint, Pylint, SpotBugs | A quality rule fails |
| Scan | Snyk, Trivy, Checkov, TruffleHog | Vulnerability or secret found |
| Build | `go build`, `npm run build`, `mvn package` | Compile/build error |
| Build image | `podman build` or approved OCI builder | Build error or policy failure |
| Sign and publish | Cosign; ECR, ACR, GAR, Harbor, or Nexus | Signing, access, or storage error |

Check the final result, not only the successful stages. A build may create an
image and pass its image scan, then fail a later license or security check.
The whole run is still failed. Do not promote the image just because it exists
in the registry.

```yaml
# GitHub Actions skeleton
name: ci
on: { push: { branches: [main] }, pull_request: {} }
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20", cache: npm }
      - run: npm ci
      - run: npm test
  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # Example only: this runner must have the approved OCI builder and registry auth.
      - run: podman build -t app:${{ github.sha }} .
      - run: podman push app:${{ github.sha }}
```

### Jenkins / GitLab / Actions equivalents

| Tool | Config file | Unit | Runner |
| ------ | ------------- | ------ | -------- |
| Jenkins | `Jenkinsfile` (declarative/scripted Groovy) | stages | Agents/executors |
| GitHub Actions | `.github/workflows/*.yml` | jobs → steps | hosted/self-hosted runners |
| GitLab CI | `.gitlab-ci.yml` | stages → jobs | GitLab runners (tags) |
| Azure DevOps | `azure-pipelines.yml` | stages → jobs | Microsoft/self-hosted agents |

### Jenkins Deep Dive (Architecture, Pipelines & Enterprise Pattern)

```text
Jenkins Controller (UI, scheduler, credentials, webhook receiver; normally no builds here)
  ├── Inbound JNLP / SSH static agents (VM build pools labeled e.g. 'linux-jdk17', 'oci-builder')
  └── Kubernetes Plugin dynamic pod agents (spins up ephemeral pod per build, destroys on finish)
```

The controller schedules the job. A worker runs the commands. Use the job
number to match the controller record with the worker's console log.

| Concept | Declarative Pipeline (`pipeline { ... }`) | Scripted Pipeline (`node { ... }`) |
| --- | --- | --- |
| **Syntax** | Opinionated structure (`agent`, `stages`, `steps`, `post`, `when`, `environment`) | Free-form Groovy code (`try/catch/finally`, loops) |
| **Validation** | Validated before execution; supports Restart-from-Stage | Validated at runtime; maximum flexibility |
| **Enterprise standard** | **Default choice** + **Jenkins Shared Libraries (`@Library`)** | Legacy or complex dynamic matrix logic |

- **Shared libraries** (`vars/*.groovy`) let teams reuse pipeline code instead
  of copying it into every service. A service may only need a short
  `Jenkinsfile`, a `properties.yaml` file, and scripts for its build and
  publishing steps.

### Failed-build handling

Run quick checks first. Block merges when required checks fail. Share the logs
with the author and track flaky tests instead of hiding them with retries. Keep
the main branch healthy; stop and investigate when it turns red.

---

## 4. CD Handoff — Helm, GitOps, Deployment Repo

### Helm and Kubernetes do different jobs

| Tool | Role | Analogy |
| --- | --- | --- |
| Tool | What it does |
| --- | --- |
| **Helm** | Fills in chart templates and creates Kubernetes settings |
| **Kubernetes** | Runs and manages the application |
| **ArgoCD/Flux** | Watches Git and keeps the cluster aligned with it |
| **Qualys `qhelm` / `quadfile`** | A reviewed pipeline applies an ordered list of Helm releases; it is not an ArgoCD/Flux controller |

Helm lets teams reuse one chart and change its values for each environment:

| Environment | replicas | cpu |
| --- | --- | --- |
| Development | 1 | 200m |
| Staging | 3 | 500m |
| Production | 20 | 2 |

### Deployment configuration

- Keep application code separate from deployment settings when that fits the
  team's ownership model. Select a tested image version for each environment.
- **ArgoCD/Flux:** a controller watches Git, spots differences, and applies
  the configured Helm or Kustomize settings.
- **Controlled pipeline:** an approved runner reads the release list and
  calls the platform's Helm tool. Qualys `qhelm`/`quadfile` is one example.
  This is not continuous drift correction.
- Other models include Helm from an authorized CI runner or plain Kubernetes
  manifests. Do not deploy to production from a personal laptop.

In the Qualys path, `quadfile` sets the release order. `wait_for_success`
applies to each release, not the whole list. If a later release fails, earlier
ones may already be updated. Check the release record and runner logs as well
as the Pods.

---

## 5. Deployment Strategies

| Strategy | Mechanism | Rollback | Cost | Best for |
| ---------- | ----------- | ---------- | ------ | ---------- |
| Strategy | How it works | Good for |
| --- | --- | --- |
| **Rolling** | Replace Pods a few at a time | Most stateless services |
| **Blue-green** | Run old and new versions side by side, then switch traffic | Changes that need a quick switch back |
| **Canary** | Send a small share of traffic to the new version, then increase it if healthy | Higher-risk changes |
| **Feature flag** | Deploy code while the feature is off; enable it later | Separating deployment from release |

With 10 Pods, a rolling update may start one new Pod, wait for it to become
ready, then remove one old Pod and repeat. This can avoid downtime, but only
with enough capacity, correct probes, and compatible old/new versions.

### Progressive delivery / canary done right

Pause at each traffic step and check user-facing signals, not just HTTP 200:
tail latency, error rate, memory growth, database connections, and JVM health.
Tools such as Argo Rollouts can query Prometheus and promote or stop a canary.

---

## 6. Post-Deployment Verification

`kubectl rollout status` only says whether the rollout finished; it does not
prove the service works. Also run a quick user-path test, check errors and
latency, review new logs, and check alerts. Automatic rollback happens only
when the platform is configured to do it. Otherwise use the approved rollback
process.

---

## 7. Three-Repository Managed-Environment Pattern

This is a common Qualys-style ownership split, not a requirement that every
service use three repositories or publish every artifact type.

| Repository | What it contains |
| --- | --- |
| **Service** | Application code, tests, image build, and service-specific config |
| **Shared config** | Defaults and the config packages the build actually includes |
| **Environment/deployment** | Image version, release order, pod settings, and secret-access rules |

### Sequence

1. Build and test the service. Add probes, resource settings, graceful
   shutdown, and database changes that work with old and new versions.
2. CI publishes the image and any config packages. Record the result of every
   test and security check.
3. The shared config repo records the service version and packages the files
   declared by the build. Check the rendered Helm settings.
4. The environment repo selects the image/config versions and adds pod
   settings. Review release order and each wait/timeout option.
5. Keep regular settings separate from secrets. Use the approved secret
   provider and limit each service's access.
6. Submit the environment change for review. After approval, the controlled
   runner applies it through the platform's Helm tool.
7. Check the release record, every Pod/image, health, dependencies, logs,
   ingress, and a user-facing test.

**Settings layers**: chart defaults → shared values → environment settings
→ runtime config and secrets. Check the actual order; platforms may apply
these layers differently.

### ArgoCD Pull Reconciliation vs Qualys Controlled Apply (`qhelm` / `quadfile`)

| Question | **ArgoCD / Flux** | **Qualys controlled pipeline** |
| --- | --- | --- |
| What starts a deploy? | A change in watched Git, based on its sync settings | An approved pipeline run |
| Who applies it? | An in-cluster controller | Jenkins/Ansible runner using `qhelm` |
| How are services ordered? | Controller-specific waves and health rules | `quadfile` order; wait settings apply per release |
| How are settings/secrets handled? | ConfigMaps and the chosen secret tool | Consul settings, Vault access rules, and Helm values |
| Does it correct drift continuously? | It can, when configured | Do not assume it does |
| Is the whole release atomic? | Depends on the controller and application | No; earlier releases may stay updated if a later one fails |

Deep dives: [CI/CD and GitOps](./Production-CI-CD-and-GitOps-Deep-Dive.md),
[enterprise deployment](./Enterprise-Microservice-Deployment-Recipe.md),
[DevOps scenarios](./DevOps-Case-Studies-and-Scenario-Questions.md), and
[Kubernetes GitOps](../Kubernetes/07-gitops-argocd.md).

---

## 8. Rollback Patterns

| Path | What to do | Important note |
| --- | --- | --- |
| Normal | Restore the previous version in reviewed settings and rerun the approved pipeline | Keeps a clear audit trail |
| Emergency | Use only the platform's approved emergency tool | Update the reviewed settings afterward; Qualys uses the reviewed environment change |
| Database-aware | Keep old and new app versions compatible during a migration | Do not roll back after removing data or fields the old version needs |

**Unsafe rollback:** an old app may not understand data written by a new app.
Use versioned data formats and compatibility checks. During a transition,
support both formats until the old app version is no longer running.

---

## 9. Production Ops Scenarios (staff-level)

| Scenario | Response | Safety check |
| --- | --- | --- |
| Regional outage and urgent security fix | Use an approved, short-lived emergency identity and signed release from a runner in the region | Keep the signature checks on; record the change in Git afterward |
| Someone changes cloud settings by hand | Compare live settings with Git, then review whether to keep or revert the change | Do not overwrite a needed change before review |
| Moving from Jenkins to GitOps | Keep building the same signed artifacts while adding GitOps in steps | Test both paths before removing the old one |
| Many pull requests wait in a large repo | Run only affected tests, use build caches, and split tests across workers | Limit concurrency so cost and load stay controlled |
| One cluster fails in a multi-cluster rollout | Track each cluster separately and pause or continue by policy | Keep the intended version clear for each cluster |
| Services depend on one another | Test API compatibility and deploy dependencies in order | Do not start a consumer until its dependencies are compatible |
| A canary fails after receiving more traffic | Stop increasing traffic and investigate user-impacting metrics | Drain connections and use the approved rollback process |
| A database change breaks older app versions | Add the new structure, migrate data, switch reads, then remove old fields | Check compatibility at every step |
| A dependency is replaced by a malicious copy | Allow trusted sources, verify checksums, and review software inventories | Require build provenance and image signatures |
| An untrusted image reaches the registry | Restrict who can publish and require signed images by digest | Link each running image to its source commit and approval |

Keep Git in sync after emergency changes. Prefer image digests over mutable
tags. Follow the approved rollback process and control network access at
build and runtime.

---

## 10. Pipeline Best Practices

| Practice | Why it helps |
| ---------- | ----- |
| **Run quick checks first** | Find simple errors before expensive build and scan steps |
| **Cache dependencies** | Avoid downloading the same packages repeatedly |
| **Pin versions** | Make builds repeatable |
| **Use short-lived identity** | Avoid long-lived cloud keys in CI |
| **Limit permissions** | Give each job only the access it needs |
| **Keep artifacts fixed** | Promote the same tested image; do not rebuild for each environment |
| **Protect branches** | Require checks and review before merging |
| **List and sign software** | Record what's in the image and verify who built it |

---

## 11. Sound Bites & Quick Reference

- "CI builds and checks the image; CD controls when it is deployed."
- "Promote the same tested image instead of rebuilding it for each environment."
- "Helm creates Kubernetes settings; Kubernetes runs the service."
- "In GitOps, change Git to roll back; do not leave live settings out of sync."
- "`kubectl apply` can succeed while the service is unhealthy. Check it after deployment."
- "Change database structures in steps so old and new versions both work."
- "A scan alone is not enough; verify who built the image and what it contains."

| Step | Result | Common problem |
| --- | --- | --- |
| Source control | Commit ID | Conflicts or untested changes |
| Tests | Test report | A test fails |
| Code/security checks | Check reports | Quality issue or vulnerability |
| Image build/sign | Verified image | Build or signing error |
| Registry publish | Stored image | Access or storage error |
| Deployment | Updated settings | Apply or sync failure |
| Kubernetes rollout | Ready Pods | Probe or scheduling failure |
| Post-deploy check | Service health | Stop or roll back |
