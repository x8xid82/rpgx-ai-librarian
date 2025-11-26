/**
 * RPGX RAG Server
 * Minimal embedding + retrieval + LLM query workflow for Ollama-based RAG.
 */

import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import fs from "fs-extra";
import http from "http";

// ---------------- CONFIG ---------------- //
const PORT = process.env.PORT || 3033;
const OLLAMA_BASE = process.env.OLLAMA_BASE || "http://127.0.0.1:11434";
const OLLAMA_LLM = process.env.OLLAMA_LLM || "qwen2.5:14b";
const OLLAMA_EMBED = process.env.OLLAMA_EMBED || "nomic-embed-text";

const KB_FILE = "kb.json";

// Load existing KB or start fresh
let KB = [];
if (fs.existsSync(KB_FILE)) {
  KB = fs.readJsonSync(KB_FILE, { throws: false }) || [];
}

// ---------------- UTILITIES ---------------- //

/** POST /api/embed -> embedding array */
async function embed(text) {
  const res = await fetch(`${OLLAMA_BASE}/api/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: OLLAMA_EMBED, input: text })
  });
  const j = await res.json();
  return j.embedding || j.data?.[0]?.embedding || null;
}

/** Cosine similarity between two vectors */
function cosineSim(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] ** 2;
    nb += b[i] ** 2;
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/** Save KB to disk */
function saveKB() {
  fs.writeJsonSync(KB_FILE, KB, { spaces: 2 });
}

// ---------------- EXPRESS SETUP ---------------- //

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));

// ---------------- API ROUTES ---------------- //

/** Simple ping */
app.get("/ping", (req, res) => {
  res.json({
    status: "ok",
    llm: OLLAMA_LLM,
    embed: OLLAMA_EMBED,
    count: KB.length
  });
});

/**
 * POST /ingest
 * {
 *   docs: [{ id, title, content }],
 *   chunkSize,
 *   chunkOverlap
 * }
 */
app.post("/ingest", async (req, res) => {
  try {
    const { docs = [], chunkSize = 1200, chunkOverlap = 200 } = req.body;
    let addedChunks = 0;

    for (const doc of docs) {
      const chunks = chunkText(doc.content, chunkSize, chunkOverlap);
      for (const chunk of chunks) {
        const emb = await embed(chunk);
        if (!emb) continue;

        KB.push({
          id: doc.id,
          title: doc.title,
          text: chunk,
          embedding: emb
        });

        addedChunks++;
      }
    }

    saveKB();

    res.json({ added: addedChunks, docs: docs.length });
  } catch (err) {
    console.error("INGEST ERROR:", err);
    res.status(500).json({ error: String(err) });
  }
});

/**
 * DELETE /wipe
 */
app.delete("/wipe", (req, res) => {
  KB = [];
  saveKB();
  res.json({ wiped: true });
});

/** Legacy fallback: POST /wipe */
app.post("/wipe", (req, res) => {
  KB = [];
  saveKB();
  res.json({ wiped: true });
});

// ---------------- TEXT CHUNKING ---------------- //

function chunkText(text, size, overlap) {
  const out = [];
  let start = 0;
  while (start < text.length) {
    const end = start + size;
    out.push(text.slice(start, end));
    start = end - overlap;
    if (start < 0) start = 0;
  }
  return out;
}

// ---------------- START SERVER ---------------- //

app.listen(PORT, () => {
  console.log(`RPGX RAG Server listening on http://127.0.0.1:${PORT}`);
  console.log(`[LLM]    ${OLLAMA_LLM}`);
  console.log(`[EMBED]  ${OLLAMA_EMBED}`);
});
