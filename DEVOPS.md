# CET Sheet DevOps Runbook

This repository contains the backend CI/CD and Kubernetes deployment assets for the CET Sheet stack. The frontend lives in the sibling `cet-sheet-frontend` repository and has its own Dockerfile and GitHub Actions workflow.

## Local Docker Compose

From `cet-sheet-hub-main`:

```powershell
docker compose up --build
```

For AI endpoints, set a real Gemini key before starting:

```powershell
$env:GEMINI_API_KEY="your-key"
```

Services:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8081/api/v1
- Backend health: http://localhost:8081/api/v1/actuator/health
- Prometheus metrics: http://localhost:8081/api/v1/actuator/prometheus
- Postgres: localhost:5432
- Redis: localhost:6379

## GitHub Actions

Both repositories include CI workflows:

- Backend: builds/tests with Maven and publishes `ghcr.io/<owner>/cet-sheet-backend`.
- Frontend: tests/builds with npm and publishes `ghcr.io/<owner>/cet-sheet-frontend`.

Image publishing runs on pushes to `main`. Pull requests build and test, but do not publish images.

## Helm Deployment

Update image repositories in `deploy/helm/cet-sheet/values.yaml`:

```yaml
frontend:
  image:
    repository: ghcr.io/<your-github-username>/cet-sheet-frontend

backend:
  image:
    repository: ghcr.io/<your-github-username>/cet-sheet-backend
```

Also replace secret placeholders in `backend.secrets`, especially `geminiApiKey` and `appJwtSecret`.

Install into a local Kubernetes or OpenShift Local cluster:

```powershell
helm upgrade --install cet-sheet ./deploy/helm/cet-sheet --namespace cet-sheet --create-namespace
```

If using the default ingress host, add this to your hosts file:

```text
127.0.0.1 cet-sheet.local
```

Then open:

```text
http://cet-sheet.local
```

## Argo CD

After Argo CD is installed in the cluster, update `deploy/argocd/application.yaml` with your GitHub repository URL, then apply:

```powershell
kubectl apply -f deploy/argocd/application.yaml
```

Argo CD will sync the Helm chart from Git and keep the cluster aligned with the repository.

## Observability

The backend exposes Prometheus metrics at:

```text
/api/v1/actuator/prometheus
```

If your cluster has Prometheus Operator installed, enable the ServiceMonitor:

```powershell
helm upgrade --install cet-sheet ./deploy/helm/cet-sheet --namespace cet-sheet --create-namespace --set serviceMonitor.enabled=true
```
