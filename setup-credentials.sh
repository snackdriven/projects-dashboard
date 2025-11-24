#!/bin/bash

# ==============================================================================
# Projects Dashboard - Interactive Credential Setup Script
# ==============================================================================
# This script will guide you through setting up all required API credentials
# ==============================================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Projects Dashboard - Credential Setup Wizard            ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo ""

# Backup existing .env if it exists
if [ -f ".env" ]; then
    BACKUP_FILE=".env.backup.$(date +%Y%m%d_%H%M%S)"
    echo -e "${YELLOW}⚠️  Existing .env found. Creating backup: $BACKUP_FILE${NC}"
    cp .env "$BACKUP_FILE"
    echo ""
fi

# Function to prompt for input with validation
prompt_input() {
    local var_name=$1
    local prompt_text=$2
    local validation_regex=$3
    local example=$4
    local current_value=""

    # Check if variable already exists in .env
    if [ -f ".env" ]; then
        current_value=$(grep "^${var_name}=" .env 2>/dev/null | cut -d '=' -f2- || echo "")
    fi

    while true; do
        if [ -n "$current_value" ] && [ "$current_value" != "your_"* ]; then
            echo -e "${GREEN}✓${NC} $var_name already set: ${current_value:0:20}..."
            read -p "Keep this value? (y/n): " keep
            if [ "$keep" = "y" ] || [ "$keep" = "Y" ]; then
                echo "$current_value"
                return
            fi
        fi

        echo -e "${BLUE}$prompt_text${NC}"
        if [ -n "$example" ]; then
            echo -e "  ${YELLOW}Example: $example${NC}"
        fi
        read -p "> " value

        if [ -z "$value" ]; then
            echo -e "${RED}✗ Value cannot be empty${NC}"
            continue
        fi

        if [ -n "$validation_regex" ]; then
            if echo "$value" | grep -qE "$validation_regex"; then
                echo "$value"
                return
            else
                echo -e "${RED}✗ Invalid format. Please check your input.${NC}"
            fi
        else
            echo "$value"
            return
        fi
    done
}

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}1. Atlassian/JIRA Configuration${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "To get your Atlassian API token:"
echo "1. Visit: https://id.atlassian.com/manage-profile/security/api-tokens"
echo "2. Click 'Create API token'"
echo "3. Give it a name (e.g., 'Projects Dashboard')"
echo "4. Copy the token"
echo ""

ATLASSIAN_EMAIL=$(prompt_input "ATLASSIAN_EMAIL" "Enter your Atlassian email:" "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$" "user@example.com")
ATLASSIAN_API_TOKEN=$(prompt_input "ATLASSIAN_API_TOKEN" "Enter your Atlassian API token:" ".{20,}" "")
ATLASSIAN_SITE_URL=$(prompt_input "ATLASSIAN_SITE_URL" "Enter your Atlassian site URL:" "^https://[a-zA-Z0-9-]+\.atlassian\.net$" "https://your-domain.atlassian.net")

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}2. Google API Configuration${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "To set up Google API credentials:"
echo "1. Visit: https://console.cloud.google.com/apis/credentials"
echo "2. Create a new project or select an existing one"
echo "3. Click 'Enable APIs and Services'"
echo "4. Search for and enable 'Google Calendar API'"
echo "5. Go back to Credentials"
echo "6. Click 'Create Credentials' > 'API Key'"
echo "7. Click 'Create Credentials' > 'OAuth 2.0 Client ID'"
echo "   - Application type: Web application"
echo "   - Authorized JavaScript origins: http://localhost:3000"
echo "   - Authorized redirect URIs: http://localhost:3000"
echo ""

read -p "Press Enter when you're ready to enter Google credentials..."

VITE_GOOGLE_API_KEY=$(prompt_input "VITE_GOOGLE_API_KEY" "Enter your Google API Key:" "^AIza[0-9A-Za-z_-]{35}$" "AIzaSyD...")
VITE_GOOGLE_CLIENT_ID=$(prompt_input "VITE_GOOGLE_CLIENT_ID" "Enter your Google OAuth Client ID:" "\.apps\.googleusercontent\.com$" "123456789.apps.googleusercontent.com")

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}3. Spotify API Configuration${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "To set up Spotify API credentials:"
echo "1. Visit: https://developer.spotify.com/dashboard"
echo "2. Log in with your Spotify account"
echo "3. Click 'Create App'"
echo "4. Fill in the details:"
echo "   - App name: 'Projects Dashboard'"
echo "   - App description: 'Personal music history tracker'"
echo "   - Redirect URI: http://localhost:5175/callback"
echo "5. Click 'Settings' to view your Client ID and Client Secret"
echo ""

read -p "Press Enter when you're ready to enter Spotify credentials..."

VITE_SPOTIFY_CLIENT_ID=$(prompt_input "VITE_SPOTIFY_CLIENT_ID" "Enter your Spotify Client ID:" "^[a-f0-9]{32}$" "")
VITE_SPOTIFY_CLIENT_SECRET=$(prompt_input "VITE_SPOTIFY_CLIENT_SECRET" "Enter your Spotify Client Secret:" "^[a-f0-9]{32}$" "")
VITE_SPOTIFY_REDIRECT_URI=${VITE_SPOTIFY_REDIRECT_URI:-"http://localhost:5175/callback"}

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}4. Writing Configuration${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Create .env file
cat > .env << EOF
# ==============================================================================
# PROJECTS DASHBOARD - Environment Variables
# ==============================================================================
# Generated: $(date)
# IMPORTANT: Never commit this file to Git (it's in .gitignore)
# ==============================================================================

# ------------------------------------------------------------------------------
# Atlassian/JIRA Configuration (for MCP Server)
# ------------------------------------------------------------------------------
ATLASSIAN_EMAIL=$ATLASSIAN_EMAIL
ATLASSIAN_API_TOKEN=$ATLASSIAN_API_TOKEN
ATLASSIAN_SITE_URL=$ATLASSIAN_SITE_URL

# ------------------------------------------------------------------------------
# Google API Configuration (google-calendar-clone, task-manager)
# ------------------------------------------------------------------------------
VITE_GOOGLE_API_KEY=$VITE_GOOGLE_API_KEY
VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

# ------------------------------------------------------------------------------
# Spotify API Configuration (lastfm-clone, livejournal-clone)
# ------------------------------------------------------------------------------
VITE_SPOTIFY_CLIENT_ID=$VITE_SPOTIFY_CLIENT_ID
VITE_SPOTIFY_CLIENT_SECRET=$VITE_SPOTIFY_CLIENT_SECRET
VITE_SPOTIFY_REDIRECT_URI=$VITE_SPOTIFY_REDIRECT_URI

# ------------------------------------------------------------------------------
# Additional Project Configuration (optional)
# ------------------------------------------------------------------------------
VITE_APP_NAME=Projects Dashboard
VITE_APP_VERSION=1.0.0
VITE_API_BASE_URL=http://localhost:3000
EOF

echo -e "${GREEN}✓ Configuration written to .env${NC}"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}5. Verification${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Load environment variables
set -a
source .env
set +a

echo "Testing Atlassian connection..."
if command -v curl &> /dev/null; then
    RESPONSE=$(curl -s -w "\n%{http_code}" -u "$ATLASSIAN_EMAIL:$ATLASSIAN_API_TOKEN" \
        "$ATLASSIAN_SITE_URL/rest/api/3/myself" || echo "000")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓ Atlassian connection successful${NC}"
    else
        echo -e "${YELLOW}⚠️  Could not verify Atlassian connection (HTTP $HTTP_CODE)${NC}"
        echo "   Please verify your credentials manually"
    fi
else
    echo -e "${YELLOW}⚠️  curl not found. Skipping Atlassian verification${NC}"
fi

echo ""
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Restart Claude Code to load the new .env file"
echo "2. Run 'npm install' or 'pnpm install' if you haven't already"
echo "3. Start your projects with 'npm run dev' or 'pnpm dev'"
echo ""
echo -e "${BLUE}For detailed documentation, see: docs/CREDENTIAL_SETUP.md${NC}"
echo ""
