'use strict';
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const os = require('os');

const CLAUDE_DIR = path.join(os.homedir(), '.claude', 'projects');

function usageTokens(u) {
  if (!u) return 0;
  return (u.input_tokens || 0) + (u.output_tokens || 0) +
    (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0);
}

// user asks that smell like frontend/design work → the Taste Master badge
const FRONTEND_RE = /(css|tailwind|frontend|front-end|界面|样式|排版|组件|美化|好看|页面|网页|设计|布局|配色|动效|landing|layout|responsive|animation|button|navbar|artifact|html|ui\b|ux\b)/i;

function listFiles() {
  const files = [];
  try {
    for (const proj of fs.readdirSync(CLAUDE_DIR)) {
      const dir = path.join(CLAUDE_DIR, proj);
      let entries;
      try { entries = fs.readdirSync(dir); } catch { continue; }
      for (const f of entries) {
        if (f.endsWith('.jsonl')) files.push(path.join(dir, f));
      }
    }
  } catch { /* no claude dir */ }
  return files;
}

// Extract token counts from complete lines in `chunk`, dedup by message id.
// Also tallies a per-type usage split (for $ valuation) and counts
// frontend-flavored user asks. consumed = bytes of complete lines.
function processChunk(chunk, seenIds) {
  let tokens = 0, msgs = 0, fe = 0;
  const split = { inp: 0, out: 0, cr: 0, cw: 0 };
  const lastNl = chunk.lastIndexOf(10);
  if (lastNl === -1) return { tokens: 0, msgs: 0, consumed: 0, split, fe };
  const text = chunk.slice(0, lastNl + 1).toString('utf8');
  for (const line of text.split('\n')) {
    if (!line) continue;
    if (line.indexOf('"usage"') === -1) {
      // real human prompts only (tool results also arrive as role:user)
      if (line.indexOf('"type":"user"') !== -1 && line.indexOf('tool_use_id') === -1 &&
        line.indexOf('isMeta') === -1 && FRONTEND_RE.test(line)) fe++;
      continue;
    }
    try {
      const obj = JSON.parse(line);
      const msg = obj.message;
      if (!msg || !msg.usage) continue;
      const id = msg.id || obj.requestId || null;
      if (id) {
        if (seenIds.has(id)) continue;
        seenIds.add(id);
      }
      const u = msg.usage;
      split.inp += u.input_tokens || 0;
      split.out += u.output_tokens || 0;
      split.cr += u.cache_read_input_tokens || 0;
      split.cw += u.cache_creation_input_tokens || 0;
      tokens += usageTokens(u);
      msgs++;
    } catch { /* partial or foreign line */ }
  }
  return { tokens, msgs, consumed: lastNl + 1, split, fe };
}

class TokenSource {
  constructor(state, { demo = false } = {}) {
    this.state = state;
    this.demo = demo;
    this.seenIds = new Set(state.recentIds || []);
    this.offsets = state.fileOffsets || {};
    this.fileList = [];
    this.lastListAt = 0;
    this.demoCarry = 0;
  }

  hasHistory() { return listFiles().length > 0; }

  // Skip everything already on disk without counting it — token counting
  // starts at skill install, so history from before doesn't inflate the total.
  baseline() {
    for (const f of listFiles()) {
      try { this.offsets[f] = fs.statSync(f).size; } catch { /* unreadable */ }
    }
    this._persist();
  }

  _absorb(r) {
    const s = this.state.usageSplit || (this.state.usageSplit = { inp: 0, out: 0, cr: 0, cw: 0 });
    s.inp += r.split.inp; s.out += r.split.out; s.cr += r.split.cr; s.cw += r.split.cw;
    if (r.fe) this.state.frontendMsgs = (this.state.frontendMsgs || 0) + r.fe;
  }

  // Full historical scan (first run). Async so a progress UI can animate.
  async scanAll(onProgress) {
    const files = listFiles();
    let total = 0, sessions = 0;
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      try {
        const buf = await fsp.readFile(f);
        const r = processChunk(
          buf[buf.length - 1] === 10 ? buf : Buffer.concat([buf, Buffer.from('\n')]),
          this.seenIds
        );
        total += r.tokens;
        this._absorb(r);
        if (r.msgs > 0) sessions++;
        this.offsets[f] = buf.length;
      } catch { /* unreadable */ }
      if (onProgress) await onProgress(i + 1, files.length, total);
    }
    this._persist();
    return { tokens: total, sessions, files: files.length };
  }

  // Incremental poll; returns newly burned tokens since last call.
  poll() {
    if (this.demo) {
      // simulated burn: bursty, feels like a real coding session
      this.demoCarry += Math.random() < 0.4 ? Math.floor(200 + Math.random() * 4000) : 0;
      const out = this.demoCarry; this.demoCarry = 0;
      return out;
    }
    const now = Date.now();
    if (now - this.lastListAt > 30000) {
      this.fileList = listFiles();
      this.lastListAt = now;
    }
    let delta = 0;
    for (const f of this.fileList) {
      let st;
      try { st = fs.statSync(f); } catch { continue; }
      const off = this.offsets[f] || 0;
      if (st.size <= off) {
        if (st.size < off) this.offsets[f] = 0; // truncated/rotated
        continue;
      }
      try {
        const fd = fs.openSync(f, 'r');
        const len = Math.min(st.size - off, 8 * 1024 * 1024);
        const buf = Buffer.alloc(len);
        fs.readSync(fd, buf, 0, len, off);
        fs.closeSync(fd);
        const r = processChunk(buf, this.seenIds);
        this.offsets[f] = off + r.consumed;
        this._absorb(r);
        delta += r.tokens;
      } catch { /* skip */ }
    }
    if (delta > 0) this._persist();
    return delta;
  }

  _persist() {
    // keep the id set bounded
    if (this.seenIds.size > 5000) {
      this.seenIds = new Set([...this.seenIds].slice(-2500));
    }
    this.state.recentIds = [...this.seenIds].slice(-2500);
    this.state.fileOffsets = this.offsets;
  }
}

module.exports = { TokenSource, CLAUDE_DIR };
