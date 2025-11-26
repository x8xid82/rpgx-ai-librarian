#!/usr/bin/env bash
# start-rag-server.sh
# Run this to set up and start the RPGX RAG server.

echo "=== RPGX RAG Server: Setup & Start ==="

cd "$(dirname "$0")"

if [ ! -d "node_modules" ]; then
  echo "Installing npm dependencies..."
  npm install
else
  echo "node_modules already present – skipping npm install."
fi

export OLLAMA_BASE="http://127.0.0.1:11434"
export OLLAMA_LLM="qwen2.5:14b"
export OLLAMA_EMBED="nomic-embed-text"
export PORT="3033"

echo "Starting RAG server on http://127.0.0.1:3033 ..."
echo "Ctrl+C to stop."

npm start
