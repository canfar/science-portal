#!/bin/bash
#
# Deploy Science Portal to Kubernetes using Helm
#
# Usage:
#   ./scripts/deploy.sh <namespace> <environment>
#
# Example:
#   ./scripts/deploy.sh science-portal production
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check arguments
if [ $# -lt 2 ]; then
  echo -e "${RED}Error: Missing required arguments${NC}"
  echo "Usage: $0 <namespace> <environment>"
  echo "Example: $0 science-portal production"
  exit 1
fi

NAMESPACE=$1
ENVIRONMENT=$2
CHART_PATH="./helm/science-portal"
VALUES_FILE="values-${ENVIRONMENT}.yaml"
RELEASE_NAME="science-portal"

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}  Science Portal Deployment${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""
echo "Namespace: ${NAMESPACE}"
echo "Environment: ${ENVIRONMENT}"
echo "Values file: ${VALUES_FILE}"
echo ""

# Check if values file exists
if [ ! -f "${VALUES_FILE}" ]; then
  echo -e "${RED}Error: Values file not found: ${VALUES_FILE}${NC}"
  echo "Please create ${VALUES_FILE} based on helm/science-portal/values.yaml"
  exit 1
fi

# Check if namespace exists
if ! kubectl get namespace "${NAMESPACE}" &> /dev/null; then
  echo -e "${YELLOW}Namespace ${NAMESPACE} does not exist. Creating...${NC}"
  kubectl create namespace "${NAMESPACE}"
  echo -e "${GREEN}✓ Namespace created${NC}"
  echo ""
fi

# Check if secrets exist
if ! kubectl get secret science-portal-secrets -n "${NAMESPACE}" &> /dev/null; then
  echo -e "${RED}Error: Secrets not found!${NC}"
  echo "Please run: ./scripts/create-secrets.sh ${NAMESPACE} <oidc-secret>"
  exit 1
fi

echo -e "${GREEN}✓ Secrets verified${NC}"
echo ""

# Lint the chart
echo -e "${YELLOW}Linting Helm chart...${NC}"
helm lint "${CHART_PATH}" -f "${VALUES_FILE}"
echo -e "${GREEN}✓ Lint passed${NC}"
echo ""

# Dry run
echo -e "${YELLOW}Running dry-run deployment...${NC}"
helm upgrade --install "${RELEASE_NAME}" "${CHART_PATH}" \
  --namespace "${NAMESPACE}" \
  --values "${VALUES_FILE}" \
  --dry-run --debug | head -100

echo ""
read -p "$(echo -e ${YELLOW}Proceed with deployment? [y/N]: ${NC})" -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}Deployment cancelled${NC}"
  exit 0
fi

# Deploy
echo -e "${GREEN}Deploying to ${ENVIRONMENT}...${NC}"
helm upgrade --install "${RELEASE_NAME}" "${CHART_PATH}" \
  --namespace "${NAMESPACE}" \
  --values "${VALUES_FILE}" \
  --wait \
  --timeout 5m

echo -e "${GREEN}✓ Deployment complete!${NC}"
echo ""

# Get deployment status
echo -e "${YELLOW}Checking deployment status...${NC}"
kubectl get pods -n "${NAMESPACE}" -l app.kubernetes.io/name=science-portal
echo ""

# Get service info
echo -e "${YELLOW}Service information:${NC}"
kubectl get svc -n "${NAMESPACE}" -l app.kubernetes.io/name=science-portal
echo ""

# Get ingress info
echo -e "${YELLOW}Ingress information:${NC}"
kubectl get ingress -n "${NAMESPACE}" -l app.kubernetes.io/name=science-portal
echo ""

echo -e "${BLUE}======================================${NC}"
echo -e "${GREEN}  Deployment Successful!${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""
echo "Next steps:"
echo "1. Check pod logs:"
echo "   kubectl logs -n ${NAMESPACE} -l app.kubernetes.io/name=science-portal --tail=50"
echo ""
echo "2. Test health endpoint:"
echo "   kubectl port-forward -n ${NAMESPACE} svc/${RELEASE_NAME} 8080:80"
echo "   curl http://localhost:8080/api/health"
echo ""
echo "3. Monitor deployment:"
echo "   kubectl get pods -n ${NAMESPACE} -w"
echo ""
echo "4. View Helm release:"
echo "   helm list -n ${NAMESPACE}"
echo "   helm status ${RELEASE_NAME} -n ${NAMESPACE}"
