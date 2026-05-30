import { useEffect, useMemo, useRef, useState } from "react";

/**
 * AmbientFeed — a thin horizontal ticker that continuously scrolls plausible
 * live market events so the SwarmMarket feels alive. Self-contained: generates
 * its own rotating pool of events. Pass `packNames` to mix real pack names in.
 *
 * Loops seamlessly by duplicating the event row and CSS-translating -50%.
 * Pauses on hover. All CSS is scoped under the `af-` class prefix.
 */

type Verb =
  | { kind: "installed"; rep: number }
  | { kind: "published" }
  | { kind: "succeeded"; rep: number }
  | { kind: "forked"; rep: number }
  | { kind: "rated"; rep: number };

type FeedEvent = {
  id: string;
  agent: string;
  pack: string;
  verb: Verb;
};

const AGENTS = [
  "agent-atlas", "agent-iris", "agent-rover", "agent-sigma", "agent-nova",
  "agent-echo", "agent-vega", "agent-orion", "agent-juno", "agent-pax",
  "agent-lyra", "agent-zephyr", "agent-helio", "agent-mira", "agent-onyx",
];

const FALLBACK_PACKS = [
  "NavigatorPro", "CodeReviewer", "NegotiatorKit", "VisionParse v2",
  "retry-on-429", "MemoryThread", "ToolForge", "SafetyGuard",
  "ChartReader", "OutreachSDR", "DiffReasoner", "PathPlanner",
];

const VERSION_TAGS = ["v2", "v3", "v1.4", "live", "beta"];

let _seq = 0;
const uid = () => `af-${Date.now().toString(36)}-${(_seq++).toString(36)}`;
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randInt = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1));

function makeEvent(packs: string[]): FeedEvent {
  const agent = pick(AGENTS);
  const pack = pick(packs);
  const roll = Math.random();
  let verb: Verb;
  if (roll < 0.34) verb = { kind: "installed", rep: randInt(1, 5) };
  else if (roll < 0.55) verb = { kind: "published" };
  else if (roll < 0.78) verb = { kind: "succeeded", rep: 1 };
  else if (roll < 0.92) verb = { kind: "forked", rep: randInt(1, 3) };
  else verb = { kind: "rated", rep: randInt(1, 2) };
  return { id: uid(), agent, pack, verb };
}

function makeBatch(packs: string[], n: number): FeedEvent[] {
  return Array.from({ length: n }, () => makeEvent(packs));
}

/* ---------- single event renderer ---------- */
function EventItem({ ev }: { ev: FeedEvent }) {
  const { verb } = ev;
  let action: React.ReactNode;
  let tail: React.ReactNode = null;

  switch (verb.kind) {
    case "installed":
      action = <>installed</>;
      tail = <span className="af-rep">rep +{verb.rep}</span>;
      break;
    case "published":
      action = <>published</>;
      tail = <span className="af-live">live</span>;
      break;
    case "succeeded":
      action = <>succeeded with</>;
      tail = <span className="af-rep">rep +{verb.rep}</span>;
      break;
    case "forked":
      action = <>forked</>;
      tail = <span className="af-rep">rep +{verb.rep}</span>;
      break;
    case "rated":
      action = <>rated</>;
      tail = <span className="af-rep">rep +{verb.rep}</span>;
      break;
  }

  return (
    <span className="af-item" aria-hidden="true">
      <span className="af-dot" />
      <span className="af-name">{ev.agent}</span>
      <span className="af-action">{action}</span>
      <span className="af-pack">{ev.pack}</span>
      {tail ? <span className="af-sep">·</span> : null}
      {tail}
    </span>
  );
}

export default function AmbientFeed(props: { packNames?: string[] }) {
  const packs = useMemo(() => {
    const real = (props.packNames ?? []).filter((p) => p && p.trim().length > 0);
    if (real.length === 0) return FALLBACK_PACKS;
    // Mix real pack names with a few flavorful built-ins + version tags.
    const versioned = real.map((p) =>
      Math.random() < 0.25 ? `${p} ${pick(VERSION_TAGS)}` : p
    );
    return [...versioned, ...FALLBACK_PACKS.slice(0, 4)];
  }, [props.packNames]);

  // A rolling window of events; we periodically replace the oldest so the
  // feed content keeps changing over the session rather than looping forever.
  const [events, setEvents] = useState<FeedEvent[]>(() => makeBatch(packs, 14));
  const packsRef = useRef(packs);
  packsRef.current = packs;

  useEffect(() => {
    setEvents(makeBatch(packsRef.current, 14));
  }, [packs]);

  useEffect(() => {
    const t = window.setInterval(() => {
      setEvents((prev) => {
        const next = prev.slice(1);
        next.push(makeEvent(packsRef.current));
        return next;
      });
    }, 2600);
    return () => window.clearInterval(t);
  }, []);

  // Duplicate the row for a seamless -50% translate loop.
  const rowKey = events.map((e) => e.id).join("|");

  return (
    <div className="af-strip" role="status" aria-label="Live swarm activity feed">
      <style>{AF_CSS}</style>

      <span className="af-badge">
        <span className="af-pulse" />
        LIVE SWARM
      </span>

      <div className="af-viewport">
        <div className="af-track" key={rowKey}>
          <div className="af-seq">
            {events.map((ev) => (
              <EventItem key={ev.id} ev={ev} />
            ))}
          </div>
          <div className="af-seq" aria-hidden="true">
            {events.map((ev) => (
              <EventItem key={`dup-${ev.id}`} ev={ev} />
            ))}
          </div>
        </div>
      </div>

      <div className="af-fade af-fade-l" />
      <div className="af-fade af-fade-r" />
    </div>
  );
}

const AF_CSS = `
.af-strip {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  height: 34px;
  padding: 0 12px;
  background: #121419;
  border: 1px solid #23262f;
  border-radius: 11px;
  overflow: hidden;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  user-select: none;
}
.af-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #9a9da8;
  padding: 3px 8px;
  background: #171a21;
  border: 1px solid #23262f;
  border-radius: 7px;
  z-index: 3;
}
.af-pulse {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #c4ee52;
  box-shadow: 0 0 6px #c4ee52, 0 0 2px #d2f56a;
  animation: af-pulse 1.8s ease-in-out infinite;
}
@keyframes af-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.35; transform: scale(0.8); }
}
.af-viewport {
  position: relative;
  flex: 1 1 auto;
  height: 100%;
  overflow: hidden;
  display: flex;
  align-items: center;
}
.af-track {
  display: flex;
  width: max-content;
  animation: af-scroll 48s linear infinite;
  will-change: transform;
}
.af-strip:hover .af-track {
  animation-play-state: paused;
}
@keyframes af-scroll {
  from { transform: translate3d(0, 0, 0); }
  to { transform: translate3d(-50%, 0, 0); }
}
.af-seq {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
}
.af-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 18px 0 0;
  margin-right: 18px;
  font-size: 11.5px;
  line-height: 1;
  white-space: nowrap;
  color: #9a9da8;
}
.af-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #5d616e;
  margin-right: 8px;
  flex: 0 0 auto;
}
.af-name {
  color: #ECEDF0;
  font-weight: 500;
}
.af-action {
  color: #5d616e;
}
.af-pack {
  color: #ECEDF0;
  font-weight: 500;
  letter-spacing: 0.01em;
}
.af-sep {
  color: #5d616e;
  padding: 0 1px;
}
.af-rep {
  color: #c4ee52;
  font-weight: 600;
  text-shadow: 0 0 8px rgba(196, 238, 82, 0.35);
}
.af-live {
  color: #d2f56a;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 9.5px;
  text-shadow: 0 0 8px rgba(210, 245, 106, 0.35);
}
.af-fade {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 56px;
  pointer-events: none;
  z-index: 2;
}
.af-fade-l {
  left: 0;
  background: linear-gradient(90deg, #121419 0%, rgba(18, 20, 25, 0) 100%);
}
.af-fade-r {
  right: 0;
  background: linear-gradient(270deg, #121419 0%, rgba(18, 20, 25, 0) 100%);
}
@media (prefers-reduced-motion: reduce) {
  .af-track { animation-duration: 120s; }
  .af-pulse { animation: none; }
}
`;
