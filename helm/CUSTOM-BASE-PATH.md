# Custom Base Path Configuration

This guide explains how to build and deploy the Science Portal Next.js application with a custom URL base path.

## Overview

The Science Portal uses Next.js `basePath` to serve the application at a custom URL prefix (e.g., `/science-portal`, `/canfar-app`, `/my-portal`).

**Important**: The base path is configured at **Docker build time**, not runtime. Your Helm deployment must use a path that matches the Docker image build.

## How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                        BUILD TIME                                │
│  docker build --build-arg NEXT_PUBLIC_BASE_PATH="/canfar-app"   │
│                              ↓                                   │
│                    Path baked into image                         │
└─────────────────────────────────────────────────────────────────┘
                               ↓
                          must match
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                       DEPLOY TIME                                │
│  Helm values:  basePath: "/canfar-app"                          │
│                              ↓                                   │
│         Configures: Ingress routes, health checks, URLs          │
└─────────────────────────────────────────────────────────────────┘
```

## Building the Docker Image

### Default Path (`/science-portal`)

```bash
docker build -t science-portal:latest .
```

### Custom Path

```bash
# Build for /canfar-app
docker build \
  --build-arg NEXT_PUBLIC_BASE_PATH="/canfar-app" \
  -t science-portal:canfar-app .

# Build for /my-portal
docker build \
  --build-arg NEXT_PUBLIC_BASE_PATH="/my-portal" \
  -t science-portal:my-portal .

# Build for root path (/)
docker build \
  --build-arg NEXT_PUBLIC_BASE_PATH="" \
  -t science-portal:root .
```

### Available Build Arguments

| Argument | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_BASE_PATH` | `/science-portal` | URL path prefix for the application |
| `NEXT_PUBLIC_USE_CANFAR` | `true` | Authentication mode (`true`=CANFAR, `false`=OIDC) |
| `NEXT_PUBLIC_LOGIN_API` | `https://ws-cadc.canfar.net/ac` | Login API endpoint |
| `NEXT_PUBLIC_SKAHA_API` | `https://ws-uv.canfar.net/skaha` | Skaha API endpoint |

### Full Build Example

```bash
docker build \
  --build-arg NEXT_PUBLIC_BASE_PATH="/canfar-app" \
  --build-arg NEXT_PUBLIC_USE_CANFAR="true" \
  --build-arg NEXT_PUBLIC_LOGIN_API="https://ws-cadc.canfar.net/ac" \
  --build-arg NEXT_PUBLIC_SKAHA_API="https://ws-uv.canfar.net/skaha" \
  -t myregistry.com/science-portal:v1.0.0-canfar-app .
```

## Helm Deployment

### Matching the Path

The Helm chart's `basePath` value **must match** the path used when building the Docker image:

```yaml
# values.yaml
basePath: "/canfar-app"  # Must match --build-arg NEXT_PUBLIC_BASE_PATH

image:
  repository: myregistry.com/science-portal
  tag: "v1.0.0-canfar-app"
```

### What the Helm basePath Configures

The `basePath` value in Helm configures:

1. **Ingress routing** - Routes traffic from the path to the service
   ```yaml
   ingress:
     rules:
       - path: /canfar-app  # ← from basePath
   ```

2. **Health check endpoints** - Kubernetes probes hit the correct paths
   ```yaml
   livenessProbe:
     httpGet:
       path: /canfar-app/api/health  # ← basePath + /api/health
   ```

3. **OIDC callback URLs** (if using OIDC auth)
   ```yaml
   env:
     NEXT_OIDC_CALLBACK_URI: https://example.com/canfar-app
     NEXT_OIDC_REDIRECT_URI: https://example.com/canfar-app/api/auth/callback/oidc
   ```

### Deployment Examples

```bash
# Deploy with matching path
helm install science-portal ./chart \
  --set basePath="/canfar-app" \
  --set image.tag="v1.0.0-canfar-app"

# Using values file
helm install science-portal ./chart -f values-canfar.yaml
```

## Common Configurations

### CANFAR Production

```bash
# Build
docker build \
  --build-arg NEXT_PUBLIC_BASE_PATH="/science-portal" \
  --build-arg NEXT_PUBLIC_USE_CANFAR="true" \
  -t science-portal:prod .
```

```yaml
# Helm values
basePath: "/science-portal"
authMode: "canfar"
image:
  tag: "prod"
```

### SRCNet/OIDC Production

```bash
# Build
docker build \
  --build-arg NEXT_PUBLIC_BASE_PATH="/srcnet-portal" \
  --build-arg NEXT_PUBLIC_USE_CANFAR="false" \
  -t science-portal:srcnet .
```

```yaml
# Helm values
basePath: "/srcnet-portal"
authMode: "oidc"
image:
  tag: "srcnet"
oidc:
  issuer: "https://ska-iam.stfc.ac.uk/"
  clientId: "your-client-id"
```

## Troubleshooting

### 404 Errors After Deployment

**Cause**: Mismatch between Docker build path and Helm `basePath`.

**Fix**: Ensure they match:
```bash
# Check what path the image was built with
docker run --rm science-portal:tag printenv | grep BASE_PATH

# Compare with Helm values
helm get values science-portal | grep basePath
```

### Assets Not Loading (Broken Images/CSS)

**Cause**: Static assets are served with the wrong path prefix.

**Fix**: The application code uses `NEXT_PUBLIC_BASE_PATH` for asset URLs. Rebuild the image if the path is wrong.

### Health Checks Failing

**Cause**: Kubernetes probes hitting wrong endpoint.

**Fix**: Ensure Helm `basePath` matches the image:
```bash
# Test health endpoint manually
curl http://localhost:3000/canfar-app/api/health
```

## CI/CD Integration

### GitHub Actions Example

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        include:
          - path: "/science-portal"
            tag-suffix: "canfar"
          - path: "/srcnet-portal"
            tag-suffix: "srcnet"
    steps:
      - uses: actions/checkout@v4

      - name: Build and push
        run: |
          docker build \
            --build-arg NEXT_PUBLIC_BASE_PATH="${{ matrix.path }}" \
            -t myregistry/science-portal:${{ github.sha }}-${{ matrix.tag-suffix }} \
            .
          docker push myregistry/science-portal:${{ github.sha }}-${{ matrix.tag-suffix }}
```

### GitLab CI Example

```yaml
build:
  stage: build
  parallel:
    matrix:
      - BASE_PATH: "/science-portal"
        TAG_SUFFIX: "canfar"
      - BASE_PATH: "/srcnet-portal"
        TAG_SUFFIX: "srcnet"
  script:
    - docker build
        --build-arg NEXT_PUBLIC_BASE_PATH="$BASE_PATH"
        -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA-$TAG_SUFFIX
        .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA-$TAG_SUFFIX
```

## Summary

1. **Build time**: Set path with `--build-arg NEXT_PUBLIC_BASE_PATH="/your-path"`
2. **Deploy time**: Set matching `basePath: "/your-path"` in Helm values
3. **They must match** - the Docker image path is baked in and cannot be changed at runtime
