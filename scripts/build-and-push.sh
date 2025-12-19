#!/bin/bash
#
# Build and push Docker image to registry
#
# Usage:
#   ./scripts/build-and-push.sh <registry> <version>
#
# Example:
#   ./scripts/build-and-push.sh gcr.io/my-project v0.1.0
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check arguments
if [ $# -lt 2 ]; then
  echo -e "${RED}Error: Missing required arguments${NC}"
  echo "Usage: $0 <registry> <version>"
  echo "Example: $0 gcr.io/my-project v0.1.0"
  exit 1
fi

REGISTRY=$1
VERSION=$2
IMAGE_NAME="science-portal"
FULL_IMAGE="${REGISTRY}/${IMAGE_NAME}:${VERSION}"
LATEST_IMAGE="${REGISTRY}/${IMAGE_NAME}:latest"

echo -e "${GREEN}Building Docker image...${NC}"
echo "Registry: ${REGISTRY}"
echo "Image: ${IMAGE_NAME}"
echo "Version: ${VERSION}"
echo ""

# Build arguments
BUILD_ARGS=(
  --build-arg NEXT_PUBLIC_LOGIN_API=https://ws-cadc.canfar.net/ac
  --build-arg NEXT_PUBLIC_SKAHA_API=https://ws-uv.canfar.net/skaha
  --build-arg NEXT_PUBLIC_SRC_SKAHA_API=https://src.canfar.net/skaha
  --build-arg NEXT_PUBLIC_SRC_CAVERN_API=https://src.canfar.net/cavern
  --build-arg NEXT_PUBLIC_API_TIMEOUT=30000
  --build-arg NEXT_PUBLIC_USE_CANFAR=false
  --build-arg NEXT_PUBLIC_ENABLE_QUERY_DEVTOOLS=false
)

# Build for linux/amd64 (K8s standard)
docker build \
  --platform linux/amd64 \
  -t "${FULL_IMAGE}" \
  -t "${LATEST_IMAGE}" \
  "${BUILD_ARGS[@]}" \
  -f Dockerfile \
  .

echo -e "${GREEN}✓ Image built successfully${NC}"
echo ""

# Optional: Scan for vulnerabilities
if command -v trivy &> /dev/null; then
  echo -e "${YELLOW}Scanning image for vulnerabilities...${NC}"
  trivy image --severity HIGH,CRITICAL "${FULL_IMAGE}" || true
  echo ""
fi

# Push to registry
echo -e "${GREEN}Pushing image to registry...${NC}"
docker push "${FULL_IMAGE}"
docker push "${LATEST_IMAGE}"

echo -e "${GREEN}✓ Image pushed successfully${NC}"
echo ""
echo "Images available at:"
echo "  ${FULL_IMAGE}"
echo "  ${LATEST_IMAGE}"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "1. Update helm/science-portal/values.yaml with:"
echo "   image:"
echo "     repository: ${REGISTRY}/${IMAGE_NAME}"
echo "     tag: ${VERSION}"
echo ""
echo "2. Deploy with Helm:"
echo "   helm upgrade --install science-portal ./helm/science-portal -f values-production.yaml"
