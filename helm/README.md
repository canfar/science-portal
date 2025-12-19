# Science Portal Helm Chart

This directory contains the Helm chart for deploying Science Portal to Kubernetes clusters, optimized for DigitalOcean Kubernetes (DOKS).

## Quick Start

```bash
# 1. Configure your values
cp science-portal/values-digitalocean.yaml science-portal/values-production.yaml
vim science-portal/values-production.yaml  # Edit with your settings

# 2. Create required secrets
kubectl create secret generic science-portal-secrets \
  --from-literal=auth-secret=$(openssl rand -base64 32) \
  --from-literal=oidc-client-secret=YOUR_OIDC_SECRET \
  --namespace science-portal

# 3. Deploy using the script
./deploy.sh production --wait
```

## Directory Structure

```
helm/
├── README.md                               # This file
├── DEPLOYMENT.md                           # Comprehensive deployment guide
├── deploy.sh                               # Automated deployment script
└── science-portal/                         # Helm chart directory
    ├── Chart.yaml                          # Chart metadata
    ├── values.yaml                         # Default values
    ├── values-digitalocean.yaml            # DigitalOcean-specific template
    ├── .helmignore                         # Files to ignore in packaging
    └── templates/                          # Kubernetes manifest templates
        ├── _helpers.tpl                    # Template helpers
        ├── deployment.yaml                 # Application deployment
        ├── service.yaml                    # Service definition
        ├── ingress.yaml                    # Ingress configuration
        ├── serviceaccount.yaml             # Service account
        ├── configmap.yaml                  # Configuration map
        ├── hpa.yaml                        # Horizontal Pod Autoscaler
        ├── pdb.yaml                        # Pod Disruption Budget
        └── networkpolicy.yaml              # Network policies
```

## Prerequisites

Before deploying, ensure you have:

1. **Kubernetes cluster** (DigitalOcean DOKS recommended)
2. **kubectl** configured to access your cluster
3. **Helm 3** installed
4. **Container registry** (DigitalOcean Container Registry or Docker Hub)
5. **Domain name** for ingress

### Required Cluster Add-ons

Install these add-ons in your cluster:

#### NGINX Ingress Controller

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.service.type=LoadBalancer
```

#### cert-manager (for SSL/TLS)

```bash
helm repo add jetstack https://charts.jetstack.io
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --set installCRDs=true
```

Then create a ClusterIssuer:

```bash
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

## Deployment Methods

### Method 1: Using the Deployment Script (Recommended)

The `deploy.sh` script automates the deployment process:

```bash
# Deploy to production
./deploy.sh production --wait

# Dry run to see what would be deployed
./deploy.sh production --dry-run

# Deploy with custom image tag
./deploy.sh production --set image.tag=1.2.3

# Deploy with debug output
./deploy.sh production --debug
```

### Method 2: Using Helm Directly

```bash
# Install new release
helm install science-portal ./science-portal \
  -f ./science-portal/values-production.yaml \
  --namespace science-portal \
  --create-namespace

# Upgrade existing release
helm upgrade science-portal ./science-portal \
  -f ./science-portal/values-production.yaml \
  --namespace science-portal
```

### Method 3: Using Helm Diff (Preview Changes)

```bash
# Install helm-diff plugin
helm plugin install https://github.com/databus23/helm-diff

# Preview changes before upgrading
helm diff upgrade science-portal ./science-portal \
  -f ./science-portal/values-production.yaml \
  --namespace science-portal
```

## Configuration

### Required Configuration Changes

Before deploying, you MUST update these values in your values file:

1. **Image Repository**
   ```yaml
   image:
     repository: registry.digitalocean.com/your-registry/science-portal-nextjs
     tag: "1.0.0"
   ```

2. **Domain Name**
   ```yaml
   ingress:
     hosts:
       - host: your-domain.com
   ```

3. **OIDC Client ID**
   ```yaml
   oidc:
     clientId: "your-oidc-client-id"
   ```

4. **Environment URLs** - Update all URLs in the `env` section to match your environment

### Optional Configuration

- **Replica Count**: Adjust `replicaCount` based on your traffic
- **Resources**: Tune CPU/memory limits for your workload
- **Autoscaling**: Configure HPA thresholds
- **Network Policies**: Adjust egress rules for your security requirements

## Secrets Management

The chart requires a Kubernetes secret named `science-portal-secrets` with the following keys:

- `auth-secret`: NextAuth secret (generate with `openssl rand -base64 32`)
- `oidc-client-secret`: Your OIDC provider client secret

Create the secret:

```bash
kubectl create secret generic science-portal-secrets \
  --from-literal=auth-secret=$(openssl rand -base64 32) \
  --from-literal=oidc-client-secret=YOUR_OIDC_SECRET \
  --namespace science-portal
```

## Building and Pushing Docker Images

### Using DigitalOcean Container Registry

```bash
# Create registry
doctl registry create your-registry-name

# Authenticate
doctl registry login

# Build and push
docker build -t registry.digitalocean.com/your-registry-name/science-portal-nextjs:1.0.0 .
docker push registry.digitalocean.com/your-registry-name/science-portal-nextjs:1.0.0

# Create image pull secret in Kubernetes
doctl registry kubernetes-manifest | kubectl apply -f -
```

### Using Docker Hub

```bash
# Build and push
docker build -t your-dockerhub-username/science-portal-nextjs:1.0.0 .
docker push your-dockerhub-username/science-portal-nextjs:1.0.0

# Create image pull secret
kubectl create secret docker-registry registry-science-portal \
  --docker-server=docker.io \
  --docker-username=YOUR_USERNAME \
  --docker-password=YOUR_PASSWORD \
  --docker-email=YOUR_EMAIL \
  --namespace science-portal
```

## Monitoring Deployment

### Check Deployment Status

```bash
# Watch pods
kubectl get pods -n science-portal -w

# Check all resources
kubectl get all -n science-portal

# Check ingress
kubectl get ingress -n science-portal

# Check certificates
kubectl get certificate -n science-portal
```

### View Logs

```bash
# Stream logs from all pods
kubectl logs -n science-portal -l app.kubernetes.io/name=science-portal -f

# Logs from specific pod
kubectl logs -n science-portal <pod-name>
```

### Access Application

```bash
# Port-forward for testing (without ingress)
kubectl port-forward -n science-portal svc/science-portal 3000:80

# Then access at http://localhost:3000
```

## Updating the Deployment

### Update Application Image

```bash
# Build and push new image
docker build -t registry.digitalocean.com/your-registry/science-portal-nextjs:1.1.0 .
docker push registry.digitalocean.com/your-registry/science-portal-nextjs:1.1.0

# Update deployment
./deploy.sh production --set image.tag=1.1.0
```

### Update Configuration

```bash
# Edit values file
vim science-portal/values-production.yaml

# Apply changes
./deploy.sh production
```

## Rollback

```bash
# View release history
helm history science-portal -n science-portal

# Rollback to previous version
helm rollback science-portal -n science-portal

# Rollback to specific revision
helm rollback science-portal 2 -n science-portal
```

## Uninstalling

```bash
# Uninstall the release
helm uninstall science-portal -n science-portal

# Delete namespace (optional)
kubectl delete namespace science-portal
```

## Troubleshooting

### Common Issues

1. **ImagePullBackOff**: Check image registry credentials and secret
2. **CrashLoopBackOff**: Check application logs for errors
3. **Certificate not issuing**: Verify DNS points to load balancer IP
4. **503 errors**: Check pod readiness and service endpoints

### Debug Commands

```bash
# Describe pod for events
kubectl describe pod -n science-portal <pod-name>

# Check pod logs
kubectl logs -n science-portal <pod-name>

# Exec into pod
kubectl exec -n science-portal <pod-name> -it -- /bin/sh

# Check service endpoints
kubectl get endpoints -n science-portal

# Test service from within cluster
kubectl run -it --rm debug --image=alpine --restart=Never -- sh
# Then: wget -O- http://science-portal.science-portal.svc.cluster.local
```

## Customization

### Add Custom Environment Variables

Edit your values file:

```yaml
env:
  - name: CUSTOM_VAR
    value: "custom-value"
```

### Use External Secrets

Instead of creating secrets manually, use external secret managers:

```yaml
secrets:
  existingSecret: "external-secret-name"
```

### Custom Ingress Annotations

Add provider-specific annotations:

```yaml
ingress:
  annotations:
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/custom-annotation: "value"
```

## Additional Resources

- [Full Deployment Guide](./DEPLOYMENT.md) - Comprehensive step-by-step guide
- [Helm Documentation](https://helm.sh/docs/)
- [DigitalOcean Kubernetes Docs](https://docs.digitalocean.com/products/kubernetes/)
- [NGINX Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
- [cert-manager](https://cert-manager.io/docs/)

## Support

For issues:
1. Check the [DEPLOYMENT.md](./DEPLOYMENT.md) guide
2. Review pod logs: `kubectl logs -n science-portal <pod-name>`
3. Check Helm status: `helm status science-portal -n science-portal`
4. Verify configuration: `helm get values science-portal -n science-portal`
