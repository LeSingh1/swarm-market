import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { search, install, rate, runAgent } from "../lib/api";
import { DEMO } from "../types/contract";
import type { SkillPack } from "../types/contract";

// Marketplace UI ported from the Swarm Market design (Claude Design handoff):
// 60/40 store + agents, install-morph button, skill-pack flight, glow/rep-pop,
// Failed->Success flip, toast — wired to the live backend (real install + run).

type Card = { id: string; name: string; icon: string; description: string; repScore: number; author: string; hue: number };

const ICONS = ["🧭", "🔍", "🤝", "👁️", "🧵", "🔧", "✍️", "🛡️", "🧠", "📡"];
const HUES = [210, 280, 16, 320, 150, 45, 95, 350, 190, 60];
const iconFor = (domain: string, i: number) => {
  const d = domain.toLowerCase();
  if (/path|navig|spatial/.test(d)) return "🧭";
  if (/code|review|diff/.test(d)) return "🔍";
  if (/vision|image|chart/.test(d)) return "👁️";
  if (/safety|guard|security/.test(d)) return "🛡️";
  if (/memory|recall|context/.test(d)) return "🧵";
  if (/tool|api|forge/.test(d)) return "🔧";
  if (/sdr|outreach|sales|negoti/.test(d)) return "🤝";
  return ICONS[i % ICONS.length];
};
const toCard = (s: SkillPack, i: number): Card => ({
  id: s.id, name: s.name, icon: iconFor(s.domain, i), description: s.lesson,
  repScore: s.rep_score, author: s.provenance.created_by, hue: HUES[i % HUES.length],
});

// Fallback showcase if the backend is unreachable, so the store is never empty.
const FALLBACK: Card[] = [
  { id: "f1", name: "NavigatorPro", icon: "🧭", description: "Pathfinding + map-reading skills for spatial tasks.", repScore: 94, author: "agent-atlas", hue: 210 },
  { id: "f2", name: "CodeReviewer", icon: "🔍", description: "Automated PR review patterns and diff reasoning.", repScore: 87, author: "agent-sigma", hue: 280 },
  { id: "f3", name: "NegotiatorKit", icon: "🤝", description: "Deal-closing conversation flows and counter-offers.", repScore: 78, author: "agent-nova", hue: 16 },
];

const hueColor = (h: number, l = 58) => `hsl(${h} 11% ${l}%)`;

const StarIcon = () => (<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.26L21.8 9.27l-4.9 4.78 1.16 6.95L12 17.77l-6.06 3.23L7.1 14.05 2.2 9.27l6.9-1.01z" /></svg>);
const SearchIcon = () => (<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>);
const PlayIcon = () => (<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>);
const CheckIcon = () => (<svg className="check-draw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>);

type Pt = { x: number; y: number };

/* ---------- Skill-pack card ---------- */
function SkillPackCard({ pack, index, onInstall }: { pack: Card; index: number; onInstall: (p: Card, r: DOMRect | null) => void }) {
  const [state, setState] = useState<"idle" | "installing" | "spin2" | "done">("idle");
  const [glow, setGlow] = useState(false);
  const [rep, setRep] = useState(pack.repScore);
  const [pop, setPop] = useState(false);
  const [shown, setShown] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { const t = setTimeout(() => setShown(true), index * 55); return () => clearTimeout(t); }, [index]);

  const doInstall = () => {
    if (state !== "idle") return;
    setState("installing");
    setTimeout(() => setState("spin2"), 300);
    setTimeout(() => {
      setState("done");
      setGlow(true);
      onInstall(pack, btnRef.current ? btnRef.current.getBoundingClientRect() : null);
    }, 600);
    setTimeout(() => { setRep((r) => r + 1); setPop(true); }, 900);
    setTimeout(() => setPop(false), 1350);
    setTimeout(() => setGlow(false), 2200);
  };

  return (
    <div className={"card" + (shown ? " shown" : "") + (glow ? " glow" : "")}>
      <div className="card-icon" style={{ background: `radial-gradient(circle at 35% 30%, ${hueColor(pack.hue, 30)}, #14161b)` }}>{pack.icon}</div>
      <div className="card-head">
        <div className="card-name">{pack.name}</div>
        <div className={"rep" + (pop ? " pop" : "")}><StarIcon />{rep}</div>
      </div>
      <div className="card-desc">{pack.description}</div>
      <div className="card-foot">
        <div className="author">
          <span className="author-dot" style={{ background: hueColor(pack.hue) }} />
          <span className="author-id">{pack.author}</span>
        </div>
        <button ref={btnRef} className={"btn-install" + (state === "done" ? " done" : state !== "idle" ? " installing" : "")} onClick={doInstall}>
          {state === "idle" && <span className="lbl">Install</span>}
          {(state === "installing" || state === "spin2") && <span className="spinner" />}
          {state === "done" && <CheckIcon />}
        </button>
      </div>
    </div>
  );
}

/* ---------- Publisher panel (ambient, scripted — "the registry is live") ---------- */
const PUB_LINES = [
  "published a skill-pack → registry. signed + indexed.",
  "packaged solved traces into a reusable pack. uploading…",
  "verified provenance · 0 conflicts · listing is live.",
];
function PublisherPanel() {
  const [idx, setIdx] = useState(0);
  const [typed, setTyped] = useState(PUB_LINES[0]);
  const [running, setRunning] = useState(false);
  const run = () => {
    if (running) return;
    setRunning(true); setTyped("");
    const next = (idx + 1) % PUB_LINES.length;
    const line = PUB_LINES[next];
    let i = 0;
    const type = () => { i++; setTyped(line.slice(0, i)); if (i < line.length) setTimeout(type, 16); else { setRunning(false); setIdx(next); } };
    setTimeout(type, 360);
  };
  return (
    <div className="panel success">
      <span className="panel-label">Publisher</span>
      <div className="panel-top">
        <div className="avatar live" style={{ background: `radial-gradient(circle at 35% 30%, ${hueColor(210, 50)}, #14171f)` }}>🛰️</div>
        <div className="agent-meta"><div className="agent-name">agent-atlas</div><div className="agent-role">publishes skill-packs</div></div>
        <button className="btn-run" onClick={run} disabled={running}>
          {running ? <span className="spinner" style={{ width: 13, height: 13, borderWidth: 2 }} /> : <PlayIcon />}{running ? "Running" : "Run"}
        </button>
      </div>
      <div className="output soft"><span className="prompt">{"› "}</span><span className="typed">{typed}</span>{running && <span className="caret" />}</div>
      <div className="badge-row">
        <span className="latency">latency 0.4s · live</span>
        <span className="outcome ok"><span className="dot" />✓ Success</span>
      </div>
    </div>
  );
}

/* ---------- App ---------- */
export function Market() {
  const [packs, setPacks] = useState<Card[]>(FALLBACK);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"default" | "rep">("default");
  const [installs, setInstalls] = useState(0);
  const [lastInstalled, setLastInstalled] = useState<string | null>(null);
  const [toast, setToast] = useState<{ id: number; name: string } | null>(null);
  const [flights, setFlights] = useState<Array<{ id: number; name: string; icon: string; from: Pt; to: Pt }>>([]);
  const [pulses, setPulses] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [bump, setBump] = useState(false);
  const [flip, setFlip] = useState(false);
  const [consumer, setConsumer] = useState<{ running: boolean; output: string }>({
    running: false, output: "cold start — no skill-packs installed. run to attempt the task.",
  });
  const searchRef = useRef<HTMLInputElement>(null);

  const consumerSuccess = installs > 0;

  // real packs from the live backend (fallback to showcase)
  useEffect(() => {
    let alive = true;
    search("").then((p) => { if (alive && p.length) setPacks(p.map(toCard)); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? packs.filter((p) => (p.name + p.description + p.author).toLowerCase().includes(q)) : packs;
    return sort === "rep" ? [...list].sort((a, b) => b.repScore - a.repScore) : list;
  }, [packs, query, sort]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "/" && document.activeElement !== searchRef.current) { e.preventDefault(); searchRef.current?.focus(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 2900); return () => clearTimeout(t); }, [toast]);

  // real backend consumer run — shows the actual agent output (the email)
  const runConsumer = async () => {
    setConsumer((c) => ({ ...c, running: true }));
    try {
      const run = await runAgent({ agent_id: DEMO.consumerId, task: DEMO.task });
      setConsumer({ running: false, output: run.result });
    } catch {
      setConsumer((c) => ({ ...c, running: false }));
    }
  };

  // skill-pack flight: card -> consumer avatar
  const handleInstall = (pack: Card, rect: DOMRect | null) => {
    // fire the real backend install + rate (best-effort, doesn't block the animation)
    install(DEMO.consumerId, pack.id).then(() => rate(pack.id)).catch(() => {});
    const av = document.getElementById("consumer-avatar");
    const ar = av?.getBoundingClientRect();
    const from = rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : null;
    const to = ar ? { x: ar.left + ar.width / 2, y: ar.top + ar.height / 2 } : null;
    if (from && to) setFlights((f) => [...f, { id: Date.now() + Math.random(), name: pack.name, icon: pack.icon, from, to }]);
    else finalize(pack, to);
  };

  const finalize = (pack: Card, to: Pt | null) => {
    const firstInstall = installs === 0;
    setInstalls((n) => n + 1);
    setLastInstalled(pack.name);
    setToast({ id: Date.now(), name: pack.name });
    setBump(true); setTimeout(() => setBump(false), 600);
    setFlip(true); setTimeout(() => setFlip(false), 600);
    if (to) setPulses((p) => [...p, { id: Date.now() + Math.random(), x: to.x, y: to.y }]);
    if (firstInstall) runConsumer(); // real run — fetches the upgraded (success) output
  };

  return (
    <div className="app">
      <style>{CSS}</style>

      {/* LEFT — store */}
      <div className="col col-store">
        <div className="store-top">
          <div className="brand">
            <div className="brand-mark"><i /></div>
            <div>
              <div className="brand-name">Swarm<span>Market</span></div>
              <div className="brand-sub">agent skill-pack registry</div>
            </div>
          </div>
          <div className="store-stats">
            <div className="stat"><b>{packs.length}</b><small>packs</small></div>
            <div className="stat">
              <motion.b key={installs} style={{ color: "var(--green-bright)" }} initial={{ scale: 1.45, opacity: 0.5 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 500, damping: 18 }}>{installs}</motion.b>
              <small>installs</small>
            </div>
          </div>
        </div>

        <div className="search">
          <SearchIcon />
          <input ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search skill-packs by name, capability or author…" />
          <AnimatePresence mode="wait" initial={false}>
            {query ? (
              <motion.button key="clear" className="clear" onClick={() => { setQuery(""); searchRef.current?.focus(); }} initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }} transition={{ duration: 0.15 }} aria-label="Clear search">✕</motion.button>
            ) : (
              <motion.kbd key="kbd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>/</motion.kbd>
            )}
          </AnimatePresence>
        </div>

        <div className="toolbar">
          <div className="result-count">
            {query ? <span><b>{filtered.length}</b> {filtered.length === 1 ? "match" : "matches"} for “{query}”</span> : <span><b>{packs.length}</b> skill-packs in the registry</span>}
          </div>
          <div className="seg">
            {([["default", "Newest"], ["rep", "Top rated"]] as const).map(([k, label]) => (
              <button key={k} className={sort === k ? "on" : ""} onClick={() => setSort(k)}>
                {sort === k && <motion.span layoutId="segPill" className="seg-pill" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                {label}
              </button>
            ))}
          </div>
        </div>

        <motion.div className="grid" layout>
          <AnimatePresence>
            {filtered.map((pack, i) => (
              <motion.div key={pack.id} layout initial={false} exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.18 } }} transition={{ type: "spring", stiffness: 380, damping: 34 }}>
                <SkillPackCard pack={pack} index={i} onInstall={handleInstall} />
              </motion.div>
            ))}
          </AnimatePresence>
          {filtered.length === 0 && <div className="empty">no skill-packs match “{query}”</div>}
        </motion.div>
      </div>

      {/* RIGHT — agents */}
      <div className="col col-agents">
        <div className="panels-head"><h2>Live Agents</h2><span className="line" /></div>
        <PublisherPanel />

        <div className="panels-head" style={{ marginTop: 2 }}><h2>Downstream</h2><span className="line" /></div>

        <div className={"panel" + (consumerSuccess ? " success" : "")}>
          <span className="panel-label">Consumer</span>
          <div className="panel-top">
            <div id="consumer-avatar" className={"avatar" + (bump ? " bump" : "")} style={{ background: `radial-gradient(circle at 35% 30%, ${hueColor(consumerSuccess ? 150 : 250, 50)}, #14171f)` }}>🤖</div>
            <div className="agent-meta"><div className="agent-name">agent-rover</div><div className="agent-role">consumes skill-packs</div></div>
            <button className="btn-run" onClick={runConsumer} disabled={consumer.running}>
              {consumer.running ? <span className="spinner" style={{ width: 13, height: 13, borderWidth: 2 }} /> : <PlayIcon />}{consumer.running ? "Running" : "Run"}
            </button>
          </div>
          <div className={"output" + (consumerSuccess ? " bright" : "")}>
            <span className="prompt">{"› "}</span>
            <span className="typed">{consumer.output}</span>
            {consumer.running && <span className="caret" />}
          </div>
          <div className="badge-row">
            <span className="latency">{consumerSuccess ? "latency 0.4s · 1 skill" : "latency 2.1s · 0 skills"}</span>
            <span className={"outcome " + (consumerSuccess ? "ok" : "fail") + (flip ? " flip" : "")}>
              <span className="dot" />{consumerSuccess ? "✓ Success" : "✗ Failed"}
            </span>
          </div>
        </div>

        <div className="hint">{consumerSuccess ? "↑ install upgraded the consumer — outcome flipped to Success" : "Install any pack on the left to upgrade the consumer agent →"}</div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div className="toast-wrap" key="toast" initial={{ opacity: 0, y: 26, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 14, scale: 0.97 }} transition={{ type: "spring", stiffness: 440, damping: 30 }}>
            <div className="toast"><span className="tcheck">✓</span><div className="tmsg"><b>{toast.name}</b> installed<em>agent-rover upgraded ↑</em></div></div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flight-layer">
        <AnimatePresence>
          {flights.map((fl) => (
            <motion.div key={fl.id} className="packet"
              initial={{ x: fl.from.x - 19, y: fl.from.y - 19, scale: 0.5, opacity: 0, rotate: -12 }}
              animate={{ x: [fl.from.x - 19, (fl.from.x + fl.to.x) / 2 - 19, fl.to.x - 19], y: [fl.from.y - 19, Math.min(fl.from.y, fl.to.y) - 100, fl.to.y - 19], scale: [0.5, 1.05, 0.38], opacity: [0, 1, 1], rotate: [-12, 4, 0] }}
              transition={{ duration: 0.8, ease: "easeInOut", times: [0, 0.55, 1] }}
              onAnimationComplete={() => { setFlights((f) => f.filter((x) => x.id !== fl.id)); finalize({ name: fl.name, icon: fl.icon } as Card, fl.to); }}>
              {fl.icon}
            </motion.div>
          ))}
        </AnimatePresence>
        {pulses.map((p) => (
          <motion.div key={p.id} className="land-ring" initial={{ x: p.x - 9, y: p.y - 9, scale: 0.4, opacity: 0.85 }} animate={{ scale: 7, opacity: 0 }} transition={{ duration: 0.75, ease: "easeOut" }} onAnimationComplete={() => setPulses((ps) => ps.filter((x) => x.id !== p.id))} />
        ))}
      </div>
    </div>
  );
}

const CSS = `
.app { --bg:#0a0b0e; --bg-2:#0c0e12; --surface:#121419; --surface-2:#171a21; --border:#23262f; --border-soft:#1a1d24;
  --text:#ECEDF0; --text-dim:#9a9da8; --text-faint:#5d616e; --blue:#c4ee52; --blue-bright:#d2f56a;
  --amber:#c4ee52; --green:#c4ee52; --green-bright:#d2f56a; --mono:'JetBrains Mono', ui-monospace, monospace;
  height:100vh; display:grid; grid-template-columns:60% 40%; position:relative; color:var(--text);
  font-family:'Space Grotesk', system-ui, sans-serif; -webkit-font-smoothing:antialiased;
  background: radial-gradient(1100px 700px at 18% -10%, rgba(196,238,82,0.05), transparent 60%),
    radial-gradient(900px 600px at 110% 120%, rgba(196,238,82,0.03), transparent 55%), var(--bg); }
.app * { box-sizing:border-box; margin:0; padding:0; }
.app .col { height:100vh; overflow-y:auto; }
.app .col-store { padding:28px 30px 60px; }
.app .col-agents { border-left:1px solid var(--border-soft); background:linear-gradient(180deg, rgba(255,255,255,0.012), transparent 30%), var(--bg-2); padding:24px 24px 40px; display:flex; flex-direction:column; gap:18px; }
.app ::-webkit-scrollbar { width:10px; } .app ::-webkit-scrollbar-track { background:transparent; }
.app ::-webkit-scrollbar-thumb { background:#262b38; border-radius:8px; border:2px solid var(--bg); }

.app .brand { display:flex; align-items:center; gap:12px; }
.app .brand-mark { width:34px; height:34px; border-radius:9px; position:relative; flex:none; background:linear-gradient(150deg,#c8f05a 0%,#9bc62f 100%); box-shadow:0 4px 16px rgba(196,238,82,0.28), inset 0 1px 0 rgba(255,255,255,0.25); overflow:hidden; animation:markPulse 3.2s ease-in-out infinite; }
.app .brand-mark::before, .app .brand-mark::after, .app .brand-mark i { content:""; position:absolute; width:6px; height:6px; border-radius:50%; background:#0a0b0e; opacity:0.9; }
/* three agents orbiting in distinct paths — a live swarm */
.app .brand-mark::before { top:8px; left:14px; animation:swarmA 3.2s ease-in-out infinite; }
.app .brand-mark::after { bottom:8px; left:8px; animation:swarmB 3.2s ease-in-out infinite; }
.app .brand-mark i { bottom:9px; right:8px; animation:swarmC 3.2s ease-in-out infinite; }
@keyframes swarmA { 0%,100% { transform:translate(0,0); } 33% { transform:translate(-5px,6px); } 66% { transform:translate(4px,3px); } }
@keyframes swarmB { 0%,100% { transform:translate(0,0); } 33% { transform:translate(7px,-4px); } 66% { transform:translate(2px,-7px); } }
@keyframes swarmC { 0%,100% { transform:translate(0,0); } 33% { transform:translate(-4px,-6px); } 66% { transform:translate(-7px,2px); } }
@keyframes markPulse { 0%,100% { box-shadow:0 4px 16px rgba(196,238,82,0.28), inset 0 1px 0 rgba(255,255,255,0.25); } 50% { box-shadow:0 5px 24px rgba(196,238,82,0.55), inset 0 1px 0 rgba(255,255,255,0.32); } }
.app .brand-name { font-size:19px; font-weight:800; letter-spacing:-0.02em; } .app .brand-name span { color:var(--blue-bright); }
.app .brand-sub { font-family:var(--mono); font-size:10.5px; color:var(--text-faint); letter-spacing:0.04em; margin-top:1px; }
.app .store-top { display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:18px; }
.app .store-stats { display:flex; gap:22px; } .app .stat { text-align:right; }
.app .stat b { display:block; font-size:16px; font-weight:700; letter-spacing:-0.01em; }
.app .stat small { font-family:var(--mono); font-size:10px; color:var(--text-faint); text-transform:uppercase; letter-spacing:0.08em; }

.app .search { display:flex; align-items:center; gap:11px; background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:0 14px; height:46px; margin-bottom:22px; transition:border-color .18s, box-shadow .18s, background .18s; }
.app .search:focus-within { border-color:rgba(196,238,82,0.5); box-shadow:0 0 0 4px rgba(196,238,82,0.1); background:var(--surface-2); }
.app .search svg { color:var(--text-faint); flex:none; }
.app .search input { flex:1; background:none; border:none; outline:none; color:var(--text); font-size:14.5px; font-family:inherit; }
.app .search input::placeholder { color:var(--text-faint); }
.app .search kbd { font-family:var(--mono); font-size:11px; color:var(--text-faint); border:1px solid var(--border); border-radius:5px; padding:2px 6px; background:var(--bg); }
.app .search .clear { border:none; background:none; cursor:pointer; color:var(--text-faint); display:grid; place-items:center; width:24px; height:24px; border-radius:6px; font-size:13px; flex:none; }
.app .search .clear:hover { color:var(--text); background:rgba(255,255,255,0.05); }

.app .toolbar { display:flex; align-items:center; justify-content:space-between; gap:14px; margin-bottom:16px; }
.app .result-count { font-family:var(--mono); font-size:11.5px; color:var(--text-faint); } .app .result-count b { color:var(--text-dim); font-weight:600; }
.app .seg { display:flex; gap:2px; background:var(--surface); border:1px solid var(--border); border-radius:9px; padding:3px; }
.app .seg button { position:relative; z-index:1; border:none; background:none; cursor:pointer; font-family:var(--mono); font-size:11.5px; color:var(--text-dim); padding:6px 12px; border-radius:6px; transition:color .2s; }
.app .seg button:hover { color:var(--text); } .app .seg button.on { color:#0a0b0e; font-weight:600; }
.app .seg-pill { position:absolute; inset:0; z-index:-1; border-radius:6px; background:linear-gradient(180deg,#c8f05a,#aee03f); }

.app .grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(230px, 1fr)); gap:16px; }
.app .card { background:linear-gradient(180deg, var(--surface) 0%, #0f1116 100%); border:1px solid var(--border); border-radius:14px; padding:17px 17px 15px; display:flex; flex-direction:column; position:relative; transition:opacity .55s ease, transform .2s cubic-bezier(.2,.7,.3,1), border-color .2s, box-shadow .2s; opacity:0; }
.app .card.shown { opacity:1; }
.app .card:hover { transform:translateY(-4px); border-color:#36405a; box-shadow:0 14px 34px rgba(0,0,0,0.5); }
.app .card.glow { border-color:var(--green); box-shadow:0 0 0 1px var(--green), 0 0 30px 4px rgba(196,238,82,0.4); animation:glowPulse 1.6s ease-out; }
@keyframes glowPulse { 0% { box-shadow:0 0 0 1px var(--green), 0 0 0 0 rgba(196,238,82,0.5); } 40% { box-shadow:0 0 0 1px var(--green), 0 0 34px 7px rgba(196,238,82,0.45); } 100% { box-shadow:0 0 0 1px rgba(196,238,82,0), 0 0 0 0 rgba(196,238,82,0); } }
.app .card-icon { width:38px; height:38px; border-radius:10px; flex:none; display:grid; place-items:center; font-size:18px; border:1px solid var(--border); background:var(--surface-2); margin-bottom:13px; }
.app .card-head { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; }
.app .card-name { font-size:15.5px; font-weight:700; letter-spacing:-0.015em; line-height:1.2; }
.app .rep { display:inline-flex; align-items:center; gap:4px; flex:none; font-family:var(--mono); font-weight:600; font-size:12px; color:var(--amber); background:rgba(196,238,82,0.1); border:1px solid rgba(196,238,82,0.28); padding:3px 8px; border-radius:999px; transition:transform .2s; }
.app .rep svg { width:12px; height:12px; }
.app .rep.pop { animation:repPop .45s cubic-bezier(.2,1.4,.3,1); }
@keyframes repPop { 0% { transform:scale(1); } 35% { transform:scale(1.32); color:var(--green-bright); background:rgba(196,238,82,0.2); border-color:rgba(196,238,82,0.55); } 100% { transform:scale(1); } }
.app .card-desc { font-size:12.8px; color:var(--text-dim); line-height:1.45; margin:9px 0 14px; min-height:36px; text-wrap:pretty; }
.app .card-foot { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-top:auto; }
.app .author { display:flex; align-items:center; gap:7px; min-width:0; }
.app .author-dot { width:18px; height:18px; border-radius:50%; flex:none; box-shadow:inset 0 0 0 1px rgba(255,255,255,0.12); }
.app .author-id { font-family:var(--mono); font-size:11px; color:var(--text-faint); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

.app .btn-install { flex:none; height:32px; min-width:84px; padding:0 14px; border:none; border-radius:8px; cursor:pointer; background:var(--blue); color:#0a0b0e; font-family:inherit; font-size:12.5px; font-weight:600; display:inline-flex; align-items:center; justify-content:center; gap:6px; position:relative; overflow:hidden; transition:background .18s, min-width .3s cubic-bezier(.4,0,.2,1), box-shadow .18s, transform .12s; box-shadow:0 2px 10px rgba(196,238,82,0.28); }
.app .btn-install:hover { background:var(--blue-bright); box-shadow:0 4px 16px rgba(196,238,82,0.4); }
.app .btn-install:active { transform:scale(.95); }
.app .btn-install.installing { min-width:38px; background:#2c3140; box-shadow:none; cursor:default; }
.app .btn-install.done { min-width:38px; background:rgba(196,238,82,0.16); color:var(--green-bright); box-shadow:inset 0 0 0 1px rgba(196,238,82,0.45); cursor:default; }
.app .spinner { width:15px; height:15px; border-radius:50%; border:2px solid rgba(255,255,255,0.25); border-top-color:#fff; animation:spin .6s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
.app .check-draw { width:16px; height:16px; }
.app .check-draw path { stroke-dasharray:22; stroke-dashoffset:22; animation:checkDraw .35s .02s ease forwards; }
@keyframes checkDraw { to { stroke-dashoffset:0; } }
.app .empty { grid-column:1 / -1; text-align:center; padding:60px 0; color:var(--text-faint); font-family:var(--mono); font-size:13px; }

.app .panels-head { display:flex; align-items:center; gap:8px; margin-bottom:2px; }
.app .panels-head h2 { font-size:12px; font-family:var(--mono); text-transform:uppercase; letter-spacing:0.12em; color:var(--text-faint); font-weight:600; }
.app .panels-head .line { flex:1; height:1px; background:var(--border-soft); }
.app .panel { background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:16px; position:relative; overflow:hidden; transition:border-color .35s, box-shadow .35s; }
.app .panel.success { border-color:rgba(196,238,82,0.4); box-shadow:0 0 24px rgba(196,238,82,0.09); }
.app .panel-label { position:absolute; top:0; right:16px; transform:translateY(-50%); font-family:var(--mono); font-size:9.5px; letter-spacing:0.1em; text-transform:uppercase; color:var(--text-faint); background:var(--bg-2); padding:2px 8px; border-radius:5px; border:1px solid var(--border-soft); }
.app .panel-top { display:flex; align-items:center; gap:11px; margin-bottom:13px; }
.app .avatar { width:40px; height:40px; border-radius:11px; flex:none; display:grid; place-items:center; font-size:20px; box-shadow:inset 0 0 0 1px rgba(255,255,255,0.10); position:relative; }
.app .avatar.live::after { content:""; position:absolute; right:-2px; bottom:-2px; width:11px; height:11px; border-radius:50%; background:var(--green); border:2.5px solid var(--surface); animation:livePulse 1.8s ease-in-out infinite; }
@keyframes livePulse { 0%,100% { opacity:1; } 50% { opacity:.45; } }
.app .avatar.bump { animation:avatarBump .6s cubic-bezier(.2,1.3,.3,1); }
@keyframes avatarBump { 0% { transform:scale(1); } 38% { transform:scale(1.22); } 100% { transform:scale(1); } }
.app .agent-meta { min-width:0; }
.app .agent-name { font-size:14.5px; font-weight:700; letter-spacing:-0.01em; }
.app .agent-role { font-family:var(--mono); font-size:10.5px; color:var(--text-faint); margin-top:1px; }
.app .btn-run { margin-left:auto; flex:none; height:32px; padding:0 15px; border-radius:8px; cursor:pointer; border:1px solid var(--border); background:var(--surface-2); color:var(--text); font-family:inherit; font-size:12.5px; font-weight:600; display:inline-flex; align-items:center; gap:6px; transition:background .15s, border-color .15s, transform .1s; }
.app .btn-run:hover { background:#2a3040; border-color:#3a4254; } .app .btn-run:active { transform:scale(.95); } .app .btn-run:disabled { opacity:.6; cursor:default; }
.app .btn-run svg { width:13px; height:13px; }
.app .output { background:var(--bg-2); border:1px solid var(--border-soft); border-radius:9px; padding:11px 13px; min-height:64px; max-height:230px; overflow-y:auto; white-space:pre-wrap; font-family:var(--mono); font-size:12px; line-height:1.55; color:var(--text-faint); position:relative; transition:color .35s; }
.app .output.bright { color:var(--green-bright); }
.app .output.soft { font-family:'Space Grotesk', system-ui, sans-serif; }
.app .output.soft .typed { color:var(--text-dim); font-weight:400; }
.app .output .prompt { color:var(--text-faint); } .app .output .typed { color:inherit; } .app .output.bright .typed { color:var(--green-bright); font-weight:600; }
.app .caret { display:inline-block; width:7px; height:13px; background:var(--blue-bright); margin-left:2px; vertical-align:-2px; animation:blink 1s steps(1) infinite; }
@keyframes blink { 50% { opacity:0; } }
.app .badge-row { display:flex; align-items:center; justify-content:space-between; margin-top:12px; }
.app .latency { font-family:var(--mono); font-size:10.5px; color:var(--text-faint); }
.app .outcome { display:inline-flex; align-items:center; gap:7px; font-size:12.5px; font-weight:700; letter-spacing:-0.01em; padding:6px 12px; border-radius:999px; transition:all .35s; position:relative; }
.app .outcome.fail { color:var(--text-dim); background:rgba(255,255,255,0.04); border:1px solid var(--border); }
.app .outcome.ok { color:var(--green-bright); background:rgba(196,238,82,0.14); border:1px solid rgba(196,238,82,0.45); box-shadow:0 0 16px rgba(196,238,82,0.22); }
.app .outcome.flip { animation:flipBadge .5s cubic-bezier(.2,1.3,.3,1); }
@keyframes flipBadge { 0% { transform:scale(.7) rotateX(80deg); opacity:0; } 60% { transform:scale(1.12) rotateX(0); opacity:1; } 100% { transform:scale(1); } }
.app .outcome .dot { width:7px; height:7px; border-radius:50%; background:currentColor; }
.app .hint { font-family:var(--mono); font-size:10.5px; color:var(--text-faint); text-align:center; margin-top:2px; opacity:.8; }

.toast-wrap { position:fixed; bottom:26px; left:50%; transform:translateX(-50%); z-index:200; }
.toast { display:flex; align-items:center; gap:11px; background:#171a21; border:1px solid rgba(196,238,82,0.4); border-radius:12px; padding:11px 16px 11px 12px; box-shadow:0 16px 44px rgba(0,0,0,0.55), 0 0 22px rgba(196,238,82,0.1); }
.toast .tcheck { width:24px; height:24px; border-radius:7px; background:rgba(196,238,82,0.16); color:#d2f56a; display:grid; place-items:center; font-size:13px; font-weight:700; flex:none; }
.tmsg { font-size:13px; color:#9a9da8; line-height:1.25; } .tmsg b { color:#ECEDF0; font-weight:600; }
.tmsg em { display:block; font-style:normal; font-family:'JetBrains Mono', monospace; font-size:10.5px; color:#d2f56a; margin-top:1px; }

.flight-layer { position:fixed; inset:0; pointer-events:none; z-index:300; }
.packet { position:absolute; top:0; left:0; width:38px; height:38px; border-radius:11px; display:grid; place-items:center; font-size:18px; background:linear-gradient(180deg,#1e2430,#14171d); border:1px solid #c4ee52; box-shadow:0 0 24px rgba(196,238,82,0.55), inset 0 1px 0 rgba(255,255,255,0.14); }
.packet::after { content:""; position:absolute; inset:-3px; border-radius:13px; box-shadow:0 0 18px 2px rgba(196,238,82,0.35); }
.land-ring { position:absolute; top:0; left:0; width:18px; height:18px; border-radius:50%; border:2px solid #c4ee52; box-shadow:0 0 16px rgba(196,238,82,0.45); }

@media (max-width:760px) { .app { grid-template-columns:1fr; height:auto; min-height:100vh; } .app .col { height:auto; overflow:visible; } .app .col-agents { border-left:none; border-top:1px solid var(--border-soft); } }
`;
