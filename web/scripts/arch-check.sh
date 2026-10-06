#!/bin/bash
#
# Architecture Debt Check Script
# 
# Verifies that backend-specific code does not leak outside adapter boundaries.
# This script fails fast if any architectural violations are detected.
# 
# Usage:
#   ./scripts/arch-check.sh
#   
# Exit codes:
#   0 - No violations found
#   1 - Architecture violations detected
# 
# Violations checked:
# 1. "directus" keyword outside src/lib/api/adapters
# 2. "axios" imports outside src/lib/api/client.js
# 3. "_raw" fields anywhere in src/ (backend leak)
# 4. Backend filters (_eq, _and, _or) outside adapters
# 
# Add this script to your CI pipeline to prevent architectural debt.
#

set -e

VIOLATIONS=0
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔒 Architecture Debt Check"
echo "================================"

# Check 1: "directus" outside adapters
echo -n "Checking for 'directus' leaks outside adapters... "
DIRECTUS_LEAKS=$(grep -r "directus" src/ \
  --exclude-dir=api/adapters \
  --exclude-dir=node_modules \
  --exclude-dir=dist \
  --exclude-dir=build \
  --include="*.js" \
  --include="*.jsx" \
  --include="*.ts" \
  --include="*.tsx" \
  2>/dev/null || true)

if [ -n "$DIRECTUS_LEAKS" ]; then
  echo -e "${RED}FAIL${NC}"
  echo "❌ Found 'directus' references outside adapter directory:"
  echo "$DIRECTUS_LEAKS"
  VIOLATIONS=$((VIOLATIONS + 1))
else
  echo -e "${GREEN}OK${NC}"
fi

# Check 2: "axios" imports outside client.js
echo -n "Checking for 'axios' imports outside client.js... "
AXIOS_LEAKS=$(grep -r "import.*axios" src/ \
  --exclude=client.js \
  --exclude-dir=adapters \
  --exclude-dir=node_modules \
  --exclude-dir=dist \
  --include="*.js" \
  --include="*.jsx" \
  --include="*.ts" \
  --include="*.tsx" \
  2>/dev/null || true)

if [ -n "$AXIOS_LEAKS" ]; then
  echo -e "${RED}FAIL${NC}"
  echo "❌ Found 'axios' imports outside client.js:"
  echo "$AXIOS_LEAKS"
  VIOLATIONS=$((VIOLATIONS + 1))
else
  echo -e "${GREEN}OK${NC}"
fi

# Check 3: "_raw" fields in source code
echo -n "Checking for '_raw' backend fields... "
RAW_LEAKS=$(grep -r "_raw" src/ \
  --exclude-dir=node_modules \
  --exclude-dir=dist \
  --include="*.js" \
  --include="*.jsx" \
  --include="*.ts" \
  --include="*.tsx" \
  2>/dev/null || true)

if [ -n "$RAW_LEAKS" ]; then
  echo -e "${RED}FAIL${NC}"
  echo "❌ Found '_raw' backend fields in source:"
  echo "$RAW_LEAKS"
  VIOLATIONS=$((VIOLATIONS + 1))
else
  echo -e "${GREEN}OK${NC}"
fi

# Check 4: Backend filters (_eq, _and, _or) outside adapters
echo -n "Checking for backend filters outside adapters... "
FILTER_LEAKS=$(grep -rE "(_eq|_and|_or|_neq|_in|_nin)" src/ \
  --exclude-dir=api/adapters \
  --exclude-dir=node_modules \
  --exclude-dir=dist \
  --include="*.js" \
  --include="*.jsx" \
  --include="*.ts" \
  --include="*.tsx" \
  2>/dev/null || true)

if [ -n "$FILTER_LEAKS" ]; then
  echo -e "${RED}FAIL${NC}"
  echo "❌ Found backend-specific filters outside adapters:"
  echo "$FILTER_LEAKS"
  VIOLATIONS=$((VIOLATIONS + 1))
else
  echo -e "${GREEN}OK${NC}"
fi

# Summary
echo "================================"
if [ $VIOLATIONS -eq 0 ]; then
  echo -e "${GREEN}✅ All checks passed! Architecture is clean.${NC}"
  exit 0
else
  echo -e "${RED}❌ Found $VIOLATIONS violation(s). Fix architecture leaks.${NC}"
  echo ""
  echo "💡 Tips:"
  echo "  - Backend code must stay in src/lib/api/adapters"
  echo "  - Use src/lib/api/facade for all API calls"
  echo "  - Use normalizers from src/lib/api/normalizers"
  echo "  - Never expose _raw, _eq, _and, or other backend-specific details"
  exit 1
fi
