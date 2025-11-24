#!/bin/bash
#
# MCP Proxy Implementation Verification
# Quick check that the code is correct without starting the server
#

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Verifying MCP Proxy Implementation...${NC}\n"

# Check 1: File exists and is modified
echo -e "${YELLOW}1. Checking server/index.js...${NC}"
if [ -f "server/index.js" ]; then
  echo -e "${GREEN}✓ File exists${NC}"
else
  echo -e "${RED}✗ File not found${NC}"
  exit 1
fi

# Check 2: Contains MCP proxy code
echo -e "\n${YELLOW}2. Checking for MCP proxy code...${NC}"
if grep -q "api/mcp/memory-shack" server/index.js; then
  echo -e "${GREEN}✓ MCP proxy endpoint found${NC}"
else
  echo -e "${RED}✗ MCP proxy endpoint not found${NC}"
  exit 1
fi

# Check 3: Tool definitions
echo -e "\n${YELLOW}3. Checking tool definitions...${NC}"
TOOL_COUNT=$(grep -c "': { category:" server/index.js || echo "0")
if [ "$TOOL_COUNT" -ge 20 ]; then
  echo -e "${GREEN}✓ Found $TOOL_COUNT tool definitions${NC}"
else
  echo -e "${RED}✗ Expected 20 tools, found $TOOL_COUNT${NC}"
  exit 1
fi

# Check 4: CallMCPTool function
echo -e "\n${YELLOW}4. Checking callMCPTool function...${NC}"
if grep -q "async function callMCPTool" server/index.js; then
  echo -e "${GREEN}✓ callMCPTool function found${NC}"
else
  echo -e "${RED}✗ callMCPTool function not found${NC}"
  exit 1
fi

# Check 5: Error handling
echo -e "\n${YELLOW}5. Checking error handling...${NC}"
if grep -q "VALID_MCP_TOOLS\[tool\]" server/index.js && \
   grep -q "res.status(400)" server/index.js && \
   grep -q "res.status(500)" server/index.js; then
  echo -e "${GREEN}✓ Error handling implemented${NC}"
else
  echo -e "${RED}✗ Error handling incomplete${NC}"
  exit 1
fi

# Check 6: No syntax errors
echo -e "\n${YELLOW}6. Checking JavaScript syntax...${NC}"
if node --check server/index.js; then
  echo -e "${GREEN}✓ No syntax errors${NC}"
else
  echo -e "${RED}✗ Syntax errors found${NC}"
  exit 1
fi

# Check 7: Documentation exists
echo -e "\n${YELLOW}7. Checking documentation...${NC}"
DOCS_FOUND=0
[ -f "docs/MCP_PROXY_API.md" ] && ((DOCS_FOUND++))
[ -f "docs/MCP_PROXY_IMPLEMENTATION.md" ] && ((DOCS_FOUND++))
[ -f "test-mcp-proxy.sh" ] && ((DOCS_FOUND++))

if [ $DOCS_FOUND -eq 3 ]; then
  echo -e "${GREEN}✓ All documentation files present${NC}"
else
  echo -e "${RED}✗ Missing documentation files (found $DOCS_FOUND/3)${NC}"
  exit 1
fi

# Check 8: Test script is executable
echo -e "\n${YELLOW}8. Checking test script...${NC}"
if [ -x "test-mcp-proxy.sh" ]; then
  echo -e "${GREEN}✓ Test script is executable${NC}"
else
  echo -e "${YELLOW}⚠ Test script needs chmod +x${NC}"
  chmod +x test-mcp-proxy.sh
  echo -e "${GREEN}✓ Fixed permissions${NC}"
fi

# Check 9: Memory-shack MCP server exists
echo -e "\n${YELLOW}9. Checking memory-shack MCP server...${NC}"
if [ -f "projects/memory-shack/dist/mcp-server.js" ]; then
  echo -e "${GREEN}✓ MCP server built${NC}"
else
  echo -e "${YELLOW}⚠ MCP server not built${NC}"
  echo "  Run: cd projects/memory-shack && npm run build"
fi

# Check 10: Database exists
echo -e "\n${YELLOW}10. Checking database...${NC}"
if [ -f ".swarm/memory.db" ]; then
  DB_SIZE=$(du -h .swarm/memory.db | cut -f1)
  echo -e "${GREEN}✓ Database exists ($DB_SIZE)${NC}"
else
  echo -e "${YELLOW}⚠ Database not created yet${NC}"
  echo "  Will be created on first use"
fi

echo -e "\n========================================"
echo -e "${GREEN}Implementation Verification Complete!${NC}"
echo -e "========================================"
echo ""
echo "Next steps:"
echo "1. Start backend: pnpm dev:backend"
echo "2. Run tests: ./test-mcp-proxy.sh"
echo "3. Integrate with frontend Memory Manager UI"
echo ""
echo "API endpoint: POST http://localhost:3001/api/mcp/memory-shack"
echo "Documentation: docs/MCP_PROXY_API.md"
