#!/bin/bash
#
# Create Kubernetes secrets for Science Portal
#
# Usage:
#   ./scripts/create-secrets.sh <namespace> <oidc-client-secret>
#
# Example:
#   ./scripts/create-secrets.sh science-portal "your-oidc-secret"
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
  echo "Usage: $0 <namespace> <oidc-client-secret>"
  echo "Example: $0 science-portal 'your-oidc-secret'"
  exit 1
fi

NAMESPACE=$1
OIDC_CLIENT_SECRET=$2
SECRET_NAME="science-portal-secrets"

echo -e "${GREEN}Creating Kubernetes secrets...${NC}"
echo "Namespace: ${NAMESPACE}"
echo "Secret Name: ${SECRET_NAME}"
echo ""

# Generate secure AUTH_SECRET
echo -e "${YELLOW}Generating AUTH_SECRET...${NC}"
AUTH_SECRET=$(openssl rand -base64 32)
echo -e "${GREEN}✓ Generated AUTH_SECRET${NC}"
echo ""

# Create namespace if it doesn't exist
echo -e "${YELLOW}Creating namespace if needed...${NC}"
kubectl create namespace "${NAMESPACE}" --dry-run=client -o yaml | kubectl apply -f -
echo -e "${GREEN}✓ Namespace ready${NC}"
echo ""

# Create or update secret
echo -e "${YELLOW}Creating secret...${NC}"
kubectl create secret generic "${SECRET_NAME}" \
  --namespace="${NAMESPACE}" \
  --from-literal=auth-secret="${AUTH_SECRET}" \
  --from-literal=oidc-client-secret="${OIDC_CLIENT_SECRET}" \
  --dry-run=client -o yaml | kubectl apply -f -

echo -e "${GREEN}✓ Secret created/updated successfully${NC}"
echo ""

# Verify
echo -e "${YELLOW}Verifying secret...${NC}"
kubectl get secret "${SECRET_NAME}" -n "${NAMESPACE}" -o jsonpath='{.data}' | jq 'keys'
echo ""

echo -e "${GREEN}✓ Setup complete!${NC}"
echo ""
echo -e "${YELLOW}IMPORTANT:${NC}"
echo "1. Store the AUTH_SECRET in a secure location (password manager, vault)"
echo "2. The secret is now available in the cluster"
echo "3. Helm will automatically use this secret"
echo ""
echo "To view the secret (use with caution):"
echo "  kubectl get secret ${SECRET_NAME} -n ${NAMESPACE} -o jsonpath='{.data.auth-secret}' | base64 -d"
echo ""
echo "To delete the secret (if needed):"
echo "  kubectl delete secret ${SECRET_NAME} -n ${NAMESPACE}"
