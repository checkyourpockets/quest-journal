import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";

const PORT = 9222;
const BASE = process.env.QJ_URL || "http://127.0.0.1:5173/quest-journal/?fixture=1";
const OUT = process.env.QJ_OUT || "/tmp/qj-shots";

const chrome = spawn("google-chrome", [
  "--headless=new",
  "--disable-gpu",
  "--no-sandbox",
  "--hide-scrollbars",
  `--remote-debugging-port=${PORT}`,
  "--user-data-dir=/tmp/chrome-qj-profile",
  "about:blank",
], { stdio: "ignore" });

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function waitFor(url) {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return res;
    } catch { /* chrome still booting */ }
    await sleep(150);
  }
  throw new Error("chrome debugging port did not open");
}

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
}

async function main() {
  await mkdir(OUT, { recursive: true });
  await waitFor(`http://127.0.0.1:${PORT}/json/version`);
  let target;
  const created = await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(BASE)}`, { method: "PUT" });
  if (created.ok) target = await created.json();
  else target = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find((t) => t.webSocketDebuggerUrl);
  if (!target?.webSocketDebuggerUrl) throw new Error("no debuggable page: " + created.status);
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve);
    ws.addEventListener("error", () => reject(new Error("websocket failed")));
  });
  const cdp = new Cdp(ws);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  const errors = [];

  async function evalJs(expression) {
    const result = await cdp.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text + " " + (result.exceptionDetails.exception?.description || ""));
    return result.result?.value;
  }

  async function shot(name) {
    const { data } = await cdp.send("Page.captureScreenshot", { format: "png" });
    const file = `${OUT}/${name}.png`;
    await writeFile(file, Buffer.from(data, "base64"));
    console.log("wrote", file);
  }

  async function setSize(width, height) {
    await cdp.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 500 });
  }

  async function open() {
    await cdp.send("Page.navigate", { url: BASE });
    for (let i = 0; i < 40; i++) {
      const ready = await evalJs(`document.body && document.body.innerText.includes("Matt's Quest Journal") && document.querySelectorAll('[role=tab]').length === 9`);
      if (ready) return;
      const err = await evalJs(`document.body ? document.body.innerText.slice(0, 400) : ""`);
      if (typeof err === "string" && /not found|Fixture failed|missing fixture/i.test(err)) throw new Error(err);
      await sleep(250);
    }
    throw new Error("journal did not render: " + await evalJs(`document.body.innerText.slice(0, 500)`));
  }

  async function clickTab(name) {
    const ok = await evalJs(`(() => { const b = [...document.querySelectorAll('[role=tab]')].find(el => el.textContent.trim() === ${JSON.stringify(name)}); if (!b) return false; b.click(); return true; })()`);
    if (!ok) throw new Error("missing tab " + name);
    await sleep(200);
  }

  const tabs = ["Today", "Journal", "Chronicle", "Runes", "Crafting", "Backpack", "Ledger", "Character", "World"];
  const shots = [
    ["Today", "today"],
    ["Runes", "runes"],
    ["Crafting", "crafting"],
    ["Character", "character"],
  ];

  for (const [width, tag] of [[390, "390"], [1280, "1280"]]) {
    await setSize(width, width === 390 ? 844 : 900);
    await open();
    const headings = [];
    for (const name of tabs) {
      await clickTab(name);
      const heading = await evalJs(`document.querySelector('h2') ? document.querySelector('h2').textContent : ""`);
      headings.push(name + ":" + heading);
    }
    console.log(tag, headings.join(" | "));
    if (headings.some((h) => h.endsWith(":"))) errors.push(tag + " missing heading");

    await clickTab("Today");
    await evalJs(`window.scrollTo(0, 180)`);
    const before = await evalJs(`window.scrollY`);
    await evalJs(`document.querySelectorAll('.day')[3].click()`);
    await sleep(100);
    const after = await evalJs(`window.scrollY`);
    console.log(tag, "scroll", before, "->", after);
    if (Math.abs(after - before) > 2) errors.push(tag + " day card scrolled the page");

    await evalJs(`document.querySelector('.qrow').click()`);
    await sleep(250);
    const opened = await evalJs(`document.querySelector('h2') && document.querySelector('h2').textContent`);
    console.log(tag, "quest opened", opened);
    if (opened !== "Quest journal") errors.push(tag + " quest did not open the journal");

    await clickTab("Journal");
    await evalJs(`[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Habits').click()`);
    await sleep(150);
    const habit = await evalJs(`[...document.querySelectorAll('button')].some(b => /Done today|Logged today/.test(b.textContent))`);
    console.log(tag, "habit button", habit);
    if (!habit) errors.push(tag + " missing habit check");

    await clickTab("Runes");
    const started = await evalJs(`(() => { const b = [...document.querySelectorAll('button')].find(el => el.textContent.includes('Start rune review')); if (!b || b.disabled) return 'no'; b.click(); return 'yes'; })()`);
    await sleep(150);
    const show = await evalJs(`[...document.querySelectorAll('button')].some(b => b.textContent.includes('Show meaning'))`);
    console.log(tag, "review", started, show);
    if (started !== "yes" || !show) errors.push(tag + " rune review did not open");

    await clickTab("Crafting");
    const cards = await evalJs(`document.querySelectorAll('.rcard').length`);
    console.log(tag, "recipes", cards);
    if (cards !== 22) errors.push(tag + " expected 22 recipes, saw " + cards);
    const backpackBtn = await evalJs(`[...document.querySelectorAll('button')].some(b => b.textContent.trim() === '−' || b.getAttribute('aria-label')?.startsWith('One less'))`);
    await clickTab("Backpack");
    const minus = await evalJs(`document.querySelectorAll('.ib').length`);
    console.log(tag, "backpack buttons", minus, "crafting had minus?", backpackBtn);
    if (minus < 2) errors.push(tag + " backpack buttons missing");

    await clickTab("Character");
    await evalJs(`document.querySelector('[aria-label="Zoom in"]').click()`);
    const zoom = await evalJs(`[...document.querySelectorAll('button')].find(b => b.textContent.includes('%'))?.textContent`);
    console.log(tag, "zoom", zoom);
    if (zoom !== "150%") errors.push(tag + " zoom did not change");

    for (const [tab, slug] of shots) {
      await clickTab(tab);
      await evalJs(`window.scrollTo(0, 0)`);
      await sleep(80);
      await shot(`${slug}-${tag}`);
    }
  }

  chrome.kill();
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exit(1);
  }
  console.log("ok");
}

main().catch((err) => {
  console.error(err);
  chrome.kill();
  process.exit(1);
});
