#!/bin/bash

# Script to switch between development and production package.json configurations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

usage() {
    echo "Usage: $0 [dev|prod]"
    echo ""
    echo "  dev   - Switch to development configuration (local dependencies)"
    echo "  prod  - Switch to production configuration (npm packages)"
    echo ""
    echo "Examples:"
    echo "  $0 dev   # Use local repositories for development"
    echo "  $0 prod  # Use published npm packages for production"
}

if [ $# -eq 0 ]; then
    echo -e "${RED}❌ Error: Please specify 'dev' or 'prod'${NC}"
    echo ""
    usage
    exit 1
fi

MODE=$1

case $MODE in
    "dev")
        echo -e "${BLUE}🔄 Switching to development configuration...${NC}"
        cp package.dev.json package.json
        echo -e "${GREEN}✅ Switched to development configuration${NC}"
        echo -e "${YELLOW}📦 Dependencies will use local repositories:${NC}"
        echo "   - @codestate/core: file:../code-state-library/packages/core"
        echo "   - @codestate/ui: file:../codestate-ui"
        echo ""
        echo -e "${BLUE}💡 Next steps:${NC}"
        echo "   1. Run 'npm install' to install local dependencies"
        echo "   2. Run 'npm run watch' to start development"
        ;;
    "prod")
        echo -e "${BLUE}🔄 Switching to production configuration...${NC}"
        cp package.prod.json package.json
        echo -e "${GREEN}✅ Switched to production configuration${NC}"
        echo -e "${YELLOW}📦 Dependencies will use published npm packages:${NC}"
        echo "   - @codestate/core: ^1.0.9"
        echo "   - @codestate/ui: ^1.0.2"
        echo ""
        echo -e "${BLUE}💡 Next steps:${NC}"
        echo "   1. Run 'npm install' to install published packages"
        echo "   2. Run 'npm run package' to build for production"
        ;;
    *)
        echo -e "${RED}❌ Error: Invalid mode '$MODE'${NC}"
        echo ""
        usage
        exit 1
        ;;
esac