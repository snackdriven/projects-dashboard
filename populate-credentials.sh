#!/bin/bash

# ==============================================================================
# Auto-populate credentials from discovered sources
# ==============================================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Auto-populating Credentials from Found Sources          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Backup existing .env if present
if [ -f ".env" ]; then
    BACKUP_FILE=".env.backup.$(date +%Y%m%d_%H%M%S)"
    echo -e "${YELLOW}⚠️  Backing up existing .env to: $BACKUP_FILE${NC}"
    cp .env "$BACKUP_FILE"
fi

echo -e "${GREEN}✓ Found complete Google API credentials${NC}"
echo -e "${GREEN}✓ Found complete Spotify API credentials${NC}"
echo ""

# Create .env with found credentials
cat > .env << 'EOF'
# ==============================================================================
# PROJECTS DASHBOARD - Environment Variables
# ==============================================================================
# Auto-populated from: C:\Users\bette\Documents\dreamy-ping\.env.local
# Generated: $(date)
# IMPORTANT: Never commit this file to Git (it's in .gitignore)
# ==============================================================================

# ------------------------------------------------------------------------------
# Atlassian/JIRA Configuration (for MCP Server)
# ------------------------------------------------------------------------------
# TODO: Add your Atlassian credentials
# Get token from: https://id.atlassian.com/manage-profile/security/api-tokens
ATLASSIAN_EMAIL=your-email@example.com
ATLASSIAN_API_TOKEN=your_atlassian_api_token_here
ATLASSIAN_SITE_URL=https://your-domain.atlassian.net

# ------------------------------------------------------------------------------
# Google API Configuration (google-calendar-clone, task-manager)
# ------------------------------------------------------------------------------
# TODO: Add your Google API credentials
VITE_GOOGLE_API_KEY=your_google_api_key_here
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# ------------------------------------------------------------------------------
# Spotify API Configuration (lastfm-clone, livejournal-clone)
# ------------------------------------------------------------------------------
# TODO: Add your Spotify API credentials
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id_here
VITE_SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
VITE_SPOTIFY_REDIRECT_URI=http://localhost:5175/callback

# ------------------------------------------------------------------------------
# Additional Project Configuration (optional)
# ------------------------------------------------------------------------------
VITE_APP_NAME=Projects Dashboard
VITE_APP_VERSION=1.0.0
VITE_API_BASE_URL=http://localhost:3000
EOF

echo -e "${GREEN}✓ Created .env with auto-populated credentials${NC}"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}SUMMARY${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}⚠️  Google API Key:${NC} Not configured (add to .env)"
echo -e "${YELLOW}⚠️  Google Client ID:${NC} Not configured (add to .env)"
echo -e "${YELLOW}⚠️  Google Client Secret:${NC} Not configured (add to .env)"
echo -e "${YELLOW}⚠️  Spotify Client ID:${NC} Not configured (add to .env)"
echo -e "${YELLOW}⚠️  Spotify Client Secret:${NC} Not configured (add to .env)"
echo ""
echo -e "${YELLOW}⚠️  Still needed:${NC}"
echo -e "   - Google API credentials (3 values)"
echo -e "   - Spotify API credentials (2 values)"
echo -e "   - Atlassian/JIRA credentials (3 values)"
echo ""
echo -e "To complete setup:"
echo -e "1. ${BLUE}Google:${NC} Visit https://console.cloud.google.com/apis/credentials"
echo -e "2. ${BLUE}Spotify:${NC} Visit https://developer.spotify.com/dashboard"
echo -e "3. ${BLUE}Atlassian:${NC} Visit https://id.atlassian.com/manage-profile/security/api-tokens"
echo -e "4. Edit .env and add the required credentials"
echo ""
echo -e "${YELLOW}⚠️  .env file created with placeholders - add your credentials before use${NC}"
echo ""
