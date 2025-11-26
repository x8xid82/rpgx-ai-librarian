# -------------------------------
# RPGX RAG SERVER START SCRIPT
# -------------------------------

Write-Host "Starting RPGX RAG Server..."

# Verify Node is installed
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js is not installed or not in PATH."
    Write-Host "Install from: https://nodejs.org"
    exit 1
}

# Install dependencies (only if node_modules missing)
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing npm packages..."
    npm install
}

# Set environment variables
$env:OLLAMA_BASE="http://127.0.0.1:11434"
$env:OLLAMA_LLM="qwen2.5:14b"
$env:OLLAMA_EMBED="nomic-embed-text"
$env:PORT="3033"

Write-Host "Environment Variables Set:"
Write-Host "OLLAMA_BASE=$env:OLLAMA_BASE"
Write-Host "OLLAMA_LLM=$env:OLLAMA_LLM"
Write-Host "OLLAMA_EMBED=$env:OLLAMA_EMBED"
Write-Host "PORT=$env:PORT"

# Start server
Write-Host "Launching server.js..."
node server.js
