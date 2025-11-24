#!/bin/bash
#
# MCP Proxy API Test Suite
# Tests all major endpoints and operations
#

set -e  # Exit on error

BASE_URL="http://localhost:3001/api/mcp/memory-shack"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if server is running
echo -e "${YELLOW}Checking if server is running...${NC}"
if ! curl -s "$BASE_URL/tools" > /dev/null 2>&1; then
  echo -e "${RED}Error: Server not running on port 3001${NC}"
  echo "Start it with: pnpm dev:backend"
  exit 1
fi
echo -e "${GREEN}✓ Server is running${NC}\n"

# Helper function for tests
test_api() {
  local name="$1"
  local tool="$2"
  local args="$3"

  echo -e "${YELLOW}Test: $name${NC}"

  local response=$(curl -s -X POST "$BASE_URL" \
    -H "Content-Type: application/json" \
    -d "{\"tool\":\"$tool\",\"arguments\":$args}")

  if echo "$response" | jq -e '.success' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Passed${NC}"
    echo "$response" | jq '.data' 2>/dev/null || echo "$response"
    return 0
  else
    echo -e "${RED}✗ Failed${NC}"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
    return 1
  fi
  echo ""
}

# Track test results
PASSED=0
FAILED=0

# Test 1: List available tools
echo -e "${YELLOW}Test: List available tools${NC}"
TOOLS_COUNT=$(curl -s "$BASE_URL/tools" | jq '.totalCount')
if [ "$TOOLS_COUNT" -eq 20 ]; then
  echo -e "${GREEN}✓ Passed - Found $TOOLS_COUNT tools${NC}\n"
  ((PASSED++))
else
  echo -e "${RED}✗ Failed - Expected 20 tools, got $TOOLS_COUNT${NC}\n"
  ((FAILED++))
fi

# Test 2: Store timeline event
echo -e "${YELLOW}Test: Store timeline event${NC}"
TIMESTAMP=$(date +%s000)
EVENT_RESPONSE=$(curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"tool\": \"store_timeline_event\",
    \"arguments\": {
      \"timestamp\": $TIMESTAMP,
      \"type\": \"test_event\",
      \"title\": \"MCP Proxy Test Event\",
      \"metadata\": {\"test\": true, \"source\": \"test-script\"},
      \"namespace\": \"testing\"
    }
  }")

if echo "$EVENT_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  EVENT_ID=$(echo "$EVENT_RESPONSE" | jq -r '.data.event_id')
  echo -e "${GREEN}✓ Passed - Event ID: $EVENT_ID${NC}\n"
  ((PASSED++))
else
  echo -e "${RED}✗ Failed${NC}"
  echo "$EVENT_RESPONSE" | jq '.'
  ((FAILED++))
  EVENT_ID=""
fi

# Test 3: Get timeline for today
echo -e "${YELLOW}Test: Get timeline${NC}"
TODAY=$(date +%Y-%m-%d)
TIMELINE_RESPONSE=$(curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"tool\": \"get_timeline\",
    \"arguments\": {
      \"date\": \"$TODAY\"
    }
  }")

if echo "$TIMELINE_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  EVENT_COUNT=$(echo "$TIMELINE_RESPONSE" | jq '.data.stats.total')
  echo -e "${GREEN}✓ Passed - Found $EVENT_COUNT events for $TODAY${NC}\n"
  ((PASSED++))
else
  echo -e "${RED}✗ Failed${NC}"
  echo "$TIMELINE_RESPONSE" | jq '.'
  ((FAILED++))
fi

# Test 4: Get specific event (if we created one)
if [ -n "$EVENT_ID" ]; then
  echo -e "${YELLOW}Test: Get specific event${NC}"
  GET_EVENT_RESPONSE=$(curl -s -X POST "$BASE_URL" \
    -H "Content-Type: application/json" \
    -d "{
      \"tool\": \"get_event\",
      \"arguments\": {
        \"event_id\": \"$EVENT_ID\"
      }
    }")

  if echo "$GET_EVENT_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    EVENT_TITLE=$(echo "$GET_EVENT_RESPONSE" | jq -r '.data.title')
    echo -e "${GREEN}✓ Passed - Retrieved: $EVENT_TITLE${NC}\n"
    ((PASSED++))
  else
    echo -e "${RED}✗ Failed${NC}"
    echo "$GET_EVENT_RESPONSE" | jq '.'
    ((FAILED++))
  fi
fi

# Test 5: Update event (if we created one)
if [ -n "$EVENT_ID" ]; then
  echo -e "${YELLOW}Test: Update event${NC}"
  UPDATE_RESPONSE=$(curl -s -X POST "$BASE_URL" \
    -H "Content-Type: application/json" \
    -d "{
      \"tool\": \"update_event\",
      \"arguments\": {
        \"event_id\": \"$EVENT_ID\",
        \"updates\": {
          \"title\": \"Updated Test Event\",
          \"metadata\": {\"test\": true, \"updated\": true}
        }
      }
    }")

  if echo "$UPDATE_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Passed${NC}\n"
    ((PASSED++))
  else
    echo -e "${RED}✗ Failed${NC}"
    echo "$UPDATE_RESPONSE" | jq '.'
    ((FAILED++))
  fi
fi

# Test 6: Store memory (KV)
echo -e "${YELLOW}Test: Store memory${NC}"
MEMORY_RESPONSE=$(curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"tool\": \"store_memory\",
    \"arguments\": {
      \"key\": \"test:api:timestamp\",
      \"value\": $(date +%s),
      \"namespace\": \"testing\",
      \"ttl\": 3600
    }
  }")

if echo "$MEMORY_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Passed${NC}\n"
  ((PASSED++))
else
  echo -e "${RED}✗ Failed${NC}"
  echo "$MEMORY_RESPONSE" | jq '.'
  ((FAILED++))
fi

# Test 7: Retrieve memory
echo -e "${YELLOW}Test: Retrieve memory${NC}"
RETRIEVE_RESPONSE=$(curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"tool\": \"retrieve_memory\",
    \"arguments\": {
      \"key\": \"test:api:timestamp\"
    }
  }")

if echo "$RETRIEVE_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  MEMORY_VALUE=$(echo "$RETRIEVE_RESPONSE" | jq '.data.value')
  echo -e "${GREEN}✓ Passed - Value: $MEMORY_VALUE${NC}\n"
  ((PASSED++))
else
  echo -e "${RED}✗ Failed${NC}"
  echo "$RETRIEVE_RESPONSE" | jq '.'
  ((FAILED++))
fi

# Test 8: List memories
echo -e "${YELLOW}Test: List memories${NC}"
LIST_RESPONSE=$(curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"tool\": \"list_memories\",
    \"arguments\": {
      \"namespace\": \"testing\"
    }
  }")

if echo "$LIST_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  MEMORY_COUNT=$(echo "$LIST_RESPONSE" | jq '.data.count')
  echo -e "${GREEN}✓ Passed - Found $MEMORY_COUNT memories in 'testing' namespace${NC}\n"
  ((PASSED++))
else
  echo -e "${RED}✗ Failed${NC}"
  echo "$LIST_RESPONSE" | jq '.'
  ((FAILED++))
fi

# Test 9: Get memory stats
echo -e "${YELLOW}Test: Get memory stats${NC}"
STATS_RESPONSE=$(curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"tool\": \"get_memory_stats\",
    \"arguments\": {}
  }")

if echo "$STATS_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  TOTAL_MEMORIES=$(echo "$STATS_RESPONSE" | jq '.data.total')
  echo -e "${GREEN}✓ Passed - Total memories: $TOTAL_MEMORIES${NC}\n"
  ((PASSED++))
else
  echo -e "${RED}✗ Failed${NC}"
  echo "$STATS_RESPONSE" | jq '.'
  ((FAILED++))
fi

# Test 10: Delete memory
echo -e "${YELLOW}Test: Delete memory${NC}"
DELETE_MEM_RESPONSE=$(curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"tool\": \"delete_memory\",
    \"arguments\": {
      \"key\": \"test:api:timestamp\"
    }
  }")

if echo "$DELETE_MEM_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Passed${NC}\n"
  ((PASSED++))
else
  echo -e "${RED}✗ Failed${NC}"
  echo "$DELETE_MEM_RESPONSE" | jq '.'
  ((FAILED++))
fi

# Test 11: Delete event (cleanup)
if [ -n "$EVENT_ID" ]; then
  echo -e "${YELLOW}Test: Delete event (cleanup)${NC}"
  DELETE_EVENT_RESPONSE=$(curl -s -X POST "$BASE_URL" \
    -H "Content-Type: application/json" \
    -d "{
      \"tool\": \"delete_event\",
      \"arguments\": {
        \"event_id\": \"$EVENT_ID\"
      }
    }")

  if echo "$DELETE_EVENT_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Passed${NC}\n"
    ((PASSED++))
  else
    echo -e "${RED}✗ Failed${NC}"
    echo "$DELETE_EVENT_RESPONSE" | jq '.'
    ((FAILED++))
  fi
fi

# Test 12: Error handling - Invalid tool
echo -e "${YELLOW}Test: Error handling (invalid tool)${NC}"
ERROR_RESPONSE=$(curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"tool\": \"invalid_tool_name\",
    \"arguments\": {}
  }")

if echo "$ERROR_RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Passed - Error handled correctly${NC}\n"
  ((PASSED++))
else
  echo -e "${RED}✗ Failed - Should return error${NC}"
  echo "$ERROR_RESPONSE" | jq '.'
  ((FAILED++))
fi

# Test 13: Error handling - Missing tool parameter
echo -e "${YELLOW}Test: Error handling (missing tool)${NC}"
ERROR_RESPONSE2=$(curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"arguments\": {}
  }")

if echo "$ERROR_RESPONSE2" | jq -e '.error' > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Passed - Error handled correctly${NC}\n"
  ((PASSED++))
else
  echo -e "${RED}✗ Failed - Should return error${NC}"
  echo "$ERROR_RESPONSE2" | jq '.'
  ((FAILED++))
fi

# Summary
echo "========================================"
echo "Test Results:"
echo "========================================"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "========================================"

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}Some tests failed${NC}"
  exit 1
fi
