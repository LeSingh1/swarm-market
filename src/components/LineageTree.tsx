import { motion } from "framer-motion";

/**
 * LineageTree — a "Pack Lineage Tree".
 *
 * Renders a small visual fork graph showing how a skill-pack evolved and spread:
 * a root pack → v2 → v3, with branches to descendant / forked packs, nodes
 * connected by faint lines (lime on the active spine). The highest-reputation
 * node is crowned. Reveal is animated with a framer-motion stagger: lines draw
 * themselves, then nodes pop in.
 *
 * Self-contained: built-in mock lineage data, scoped `lt-` CSS, no new deps.
 */

type LineageNode = {
  id: string;
  label: string; // version / fork label, e.g. "v1", "v3-fork"
  parent: string | null;
  rep: number; // reputation score
  spine: boolean; // true if on the canonical evolution path (active path)
  x: number; // grid column (0..N)
  y: number; // grid row (0..N)
};

// Built-in mock lineage. A root lesson that evolved (v1→v2→v3) and forked.
const NODES: LineageNode[] = [
  { id: "root", label: "v1", parent: null, rep: 71, spine: true, x: 0, y: 1 },
  { id: "v2", label: "v2", parent: "root", rep: 86, spine: true, x: 1, y: 1 },
  { id: "v3", label: "v3", parent: "v2", rep: 97, spine: true, x: 2, y: 1 },
  { id: "fork-a", label: "fork·edge", parent: "v2", rep: 64, spine: false, x: 2, y: 0 },
  { id: "fork-b", label: "fork·lite", parent: "v2", rep: 58, spine: false, x: 2, y: 2 },
  { id: "leaf-a", label: "v3.1", parent: "v3", rep: 80, spine: false, x: 3, y: 1 },
  { id: "leaf-b", label: "fork·pro", parent: "fork-a", rep: 73, spine: false, x: 3, y: 0 },
];

const TOTAL_DESCENDANTS = NODES.length - 1;

// SVG layout geometry.
const VB_W = 480;
const VB_H = 220;
const PAD_X = 56;
const PAD_Y = 46;
const COLS = 3; // max x index → 0..3
const ROWS = 2; // max y index → 0..2
const colX = (x: number) => PAD_X + (x / COLS) * (VB_W - PAD_X * 2);
const rowY = (y: number) => PAD_Y + (y / ROWS) * (VB_H - PAD_Y * 2);

type Edge = { id: string; from: LineageNode; to: LineageNode; active: boolean };
const EDGES: Edge[] = NODES.filter((n) => n.parent).map((n) => {
  const from = NODES.find((p) => p.id === n.parent)!;
  return { id: `${from.id}->${n.id}`, from, to: n, active: from.spine && n.spine };
});

const crownId = NODES.reduce((a, b) => (b.rep > a.rep ? b : a)).id;

const C = {
  bg: "#0a0b0e",
  surface: "#121419",
  surface2: "#171a21",
  border: "#23262f",
  text: "#ECEDF0",
  dim: "#9a9da8",
  faint: "#5d616e",
  lime: "#c4ee52",
  limeBright: "#d2f56a",
} as const;

const Crown = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden>
    <path d="M3 8l4 3 5-7 5 7 4-3-2 12H5L3 8z" />
  </svg>
);

const Close = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

// Build a smooth cubic path between two points (horizontal-ish flow).
const edgePath = (e: Edge) => {
  const x1 = colX(e.from.x);
  const y1 = rowY(e.from.y);
  const x2 = colX(e.to.x);
  const y2 = rowY(e.to.y);
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
};

export default function LineageTree(props: { rootName?: string; onClose?: () => void }) {
  const { rootName = "NavigatorPro", onClose } = props;

  // Reveal timeline: edges draw first (staggered), then nodes pop in after.
  const edgeStagger = 0.12;
  const nodeStart = EDGES.length * edgeStagger + 0.15;

  return (
    <>
      <style>{LT_CSS}</style>
      <motion.div
        className="lt-card"
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        role="figure"
        aria-label={`Lineage tree for ${rootName}`}
      >
        <div className="lt-head">
          <div className="lt-head-l">
            <span className="lt-kicker">Pack Lineage</span>
            <span className="lt-title">{rootName}</span>
          </div>
          {onClose && (
            <button className="lt-close" onClick={onClose} aria-label="Close lineage tree">
              <Close />
            </button>
          )}
        </div>

        <div className="lt-canvas">
          <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="lt-svg" preserveAspectRatio="xMidYMid meet">
            <defs>
              <filter id="lt-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2.4" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Edges — draw themselves on reveal */}
            {EDGES.map((e, i) => (
              <motion.path
                key={e.id}
                d={edgePath(e)}
                className={e.active ? "lt-edge lt-edge-active" : "lt-edge"}
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{
                  pathLength: { duration: 0.5, delay: i * edgeStagger, ease: "easeInOut" },
                  opacity: { duration: 0.2, delay: i * edgeStagger },
                }}
              />
            ))}

            {/* Nodes — pop in after edges */}
            {NODES.map((n, i) => {
              const cx = colX(n.x);
              const cy = rowY(n.y);
              const crowned = n.id === crownId;
              const r = n.spine ? 11 : 8.5;
              return (
                <motion.g
                  key={n.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: nodeStart + i * 0.07,
                    type: "spring",
                    stiffness: 420,
                    damping: 18,
                  }}
                  style={{ transformOrigin: `${cx}px ${cy}px` }}
                >
                  {(n.spine || crowned) && (
                    <circle cx={cx} cy={cy} r={r + 5} className="lt-node-halo" />
                  )}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    className={n.spine ? "lt-node lt-node-spine" : "lt-node"}
                    filter={crowned ? "url(#lt-glow)" : undefined}
                  />
                  <text x={cx} y={cy + (n.y >= ROWS ? 26 : -19)} className="lt-node-label" textAnchor="middle">
                    {n.label}
                  </text>
                  <text x={cx} y={cy + 3.5} className="lt-node-rep" textAnchor="middle">
                    {n.rep}
                  </text>
                  {crowned && (
                    <g className="lt-crown" transform={`translate(${cx - 6.5}, ${cy - r - 19})`}>
                      <Crown />
                    </g>
                  )}
                </motion.g>
              );
            })}
          </svg>
        </div>

        <motion.div
          className="lt-caption"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: nodeStart + NODES.length * 0.07 + 0.1, duration: 0.4 }}
        >
          <span className="lt-cap-num">{TOTAL_DESCENDANTS}</span> packs descend from this lesson
          <span className="lt-cap-sep">·</span>
          <span className="lt-cap-em">nobody re-learned it.</span>
        </motion.div>
      </motion.div>
    </>
  );
}

const LT_CSS = `
.lt-card {
  width: 100%;
  max-width: 540px;
  box-sizing: border-box;
  background: ${C.surface};
  border: 1px solid ${C.border};
  border-radius: 14px;
  padding: 18px 18px 16px;
  color: ${C.text};
  font-family: 'Space Grotesk', system-ui, sans-serif;
  position: relative;
  box-shadow: 0 18px 50px -22px rgba(0,0,0,0.85), 0 0 0 1px rgba(196,238,82,0.02);
}
.lt-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 6px;
}
.lt-head-l { display: flex; flex-direction: column; gap: 4px; }
.lt-kicker {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: ${C.lime};
}
.lt-title {
  font-size: 19px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: ${C.text};
}
.lt-close {
  appearance: none;
  width: 28px; height: 28px;
  display: grid; place-items: center;
  background: ${C.surface2};
  border: 1px solid ${C.border};
  border-radius: 8px;
  color: ${C.dim};
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}
.lt-close:hover { color: ${C.text}; border-color: ${C.faint}; background: #1c2029; }

.lt-canvas {
  margin-top: 6px;
  background:
    radial-gradient(120% 90% at 70% 0%, rgba(196,238,82,0.05), transparent 60%),
    ${C.bg};
  border: 1px solid ${C.border};
  border-radius: 12px;
  padding: 4px;
  overflow: hidden;
}
.lt-svg { width: 100%; height: auto; display: block; }

.lt-edge {
  stroke: ${C.faint};
  stroke-width: 1.4;
  opacity: 0.5;
}
.lt-edge-active {
  stroke: ${C.lime};
  stroke-width: 2;
  opacity: 0.9;
  filter: drop-shadow(0 0 3px rgba(196,238,82,0.5));
}

.lt-node {
  fill: ${C.surface2};
  stroke: ${C.faint};
  stroke-width: 1.4;
}
.lt-node-spine {
  fill: ${C.surface2};
  stroke: ${C.lime};
  stroke-width: 1.8;
}
.lt-node-halo {
  fill: rgba(196,238,82,0.06);
  stroke: rgba(196,238,82,0.18);
  stroke-width: 1;
}
.lt-node-label {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 9px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  fill: ${C.dim};
}
.lt-node-rep {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 9.5px;
  font-weight: 600;
  fill: ${C.text};
}
.lt-crown { color: ${C.limeBright}; }

.lt-caption {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid ${C.border};
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 11px;
  letter-spacing: 0.02em;
  color: ${C.dim};
  line-height: 1.5;
}
.lt-cap-num {
  color: ${C.limeBright};
  font-weight: 600;
  font-size: 12px;
}
.lt-cap-sep { margin: 0 6px; color: ${C.faint}; }
.lt-cap-em { color: ${C.text}; }
`;
