# Helm & Kustomize — Interview Notes

## 1. What Each Solves

- **Helm** packages an app as a chart. A chart contains Kubernetes templates
  and default values; Helm installs it and tracks its releases.
- **Kustomize** edits plain Kubernetes YAML for each environment. It uses a
  shared base plus small changes called overlays, and is built into `kubectl`.

---

## 2. Helm

```bash
# Sandbox/authorized environment examples; do not use as a Qualys production deploy path.
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install web bitnami/nginx -n prod --create-namespace
helm upgrade web bitnami/nginx -f values-prod.yaml --set image.tag=1.2.3
helm list -n prod
helm history web -n prod
helm template web ./chart -f values-dev.yaml     # render without installing
```

These commands are for a sandbox or another authorized environment. For
managed Qualys pods, submit a reviewed change through the deployment process.
The platform uses `qhelm` and `quadfile` to apply the values and release order.
Do not run `helm install`, `upgrade`, or `rollback` directly against a pod.

```yaml
# templates/deployment.yaml (Go templates)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Release.Name }}
  labels:
    app.kubernetes.io/name: {{ .Chart.Name | quote }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      app.kubernetes.io/name: {{ .Chart.Name | quote }}
  template:
    metadata:
      labels:
        app.kubernetes.io/name: {{ .Chart.Name | quote }}
    spec:
      containers:
        - name: app
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          resources: {{- toYaml .Values.resources | nindent 12 }}
```

```yaml
# values.yaml
replicaCount: 3
image: { repository: myapp, tag: "1.0.0" }
resources: { requests: { cpu: 100m, memory: 128Mi } }
```

Helm hooks run jobs before or after an install/upgrade, such as a database
migration. `--wait` makes Helm wait for resources to become ready.
`helm dependency` manages subcharts.

### Helm 3 Internals (Architecture, Release State & 3-Way Merge)

- **Helm 2 and Helm 3**: Helm 2 used an in-cluster server called Tiller.
  Helm 3 removed Tiller and uses the caller's Kubernetes credentials.
- **Release history**: Helm stores each release revision as a Kubernetes
  Secret in the target namespace. Each upgrade adds another Secret. Limit
  history with `--history-max` so old revisions do not build up.
- **How upgrades compare changes**: Helm considers the old chart, the live
  Kubernetes settings, and the new chart. This helps it handle changes made
  directly to the cluster.
- **Hooks and weights**: Hooks run Jobs at named points, such as before an
  upgrade. Hook weights set their order; delete policies control cleanup.
- **Named templates**: Put reusable YAML in `_helpers.tpl`. Use `include`
  when you need to pass the rendered text through a function such as
  `nindent`; `template` cannot be piped this way.
- **Qualys `qhelm` + `quadfile`**: an approved runner processes a reviewed
  release list and applies shared and pod-specific values. Wait and rollback
  options apply to each release; the whole list is not one all-or-nothing
  change.

## 3. Kustomize

```text
base/                    # works standalone
  deployment.yaml service.yaml kustomization.yaml
overlays/
  prod/kustomization.yaml   # namePrefix, replicas patch, images: newTag
  dev/kustomization.yaml
```

```yaml
# overlays/prod/kustomization.yaml
resources: [../../base]
namePrefix: prod-
replicas: [{ name: app, count: 5 }]
images:   [{ name: myapp, newTag: "1.2.3" }]
patches:
  - patch: |-
      - op: replace
        path: /spec/template/spec/containers/0/resources/requests/cpu
        value: "500m"
    target: { kind: Deployment, name: app }
```

Kustomize can also create ConfigMaps and Secrets. It adds a hash to the
generated name, so a changed file can trigger a new Deployment. You can also
set common labels and a namespace. The generated name is not encryption; do
not commit plaintext secret values. Use an approved encrypted or external
secret-management workflow.

---

## 4. Helm vs Kustomize (X vs Y)

| Question | Helm | Kustomize |
| --- | --- | --- |
| How does it work? | Templates and values | A base plus YAML patches |
| Does it package apps? | Yes; charts can be stored in a registry | No |
| Does it track releases? | Yes; includes history and hooks | No; it renders files for `kubectl` or another tool |
| Is it built into `kubectl`? | No; use Helm CLI | Yes; use `kubectl -k` |
| Best for | Sharing and installing apps | Changing your YAML for each environment |
| Works with ArgoCD/Flux? | Yes | Yes |

Teams can use Helm for the app package and Kustomize for small environment
changes. ArgoCD supports both.

---

## 5. Interview Q&A

**Q: Rollback strategy?**
In an authorized standalone Helm environment, `helm rollback web 3` restores
an earlier release. Check the database first; its schema may not work with
the older app. For Qualys, restore the previous image/settings through the
reviewed deployment process. For Kustomize/GitOps, revert the reviewed Git
change.

**Q: How do you keep dev/prod configs apart?**
Use one Helm chart with separate `values-<env>.yaml` files, or a shared
Kustomize base with one overlay per environment. Review changes in CI; do not
edit live production settings by hand.

**Q: Secret handling with Helm/Kustomize?**
Do not put secret values in charts or values files. Use an approved secret
tool, such as SOPS, Sealed Secrets, or External Secrets Operator.

**Q: Drift between chart and cluster?**
A manual `kubectl edit` can make the live cluster differ from Git. Helm may
not correct it until the next upgrade. ArgoCD can detect the difference and
correct it if self-healing is enabled.

---

## 6. Recall — Sound Bites

- "Helm packages apps; Kustomize applies small changes to plain YAML."
- "`helm template` renders settings; an approved runner deploys them."
- "A generated ConfigMap name changes when its content changes."
- "Never store real secrets in `values.yaml` or committed overlays."
- "GitOps wants declarative render (Kustomize); distribution wants packages (Helm)."
