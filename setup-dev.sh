#!/bin/bash

# CodeState IDE Development Setup Script
# This script automatically sets up the development environment by cloning
# the required repositories and configuring local dependencies

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CODESTATE_LIBRARY_REPO="https://github.com/codestate-cs/code-state-library.git"
CODESTATE_UI_REPO="https://github.com/codestate-cs/codestate-ui.git"
CODESTATE_LIBRARY_DIR="../code-state-library"
CODESTATE_UI_DIR="../codestate-ui"

echo -e "${BLUE}🚀 Setting up CodeState IDE Development Environment${NC}"
echo "=================================================="

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

if ! command_exists git; then
    echo -e "${RED}❌ Git is not installed. Please install Git first.${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed. Please install Node.js and npm first.${NC}"
    exit 1
fi

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites are installed${NC}"

# Get the current directory (should be code-state-ide-v2)
CURRENT_DIR=$(pwd)
PARENT_DIR=$(dirname "$CURRENT_DIR")

echo -e "${YELLOW}📁 Current directory: $CURRENT_DIR${NC}"
echo -e "${YELLOW}📁 Parent directory: $PARENT_DIR${NC}"

# Clone code-state-library if it doesn't exist
echo -e "${YELLOW}📦 Setting up code-state-library...${NC}"
if [ ! -d "$CODESTATE_LIBRARY_DIR" ]; then
    echo -e "${BLUE}🔄 Cloning code-state-library repository...${NC}"
    cd "$PARENT_DIR"
    git clone "$CODESTATE_LIBRARY_REPO" "$(basename "$CODESTATE_LIBRARY_DIR")"
    echo -e "${GREEN}✅ code-state-library cloned successfully${NC}"
else
    echo -e "${GREEN}✅ code-state-library already exists${NC}"
fi

# Clone codestate-ui if it doesn't exist
echo -e "${YELLOW}🎨 Setting up codestate-ui...${NC}"
if [ ! -d "$CODESTATE_UI_DIR" ]; then
    echo -e "${BLUE}🔄 Cloning codestate-ui repository...${NC}"
    cd "$PARENT_DIR"
    git clone "$CODESTATE_UI_REPO" "$(basename "$CODESTATE_UI_DIR")"
    echo -e "${GREEN}✅ codestate-ui cloned successfully${NC}"
else
    echo -e "${GREEN}✅ codestate-ui already exists${NC}"
fi

# Return to the main project directory
cd "$CURRENT_DIR"

# Install dependencies for code-state-library
echo -e "${YELLOW}📦 Installing dependencies for code-state-library...${NC}"
cd "$CODESTATE_LIBRARY_DIR"
if [ -f "package.json" ]; then
    npm install
    echo -e "${GREEN}✅ code-state-library dependencies installed${NC}"
else
    echo -e "${RED}❌ package.json not found in code-state-library${NC}"
    exit 1
fi

# Build code-state-library
echo -e "${YELLOW}🔨 Building code-state-library...${NC}"
# Clean previous build first
rm -rf packages/core/dist
npm run build:core
echo -e "${GREEN}✅ code-state-library built successfully${NC}"

# Return to the main project directory
cd "$CURRENT_DIR"

# Install dependencies for codestate-ui
echo -e "${YELLOW}📦 Installing dependencies for codestate-ui...${NC}"
cd "$CODESTATE_UI_DIR"
if [ -f "package.json" ]; then
    npm install
    echo -e "${GREEN}✅ codestate-ui dependencies installed${NC}"
else
    echo -e "${RED}❌ package.json not found in codestate-ui${NC}"
    exit 1
fi

# Build codestate-ui
echo -e "${YELLOW}🔨 Building codestate-ui...${NC}"
# Clean previous build first
rm -rf dist
npm run build
echo -e "${GREEN}✅ codestate-ui built successfully${NC}"

# Return to the main project directory
cd "$CURRENT_DIR"

# Install dependencies for the main project
echo -e "${YELLOW}📦 Installing dependencies for code-state-ide-v2...${NC}"
npm install
echo -e "${GREEN}✅ code-state-ide-v2 dependencies installed${NC}"

# Create symlinks for local development (if needed)
echo -e "${YELLOW}🔗 Setting up local development links...${NC}"

# Check if we need to create symlinks in node_modules
if [ -d "node_modules/@codestate" ]; then
    echo -e "${BLUE}🔄 Updating local package links...${NC}"
    
    # Remove existing packages
    rm -rf node_modules/@codestate/core
    rm -rf node_modules/@codestate/ui
    
    # Create symlinks to local repositories
    mkdir -p node_modules/@codestate
    ln -sf "$(realpath "$CODESTATE_LIBRARY_DIR/packages/core")" node_modules/@codestate/core
    ln -sf "$(realpath "$CODESTATE_UI_DIR")" node_modules/@codestate/ui
    
    echo -e "${GREEN}✅ Local package links created${NC}"
else
    echo -e "${YELLOW}⚠️  @codestate packages not found in node_modules${NC}"
fi

# Build the main project
echo -e "${YELLOW}🔨 Building code-state-ide-v2...${NC}"
npm run compile
echo -e "${GREEN}✅ code-state-ide-v2 built successfully${NC}"

echo ""
echo -e "${GREEN}🎉 Development environment setup complete!${NC}"
echo "=================================================="
echo -e "${BLUE}📁 Repository structure:${NC}"
echo "  $PARENT_DIR/"
echo "  ├── code-state-ide-v2/     (main project)"
echo "  ├── code-state-library/    (core library)"
echo "  └── codestate-ui/          (UI components)"
echo ""
echo -e "${BLUE}🚀 Next steps:${NC}"
echo "  1. Run 'npm run watch' to start development mode"
echo "  2. Press F5 in VS Code to test the extension"
echo "  3. Check DEVELOPMENT.md for detailed instructions"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"