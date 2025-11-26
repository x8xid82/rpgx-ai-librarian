TL;DR (More detailed steps below)
1. Make sure Ollama and Node.js are installed FIRST. 
2. Install LLM model: qwen2.5:14b
3. Take unzipped root folder and all it's contents (rpgx-rag-server) and put in the location you wish to host.
4. Right click in root folder > Open Terminal.
5. Paste this code: Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
6. Paste this code: .\start-rag-server.ps1
7. This should create AND start your RAG server. (Keep terminal window open to runs server).
8. Make Sure Ollama is running.
9. Configure modules in Foundry. 

To start server again repeat steps 4 - 7.

-------------------

# 🧠 RPGX RAG Server

This folder contains the **RPGX RAG Server** used by:

- **RPGX AI Librarian** (ingestion of Journals/Actors/Items)
- **RPGX AI Assistant** (context-aware responses)

The RAG server runs on **Node.js** and talks to **Ollama** for both:
- Embeddings (vector index)
- LLM responses

By default it listens on:

> `http://127.0.0.1:3033`

You’ll point FoundryVTT at this URL in the module settings.

---

## 1. Requirements

Before you run the server, you need:

### 1.1. Ollama

Install Ollama from:

> https://ollama.ai

Then open a terminal / PowerShell and pull the recommended models:

```bash
ollama pull qwen2.5:14b
ollama pull nomic-embed-text

Make sure Ollama is running (usually ollama serve starts automatically).

1.2. Node.js

Install Node.js 18+ from:

https://nodejs.org

You can verify it’s installed with:

node -v
npm -v





## 2. Folder Contents
This folder should contain at least:

rpgx-rag-server/
  server.js
  package.json
  start-rag-server.ps1   (Windows PowerShell launcher)
  start-rag-server.sh    (Linux/macOS launcher)
  README.md







## 3. First Time Setup

3. First-Time Setup

You only need to do this once per machine.

### 3.1. Windows (PowerShell)

Right-click the folder and choose Open in Terminal
or open PowerShell and cd into the folder:

cd PATH\TO\rpgx-rag-server


Unblock the script if Windows complains:

Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned


(You may be prompted to confirm with Y.)

Run the startup script:

./start-rag-server.ps1


The script will:

Run npm install if node_modules is missing

Set environment variables for:

OLLAMA_BASE → http://127.0.0.1:11434

OLLAMA_LLM → qwen2.5:14b

OLLAMA_EMBED → nomic-embed-text

PORT → 3033

Start the RAG server with npm start

If successful, you’ll see something like:

RPGX RAG Server listening on http://127.0.0.1:3033


Leave this window open and running while you use Foundry.



### 3.2. Linux / macOS

Open a terminal and cd into the folder:

cd /path/to/rpgx-rag-server


Make the script executable (first time only):

chmod +x start-rag-server.sh


Run the startup script:

./start-rag-server.sh


The script will:

Run npm install if node_modules is missing

Set environment variables:

OLLAMA_BASE → http://127.0.0.1:11434

OLLAMA_LLM → qwen2.5:14b

OLLAMA_EMBED → nomic-embed-text

PORT → 3033

Start the RAG server with npm start

You should see:

RPGX RAG Server listening on http://127.0.0.1:3033


Keep this terminal running while using Foundry.


## 4. Point FoundryVTT at the RAG Server

In your Foundry world:

Open Game Settings → Configure Settings

Go to Module Settings → RPGX AI Librarian

Set:

RAG Server Base URL to:

If Foundry is on the same machine:

http://127.0.0.1:3033


If Foundry is on a different machine on your LAN:

http://<RAG-SERVER-LAN-IP>:3033


Example:

http://192.168.0.50:3033


Click Save Settings.

Open RPGX AI Librarian → Open Control Panel and click Ping Server.

If everything is configured correctly you’ll get a notification that the RAG server responded.




## 5. Normal Usage (After First Setup)

After the initial install, your routine is:

Every time you want to use it

Start Ollama (if it isn’t already running).

Run the startup script:

Windows:

cd PATH\TO\rpgx-rag-server
./start-rag-server.ps1


Linux/macOS:

cd /path/to/rpgx-rag-server
./start-rag-server.sh


Launch Foundry, open your world.

Use the RPGX AI Librarian control panel to:

Ingest All Journals, Actors & Items

Ping Server

Wipe Knowledge Base (if you want to reset the index)



## 6. Troubleshooting
6.1. Ping Fails in Foundry

Make sure the RAG server script is running and shows listening on http://...:3033

Verify the URL in RPGX AI Librarian → RAG Server Base URL

If Foundry runs on a different machine:

Use the server’s LAN IP instead of 127.0.0.1

Ensure your firewall allows inbound connections on port 3033

6.2. CORS Errors in the Browser Console

The provided server.js enables CORS. If you modified it, ensure:

const cors = require("cors");
app.use(cors());


is present.

6.3. Ollama / Model Errors

If ingesting or answering questions fails with model errors:

Confirm the models exist:

ollama list


Make sure these match the environment variables:

OLLAMA_LLM → name of your chat model (e.g. qwen2.5:14b)

OLLAMA_EMBED → name of your embedding model (e.g. nomic-embed-text)

Change them in the startup script if you’re using different models.


## 7. Notes

This server is designed to be local and private. Nothing leaves your machine unless you configure Ollama or your network otherwise.

At the moment, only this RPGX RAG Server API is supported by RPGX AI Librarian and RPGX AI Assistant.
Dropping in random third-party RAG services (AnythingLLM, Gemini, etc.) will not work unless they are wrapped to match this API.

