# Credential Setup Guide

Complete guide for setting up all API credentials needed for the Projects Dashboard monorepo.

## Quick Start

Run the interactive setup script:

```bash
./setup-credentials.sh
```

This will guide you through collecting all credentials and automatically configure your `.env` file.

---

## Manual Setup

If you prefer to set up credentials manually, follow these detailed instructions:

### 1. Atlassian/JIRA Setup

**Required for:** MCP Server integration, JIRA ticket access

#### Steps:

1. **Get API Token:**
   - Visit: https://id.atlassian.com/manage-profile/security/api-tokens
   - Click "Create API token"
   - Name it "Projects Dashboard" (or any name you prefer)
   - Copy the token immediately (you won't be able to see it again)

2. **Find Your Site URL:**
   - Format: `https://your-domain.atlassian.net`
   - You can find this in your browser when logged into Jira
   - Example: `https://mycompany.atlassian.net`

3. **Add to .env:**
   ```bash
   ATLASSIAN_EMAIL=your-email@example.com
   ATLASSIAN_API_TOKEN=your_token_here
   ATLASSIAN_SITE_URL=https://your-domain.atlassian.net
   ```

#### Permissions Required:
- Read access to Jira projects
- View issues
- View comments

#### Testing:
```bash
curl -u "your-email:your-token" \
  "https://your-domain.atlassian.net/rest/api/3/myself"
```

---

### 2. Google API Setup

**Required for:** google-calendar-clone, task-manager projects

#### Steps:

1. **Create/Select Project:**
   - Visit: https://console.cloud.google.com/
   - Create a new project or select existing
   - Name: "Projects Dashboard" (or your preference)

2. **Enable Required APIs:**
   - Go to: https://console.cloud.google.com/apis/library
   - Search for and enable:
     - Google Calendar API
     - (Add others as needed)

3. **Create API Key:**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Click "Create Credentials" > "API Key"
   - (Recommended) Click "Restrict Key":
     - Application restrictions: HTTP referrers
     - Add: `http://localhost:*` and `http://127.0.0.1:*`
     - API restrictions: Restrict to Google Calendar API
   - Copy the API Key

4. **Create OAuth 2.0 Client ID:**
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: "Web application"
   - Name: "Projects Dashboard"
   - Authorized JavaScript origins:
     - `http://localhost:3000`
     - `http://localhost:5173`
     - (Add other ports your projects use)
   - Authorized redirect URIs:
     - `http://localhost:3000`
     - `http://localhost:5173`
   - Copy the Client ID

5. **Add to .env:**
   ```bash
   VITE_GOOGLE_API_KEY=AIzaSyD...your-key-here
   VITE_GOOGLE_CLIENT_ID=123456789.apps.googleusercontent.com
   ```

#### Testing:
```bash
# Test API Key
curl "https://www.googleapis.com/calendar/v3/users/me/calendarList?key=$VITE_GOOGLE_API_KEY"
```

---

### 3. Spotify API Setup

**Required for:** lastfm-clone, livejournal-clone projects

#### Steps:

1. **Create Spotify App:**
   - Visit: https://developer.spotify.com/dashboard
   - Log in with your Spotify account
   - Click "Create App"

2. **Configure App:**
   - App name: "Projects Dashboard"
   - App description: "Personal music history tracker"
   - Redirect URIs: `http://localhost:5175/callback`
   - APIs used: Web API
   - Check the Terms of Service box
   - Click "Save"

3. **Get Credentials:**
   - Click on your newly created app
   - Click "Settings"
   - Copy "Client ID"
   - Click "View client secret"
   - Copy "Client Secret"

4. **Add to .env:**
   ```bash
   VITE_SPOTIFY_CLIENT_ID=your32characterclientidhere
   VITE_SPOTIFY_CLIENT_SECRET=your32characterclientsecrethere
   VITE_SPOTIFY_REDIRECT_URI=http://localhost:5175/callback
   ```

#### Scopes Needed:
The apps will request these scopes at runtime:
- `user-read-private`
- `user-read-email`
- `user-read-recently-played`
- `user-top-read`
- `playlist-read-private`

#### Testing:
```bash
# Get authorization (will return auth URL)
curl -X POST "https://accounts.spotify.com/api/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -u "$VITE_SPOTIFY_CLIENT_ID:$VITE_SPOTIFY_CLIENT_SECRET"
```

---

## Environment Variables Reference

### Complete .env Template

```bash
# ==============================================================================
# Atlassian/JIRA Configuration
# ==============================================================================
ATLASSIAN_EMAIL=your-email@example.com
ATLASSIAN_API_TOKEN=your_atlassian_api_token_here
ATLASSIAN_SITE_URL=https://your-domain.atlassian.net

# ==============================================================================
# Google API Configuration
# ==============================================================================
VITE_GOOGLE_API_KEY=AIzaSyD...your-key-here
VITE_GOOGLE_CLIENT_ID=123456789.apps.googleusercontent.com

# ==============================================================================
# Spotify API Configuration
# ==============================================================================
VITE_SPOTIFY_CLIENT_ID=your32characterclientid
VITE_SPOTIFY_CLIENT_SECRET=your32characterclientsecret
VITE_SPOTIFY_REDIRECT_URI=http://localhost:5175/callback

# ==============================================================================
# Optional Configuration
# ==============================================================================
VITE_APP_NAME=Projects Dashboard
VITE_APP_VERSION=1.0.0
VITE_API_BASE_URL=http://localhost:3000
```

---

## Project-Specific Usage

### Which projects use which credentials:

| Project | Google API | Spotify API | Atlassian MCP |
|---------|------------|-------------|---------------|
| google-calendar-clone | ✓ | | |
| task-manager | ✓ | | |
| lastfm-clone | | ✓ | |
| livejournal-clone | | ✓ | |
| jira-wrapper | | | ✓ |
| All projects | | | ✓ (via MCP) |

---

## Troubleshooting

### Atlassian MCP Not Connecting

**Problem:** Claude Code shows Atlassian MCP server errors

**Solutions:**
1. Verify your `.env` file exists and has the correct values
2. Check that `.mcp.json` references the environment variables:
   ```json
   {
     "env": {
       "ATLASSIAN_EMAIL": "${ATLASSIAN_EMAIL}",
       "ATLASSIAN_API_TOKEN": "${ATLASSIAN_API_TOKEN}",
       "ATLASSIAN_SITE_URL": "${ATLASSIAN_SITE_URL}"
     }
   }
   ```
3. Restart Claude Code after updating `.env`
4. Test credentials manually with curl

### Google Calendar Not Loading

**Problem:** Google Calendar integration fails to load

**Solutions:**
1. Check that API Key is valid and not restricted too heavily
2. Verify OAuth Client ID is for "Web application" type
3. Ensure redirect URIs match your dev server port
4. Check browser console for specific error messages
5. Verify Google Calendar API is enabled in your project

### Spotify Authentication Fails

**Problem:** Spotify OAuth redirect fails or returns error

**Solutions:**
1. Verify redirect URI in Spotify app settings **exactly** matches `.env`
2. Common issue: `http://localhost:5175/callback` vs `http://localhost:5175/callback/`
3. Check Client Secret is correct (it's easy to copy incorrectly)
4. Ensure app is not in "Development Mode" restrictions

---

## Security Best Practices

### DO:
- ✓ Keep `.env` file local (it's in `.gitignore`)
- ✓ Use environment-specific keys (dev vs production)
- ✓ Restrict API keys to specific referrers/IPs
- ✓ Rotate API tokens regularly (every 90 days)
- ✓ Use OAuth over API keys when possible

### DON'T:
- ✗ Commit `.env` to version control
- ✗ Share API keys in chat/email/slack
- ✗ Use production keys for development
- ✗ Grant more permissions than needed
- ✗ Use root/admin accounts for API access

---

## Credential Rotation

When rotating credentials (recommended every 90 days):

1. **Atlassian:**
   - Generate new API token
   - Update `.env`
   - Delete old token after verifying new one works

2. **Google:**
   - Can't rotate API key directly - create new key
   - Update `.env`
   - Delete old key after testing

3. **Spotify:**
   - Reset Client Secret in app settings
   - Update `.env` immediately
   - Old secret stops working instantly

---

## Additional Resources

- [Atlassian API Tokens Documentation](https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
- [MCP Servers Documentation](https://modelcontextprotocol.io/docs)

---

## Need Help?

If you encounter issues not covered here:

1. Check the error messages in browser console / terminal
2. Verify all URLs and credentials are correct (no extra spaces)
3. Test each API independently using curl commands provided
4. Check that all required APIs are enabled in their respective consoles
5. Restart Claude Code and dev servers after credential changes
