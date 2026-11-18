# Production CI/CD, GitOps & Helm — Interview Guide

---

## 1. The Three Independent Systems

Deploying a service safely takes more than running `kubectl apply` after a
build. The work is usually split into three parts:

1. **Continuous integration (CI)** builds and checks the code.
2. **Artifact storage** keeps the tested packages and reports.
3. **Continuous delivery/deployment (CD)** releases the chosen version safely.

> Keep build and deployment separate so you can change or roll back a release
> without rebuilding the code.

CD may use a controller such as ArgoCD/Flux, or an approved pipeline that
applies reviewed settings. The Qualys `qhelm`/`quadfile` example below uses a
pipeline; it does not mean ArgoCD/Flux is installed.

---

## 2. Helm vs Kubernetes

Helm and Kubernetes do different jobs:

| Tool | Job |
| --- | --- |
| **Helm** | Turns a chart and values into Kubernetes settings |
| **Kubernetes** | Starts and manages the application |
| **ArgoCD/Flux** | Watches Git and keeps the cluster aligned with it |
| **Qualys `qhelm` / `quadfile`** | Applies an approved, ordered release list through a pipeline |

Helm creates the settings; Kubernetes uses them to run the service.

---

## 3. Complete Production Flow

```text
Git Repository
    │
    ├── git push / PR merge to main
    │
    ▼
CI Pipeline Starts
    │
    ├── Checkout code
    ├── Install/restore dependencies
    ├── Unit + integration tests
    ├── Static analysis (SAST)
    ├── Security scans (deps, container, IaC, secrets)
    ├── Build binary
    ├── Build OCI image with the approved builder
    ├── Scan + sign image
    └── Push image to registry (ECR/ACR/GCR/Harbor)
    │
    ▼
Reviewed environment change selects the artifact
    │
    ├── Pull model: ArgoCD / Flux detects desired-state drift
    │                 and renders/applies Helm or Kustomize
    │
    └── Controlled-apply model: approved runner reads the release plan
                                and invokes platform deployment tooling
    │
    ▼
Kubernetes manifests rendered and applied
    │
    ▼
Kubernetes API Server
    │
    ▼
Deployment Controller
    │
    ▼
New ReplicaSet created
    │
    ▼
Scheduler → Kubelet → Pod creation
    │
    ▼
Startup probe → Readiness probe pass
    │
    ▼
Service routes traffic
    │
    ▼
Post-deploy smoke tests / metrics validation
    │
    ▼
Old ReplicaSet scaled down
```

---

## 4. Phase 1 — Source Control

```text
Developer
    │
    ├── git push origin main
    │
    or
    │
    └── Merge Pull Request
    │
    ▼
Protected source branch updated
```

Nothing has been built yet. The commit SHA (for example, `74ae12bc`) links
this source revision to its build.

---

## 5. Phase 2 — CI Pipeline

### 5.1 Checkout

```bash
git checkout 74ae12bc
```

The build uses exactly this commit.

### 5.2 Dependency restore

| Language | Command |
| --- | --- |
| Node.js | `npm ci` |
| Python | `pip install -r requirements.txt` |
| Java | `mvn dependency:resolve` |
| Go | `go mod download` |

### 5.3 Unit tests

```bash
npm test
pytest
go test
```

The pipeline stops if a required test fails.

### 5.4 Static analysis

| Tool | Ecosystem |
| --- | --- |
| SonarQube | Multi-language |
| ESLint | JavaScript |
| Pylint | Python |
| golangci-lint | Go |
| SpotBugs / PMD | Java |

### 5.5 Security scans

| Type | Input | Tool examples |
| --- | --- | --- |
| Dependency scanning | `package.json`, `pom.xml`, etc. | Snyk, Dependabot, OWASP Dependency-Check |
| Container scan | OCI image | Trivy, Clair, Grype |
| IaC scan | Terraform/CloudFormation/CDK | Checkov, tfsec, Terrascan |
| Secrets scan | Repo history | TruffleHog, GitLeaks |

### 5.6 Build

```bash
go build
npm run build
mvn package
```

This creates an application package, such as a binary, JAR, or `dist/`
directory.

### 5.7 Build the container image

```bash
podman build -t myapp:74ae12bc .
```

Do not use `latest` as the production version. Prefer an image digest. A tag
is only immutable if the registry prevents it from changing. Example tags:

```text
myapp:74ae12bc
myapp:v2.14.6
myapp:build-1048
```

### 5.8 Container scan

Scan the full image, including its base layers. A vulnerable package such as
`openssl` may cause the scan to fail.

### 5.9 Image signing

| Tool | Purpose |
| --- | --- |
| Cosign | Sign and verify container images |
| Notary | Docker Content Trust v1 |
| Sigstore/Cosign keyless | Identity-based signing |

Signing helps verify who built the image and whether it changed afterward.

### 5.10 Push to registry

| Registry | Cloud |
| --- | --- |
| Amazon ECR | AWS |
| Azure ACR | Azure |
| Google GAR | GCP |
| Harbor | On-prem / multi-cloud |

At this point, the build is complete. Nothing has been deployed yet.

### 5.11 Artifact promotion — build once, deploy everywhere

Promote the same tested image to each environment. Do not rebuild it for each
environment:

```text
myapp:74ae12bc  →  dev deploy  →  qa deploy  →  prod deploy
                 (same digest, only values/overlays differ)
```

Only the environment settings should change. Keep the image tag or digest the
same so the image tested is the image deployed.

---

## 6. CD Starts Here

### 6.1 Deployment repository

Many teams keep application code and deployment settings in separate
repositories:

- `app-code` — application logic.
- `deployment-config` — desired production state.

This makes it easier to review who can change the application and who can
change production settings.

The release process proposes a reviewed change that selects the tested image:

```yaml
# Before
image: myapp:63ea90

# After
image: myapp:74ae12bc
```

Follow the environment's review rules. Do not assume CI can approve or deploy
the change on its own.

### 6.2 Apply model: pull controller or controlled runner

**Pull model:** ArgoCD or Flux watches the deployment repo. It compares Git
with the cluster and applies changes according to its settings.

```text
Git Repository
    │
    ├── Helm Chart
    │
    ▼
helm template
    │
    ▼
Kubernetes YAML
    │
    ▼
kubectl apply
```

**Controlled pipeline:** a reviewed deployment pipeline reads the release
plan and calls the platform's Helm tool. In the Qualys pattern, Jenkins or
Ansible processes `quadfile.yaml` through `qhelm`. The platform also handles
Consul settings and Vault policies. Unlike ArgoCD/Flux, this pipeline does
not continuously check for drift. A release list is not all-or-nothing; each
release has its own wait and rollback settings.

Use an approved controller or deployment runner in production, not a
developer laptop.

### 6.3 Promote through environments

```text
dev → qa → staging → prod
```

- Each environment may have its own folder, branch, or repository. Promote
  the same tested image; do not rebuild it for each environment.
- Define the checks and approvals for each environment. Do not assume that
  every team uses the same order or automatic deployment rules.
- Keep secret values out of Git and build artifacts. Store only references or
  access rules there; get secret values from the approved secret service.

---

## 7. Where Helm Comes In

### 7.1 Helm creates Kubernetes settings

```text
Helm Chart
    │
    ├── values.yaml
    ├── templates/
    │   ├── deployment.yaml
    │   ├── service.yaml
    │   ├── ingress.yaml
    │   ├── configmap.yaml
    │   ├── secret.yaml
    │   └── hpa.yaml
    │
    ▼
helm template
    │
    ▼
Kubernetes YAML
```

Placeholders in templates:

```yaml
image:
  repository: myapp
  tag: {{ .Values.image.tag }}
```

Values file:

```yaml
image:
  tag: 74ae12bc
```

Rendered output:

```yaml
image: myapp:74ae12bc
```

`helm template` only renders the files. An authorized Helm command or
deployment controller applies them to the cluster.

### 7.2 Helm chart structure

```text
my-chart/
├── Chart.yaml
├── values.yaml
├── templates/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── configmap.yaml
│   ├── hpa.yaml
│   └── secret.yaml
└── charts/
```

### 7.3 Why Helm exists

Without Helm, teams would repeat Kubernetes settings for:

- namespace
- replicas
- image
- resources
- probes
- ports
- labels
- service account
- node selector
- ingress
- tolerations

Helm puts those settings in reusable templates and lets each environment
provide different values:

```yaml
replicas: {{ .Values.replicas }}
```

Same chart, different values per environment:

| Environment | replicas | cpu |
| --- | --- | --- |
| Development | 1 | 200m |
| Staging | 3 | 500m |
| Production | 20 | 2 |

### 7.4 ArgoCD + Helm flow

```text
Git
    │
    ▼
Helm Chart
    │
    ▼
helm template
    │
    ▼
Kubernetes YAML
    │
    ▼
kubectl apply
```

---

## 8. Kubernetes Receives YAML

1. The API server stores the Deployment settings.
2. A controller creates a ReplicaSet, which manages the Pods.
3. The scheduler chooses a node for each Pod.
4. The node downloads the image and starts the container.
5. Startup probe passes.
6. Readiness probe passes.
7. Service begins routing traffic to Ready pods.

Old and new ReplicaSets may run at the same time during an update.

---

## 9. Rolling Update

Deployment strategy example:

```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxUnavailable: 1
    maxSurge: 1
```

For 10 pods:

```text
10 old
    │
    ▼
11 total (1 new added)
    │
    ▼
1 new ready → 1 old removed
    │
    ▼
Repeat until 10 new
```

This may avoid interruption if there is enough capacity, probes work,
shutdown is graceful, and both versions can run together. A rolling update
alone does not guarantee zero downtime.

---

## 10. Post-Deployment Verification

Do not stop at `kubectl rollout status`. Check that the application works:

- Smoke tests against critical endpoints.
- Synthetic transactions (login, checkout).
- Metrics validation (error rate, latency, CPU, memory).
- Log analysis for new exceptions.
- Alert status from monitoring systems.

If a check fails, stop promotion and follow the rollback policy. Automatic
rollback works only if the platform has configured and tested it.

---

## 11. Common Deployment Models

| Model | How it works | Often used when |
| --- | --- | --- |
| **Helm + CI** | An authorized CI runner applies a Helm chart | The environment is small and simple |
| **Helm + ArgoCD/Flux** | A pull controller applies the reviewed image version | The team wants continuous reconciliation |
| **Kustomize + ArgoCD** | ArgoCD applies environment-specific YAML patches | The team prefers plain Kubernetes YAML |
| **Raw manifests** | CI applies plain YAML | The app has few deployment settings |
| **Controlled release runner** | An approved pipeline applies an ordered release plan | A managed platform controls deployments |

### 11.1 Common mistakes

| Mistake | Why it is risky |
| --- | --- |
| Rebuild for each environment | The deployed image may differ from the tested one |
| Use `:latest` in production | The tag can move, making rollback unclear |
| Deploy from a laptop | The change may not be reviewed or recorded |
| Put secrets in logs or values | Anyone with log/repo access may see them |
| Give CI broad cluster access | A leaked credential could expose the cluster |
| Change live settings only | Git may overwrite the change or become misleading |
| Deploy and release every change at once | There is no gradual rollout or feature switch |

---

## 12. Industry-Standard Flow Summary

```text
Developer
    │
    ▼
Git Push / PR Merge
    │
    ▼
CI Pipeline
    ├── Checkout
    ├── Restore dependencies
    ├── Unit tests
    ├── Integration tests
    ├── Static analysis
    ├── Security scans
    ├── Build binary
    ├── Build OCI image with the approved builder
    ├── Scan image
    ├── Sign image
    └── Push image to registry
    │
    ▼
Reviewed environment change selects the artifact
    │
    ▼
Pull controller or controlled deployment runner
    │
    ▼
Helm template rendering
    │
    ▼
Generated Kubernetes manifests
    │
    ▼
Kubernetes API Server
    │
    ▼
Deployment Controller
    │
    ▼
New ReplicaSet
    │
    ▼
Scheduler → Kubelet → Pod creation
    │
    ▼
Startup probe
    │
    ▼
Readiness probe
    │
    ▼
Traffic shift (rolling update)
    │
    ▼
Smoke tests & health validation
    │
    ▼
Old ReplicaSet scaled down
```

---

## 13. Key Points

- "CI checks the image; CD decides when to deploy it."
- "Promote the same tested image instead of rebuilding it."
- "Helm creates Kubernetes settings; Kubernetes runs the service."
- "GitOps uses reviewed Git changes to manage the cluster."
- "`kubectl apply` can succeed even when the app is unhealthy."
- "Scans, image signatures, and build records help verify software."

---

## 14. Quick Reference Table

| Step | Result | Common problem |
| --- | --- | --- |
| Source control | Commit ID | Conflicts or untested changes |
| CI tests | Test report | A test fails |
| Code checks | Quality report | A rule fails |
| Security scan | Vulnerability report | Risky package or image |
| Image build/sign | Image and signature | Build or signing failure |
| Registry publish | Stored image | Access or storage failure |
| Deployment | Updated cluster | Settings or sync failure |
| Kubernetes rollout | Ready Pods | Probe or scheduling failure |
| Post-deploy check | Service health | Stop or roll back release |

---

## 15. Interview Follow-Ups

**Q: Why three systems (CI / artifacts / CD) instead of one pipeline?**
Separate systems can scale and have different permissions. You can also roll
back to an earlier image without rebuilding it. CI does not need production
access.

**Q: How does a commit reach prod?**
Track the commit through tests and scans, build its image, store it, approve
the environment change, deploy it, and check the running service. The exact
deployment step depends on the platform.

**Q: GitOps vs traditional push CD?**
With GitOps, an in-cluster controller reads Git and can correct drift. With
push CD, a pipeline applies changes directly; it needs cluster access and may
not notice drift between deployments.

**Q: How do you do a canary in this world?**
Use a rollout controller to send a small share of traffic to the new version.
Check Prometheus for errors and latency, then increase traffic or stop.

**Q: Pipeline took the prod env down — RCA?**
Check each step in order: Was the image bad? Were the environment settings
wrong? Did the deploy step fail? Did the app fail after it started? Compare
the run IDs, logs, and health checks to find the first failure.
