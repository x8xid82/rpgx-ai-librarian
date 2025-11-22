const MODULE_ID = "rpgx-ai-librarian";

/* -------------------------- Init / Settings -------------------------- */

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | init`);

  // Settings
  game.settings.register(MODULE_ID, "ragBase", {
    name: "RAG Server Base URL",
    hint: "Example: http://XXX.0.0.1:3033",
    scope: "world",
    config: true,
    type: String,
    default: "http://127.0.0.1:3033"
  });

  game.settings.register(MODULE_ID, "chunkSize", {
    name: "Chunk Size",
    hint: "Text chunk size when indexing (server-side default is 1200).",
    scope: "world",
    config: true,
    type: Number,
    default: 1200
  });

  game.settings.register(MODULE_ID, "chunkOverlap", {
    name: "Chunk Overlap",
    hint: "Overlap between chunks (server-side default is 200).",
    scope: "world",
    config: true,
    type: Number,
    default: 200
  });

  // Add a Game Settings menu with action buttons (GM only)
  game.settings.registerMenu(MODULE_ID, "panel", {
    name: "RPGX AI Librarian",
    label: "Open Control Panel",
    hint: "Ingest all journals (and actors) or wipe the RAG knowledge base.",
    icon: "fas fa-book",
    type: RPGXLibrarianPanel,
    restricted: true
  });
});

/* -------------------------- Control Panel -------------------------- */

class RPGXLibrarianPanel extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "rpgx-ai-librarian-panel",
      title: "RPGX AI Librarian",
      template: null,     // we’ll build HTML in render()
      width: 520,
      height: "auto",
      closeOnSubmit: false
    });
  }

  async _render(force, options) {
    await super._render(force, options);
    const html = $(this.element);
    html.empty().append(this._renderInner());
    this.activateListeners(html);
  }

  _renderInner() {
    const rag = game.settings.get(MODULE_ID, "ragBase");
    const journalCount = game.journal.size ?? (game.journal?.contents?.length ?? 0);
    const actorCount   = game.actors?.size ?? (game.actors?.contents?.length ?? 0);
    const itemCount    = game.items?.size ?? (game.items?.contents?.length ?? 0);

    return $(/*html*/`
      <div class="rpgx-panel">
        <div class="form-group">
          <label>RAG Server</label>
          <div>${rag}</div>
        </div>
        <div class="form-group">
          <label>Journals in World:</label>
          <div>${journalCount}</div>
        </div>
        <div class="form-group">
          <label>Actors / NPCs in World:</label>
          <div>${actorCount}</div>
        </div>
        <div class="form-group">
          <label>Items in World:</label>
          <div>${itemCount}</div>
        </div>
        <div class="form-group">
          <button type="button" class="ingest-all" style="margin-left:0px;">
            <i class="fa-solid fa-upload"></i> Ingest All Journals, Actors & Items
          </button>
          <button type="button" class="wipe-kb" style="margin-left:0px;">
            <i class="fa-solid fa-trash"></i> Wipe Knowledge Base
          </button>
          <button type="button" class="ping" style="margin-left:0px;">
            <i class="fa-solid fa-plug"></i> Ping Server
          </button>
          <button type="button" class="close-panel" style="margin-left:0px;">
            <i class="fa-solid fa-xmark"></i> Close
          </button>
        </div>
        <p class="notes" style="margin-left:15px;">
          Ingest journals, actor sheets, and world items to add custom knowledge to your RPGX-AI Library Knowledge Base.
        </p>
      </div>
    `);
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find("button.ingest-all").on("click", () => this._ingestAll());
    html.find("button.wipe-kb").on("click", () => this._wipeKB());
    html.find("button.ping").on("click", () => this._ping());
    html.find("button.close-panel").on("click", () => this.close());
  }

  async _ping() {
    try {
      const base = game.settings.get(MODULE_ID, "ragBase");
      const res = await fetch(`${base}/ping`);
      if (!res.ok) throw new Error(`Ping HTTP ${res.status}`);
      const j = await res.json();
      ui.notifications.info(`RAG OK | LLM=${j.llm} | EMBED=${j.embed}`);
    } catch (e) {
      console.error(e);
      ui.notifications.error(`RAG ping failed: ${e.message}`);
    }
  }

  async _wipeKB() {
    const yes = await Dialog.confirm({
      title: "Wipe RAG Knowledge Base",
      content: "<p>This will clear ALL previously ingested chunks on the RAG server. Continue?</p>"
    });
    if (!yes) return;

    const base = game.settings.get(MODULE_ID, "ragBase");
    const url = `${base}/wipe`;

    const tryCall = async (method) => {
      try {
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" }
        });
        return { ok: res.ok, status: res.status };
      } catch (e) {
        return { ok: false, status: 0, err: e };
      }
    };

    try {
      let r = await tryCall("DELETE");
      if (!r.ok && (r.status === 404 || r.status === 405)) {
        r = await tryCall("POST");
      }
      if (!r.ok && r.status === 0) {
        r = await tryCall("POST");
      }
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      ui.notifications.info("RAG KB cleared.");
    } catch (e) {
      console.error(e);
      ui.notifications.error(`Wipe failed: ${e.message || e}`);
    }
  }

  async _ingestAll() {
    if (!game.user.isGM) return ui.notifications.error("GM only.");

    const base = game.settings.get(MODULE_ID, "ragBase");
    const chunkSize = game.settings.get(MODULE_ID, "chunkSize");
    const chunkOverlap = game.settings.get(MODULE_ID, "chunkOverlap");

    const journalDocs = await collectAllJournalDocs();
    const actorDocs   = await collectAllActorDocs();
    const itemDocs    = await collectAllItemDocs();

    const docs = [...journalDocs, ...actorDocs, ...itemDocs];

    if (!docs.length) {
      return ui.notifications.warn("No journals, actors, or items found to ingest.");
    }

    const notice = ui.notifications.info(
      `Indexing ${docs.length} documents (${journalDocs.length} journals, ${actorDocs.length} actors, ${itemDocs.length} items)...`,
      { permanent: true }
    );

    try {
      const res = await fetch(`${base}/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docs, chunkSize, chunkOverlap })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = await res.json();
      ui.notifications.info(
        `RAG ingest complete: ${j.added} chunks from ${j.docs} docs (journals + actors + items).`
      );
    } catch (e) {
      console.error(e);
      ui.notifications.error(`Ingest failed: ${e.message}`);
    } finally {
      ui.notifications.remove(notice);
    }
  }
}

/* ------------------- Add header button on Journal sheets ------------------- */

Hooks.on("renderJournalSheet", (app, html, data) => {
  if (!game.user.isGM) return;

  // Avoid duplicates
  if (html.find(".rpgx-upload").length) return;

  const actions = html.closest(".app").find(".window-header .window-actions");
  const header  = html.closest(".app").find(".window-header .window-title");

  const btn = $(`<a class="header-button rpgx-upload" title="Upload to RAG">
      <i class="fa-solid fa-upload"></i>
    </a>`);

  btn.on("click", async () => {
    try {
      const doc = await collectSingleJournalDoc(app.document);
      if (!doc) return ui.notifications.warn("Nothing to ingest from this journal.");
      const base = game.settings.get(MODULE_ID, "ragBase");
      const chunkSize = game.settings.get(MODULE_ID, "chunkSize");
      const chunkOverlap = game.settings.get(MODULE_ID, "chunkOverlap");

      const res = await fetch(`${base}/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docs: [doc], chunkSize, chunkOverlap })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = await res.json();
      ui.notifications.info(`Uploaded "${doc.title}" (${j.added} chunks).`);
    } catch (e) {
      console.error(e);
      ui.notifications.error(`Upload failed: ${e.message}`);
    }
  });

  if (actions.length) actions.prepend(btn);
  else if (header.length) header.after(btn);
});

/* ---------------------- Helpers: gather journal text ---------------------- */

async function collectAllJournalDocs() {
  const coll    = game.journal;
  const entries = Array.isArray(coll?.contents) ? coll.contents : Array.from(coll ?? []);
  const out     = [];

  for (const entry of entries) {
    const doc = await collectSingleJournalDoc(entry);
    if (doc) out.push(doc);
  }

  console.debug("RPGX Librarian | collectAllJournalDocs found:", out.length, "docs");
  return out;
}

/**
 * Robust extractor for v10–v13:
 *  - Text pages: p.text.content (HTML) or p.text.markdown
 *  - Legacy single-content journals
 *  - Strips HTML safely with multiple fallbacks
 */
async function collectSingleJournalDoc(entry) {
  try {
    let content = "";

    // v10+ journals have pages (Collection)
    if (entry.pages) {
      const pages = Array.isArray(entry.pages.contents) ? entry.pages.contents : [];
      for (const p of pages) {
        if (p.type === "text") {
          if (p.text?.content) content += "\n\n" + stripToPlain(p.text.content);
          else if (p.text?.markdown) content += "\n\n" + p.text.markdown;
        }
      }
    }

    // Legacy single-content journals
    if (!content) {
      const legacyHtml = entry.data?.content ?? entry.content ?? entry.text?.content;
      if (legacyHtml) content = stripToPlain(legacyHtml);
    }

    content = (content ?? "").trim();
    if (!content) return null;

    return {
      id: entry.id,
      title: entry.name ?? "Untitled",
      content
    };
  } catch (e) {
    console.error("RPGX Librarian | collectSingleJournalDoc failed", e);
    return null;
  }
}

/** Prefer Foundry utils; fall back to a naive HTML stripper if needed */
function stripToPlain(html) {
  try {
    if (globalThis.TextEditor?.extractPlainText) {
      return TextEditor.extractPlainText(html);
    }
  } catch (_) { /* ignore */ }
  const tmp = document.createElement("div");
  tmp.innerHTML = html ?? "";
  const text = tmp.textContent ?? tmp.innerText ?? "";
  return text.replace(/\u00A0/g, " ").trim();
}

/* ---------------------- Helpers: gather actor / NPC text ---------------------- */

async function collectAllActorDocs() {
  const coll   = game.actors;
  const actors = Array.isArray(coll?.contents) ? coll.contents : Array.from(coll ?? []);
  const out    = [];

  for (const actor of actors) {
    const doc = collectSingleActorDoc(actor);
    if (doc) out.push(doc);
  }

  console.debug("RPGX Librarian | collectAllActorDocs found:", out.length, "docs");
  return out;
}

/**
 * Extracts a reasonable text blob from an Actor (PC or NPC).
 * Tries common biography/description fields across systems (dnd5e, generic, etc.)
 */
function collectSingleActorDoc(actor) {
  try {
    const sys = actor.system ?? actor.data?.data ?? {};
    const DND = (globalThis.CONFIG && CONFIG.DND5E) ? CONFIG.DND5E : {};
    const sections = [];

    /* -------------------- BASIC INFO -------------------- */
    const basicLines = [];

    // Classes + levels (class items)
    const classItems = actor.items.filter(i => i.type === "class");
    if (classItems.length) {
      const clsLines = classItems.map(ci => {
        const lvl = ci.system?.levels ?? ci.system?.level ?? "?";
        return `${ci.name} ${lvl}`;
      });
      basicLines.push(`Classes: ${clsLines.join(", ")}`);
    }

    // Species / Race
    const det = sys.details ?? {};
    const species = det.species?.value ?? det.species ?? det.race?.value ?? det.race;
    if (species) basicLines.push(`Species / Race: ${species}`);

    // Background (name, not description)
    const background = det.background?.value ?? det.background;
    if (background) basicLines.push(`Background: ${background}`);

    // Total / character level
    const totalLevel = det.level ?? sys.classes?.levels;
    if (totalLevel) basicLines.push(`Character Level: ${totalLevel}`);

    // Alignment
    if (det.alignment) basicLines.push(`Alignment: ${det.alignment}`);

    // Proficiency bonus
    if (sys.attributes?.prof != null) {
      basicLines.push(
        `Proficiency Bonus: ${sys.attributes.prof >= 0 ? "+" : ""}${sys.attributes.prof}`
      );
    }

    // Initiative
    const init = sys.attributes?.init;
    let initVal = null;
    if (init) {
      initVal = init.total ?? init.mod ?? init.value ?? init.bonus ?? null;
    }
    if (initVal != null) {
      basicLines.push(
        `Initiative Bonus: ${initVal >= 0 ? "+" : ""}${initVal}`
      );
    }

    // Size
    const sizeKey = sys.traits?.size;
    if (sizeKey) {
      const sizeLabel =
        DND.actorSizes?.[sizeKey]?.label ||
        DND.actorSizes?.[sizeKey] ||
        sizeKey.toString().toUpperCase();
      basicLines.push(`Size: ${sizeLabel}`);
    }

    // Max HP / current HP
    const hpMax = sys.attributes?.hp?.max;
    if (hpMax != null) {
      const hpCurr = sys.attributes?.hp?.value ?? null;
      basicLines.push(
        `Hit Points: ${hpCurr != null ? `${hpCurr}/` : ""}${hpMax}`
      );
    }

    // Hit Dice (best-effort)
    const hdAttr = sys.attributes?.hd;
    const hdParts = [];
    if (hdAttr?.value || hdAttr?.max || hdAttr?.formula) {
      const used = hdAttr.value != null ? hdAttr.value : (hdAttr.used ?? null);
      const max = hdAttr.max ?? null;
      const formula = hdAttr.formula ?? null;
      if (formula) hdParts.push(`Formula: ${formula}`);
      if (max != null) hdParts.push(`Total Dice: ${max}${used != null ? ` (used ${used})` : ""}`);
    } else if (classItems.length) {
      // Fall back to class hit dice
      const cds = classItems.map(ci => {
        const hd = ci.system?.hitDice ?? ci.system?.hd;
        const lvl = ci.system?.levels ?? ci.system?.level;
        if (!hd) return null;
        return lvl != null ? `${lvl}×${hd} (${ci.name})` : `${hd} (${ci.name})`;
      }).filter(Boolean);
      if (cds.length) hdParts.push(...cds);
    }
    if (hdParts.length) {
      basicLines.push(`Hit Dice: ${hdParts.join("; ")}`);
    }

    // Movement / Speed
    const mv = sys.attributes?.movement ?? {};
    const moveLines = [];
    const units = mv.units || "ft";
    if (mv.walk != null)  moveLines.push(`Walk: ${mv.walk} ${units}`);
    if (mv.fly  != null)  moveLines.push(`Fly: ${mv.fly} ${units}`);
    if (mv.climb != null) moveLines.push(`Climb: ${mv.climb} ${units}`);
    if (mv.swim != null)  moveLines.push(`Swim: ${mv.swim} ${units}`);
    if (mv.burrow != null) moveLines.push(`Burrow: ${mv.burrow} ${units}`);
    if (mv.hover) moveLines.push(`Hover: yes`);

    if (moveLines.length) {
      basicLines.push(`Speed:\n  ${moveLines.join("\n  ")}`);
    }

    // Money / currency
    const cur = sys.currency ?? sys.currencies ?? {};
    const curParts = [];
    if (cur.pp) curParts.push(`${cur.pp} pp`);
    if (cur.gp) curParts.push(`${cur.gp} gp`);
    if (cur.ep) curParts.push(`${cur.ep} ep`);
    if (cur.sp) curParts.push(`${cur.sp} sp`);
    if (cur.cp) curParts.push(`${cur.cp} cp`);
    if (curParts.length) {
      basicLines.push(`Money: ${curParts.join(", ")}`);
    }

    if (basicLines.length) {
      sections.push("Basic Info:\n" + basicLines.join("\n"));
    }

    /* -------------------- ABILITY SCORES -------------------- */
    const abil = sys.abilities ?? {};
    const abilNames = {
      str: "Strength",
      dex: "Dexterity",
      con: "Constitution",
      int: "Intelligence",
      wis: "Wisdom",
      cha: "Charisma"
    };
    const abilLines = [];

    for (const [k, data] of Object.entries(abil)) {
      const name = abilNames[k] || k.toUpperCase();
      const val = data.value ?? data.score ?? data.base;
      const mod = data.mod ?? data.modifier;
      const save = data.save ?? data.saveBonus;
      const parts = [];
      if (val != null) parts.push(`${val}`);
      if (mod != null) parts.push(`mod ${mod >= 0 ? "+" : ""}${mod}`);
      if (save != null) parts.push(`save ${save >= 0 ? "+" : ""}${save}`);
      if (parts.length) abilLines.push(`${name}: ${parts.join(", ")}`);
    }

    if (abilLines.length) {
      sections.push("Ability Scores:\n" + abilLines.join("\n"));
    }

    /* -------------------- SKILLS -------------------- */
    const skills = sys.skills ?? {};
    const skillConfig = DND.skills ?? {};
    const skillLines = [];

    for (const [k, data] of Object.entries(skills)) {
      const label = skillConfig[k] || k.toUpperCase();
      const total = data.total ?? data.mod ?? data.value;
      const mod = data.mod ?? null;
      const parts = [];
      if (total != null) parts.push(`total ${total >= 0 ? "+" : ""}${total}`);
      if (mod != null && mod !== total) parts.push(`mod ${mod >= 0 ? "+" : ""}${mod}`);
      if (!parts.length) continue;
      skillLines.push(`${label}: ${parts.join(", ")}`);
    }

    if (skillLines.length) {
      sections.push("Skills:\n" + skillLines.join("\n"));
    }

    /* -------------------- LANGUAGES -------------------- */
    const traits = sys.traits ?? {};
    const lang = traits.languages ?? {};
    const langConfig = DND.languages ?? {};
    const langValues = Array.isArray(lang.value) ? lang.value : [];
    const langLines = [];

    if (langValues.length) {
      const names = langValues.map(k => langConfig[k]?.label || langConfig[k] || k);
      langLines.push(`Languages: ${names.join(", ")}`);
    }
    if (lang.custom) {
      langLines.push(`Custom Languages: ${lang.custom}`);
    }

    if (langLines.length) {
      sections.push(langLines.join("\n"));
    }

    /* -------------------- SENSES -------------------- */
    const sensesLines = [];
    const senses = sys.attributes?.senses ?? {};
    const senseMap = {
      darkvision: "Darkvision",
      blindsight: "Blindsight",
      tremorsense: "Tremorsense",
      truesight: "Truesight"
    };
    const senseUnit = senses.units || "ft";

    for (const [key, label] of Object.entries(senseMap)) {
      const v = senses[key];
      if (v != null && v !== 0) {
        sensesLines.push(`${label}: ${v} ${senseUnit}`);
      }
    }
    if (senses.special) {
      sensesLines.push(`Special Senses: ${senses.special}`);
    }
    // older dnd5e used traits.senses as a string
    if (!sensesLines.length && traits.senses) {
      sensesLines.push(`Senses: ${traits.senses}`);
    }

    if (sensesLines.length) {
      sections.push("Senses:\n" + sensesLines.join("\n"));
    }

    /* -------------------- DEFENSE / RESISTANCES -------------------- */
    const defLines = [];

    // Armor Class
    const acVal = sys.attributes?.ac?.value ?? sys.attributes?.ac;
    if (acVal != null && typeof acVal !== "object") {
      defLines.push(`Armor Class: ${acVal}`);
    } else if (sys.attributes?.ac?.value != null) {
      defLines.push(`Armor Class: ${sys.attributes.ac.value}`);
    }

    const dmgTypes = DND.damageTypes ?? {};
    const condTypes = DND.conditionTypes ?? {};

    const mapKeysToNames = (keys, table) => {
      if (!Array.isArray(keys)) return [];
      return keys.map(k => table[k]?.label || table[k] || k);
    };

    const di = traits.di ?? {}; // damage immunities
    const dr = traits.dr ?? {}; // damage resistances
    const dv = traits.dv ?? {}; // damage vulnerabilities
    const ci = traits.ci ?? {}; // condition immunities

    const diNames = mapKeysToNames(di.value, dmgTypes);
    const drNames = mapKeysToNames(dr.value, dmgTypes);
    const dvNames = mapKeysToNames(dv.value, dmgTypes);
    const ciNames = mapKeysToNames(ci.value, condTypes);

    if (diNames.length || di.custom) {
      defLines.push(
        `Damage Immunities: ` +
        [diNames.join(", "), di.custom].filter(Boolean).join("; ")
      );
    }
    if (drNames.length || dr.custom) {
      defLines.push(
        `Damage Resistances: ` +
        [drNames.join(", "), dr.custom].filter(Boolean).join("; ")
      );
    }
    if (dvNames.length || dv.custom) {
      defLines.push(
        `Damage Vulnerabilities: ` +
        [dvNames.join(", "), dv.custom].filter(Boolean).join("; ")
      );
    }
    if (ciNames.length || ci.custom) {
      defLines.push(
        `Condition Immunities: ` +
        [ciNames.join(", "), ci.custom].filter(Boolean).join("; ")
      );
    }

    if (defLines.length) {
      sections.push("Defenses:\n" + defLines.join("\n"));
    }

    /* -------------------- ARMOR & WEAPONS -------------------- */
    const armorItems = actor.items.filter(i => i.type === "equipment" && i.system?.armor);
    const armorLines = armorItems.map(i => {
      const ac = i.system.armor.value ?? i.system.armor.ac ?? null;
      const typeKey = i.system.armor.type ?? i.system.armor?.category;
      const typeLabel = DND.armorProficiencies?.[typeKey]?.label ||
                        DND.armorProficiencies?.[typeKey] ||
                        typeKey ||
                        "armor";
      const equipped = i.system.equipped ? "equipped" : "unequipped";
      const parts = [`${i.name}`];
      if (ac != null) parts.push(`AC ${ac}`);
      parts.push(typeLabel);
      parts.push(equipped);
      return parts.join(" | ");
    });

    if (armorLines.length) {
      sections.push("Armor:\n" + armorLines.join("\n"));
    }

    const weaponItems = actor.items.filter(i => i.type === "weapon");
    const weaponLines = weaponItems.map(i => {
      const atk = i.system.attackBonus ?? i.system.bonus ?? null;
      const dmgParts = Array.isArray(i.system.damage?.parts) ? i.system.damage.parts : [];
      const dmgText = dmgParts.map(p => p[0]).join(" + ");
      const parts = [`${i.name}`];
      if (atk != null) parts.push(`attack ${atk >= 0 ? "+" : ""}${atk}`);
      if (dmgText) parts.push(`damage ${dmgText}`);
      return parts.join(" | ");
    });

    if (weaponLines.length) {
      sections.push("Weapons:\n" + weaponLines.join("\n"));
    }

    /* -------------------- FEATS & FEATURES -------------------- */
    const featItems = actor.items.filter(i => i.type === "feat");
    const featLines = [];
    const classFeatureLines = [];
    const raceFeatureLines = [];
    const backgroundFeatureLines = [];

    for (const f of featItems) {
      const ft = f.system?.type?.value ?? f.system?.type ?? f.flags?.dnd5e?.featType ?? "";
      const lower = String(ft).toLowerCase();

      if (lower.includes("class")) {
        classFeatureLines.push(f.name);
      } else if (lower.includes("race") || lower.includes("species") || lower.includes("ancestry")) {
        raceFeatureLines.push(f.name);
      } else if (lower.includes("background")) {
        backgroundFeatureLines.push(f.name);
      } else {
        featLines.push(f.name);
      }
    }

    if (classFeatureLines.length) {
      sections.push("Class Features:\n" + classFeatureLines.join(", "));
    }
    if (raceFeatureLines.length) {
      sections.push("Species / Race Features:\n" + raceFeatureLines.join(", "));
    }
    if (backgroundFeatureLines.length) {
      sections.push("Background Features:\n" + backgroundFeatureLines.join(", "));
    }
    if (featLines.length) {
      sections.push("Feats:\n" + featLines.join(", "));
    }

    /* -------------------- PROFICIENCIES (WEAPON / ARMOR / TOOL) -------------------- */
    const profLines = [];

    const profTraitToText = (trait, table) => {
      if (!trait) return null;
      const vals = Array.isArray(trait.value) ? trait.value : [];
      const names = vals.map(k => table?.[k]?.label || table?.[k] || k);
      const custom = trait.custom ? trait.custom : "";
      const all = [names.join(", "), custom].filter(Boolean).join("; ");
      return all || null;
    };

    const wProf = profTraitToText(traits.weaponProf, DND.weaponProficiencies);
    const aProf = profTraitToText(traits.armorProf, DND.armorProficiencies);
    const tProf = profTraitToText(traits.toolProf, DND.toolProficiencies);

    if (wProf) profLines.push(`Weapon Proficiencies: ${wProf}`);
    if (aProf) profLines.push(`Armor Proficiencies: ${aProf}`);
    if (tProf) profLines.push(`Tool Proficiencies: ${tProf}`);

    if (profLines.length) {
      sections.push("Proficiencies:\n" + profLines.join("\n"));
    }

    /* -------------------- INVENTORY (NAMES & QUANTITY ONLY) -------------------- */
    const invItems = actor.items.filter(i => i.type !== "class" && i.type !== "spell" && i.type !== "feat");
    if (invItems.length) {
      const invLines = invItems.map(i => {
        const qty = i.system?.quantity ?? i.system?.qty;
        return qty != null && qty !== 1 ? `${i.name} x${qty}` : i.name;
      });
      sections.push("Inventory:\n" + invLines.join("\n"));
    }

    /* -------------------- SPELLS (NAMES ONLY) -------------------- */
    const spells = actor.items.filter(i => i.type === "spell");
    if (spells.length) {
      const byLevel = {};
      for (const sp of spells) {
        const lvl = sp.system?.level ?? 0;
        if (!byLevel[lvl]) byLevel[lvl] = [];
        byLevel[lvl].push(sp.name);
      }
      const spellLines = [];
      const levelNames = {
        0: "Cantrips",
        1: "1st-level",
        2: "2nd-level",
        3: "3rd-level",
        4: "4th-level",
        5: "5th-level",
        6: "6th-level",
        7: "7th-level",
        8: "8th-level",
        9: "9th-level"
      };
      for (const lvl of Object.keys(byLevel).sort((a, b) => Number(a) - Number(b))) {
        const list = byLevel[lvl].join(", ");
        const label = levelNames[lvl] || `Level ${lvl}`;
        spellLines.push(`${label}: ${list}`);
      }
      sections.push("Spells (names only):\n" + spellLines.join("\n"));
    }

    /* -------------------- PHYSICAL & PERSONALITY -------------------- */
    const physLines = [];
    if (det.gender)   physLines.push(`Gender: ${det.gender}`);
    if (det.age)      physLines.push(`Age: ${det.age}`);
    if (det.height)   physLines.push(`Height: ${det.height}`);
    if (det.weight)   physLines.push(`Weight: ${det.weight}`);
    if (det.eyes)     physLines.push(`Eyes: ${det.eyes}`);
    if (det.hair)     physLines.push(`Hair: ${det.hair}`);
    if (det.skin)     physLines.push(`Skin: ${det.skin}`);
    if (det.faith)    physLines.push(`Faith: ${det.faith}`);
    if (det.appearance) physLines.push(`Appearance: ${det.appearance}`);

    const ethosLines = [];
    const ideals  = det.ideals?.value ?? det.ideals;
    const traitsT = det.traits?.value ?? det.traits;
    const bonds   = det.bonds?.value ?? det.bonds;
    const flaws   = det.flaws?.value ?? det.flaws;

    if (traitsT) ethosLines.push(`Personality Traits: ${traitsT}`);
    if (ideals)  ethosLines.push(`Ideals: ${ideals}`);
    if (bonds)   ethosLines.push(`Bonds: ${bonds}`);
    if (flaws)   ethosLines.push(`Flaws: ${flaws}`);

    if (physLines.length || ethosLines.length) {
      sections.push(
        "Personal Details:\n" +
        [...physLines, ...ethosLines].join("\n")
      );
    }

    /* -------------------- BIOGRAPHY -------------------- */
    const bioParts = [];
    if (det.biography?.value)  bioParts.push(det.biography.value);
    if (det.biography?.public) bioParts.push(det.biography.public);
    if (sys.biography)         bioParts.push(sys.biography);

    let bio = bioParts.filter(Boolean).join("\n\n");
    if (bio) {
      const bioText = stripToPlain(bio);
      if (bioText && bioText.trim()) {
        sections.push("Biography:\n" + bioText.trim());
      }
    }

    /* -------------------- FINAL DOC -------------------- */
    const content = sections.join("\n\n").trim();
    if (!content) return null;

    return {
      id: actor.id,
      title: `Actor: ${actor.name}`,
      content
    };
  } catch (e) {
    console.error("RPGX Librarian | collectSingleActorDoc failed", e, actor);
    return null;
  }
}

/* ---------------------- Helpers: gather world Item text ---------------------- */

/**
 * Collects all world-level Items (from the Items directory, not compendiums)
 * and converts them into docs for ingestion.
 */
async function collectAllItemDocs() {
  const coll  = game.items;
  const items = Array.isArray(coll?.contents) ? coll.contents : Array.from(coll ?? []);
  const out   = [];

  for (const item of items) {
    const doc = collectSingleItemDoc(item);
    if (doc) out.push(doc);
  }

  console.debug("RPGX Librarian | collectAllItemDocs found:", out.length, "docs");
  return out;
}

/**
 * Convert a single Item into a doc for the RAG server.
 * We keep:
 *  - Name
 *  - Type
 *  - Basic mechanical fields (rarity, cost, etc. when present)
 *  - Description (stripped to plain text)
 *
 * No compendium items are included here — only world items.
 */
function collectSingleItemDoc(item) {
  try {
    const sys = item.system ?? item.data?.data ?? {};
    const lines = [];

    // Name & type
    lines.push(`Name: ${item.name}`);
    if (item.type) lines.push(`Type: ${item.type}`);

    // Common D&D5e-ish fields if present
    if (sys.rarity)    lines.push(`Rarity: ${sys.rarity}`);
    if (sys.attunement !== undefined && sys.attunement !== null) {
      // dnd5e uses 0/1/2 for attunement sometimes
      let att = sys.attunement;
      if (typeof att === "number") {
        const map = { 0: "No", 1: "Required", 2: "Optional" };
        att = map[att] ?? att;
      }
      lines.push(`Attunement: ${att}`);
    }
    if (sys.type?.value || sys.type) {
      const t = sys.type?.value ?? sys.type;
      lines.push(`Subtype: ${t}`);
    }
    if (sys.price || sys.cost) {
      const price = sys.price ?? sys.cost;
      lines.push(`Cost: ${price}`);
    }

    // Damage / AC etc if it's a weapon/armor-like item
    if (sys.damage?.parts && Array.isArray(sys.damage.parts) && sys.damage.parts.length) {
      const dmgText = sys.damage.parts.map(p => p[0]).join(" + ");
      if (dmgText) lines.push(`Damage: ${dmgText}`);
    }
    if (sys.armor?.value || sys.armor?.ac) {
      const ac = sys.armor.value ?? sys.armor.ac;
      lines.push(`Armor: AC ${ac}`);
    }

    // Description (plain text)
    let descHtml = sys.description?.value ?? sys.description ?? "";
    descHtml = descHtml ?? "";
    const descText = descHtml ? stripToPlain(descHtml) : "";
    if (descText) {
      lines.push("Description:");
      lines.push(descText);
    }

    const content = lines.join("\n").trim();
    if (!content) return null;

    return {
      id: item.id,
      title: `Item: ${item.name}`,
      content
    };
  } catch (e) {
    console.error("RPGX Librarian | collectSingleItemDoc failed", e, item);
    return null;
  }
}

/* ----------------------------- Settings Footer ----------------------------- */

Hooks.on("renderSettingsConfig", (app, html, context, options) => {
  // Support both AppV1 (jQuery) and AppV2 (HTMLElement)
  const root = html instanceof HTMLElement ? html : html[0];
  if (!root) return;

  // Don't add it multiple times if the form rerenders
  if (root.querySelector(".rpgx-footer-librarian")) return;

  // Find any setting that belongs to this module
  const settingElement =
    root.querySelector('input[name="rpgx-ai-librarian.ragBase"]') ||
    root.querySelector('input[name="rpgx-ai-librarian.chunkSize"]') ||
    root.querySelector('input[name="rpgx-ai-librarian.chunkOverlap"]') ||
    root.querySelector('[name^="rpgx-ai-librarian."]');

  // If our settings aren't visible, bail out
  if (!settingElement) return;

  // Find a reasonable container to append into
  let container =
    settingElement.closest(".tab") ||           // v11/v12 categories
    settingElement.closest(".settings-list") || // older layouts
    settingElement.closest("form") ||           // fallback
    root;

  // Build footer
  const footer = document.createElement("div");
  footer.classList.add("rpgx-footer-librarian");
  footer.style.marginTop = "1rem";
  footer.style.textAlign = "center";
  footer.style.fontSize = "0.9em";
  footer.style.lineHeight = "1.4em";
  footer.style.color = "var(--color-text-light-primary, #bbb)";

  footer.innerHTML = `
    <hr>
    <div>
      Thank you for using the <strong>RPGX AI Librarian</strong> created by
      <a href="https://x8xid82.wixsite.com/rpgxstudios" target="_blank" rel="noreferrer noopener">
        RPGX Studios
      </a>.<br>
      To find other tools and modules by RPGX Studios, please visit our
      <a href="https://www.patreon.com/c/rpgxstudios" target="_blank" rel="noreferrer noopener">
        Patreon Page
      </a>.
    </div>
  `;

  container.appendChild(footer);

  // Make sure the window resizes so the footer isn't cut off
  if (typeof app.setPosition === "function") app.setPosition();
});
