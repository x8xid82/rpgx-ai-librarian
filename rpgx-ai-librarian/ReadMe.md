## License

Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0) License

This work is licensed under the Creative Commons Attribution-NonCommercial 4.0
International License. To view a copy of this license, visit
http://creativecommons.org/licenses/by-nc/4.0/.

### Summary of License Terms:

* **Attribution**: You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
* **NonCommercial**: You may not use the material for commercial purposes.

For more information, please see the full text of the license at
http://creativecommons.org/licenses/by-nc/4.0/legalcode

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## Contributors

* Ashton Rogers (@x8xid82)
* RPGX Studios
* X8 Studios

---

# 🧠 RPGX-AI Library (v1.3)

*A Retrieval-Augmented Knowledge System for the RPGX-AI Assistant Module*

---

## Overview

**RPGX-AI Library** transforms RPGX-AI into a context-aware assistant for Game Masters and world-builders.  
It allows you to **ingest journals, notes, NPC sheets, and (soon) compendiums** into a locally running AI “knowledge base.”  
The AI can then answer questions, explain rules, summarize lore, or recall information directly from your game world.

Instead of relying solely on a language model’s generic memory, the module builds a searchable **Retrieval-Augmented Generation (RAG)** database that references your own Foundry content.  
When you ask the AI something, it first retrieves the most relevant chunks of your uploaded documents, and then uses them to generate an answer—citing its sources.

---

## ⚙️ How It Works

1. **Data Ingestion**

   * The module sends the plain text of your Foundry journals (and soon other document types) to a lightweight local RAG server.
   * The server splits your text into manageable “chunks” and generates vector embeddings using **Ollama** and your chosen embedding model (e.g., `nomic-embed-text`).
   * These vectors are stored in `kb.json`, forming your knowledge base.

2. **Question-Answering**

   * When you query the AI, the RAG server compares your question’s embedding to all stored chunks.
   * The most relevant chunks are included as context in a prompt to your selected **local LLM** (e.g., `qwen2.5:14b`).
   * The AI then generates an answer using that context, citing the journal(s) it pulled from.

3. **Fallback Behavior**

   * If no relevant context is found, the system gracefully falls back to the model’s general knowledge base—ensuring consistent answers even when your RAG data doesn’t match.

---

## 🧩 Core Features

* 🗂️ **Journal Ingestion:** Add all or individual journals into your AI’s knowledge base.
* 🧾 **Full Text Parsing:** Automatically extracts text content from journal pages (HTML, Markdown, legacy).
* 🧹 **Knowledge Wipe:** Reset or clear the stored data from the RAG server.
* ⚙️ **Configurable Settings:**

  * **Chunk Size / Overlap** — Controls text segmentation granularity.
  * **RAG Top-K** — Number of chunks retrieved per query.
  * **Temperature / Max Tokens / Timeout** — AI generation settings for response creativity and performance.
  * **System Prompt (Persona)** — Define your AI’s tone and behavior.

* 💬 **Smart Citation:** AI cites which Foundry journals were used in its answer.
* 🧠 **Local \& Private:** All processing happens on your own machine—no external API or cloud dependencies.
* 🧩 **Extensible:** Future updates will add support for **Actors**, **Compendiums**, and custom ingest types.

---

## 🖥️ System Requirements

* **Foundry VTT:** Version **v12** or newer
* **Node.js:** Version **18+** (for the RAG server)
* **Ollama:** Installed locally with at least one supported model

  * Recommended LLM: `qwen2.5:14b`
  * Recommended Embedding Model: `nomic-embed-text`

* **Operating Systems:** Windows 10/11, macOS, or Linux
* **Hardware:**

  * Minimum: 8 GB RAM, 4 CPU cores
  * Recommended: 16 GB+ RAM and GPU acceleration (CUDA or Metal)

---

## 📦 Software Dependencies

| Component | Description |
|------------|-------------|
| \*\*Foundry Module:\*\* `rpgx-ai-assistant` | RPGX-AI \*\*Ollama\*\* integration into FoundryVTT Chat |
| \*\*Foundry Module:\*\* `rpgx-ai-librarian` | Provides ingestion UI and AI integration. |
| \*\*Local RAG Server:\*\* `server.js` | Manages embeddings and retrieval. |
| \*\*Ollama\*\* | Hosts LLM and embedding models. |
| \*\*NPM Packages:\*\* | `express`, `body-parser`, `cors`, `fs-extra`, `http` |

---

## 🧾 Changelog

### v1.0 — Stable Release

**Core Functionality Complete**

* Fully working RAG integration between Foundry VTT and a local Ollama instance.
* Added seamless fallback to core model knowledge when RAG has no context.
* Clean citation display — inline journal references in AI responses.
* Refined server.js handling with proper JSON safety and CORS compatibility.
* Implemented reliable ping, ingest, and wipe endpoints.

**Librarian Module Features**

* Added full ingest system for all Foundry journals.
* Added progress notifications and feedback for ingest actions.
* Rebuilt Librarian control panel with working “Ingest All” and “Wipe Knowledge Base” controls.
* Optimized journal parsing for Foundry v13 compatibility (handles text, HTML, and markdown).
* Improved safety fallbacks and performance tuning.

**Quality of Life Improvements**

* Streamlined error handling and notification messages.
* Ensured fallback to core Ollama model when RAG is unavailable.
* Cleaned up chat card output — removed duplicate or broken citation footers.
* Improved logging and debug output for easier troubleshooting.

**Upcoming Features**

* Right-click “Ingest to RAG” context menu for journals.
* Actor and NPC ingestion support.
* Compendium ingestion with progress feedback.
* Editable system prompt for AI personality customization.

---

🎉 *RPGX-AI Library v1.0 represents the first fully stable build — integrating local AI, Foundry journals, and real-time context retrieval into a single seamless workflow.*

---

## 🛠️ Installation Guide

### Step 1 — Install Ollama

1. Download from [https://ollama.ai](https://ollama.ai)
2. Run the following commands:

```bash
   ollama pull qwen2.5:14b
   ollama pull nomic-embed-text

### Step 2 — Set Up the RAG Server

### Step 2 — Set Up the RAG Server

Place server.js and package.json inside a folder, e.g.:

Documents\\rag-server



Open PowerShell or Terminal, then run:

cd $env:USERPROFILE\\Documents\\rag-server
npm install
$env:OLLAMA\_BASE="http://127.0.0.1:11434"
$env:OLLAMA\_LLM="qwen2.5:14b"
$env:OLLAMA\_EMBED="nomic-embed-text"
$env:PORT="3033"
npm start



Confirm it’s running — you should see:

RAG server listening on http://127.0.0.1:3033

### Step 3 — Install the Foundry Module

Add the module to Foundry via Manifest URL or manual copy into Data/modules.

Enable RPGX-AI Librarian in your Game World.

Configure under Settings → Module Settings → RPGX AI Librarian:

Set the RAG Base URL (default: http://127.0.0.1:3033).

Adjust Chunk Size, Overlap, and Model settings if desired.

\###Step 4 — Ingest Journals

Open the Librarian Control Panel:
Settings → RPGX AI Librarian → Open Control Panel

Click “Ingest All Journals” or use the header button on a specific Journal.

Watch the console for confirmation:

Uploaded “Lore of Elturel” (7 chunks)

\###Step 5 — Ask Questions

Use any integrated AI interface (e.g., After Dark AI or GM console) to ask questions.
The model will retrieve relevant information from your ingested journals before answering.

---

🧹 Maintenance

Wipe Knowledge Base: Clears kb.json and resets the index.

Manual Reset: You can also manually delete kb.json from the RAG folder.

Re-Index: After editing journals, re-ingest them to refresh the knowledge base.

🧩 Future Enhancements

✅ Right-click context menu for per-journal ingestion

✅ Editable system prompt for user-defined AI persona

🔜 Actor and NPC sheet ingestion

🔜 Compendium ingestion with progress tracking

🔜 Multi-model configuration and performance benchmarking

📚 Example Use Cases

“Summarize all lore about Elturel from my journals.”

“List the stat blocks for NPCs in the Order of the Veil.”

“Explain how teleportation circles work in my world’s custom magic system.”

“What events led to the fall of Elturel according to my notes?”

💡 Tips for Optimal Performance
Setting	Recommended	Notes
Chunk Size	1000 – 1200	Balanced detail vs speed
Chunk Overlap	150 – 250	Keeps sentences intact
Top K	6 – 8	Enough for context coverage
Temperature	0.3 – 0.5	Factual and consistent output
Max Tokens	600 – 800	Adequate for full responses
Timeout (ms)	60000 – 90000	Depends on hardware speed
🚀 In Short

RPGX-AI Library bridges Foundry and local AI, turning your journals into a private, searchable, conversational database.
No cloud, no subscriptions — just your world, your data, your AI.

