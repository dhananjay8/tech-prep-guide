# Configuration Management — Ansible, Chef, Puppet & Qualys Orchestration

## 1. Configuration Management vs Infrastructure Provisioning

| Tool | Main job | How it works | Good fit |
| --- | --- | --- | --- |
| **Terraform** | Creates cloud resources such as networks, clusters, and databases | Pushes a declared plan through cloud APIs | Creating and changing infrastructure |
| **Ansible** | Configures hosts and coordinates deployments | Usually connects without an installed agent; runs YAML playbooks | Ordered tasks, releases, and operations |
| **Puppet** | Keeps host settings in the required state | Agents regularly pull and apply a catalog | Enforcing settings across large fleets |
| **Chef** | Configures hosts with Ruby recipes | Agents pull and run recipes | Teams that use Chef and Ruby tooling |
| **SaltStack** | Runs configuration and remote commands | Push or pull using agents, or agentless SSH | Fast operations across many hosts |

**Quick guide:** Terraform creates the infrastructure. Ansible, Puppet, and
Chef configure hosts or coordinate work. Kubernetes runs containerized
services. Packer and Ansible can also create standard machine images to reduce
configuration differences after startup.

An **idempotent** task is safe to run more than once: after the first successful
run, repeating it does not create another change.

---

## 2. Ansible — Architecture & Core Concepts

```text
Ansible control node (CLI / AWX / Tower / Jenkins worker)
  ├── Inventory (static INI/YAML or dynamic AWS/Consul/K8s plugin)
  ├── Playbook (ordered steps for selected host groups)
  ├── Variables (values from defaults, inventory, plays, and command line)
  └── Connects via SSH (Linux) / WinRM (Windows) / localhost (K8s/Helm/Cloud APIs)
        └── Runs tasks and reports what changed or failed
```

### Core Building Blocks

| Concept | What it means | Key point |
| --- | --- | --- |
| **Inventory** | Lists hosts, usually grouped by environment or role (`[web]`, `[db]`) | Dynamic inventory can read host details from AWS, Consul, or Kubernetes |
| **Facts (`setup`)** | Details collected from a host, such as OS, IP, CPU, and mounts | Set `gather_facts: false` for local API/Helm work when host details are not needed |
| **Task and module** | One action, such as copying a file or installing a package | Built-in modules are often safe to repeat; guard `command`, `shell`, and `raw` yourself |
| **Handler** | A task called by `notify` when another task changes something | Runs once at the end of the play unless you flush handlers earlier |
| **Role** | A reusable set of tasks, files, templates, and variables | Share roles through Ansible Galaxy or an internal repository |
| **Template (Jinja2)** | A file filled in with variables, such as `{{ http_port }}` | Ansible renders it on the control node before sending it to the host |
| **Ansible Vault** | Encrypts sensitive variables or files | For live secrets, prefer a runtime lookup from HashiCorp Vault |

### Which variable wins? (lowest to highest)

If a variable is set in more than one place, the value farther down this list
overrides the earlier value.

```text
1. role defaults (defaults/main.yml)         — lowest, meant to be overridden
2. inventory group_vars/all → group_vars/<group> → host_vars/<host>
3. playbook vars / vars_files
4. role vars (vars/main.yml)
5. task vars / set_fact / registered vars
6. -e / --extra-vars                         — ALWAYS WINS (highest precedence)
```

### Rolling update with a load balancer

This example removes each host from traffic, updates it, checks its health,
then adds it back. The batch and failure settings reduce risk but do not by
themselves guarantee zero downtime.

```yaml
- name: Rolling update web tier
  hosts: webservers
  serial: "25%"                 # batch size: 25% of fleet at a time
  max_fail_percentage: 10       # abort entire rollout if >10% fail
  become: true
  pre_tasks:
    - name: Drain node from HAProxy before touching app
      community.general.haproxy:
        state: disabled
        backend: web_back
        host: "{{ inventory_hostname }}"
      delegate_to: "{{ item }}"
      loop: "{{ groups['lb'] }}"
  roles:
    - role: app_deploy
  post_tasks:
    - name: Verify local health endpoint before re-enabling traffic
      ansible.builtin.uri:
        url: "http://127.0.0.1:8080/healthz"
        status_code: 200
      retries: 10
      delay: 3
    - name: Re-enable node in HAProxy
      community.general.haproxy:
        state: enabled
        backend: web_back
        host: "{{ inventory_hostname }}"
      delegate_to: "{{ item }}"
      loop: "{{ groups['lb'] }}"
```

---

## 3. Ansible, Consul, Vault & Helm in a Managed Qualys Environment

In the Qualys pattern reviewed here, Ansible helps run a controlled
deployment. It selects versioned settings, applies the Vault access policy,
and calls the platform's Helm tool. Other services may use different files or
packages, so check the service's actual build and deployment setup.

```text
1. Service repo
   └── App code, tests, image build, and optional config/chart files
2. Shared config repo (where used)
   ├── Defaults shared across environments and versioned config packages
   └── Base qhelm values; the build decides which files are included
3. Environment/deployment repo
   ├── quadfile.yaml                         # releases and their order
   ├── qhelm/*-values-override.yml           # shared/pod-specific settings
   ├── qvaultsi/<service>/...                # Vault access rules
   └── consul/<service>/                     # regular runtime settings
4. Controlled deployment runner
   ├── Publishes the Consul settings used by the service
   ├── Applies the approved Vault access rules
   └── Runs each release through qhelm / Helm
```

### Configuration and release boundaries

- **Ownership**: application code goes in the service repo. Shared defaults
  go in shared config. Pod endpoints, image versions, release order, and
  local policy go in the environment repo.
- **Packaging**: check the build files to see which config files are
  published. Some builds always publish Helm/Ansible packages but publish a
  Consul package only when the service uses one. A source file may not be in
  the published package.
- **Settings order**: Helm defaults, shared values, pod values, and runtime
  config can override each other. Check which value actually wins.
- **Consul and Vault**: Consul holds regular settings; Vault holds secrets.
  Give each service access only to the secrets it needs. Never put secret
  values in Git, Helm files, or pipeline logs.
- **Release order**: `quadfile.yaml` lists releases in order. Only
  `wait_for_success: true` makes the runner wait for that release before
  continuing. This is not one all-or-nothing deployment; earlier releases may
  stay updated if a later one fails.
- **Deployment type**: this runner applies reviewed changes. Do not call it
  ArgoCD/Flux pull reconciliation unless one of those controllers actually
  manages the service.

This model helps explain how to share defaults while keeping pod-specific
settings clear and reviewed. The amount of shared versus local config varies
by service.

---

## 4. Puppet & Chef — What You Must Know for Interviews

Even teams that use Kubernetes may still manage older virtual machines with
Chef or Puppet. Be ready to explain how to support them or move away from
them.

| Concept | Puppet | Chef | Ansible Equivalent |
| --- | --- | --- | --- |
| **Config unit** | **Manifest** (`.pp`, declarative Ruby-like DSL) | **Recipe** (`.rb`, procedural Ruby DSL) | **Playbook / Task** (`.yml`) |
| **Bundle / Module** | **Module** (`manifests/`, `templates/`, `files/`) | **Cookbook** (`recipes/`, `attributes/`, `templates/`) | **Role** |
| **Host facts** | **Facter** (collects OS/hardware facts before catalog request) | **Ohai** (collects node attributes at start of `chef-client` run) | **`setup` module** (`gather_facts`) |
| **External data** | **Hiera** (hierarchical key/value lookup separated from code) | **Data Bags** (encrypted/plain JSON) + **Attributes** | `group_vars` / `host_vars` / Ansible Vault |
| **Execution flow** | Agent sends Facter facts → Master compiles **Catalog** (DAG of resources) → Agent enforces catalog every 30m | Agent pulls Cookbook → compiles resource collection → converges node in recipe order | Control node SSHs in and runs tasks top-to-bottom |
| **Templates** | ERB / EPP (`.erb` / `.epp`) | ERB (`.erb`) | Jinja2 (`.j2`) |

### Key Interview Trade-Offs (Push vs Pull at Scale)

- **Why teams use Puppet/Chef pull on large fleets**: Each node checks in on
  a schedule and can correct configuration drift without a central SSH run.
- **Why teams use Ansible push for releases**: It needs no agent on the
  target and can run steps in order, such as drain traffic, update a database,
  restart the app, and check health.
- **A common mix**: ArgoCD/Flux can reconcile Kubernetes settings; Packer and
  Ansible can build standard VM images; Ansible can coordinate host
  maintenance.

---

## 5. Interview Scenarios & Case Studies

**Q: A playbook is slow on hundreds of production servers. How do you speed it up?**

1. Enable SSH pipelining and connection reuse to reduce setup work.
2. Raise `forks` carefully to run more hosts at once; watch controller
   capacity.
3. Skip fact gathering when the play does not need host details, or cache
   facts between runs.
4. Use `strategy: free` when hosts do not need to move in lockstep.
5. Use `async` and `poll` for long-running tasks.
6. Install packages as a list instead of one package per loop iteration.

**Q: A task restarts a database on every run. How do you prevent that?**

1. Use the service/systemd module instead of `shell` when possible.
2. Restart through a `notify` handler only when the configuration changes.
3. If you must run a command, guard it with a marker file or a read-only
   check so it runs only when needed.

**Q: How do you test configuration changes before production?**

1. Run `ansible-lint` and `yamllint`.
2. Use `--check` and `--diff` against a test inventory to preview changes.
3. Use Molecule with temporary Podman containers or VMs. Run the playbook
   twice and confirm the second run reports no changes. Check the final state
   with Testinfra or Goss.

---

## 6. Recall — Sound Bites

- "Terraform creates infrastructure; Ansible configures hosts; Kubernetes runs containers."
- "Ansible connects to hosts to run tasks; Puppet and Chef agents check in for settings."
- "Use built-in modules and handlers to avoid repeating changes."
- "Values passed with `--extra-vars` (`-e`) override lower-priority Ansible values."
- "Run an Ansible playbook twice in tests; the second run should make no changes."
- "In the Qualys deployment pattern, shared defaults and pod settings are separate, and release checks are set per release."
