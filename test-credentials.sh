#!/bin/bash

# ==============================================================================
# Projects Dashboard - Credential Testing Script
# ==============================================================================
# Tests all API credentials to verify they're working correctly
# ==============================================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Projects Dashboard - Credential Testing                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${RED}✗ .env file not found!${NC}"
    echo "Please run ./setup-credentials.sh first"
    exit 1
fi

# Load environment variables
set -a
source .env
set +a

PASSED=0
FAILED=0
WARNINGS=0

# Function to test and report
test_api() {
    local name=$1
    local test_command=$2
    local success_pattern=$3

    echo -e "${BLUE}Testing $name...${NC}"

    if ! command -v curl &> /dev/null; then
        echo -e "${YELLOW}⚠️  curl not found. Skipping $name test${NC}"
        ((WARNINGS++))
        return
    fi

    result=$(eval "$test_command" 2>&1)
    exit_code=$?

    if [ $exit_code -eq 0 ] && echo "$result" | grep -q "$success_pattern"; then
        echo -e "${GREEN}✓ $name: Connection successful${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ $name: Connection failed${NC}"
        echo "   Error: $result"
        ((FAILED++))
    fi
    echo ""
}

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Testing API Credentials${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Test Atlassian/JIRA
if [ -n "$ATLASSIAN_EMAIL" ] && [ -n "$ATLASSIAN_API_TOKEN" ] && [ -n "$ATLASSIAN_SITE_URL" ]; then
    test_api "Atlassian/JIRA" \
        "curl -s -u '$ATLASSIAN_EMAIL:$ATLASSIAN_API_TOKEN' '$ATLASSIAN_SITE_URL/rest/api/3/myself'" \
        '"accountId"'
else
    echo -e "${YELLOW}⚠️  Atlassian credentials not configured${NC}"
    echo ""
    ((WARNINGS++))
fi

# Test Google API Key
if [ -n "$VITE_GOOGLE_API_KEY" ]; then
    # Test if API key is valid (not testing calendar access specifically)
    test_api "Google API Key" \
        "curl -s 'https://www.googleapis.com/calendar/v3/users/me/calendarList?key=$VITE_GOOGLE_API_KEY'" \
        '"error".*"code".*40[0-9]|"items"'
else
    echo -e "${YELLOW}⚠️  Google API Key not configured${NC}"
    echo ""
    ((WARNINGS++))
fi

# Test Spotify Client Credentials
if [ -n "$VITE_SPOTIFY_CLIENT_ID" ] && [ -n "$VITE_SPOTIFY_CLIENT_SECRET" ]; then
    test_api "Spotify API" \
        "curl -s -X POST 'https://accounts.spotify.com/api/token' \
            -H 'Content-Type: application/x-www-form-urlencoded' \
            -d 'grant_type=client_credentials' \
            -u '$VITE_SPOTIFY_CLIENT_ID:$VITE_SPOTIFY_CLIENT_SECRET'" \
        '"access_token"'
else
    echo -e "${YELLOW}⚠️  Spotify credentials not configured${NC}"
    echo ""
    ((WARNINGS++))
fi

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Test Summary${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${GREEN}Passed:${NC}   $PASSED"
echo -e "  ${RED}Failed:${NC}   $FAILED"
echo -e "  ${YELLOW}Warnings:${NC} $WARNINGS"
echo ""

if [ $FAILED -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed! Your credentials are configured correctly.${NC}"
    exit 0
elif [ $FAILED -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Some credentials are not configured, but all configured ones work.${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Please check your credentials.${NC}"
    echo ""
    echo "Troubleshooting steps:"
    echo "1. Verify credentials in .env file"
    echo "2. Check that URLs don't have trailing slashes"
    echo "3. Ensure API tokens haven't expired"
    echo "4. See docs/CREDENTIAL_SETUP.md for detailed help"
    exit 1
fi
