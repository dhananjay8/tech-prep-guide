# GitOps & ArgoCD — Interview Notes

## 1. GitOps Principles

- Strictly, **GitOps means a pull controller continuously reconciles declared
  Git state**. A reviewed CI/CD pipeline that reads Git and applies changes is
  a controlled deployment, not continuous pull reconciliation.
- Git stores the approved cluster settings. Changes are declarative, reviewed,
  and versioned.
- A controller inside the cluster reads Git and applies changes. CI does not
  need direct cluster credentials.
- CI builds the image; the Git change selects its version. The controller
  then brings the cluster in line with Git.

```text
Code change → CI builds and checks image
           → reviewed Git change selects image version
           → ArgoCD notices change and updates cluster
           → report health; correct manual drift if self-heal is enabled
```

Teams often keep application code, shared settings, and environment settings
in separate repositories. This makes ownership and review clearer.

---

## 2. ArgoCD Architecture & Core Concepts

```text
ArgoCD Control Plane (in-cluster, namespace: argocd)
  ├── argocd-server (API + Web UI + gRPC/CLI endpoint, SSO via Dex/OIDC, RBAC enforcement)
  ├── argocd-repo-server (fetches repositories and renders Helm/Kustomize manifests)
  ├── argocd-application-controller (reconciles rendered manifests with live Kubernetes state)
  └── argocd-applicationset-controller (generates Applications dynamically from Git dirs, clusters, PRs, matrices)
```

Redis is a cache used to reduce requests to Git and the Kubernetes API. It is
not the source of desired manifests.

- **Application**: says which Git revision and folder to use, and which
  cluster and namespace to update. A project sets its access boundaries.
- **Sync modes**: manual or automatic. With `prune: true`, ArgoCD deletes
  objects removed from Git. With `selfHeal: true`, it can undo manual cluster
  changes.
- **Sync phases and hooks**:
  1. `PreSync`: run a task before the main update, such as a migration job.
  2. `Sync`: apply the main Kubernetes files. Sync waves set their order;
     lower numbers run first.
  3. `PostSync`: run checks or send a notification after the update.
  4. `SyncFail`: run an alert or cleanup task when sync fails.
- **App of Apps vs `ApplicationSet`**:
  - **App of Apps**: one Application points to a folder of other Application
    files.
  - **`ApplicationSet`**: creates many Applications from a list, cluster
    inventory, Git folders, or pull requests. This avoids writing each one
    by hand.
- **How ArgoCD differs from the Qualys `qhelm` / `quadfile` flow**:
  - ArgoCD keeps checking the cluster against Git. It can correct drift or
    remove deleted objects when those options are enabled.
  - In the Qualys pattern reviewed here, a Jenkins/Ansible runner applies
    reviewed changes. It reads `quadfile.yaml` and calls `qhelm`, with
    Consul settings, Vault policy, and Helm values.
  - `quadfile` is a release list, not an ArgoCD ApplicationSet or sync-wave
    controller. `wait_for_success` is set for each release. A later failure
    may leave earlier releases updated.
  - Call this a **controlled deployment backed by Git** unless ArgoCD or Flux
    actually manages the service.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata: { name: api, namespace: argocd }
spec:
  project: default
  source:
    repoURL: git@github.com:org/env-repo.git
    targetRevision: main
    path: overlays/prod
  destination: { server: https://kubernetes.default.svc, namespace: prod }
  syncPolicy:
    automated: { prune: true, selfHeal: true }
    syncOptions: [CreateNamespace=true]
```

```bash
argocd app list
argocd app get api
argocd app history api
# Mutating operations require the platform's authorized workflow.
# argocd app sync api
# argocd app rollback api 5
```

## 3. Gradual Rollouts with GitOps

- Argo Rollouts supports canary and blue-green releases. Send a small share
  of traffic to the new version, check Prometheus metrics, then increase
  traffic or stop the rollout.
- In GitOps, normally revert the Git change to roll back. If emergency
  tooling changes the live cluster, bring Git back in sync afterward.

## 4. GitOps vs Push Deployment

| | Direct push | Qualys controlled pipeline | ArgoCD/Flux pull |
| --- | --- | --- | --- |
| Who needs cluster access? | CI runner | Deployment runner | Controller inside the cluster |
| How is drift found? | Usually on the next deploy | Do not assume it is checked continuously | Controller can check continuously |
| What is the audit trail? | CI logs | Review and runner logs | Git history and controller status |
| How to roll back? | Rerun an approved version | Review and apply the previous settings | Revert the Git change |
| Multiple clusters | CI needs access to each cluster | Configure runners and approvals per environment | Use the controller/fleet setup |

### ArgoCD vs Flux

| | ArgoCD | Flux |
| --- | ------ | ---- |
| Main style | Application objects, UI, and built-in access controls | A set of smaller controllers, often managed with CLI |
| Helm/Kustomize | Supports both | Supports both |
| Secrets | Use a supported plugin or external secret tool | Commonly use SOPS and a key-management service |
| Many clusters | ApplicationSet or App of Apps | Shared Git layout and controllers per cluster |
| Often chosen by | Teams that want a UI and app view | Teams that prefer smaller, composable tools |

**Secrets in GitOps:** never commit plaintext secrets. Options include
Sealed Secrets, SOPS with a key-management service, or External Secrets
Operator. Git should contain encrypted values or references, not the secret
itself.

## 5. Interview Q&A

**Q: Someone edits live state (`kubectl edit`) — what happens?**
ArgoCD shows the app is out of sync. If `selfHeal` is on, it restores the
Git version. Use `ignoreDifferences` for fields that another controller owns,
such as HPA-managed replicas.

**Q: Secrets in a GitOps repo?**
Never store plaintext secrets. Use Sealed Secrets, SOPS, or External Secrets
Operator. Keep only an encrypted value or reference in Git.

**Q: Failed sync — now what?**
Run `argocd app get` and read the Kubernetes events to find the failed
resource. Prefer a reviewed Git fix. If emergency rollback tooling is used,
update Git afterward.

**Q: ArgoCD vs Flux?**
ArgoCD has an application-focused UI. Flux uses smaller, composable
controllers and a CLI-first workflow. Both use Git to manage cluster state;
choose the one that fits the team's needs.

---

## 6. Recall — Sound Bites

- "CI builds artifacts; GitOps applies approved environment settings."
- "In a pull model, the cluster reads Git; CI does not need its credentials."
- "`git revert` is the rollback button."
- "`selfHeal` and `prune` can undo manual changes or remove deleted objects."
- "When Git and the cluster differ, inspect the difference before acting."
