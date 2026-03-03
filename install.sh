#!/usr/bin/env bash
# VL-Code Installer — one-command setup
# Usage: bash install.sh

set -e

BOLD='\033[1m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

header() { echo -e "\n${CYAN}${BOLD}▸ $1${NC}"; }
ok()     { echo -e "  ${GREEN}✓${NC} $1"; }
warn()   { echo -e "  ${YELLOW}!${NC} $1"; }
fail()   { echo -e "  ${RED}✗ $1${NC}"; exit 1; }

echo -e "${BOLD}"
echo "╔═══════════════════════════════════════╗"
echo "║       VL-Code v0.9.1 Installer        ║"
echo "║   AI IDE for Visual Language v2.91    ║"
echo "╚═══════════════════════════════════════╝"
echo -e "${NC}"

# ── 1. Check prerequisites ──────────────────────────────────────────
header "Checking prerequisites"

# Node.js
if ! command -v node &>/dev/null; then
  fail "Node.js is not installed. Please install Node.js 18+ first:\n       https://nodejs.org"
fi

NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VER" -lt 18 ]; then
  fail "Node.js v18+ required (found v$(node -v)). Please upgrade."
fi
ok "Node.js $(node -v)"

# npm
if ! command -v npm &>/dev/null; then
  fail "npm not found. Please install npm."
fi
ok "npm $(npm -v)"

# ── 2. Resolve install directory ─────────────────────────────────────
header "Setting up VL-Code"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/package.json" ] && grep -q '"vl-code"' "$SCRIPT_DIR/package.json" 2>/dev/null; then
  INSTALL_DIR="$SCRIPT_DIR"
  ok "Installing from: $INSTALL_DIR"
else
  fail "Please run this script from the VL-Code project directory."
fi

# ── 3. Install dependencies ──────────────────────────────────────────
header "Installing dependencies"

cd "$INSTALL_DIR"
npm install --production 2>&1 | tail -3
ok "Dependencies installed"

# ── 4. Setup .env ────────────────────────────────────────────────────
header "Configuring environment"

if [ ! -f "$INSTALL_DIR/.env" ]; then
  if [ -f "$INSTALL_DIR/.env.example" ]; then
    cp "$INSTALL_DIR/.env.example" "$INSTALL_DIR/.env"
    ok "Created .env from template"
  fi

  echo ""
  echo -e "  ${YELLOW}VL-Code needs an Anthropic API key to work.${NC}"
  echo -e "  ${CYAN}Get one at: https://console.anthropic.com/settings/keys${NC}"
  echo ""
  read -p "  Enter your API key (or press Enter to skip): " API_KEY

  if [ -n "$API_KEY" ]; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' "s|sk-ant-api03-your-key-here|$API_KEY|" "$INSTALL_DIR/.env"
    else
      sed -i "s|sk-ant-api03-your-key-here|$API_KEY|" "$INSTALL_DIR/.env"
    fi
    ok "API key saved to .env"
  else
    warn "No API key entered. Edit .env later or set ANTHROPIC_API_KEY env var."
  fi
else
  ok ".env already exists"
fi

# ── 5. Make CLI executable ───────────────────────────────────────────
header "Setting up CLI"

chmod +x bin/vl-code.js
ok "bin/vl-code.js made executable"

if npm link 2>/dev/null; then
  ok "Global command 'vl-code' linked"
  GLOBAL_LINKED=true
else
  warn "Could not link globally (may need sudo). Trying with sudo..."
  if sudo npm link 2>/dev/null; then
    ok "Global command 'vl-code' linked (with sudo)"
    GLOBAL_LINKED=true
  else
    warn "Global link failed. You can still run: node $INSTALL_DIR/bin/vl-code.js"
    GLOBAL_LINKED=false
  fi
fi

# ── 6. Optional: Playwright browsers ────────────────────────────────
echo ""
echo -e "  ${CYAN}Optional: Install Playwright for browser testing? (y/N)${NC}"
read -p "  " INSTALL_PW
if [ "$INSTALL_PW" = "y" ] || [ "$INSTALL_PW" = "Y" ]; then
  npx playwright install chromium 2>&1 | tail -3
  ok "Playwright chromium installed"
else
  ok "Skipped Playwright (run 'npx playwright install chromium' later if needed)"
fi

# ── 7. Done ──────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}╔═══════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║       ✓ VL-Code installed!            ║${NC}"
echo -e "${GREEN}${BOLD}╚═══════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BOLD}Quick start:${NC}"
if [ "$GLOBAL_LINKED" = true ]; then
  echo -e "    ${CYAN}vl-code --web${NC}                 Launch web IDE"
  echo -e "    ${CYAN}vl-code${NC}                       Launch CLI mode"
  echo -e "    ${CYAN}vl-code --web --port 8080${NC}     Custom port"
else
  echo -e "    ${CYAN}node $INSTALL_DIR/bin/vl-code.js --web${NC}"
fi
echo ""
echo -e "  ${BOLD}Try an example:${NC}"
echo -e "    ${CYAN}vl-code --web --dir examples/ConcertReg${NC}"
echo ""
echo -e "  Then open ${BOLD}http://localhost:3200${NC} in your browser."
echo ""
