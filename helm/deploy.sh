#!/bin/bash

# Science Portal Deployment Script for DigitalOcean Kubernetes
# Usage: ./deploy.sh [environment] [options]
# Example: ./deploy.sh production --dry-run

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CHART_PATH="./science-portal"
NAMESPACE="science-portal"
RELEASE_NAME="science-portal"

# Functions
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_usage() {
    cat << EOF
Science Portal Deployment Script

Usage: $0 [ENVIRONMENT] [OPTIONS]

ENVIRONMENT:
    production          Deploy with production values (values-production.yaml)
    staging             Deploy with staging values (values-staging.yaml)
    digitalocean        Deploy with DigitalOcean defaults (values-digitalocean.yaml)
    custom              Specify custom values file with --values flag

OPTIONS:
    --dry-run           Simulate deployment without applying changes
    --values FILE       Use custom values file
    --set KEY=VALUE     Set additional values (can be used multiple times)
    --version VERSION   Deploy specific chart version
    --wait              Wait for deployment to complete
    --timeout DURATION  Timeout for deployment (default: 5m)
    --debug             Enable debug output
    --help              Show this help message

EXAMPLES:
    # Deploy to production
    $0 production --wait

    # Dry run for staging
    $0 staging --dry-run

    # Deploy with custom values
    $0 custom --values my-values.yaml

    # Deploy with override
    $0 production --set image.tag=1.2.3

    # Debug deployment
    $0 production --debug --dry-run

PREREQUISITES:
    - kubectl configured for your DOKS cluster
    - Helm 3 installed
    - Required secrets created (science-portal-secrets)
    - NGINX Ingress Controller installed
    - cert-manager installed

EOF
}

check_prerequisites() {
    print_info "Checking prerequisites..."

    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl not found. Please install kubectl."
        exit 1
    fi

    # Check Helm
    if ! command -v helm &> /dev/null; then
        print_error "helm not found. Please install Helm 3."
        exit 1
    fi

    # Check Helm version
    HELM_VERSION=$(helm version --short | grep -oE 'v[0-9]+' | cut -c2-)
    if [ "$HELM_VERSION" -lt 3 ]; then
        print_error "Helm 3 or higher is required. Found version: $HELM_VERSION"
        exit 1
    fi

    # Check kubectl connection
    if ! kubectl cluster-info &> /dev/null; then
        print_error "Cannot connect to Kubernetes cluster. Check your kubeconfig."
        exit 1
    fi

    print_success "All prerequisites met"
}

check_secrets() {
    print_info "Checking required secrets..."

    if ! kubectl get secret science-portal-secrets -n "$NAMESPACE" &> /dev/null; then
        print_warning "Secret 'science-portal-secrets' not found in namespace '$NAMESPACE'"
        print_info "Create the secret with:"
        echo "  kubectl create secret generic science-portal-secrets \\"
        echo "    --from-literal=auth-secret=\$(openssl rand -base64 32) \\"
        echo "    --from-literal=oidc-client-secret=YOUR_SECRET \\"
        echo "    --namespace $NAMESPACE"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        print_success "Required secrets found"
    fi
}

validate_chart() {
    print_info "Validating Helm chart..."

    if ! helm lint "$CHART_PATH" $VALUES_FLAG; then
        print_error "Chart validation failed"
        exit 1
    fi

    print_success "Chart validation passed"
}

# Parse arguments
ENVIRONMENT=""
DRY_RUN=""
VALUES_FILE=""
EXTRA_ARGS=""
WAIT_FLAG=""
DEBUG_FLAG=""

while [[ $# -gt 0 ]]; do
    case $1 in
        production|staging|digitalocean|custom)
            ENVIRONMENT=$1
            shift
            ;;
        --dry-run)
            DRY_RUN="--dry-run"
            shift
            ;;
        --values)
            VALUES_FILE="$2"
            shift 2
            ;;
        --set)
            EXTRA_ARGS="$EXTRA_ARGS --set $2"
            shift 2
            ;;
        --version)
            EXTRA_ARGS="$EXTRA_ARGS --version $2"
            shift 2
            ;;
        --wait)
            WAIT_FLAG="--wait"
            shift
            ;;
        --timeout)
            EXTRA_ARGS="$EXTRA_ARGS --timeout $2"
            shift 2
            ;;
        --debug)
            DEBUG_FLAG="--debug"
            shift
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate environment
if [ -z "$ENVIRONMENT" ]; then
    print_error "Environment not specified"
    show_usage
    exit 1
fi

# Set values file based on environment
VALUES_FLAG=""
if [ "$ENVIRONMENT" = "custom" ]; then
    if [ -z "$VALUES_FILE" ]; then
        print_error "Custom environment requires --values flag"
        exit 1
    fi
    VALUES_FLAG="-f $VALUES_FILE"
else
    VALUES_FILE="${CHART_PATH}/values-${ENVIRONMENT}.yaml"
    if [ ! -f "$VALUES_FILE" ]; then
        print_warning "Values file not found: $VALUES_FILE"
        print_info "Using default values with environment: $ENVIRONMENT"
        VALUES_FLAG=""
    else
        VALUES_FLAG="-f $VALUES_FILE"
    fi
fi

# Print deployment info
echo ""
print_info "======================================="
print_info "Science Portal Deployment"
print_info "======================================="
print_info "Environment:  $ENVIRONMENT"
print_info "Namespace:    $NAMESPACE"
print_info "Release:      $RELEASE_NAME"
print_info "Chart:        $CHART_PATH"
if [ -n "$VALUES_FILE" ] && [ -f "$VALUES_FILE" ]; then
    print_info "Values:       $VALUES_FILE"
fi
if [ -n "$DRY_RUN" ]; then
    print_warning "Dry run mode enabled"
fi
print_info "======================================="
echo ""

# Run checks
check_prerequisites

if [ -z "$DRY_RUN" ]; then
    # Create namespace if it doesn't exist
    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        print_info "Creating namespace: $NAMESPACE"
        kubectl create namespace "$NAMESPACE"
    fi

    check_secrets
fi

validate_chart

# Deploy
print_info "Deploying Science Portal..."

HELM_CMD="helm upgrade --install $RELEASE_NAME $CHART_PATH \
    --namespace $NAMESPACE \
    --create-namespace \
    $VALUES_FLAG \
    $EXTRA_ARGS \
    $WAIT_FLAG \
    $DRY_RUN \
    $DEBUG_FLAG"

print_info "Running: $HELM_CMD"
echo ""

if eval "$HELM_CMD"; then
    echo ""
    print_success "Deployment completed successfully!"

    if [ -z "$DRY_RUN" ]; then
        echo ""
        print_info "Deployment status:"
        kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/name=science-portal

        echo ""
        print_info "To check logs:"
        echo "  kubectl logs -n $NAMESPACE -l app.kubernetes.io/name=science-portal --tail=100 -f"

        echo ""
        print_info "To check deployment status:"
        echo "  kubectl get all -n $NAMESPACE"

        echo ""
        print_info "To check ingress:"
        echo "  kubectl get ingress -n $NAMESPACE"
    fi
else
    print_error "Deployment failed!"
    exit 1
fi
