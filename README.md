# 🧠 RPGX AI Librarian

## Turn Your Foundry World Into a Real AI-Powered Brain

RPGX AI Librarian is a **premium RAG integration module** for FoundryVTT. It transforms your journals, actors, items, and world data into a **local, private, searchable knowledge base** that the RPGX AI Assistant can use to deliver context-aware responses, summaries, lore explanations, and world-specific insights.

Tired of AI tools that know *everything except your campaign*?  
This module fixes that.

RPGX AI Librarian is the missing link between your meticulously crafted world and your AI assistant. It reads your content, structures it, and feeds it to your RAG server — quietly doing the unsexy heavy lifting so your AI feels truly grounded in your lore.

It’s like Skynet…  
**but for your TTRPG, and in a good way.**

![Untitled-1](https://github.com/user-attachments/assets/70bb4a82-db02-43eb-bde4-c6a3eb1482e4)

---

# 📌 What RPGX AI Librarian Actually Does

At a high level, the Librarian module:

### 1. **Scans your Foundry world**
Journals, NPCs, PCs, items — everything with meaningful text.

### 2. **Extracts the important data**
Bios, quests, stat blocks, abilities, spell lists, personalities, notes, lore, and more.

### 3. **Sends those documents to your RAG server**
They’re chunked, embedded, indexed, and stored locally.

### 4. **Feeds context to your AI assistant**
Your AI can now answer questions using your actual game data — not generic SRD filler.

---

### **Result?**

Your AI can now give real answers to questions like:

- “What’s Rami Treenuts’ backstory again?”
- “What does the cursed ring actually do?”
- “Who hired the party at the start of this arc?”
- “Summarize everything we know about Elturel.”

All grounded in your world — **not hallucinations**.

---

![Untitled-2](https://github.com/user-attachments/assets/01a661bf-aa62-4b29-98df-9ccfbaf87eb0)

# 🧩 Feature Rundown

## 🔍 Full World Ingestion: Journals, Actors, Items

---

## 📝 Journals

- Supports Foundry v10+ multi-page journals  
- Reads HTML, Markdown, and legacy text  
- Strips formatting → clean, AI-friendly plain text  
- Produces one compiled “doc” per journal  

---

## 🧍 Actors (PCs & NPCs)

*The most complete Actor ingestion on any Foundry module.*

### **Basic Info**
- Class(es), levels  
- Species/Race, background  
- Alignment, size  
- HP, hit dice  
- Proficiency bonus  

### **Abilities & Saves**
- STR / DEX / CON / INT / WIS / CHA  
- Ability modifiers  
- Saving throw values  

### **Skills**
- Full skill list + modifiers  
- Passive perception / insight / investigation  

### **Movement**
- Walk / fly / climb / swim / burrow  
- Hover support  

### **Defenses**
- AC  
- Resistances  
- Immunities  
- Vulnerabilities  
- Condition immunities  

### **Senses**
- Darkvision  
- Blindsight  
- Tremorsense  
- Truesight  

### **Inventory**
- All items with names & quantities  
- Value / cost  
- Equipment state (equipped/unequipped)  

### **Armor & Weapons**
- Full armor list  
- Weapon attack bonuses  
- Damage formulas  

### **Features & Traits**
- Class features  
- Species/Race traits  
- Background traits  
- Feats  

### **Spells**
- Spells grouped by level  
- Includes cantrips → 9th level  

### **Personal Profile**
- Gender, age, height, weight  
- Hair / eyes / skin  
- Faith  
- Appearance  
- Personality traits, ideals, bonds, flaws  
- Biography (flattened to readable text)

Every Actor becomes a complete textual “document,” ideal for RAG ingestion.

---

## 📦 Items

RPGX AI Librarian extracts:

- Name  
- Type & subtype  
- Rarity  
- Attunement (required/optional)  
- Damage / armor values  
- Cost / price  
- Description (clean plain text)

Perfect for:  
**“What does this item actually do again?”**

---

# 🧷 GM Control Panel

Found in:  
**Game Settings → RPGX AI Librarian → Open Control Panel**

Displays:

- Total journals  
- Total actors  
- Total items  
- RAG server status  

### **Buttons Included**

#### **Ingest All**
Indexes your entire world in one click.

#### **Wipe Knowledge Base**
- Calls `/wipe` on your RAG server  
- Protected with confirmation  
- Ideal after big world restructuring  

#### **Ping Server**
Verifies connectivity and displays model names.

#### **Close**
Closes the panel without drama.

---

# 📝 Per-Journal Upload Button *(Coming Soon)*

Adds a header button to each journal for:

- Quick per-entry ingestion  
- Small updates without re-indexing everything  
- Session-to-session cleanup  

---

# ⚙️ RAG Configuration (Chunking)

Under:  
**Configure Settings → RPGX AI Librarian**

You can adjust:

### **RAG Server Base URL**
Example:  
`http://127.0.0.1:3033`

### **Chunk Size**  
Default: `1200`

### **Chunk Overlap**  
Default: `200`

These determine how your world’s text is segmented and indexed.

---

# 🔐 GM-Only, Local-First Design

- All actions are GM-restricted  
- No external APIs  
- No cloud services  
- You choose exactly when content is indexed or wiped  
- Works with **any** self-hosted RAG/LLM setup  

---

# 🧰 Installation & Setup

## 1. Requirements

You need:

- Foundry VTT v10 or newer  
- A local RAG server (Node/Ollama recommended)  
- RPGX AI Assistant (optional but strongly recommended)

Your RAG server must support:

- `POST /ingest`  
- `DELETE /wipe`  
- `GET /ping`  

---

## 2. How to Get the Module

Two access models:

### 🔹 **Option A — One-Time Purchase ($3)**

- Buy once  
- Keep that version forever  
- No guaranteed updates  

### 🔸 **Option B — Silver Tier (or higher) Subscription**

- Full access to all updates  
- Continuous new features  
- Unlock all other RPGX tools  
- Best for long-term use  

---

## 3. Installing in Foundry

1. Open **Add-on Modules**  
2. Click **Install Module**  
3. Paste your Manifest URL **or** install from ZIP  
4. Enable module in your world  
5. Save settings  

---

## 4. Basic Configuration

Inside your world:

1. Go to **Game Settings → Configure Settings**  
2. Open **RPGX AI Librarian**  
3. Set:  
   - **RAG Server URL** (e.g., `http://127.0.0.1:3033`)  
   - **Chunk Size**  
   - **Chunk Overlap**  
4. Save settings  

---

## 5. Using the Librarian

1. Open the Control Panel  
2. Click **Ingest All**  
3. Wait for ingestion notifications  
4. Ask your AI Assistant contextual questions  

---

# 🤖 Integration with RPGX AI Assistant

- **Librarian = The Archivist**  
- **Assistant = The Brain**  

Together they create an AI co-DM that can:

- Summarize sessions  
- Explain homebrew rules  
- Track NPCs  
- Recall relationships  
- Recap plot arcs  
- Understand items  
- Reference backstories  
- Use YOUR world’s data instead of generic fantasy  

It’s the closest thing to giving your world actual memory.

---

# 🧾 TL;DR

RPGX AI Librarian is:

- The bridge between your Foundry world and your AI  
- A full ingestion + indexing pipeline  
- GM-only and local-first  
- Tunable and flexible  
- Premium (one-time purchase or subscription)  
- The perfect partner for RPGX AI Assistant  

If you want your AI to **actually know your campaign**, this is the module that makes it happen.
