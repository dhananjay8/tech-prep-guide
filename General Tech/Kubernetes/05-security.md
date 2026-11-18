# Kubernetes Security — Interview Notes

## 1. The Layers (text sequence)

```text
API request → authn (who) → authz/RBAC (allowed?) → admission (mutate/validate)
Pod runtime → securityContext → Pod Security Standards → NetworkPolicy → node isolation
Data        → Secrets (etcd encryption) → external secret managers → image scanning/signing
```

---

## 2. RBAC — Who Can Do What

- **Role/RoleBinding** = namespaced · **ClusterRole/ClusterRoleBinding** = cluster-wide (or node-level resources).
- Default-deny: no binding = no permission. `kubectl auth can-i` to check.

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata: { namespace: prod, name: pod-reader }
rules:
  - apiGroups: [""]            # "" = core group
    resources: ["pods"]
    verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata: { namespace: prod, name: pod-reader }
subjects: [{ kind: User, name: alice }]       # or ServiceAccount/Group
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: pod-reader
```

Rules: **verb × resource** granularity (`get` vs `list` differ); `secrets` access is the crown jewel — audit it; avoid `*` wildcards and `cluster-admin` in production.

## 3. ServiceAccounts & Projected Bound Tokens (`TokenRequest` API)

Pods use the namespace's default ServiceAccount unless another is selected.
Create a dedicated ServiceAccount for each app and grant only the permissions
it needs. Set `automountServiceAccountToken: false` when the app does not call
the Kubernetes API. On AWS, **IRSA** or **EKS Pod Identity** can map a
ServiceAccount to an IAM role without placing long-lived AWS keys on the node.

- **Legacy token Secrets:** Before Kubernetes v1.22, Pods typically received
  long-lived ServiceAccount tokens from Secrets. Kubernetes stopped creating
  these Secrets automatically by default in v1.24, but they can still be
  created manually and should generally be avoided.
- **Projected bound tokens:** Kubernetes v1.22 and later use short-lived,
  automatically rotated tokens by default. A projected token can be scoped
  to an audience and bound to a Pod; deleting the Pod invalidates its token.

## 4. securityContext — the Interview Checklist

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app
  namespace: prod
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    fsGroup: 2000
    seccompProfile: { type: RuntimeDefault }
  containers:
    - name: app
      image: example/app:1.0
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities: { drop: [ALL] }
      volumeMounts:
        - name: tmp
          mountPath: /tmp
  volumes:
    - name: tmp
      emptyDir: {}
```

## 5. Pod Security Admission and Standards

Pod Security Admission enforces the Pod Security Standards (PSS). The older
PodSecurityPolicy (PSP) feature was deprecated in Kubernetes v1.21 and
removed in v1.25.

| Level | Enforcement | Use |
| ------- | ------------- | ----- |
| `privileged` | No restrictions | System components that need them; avoid for app workloads |
| `baseline` | Blocks common escalation paths (hostPID, hostNetwork, privileged) | Safer baseline for general workloads |
| `restricted` | Requires controls such as non-root, dropped capabilities, and seccomp | Production and multi-tenant apps |

```bash
kubectl label ns prod pod-security.kubernetes.io/enforce=restricted
# modes: enforce | audit | warn
```

## 6. Secrets — Encode ≠ Encrypt (favorite gotcha)

- `kubectl get secret -o yaml` output is **base64 — anyone with read access decodes it**. So: etcd **encryption at rest** (EncryptionConfiguration, KMS provider) + tight RBAC on `secrets`.
- External managers (prod answer): AWS Secrets Manager / GCP SM / HashiCorp Vault / Azure KV via **External Secrets Operator** or CSI driver — K8s stays the consumption layer, manager owns rotation/audit.
- Avoid env-var secrets for high sensitivity (visible in `kubectl exec env`, process lists, crash dumps) — mounted files are marginally better; best is short-lived workload-identity tokens.

## 7. Runtime & Admission Security (from source gaps)

- **Admission controllers**: built-in (LimitRanger, PodSecurity, ResourceQuota) + dynamic webhooks — **OPA/Gatekeeper** (Rego DSL) or **Kyverno** (YAML-native) for policy-as-code ("no :latest", "must have resource limits", "only trusted registries").
- **CEL `ValidatingAdmissionPolicy` (GA in v1.30)**: Compiles Common Expression Language (`object.spec.containers.all(c, !c.image.endsWith(':latest'))`) **in-process inside `kube-apiserver`** — zero external webhook network hop, zero webhook pod crash blocking cluster deployments!
- **seccomp**: `seccompProfile: RuntimeDefault` applies the container runtime's
  default syscall restrictions. The exact profile depends on the runtime.
- **AppArmor/SELinux**: MAC confinement at node level (`annotations` / `securityContext.appArmorProfile`).
- **Sandboxed runtimes (`RuntimeClass`)**: **gVisor (`runsc`)** (user-space kernel intercepting syscalls) or **Kata Containers / Firecracker** (lightweight microVM per pod) for untrusted multi-tenant code execution.
- **Runtime detection**: Falco / Cilium Tetragon (eBPF) → alert or kill on shells spawned in pods (`execve /bin/sh`), sensitive file reads (`/etc/shadow`), crypto miners, or unexpected outbound connections.
- **Image supply chain**: scan in CI (Trivy/Grype), sign + verify (cosign), private registries only.

---

## 8. Interview Q&A

**Q: Compromised pod — blast radius?**
Namespaced RBAC limits API calls; NetworkPolicy limits lateral movement; non-root + RO-rootfs + dropped caps limits node damage; PSS stops escalation. Then: detect (Falco), isolate (cordon + delete pod), rotate SA token + secrets.

**Q: How do pods call the K8s API?**
Mounted SA token → apiserver → RBAC decides. That's why `automountServiceAccountToken: false` is a cheap win.

**Q: Secret got exfiltrated from `kubectl get secret -o yaml`?**
RBAC on `get secrets` was too broad — that's the real vuln. Rotate, enable etcd encryption, move to external manager, audit `secrets` access.

**Q: Pod runs as root — how bad?**
Container root ≠ host root by default (user namespaces still maturing), but root + writable rootfs + default caps = easier escape; `runAsNonRoot` is baseline hygiene.

---

## 9. Recall — Sound Bites

- "Authn → authz → admission — three doors, in that order."
- "RoleBinding is namespaced; ClusterRoleBinding reaches the cluster."
- "Secrets are encoded, not encrypted — encrypt etcd + starve RBAC."
- "PSP is dead; Pod Security Standards + admission policies replaced it."
- "`runAsNonRoot + drop ALL + readOnlyRootFilesystem` is the 80% answer."
