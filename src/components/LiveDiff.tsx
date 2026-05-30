import { useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Live Diff Ringside — before/after side-by-side of an agent's output.
// LEFT: "Cold (no skill-pack)" failing transcript. RIGHT: "After install" upgraded transcript.
// Self-contained modal overlay; falls back to built-in sample transcripts when empty.

type LiveDiffProps = {
  cold: string;
  warm: string;
  packName?: string;
  onClose: () => void;
};

const SAMPLE_COLD = `> task: cold outreach email to a fintech prospect who objects on price

thinking… they said we're expensive, so lead with a discount.

Hi [First Name],

I know [Company] said our pricing is high. We can do 20% off
if you sign this quarter — just let me know!

✗ leads with a discount — trains the buyer to expect concessions
✗ unfilled placeholders left in: [First Name], [Company]
✗ no compliance angle, no ROI, no quantified value

result: FAILED — generic, discount-led, never sent
confidence: 0.92 (overconfident, wrong)`;

const SAMPLE_WARM = `> task: cold outreach email to a fintech prospect who objects on price
> using: Fintech-objection skill-pack

reframe the price objection → compliance + ROI, not a discount.

Subject: cutting your AML review cycle, not your budget

Hi Sarah,

You flagged price — fair. Most fintechs we work with weren't
overpaying; they were bleeding on manual AML review and failed
payment recovery (60-70% vs the 85%+ benchmark).

✓ leads with compliance + ROI, never a discount
✓ quantified pain: AML fines, recovery rate, ops hours
✓ personalized — zero unfilled placeholders

result: SUCCESS — compliance-led, quantified, ready to send
confidence: 0.88 (calibrated)`;

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
  fail: "#8b8f9c",
} as const;

type LineKind = "fail" | "ok" | "prompt" | "default";

function classifyLine(line: string): LineKind {
  const t = line.trimStart();
  if (t.startsWith("✗") || /\bFAILED\b/.test(t)) return "fail";
  if (t.startsWith("✓") || /\bSUCCESS\b/.test(t)) return "ok";
  if (t.startsWith(">")) return "prompt";
  return "default";
}

function lineSummary(text: string): { fails: number; wins: number } {
  let fails = 0, wins = 0;
  for (const line of text.split("\n")) {
    const k = classifyLine(line);
    if (k === "fail") fails++;
    else if (k === "ok") wins++;
  }
  return { fails, wins };
}

function DiffLines({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => {
        const kind = classifyLine(line);
        return (
          <span key={i} className={`ld-line ld-line--${kind}`}>
            {line}
            {i < lines.length - 1 ? "\n" : ""}
          </span>
        );
      })}
    </>
  );
}

export default function LiveDiff(props: LiveDiffProps) {
  const { cold, warm, packName, onClose } = props;
  const coldText = cold && cold.trim().length > 0 ? cold : SAMPLE_COLD;
  const warmText = warm && warm.trim().length > 0 ? warm : SAMPLE_WARM;
  const name = packName && packName.trim().length > 0 ? packName : "NavigatorPro";

  const coldSummary = useMemo(() => lineSummary(coldText), [coldText]);
  const warmSummary = useMemo(() => lineSummary(warmText), [warmText]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        className="ld-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <style>{LD_CSS}</style>
        <motion.div
          className="ld-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Live diff ringside"
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.94 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
        >
          <header className="ld-head">
            <div className="ld-headLeft">
              <span className="ld-microlabel">Live Diff</span>
              <h2 className="ld-title">Ringside — before / after</h2>
            </div>
            <button className="ld-close" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </header>

          <div className="ld-arena">
            {/* COLD */}
            <section className="ld-col ld-col--cold">
              <div className="ld-colHead ld-colHead--cold">
                <span className="ld-mark ld-mark--fail">✗</span>
                <span className="ld-colLabel">Cold (no skill-pack)</span>
                {coldSummary.fails > 0 && (
                  <span className="ld-chip-sum ld-chip-sum--fail">✗ {coldSummary.fails} issue{coldSummary.fails !== 1 ? "s" : ""}</span>
                )}
              </div>
              <pre className="ld-panel ld-panel--cold">
                <code><DiffLines text={coldText} /></code>
              </pre>
            </section>

            {/* DIVIDER */}
            <div className="ld-divider" aria-hidden="true">
              <span className="ld-chip">→ installed</span>
            </div>

            {/* WARM */}
            <section className="ld-col ld-col--warm">
              <div className="ld-colHead ld-colHead--warm">
                <span className="ld-mark ld-mark--ok">✓</span>
                <span className="ld-colLabel">
                  After install: <span className="ld-pack">{name}</span>
                </span>
                {warmSummary.wins > 0 && (
                  <span className="ld-chip-sum ld-chip-sum--ok">✓ {warmSummary.wins} win{warmSummary.wins !== 1 ? "s" : ""}</span>
                )}
              </div>
              <pre className="ld-panel ld-panel--warm">
                <code><DiffLines text={warmText} /></code>
              </pre>
            </section>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

const LD_CSS = `
.ld-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(5, 6, 8, 0.78);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}
.ld-modal {
  width: min(1080px, 100%);
  max-height: calc(100vh - 48px);
  display: flex;
  flex-direction: column;
  background: ${C.bg};
  border: 1px solid ${C.border};
  border-radius: 14px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6);
  overflow: hidden;
  font-family: 'Space Grotesk', system-ui, sans-serif;
  color: ${C.text};
}
.ld-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 22px;
  border-bottom: 1px solid ${C.border};
  background: ${C.surface};
}
.ld-headLeft { display: flex; flex-direction: column; gap: 3px; }
.ld-microlabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: ${C.lime};
}
.ld-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: ${C.text};
}
.ld-close {
  appearance: none;
  border: 1px solid ${C.border};
  background: ${C.surface2};
  color: ${C.dim};
  width: 34px;
  height: 34px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}
.ld-close:hover {
  color: ${C.text};
  border-color: ${C.faint};
  background: ${C.border};
}
.ld-arena {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 0;
  padding: 20px;
  overflow: hidden;
  min-height: 0;
}
.ld-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}
.ld-colHead {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 9px 12px;
  border-radius: 10px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.ld-colHead--cold {
  color: ${C.fail};
  border: 1px solid ${C.border};
  background: ${C.surface};
}
.ld-colHead--warm {
  color: ${C.limeBright};
  border: 1px solid rgba(196, 238, 82, 0.28);
  background: rgba(196, 238, 82, 0.05);
}
.ld-colLabel { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ld-pack { color: ${C.lime}; }
.ld-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 700;
  flex: none;
}
.ld-mark--fail { color: #c66; background: rgba(200, 90, 90, 0.12); }
.ld-mark--ok { color: ${C.bg}; background: ${C.lime}; }
.ld-panel {
  margin: 0;
  flex: 1 1 auto;
  min-height: 0;
  max-height: 56vh;
  overflow: auto;
  padding: 16px;
  border-radius: 12px;
  background: ${C.surface2};
  font-family: 'JetBrains Mono', monospace;
  font-size: 12.5px;
  line-height: 1.65;
  white-space: pre-wrap;
  word-break: break-word;
  tab-size: 2;
}
.ld-panel code { font-family: inherit; }
.ld-panel--cold {
  border: 1px solid ${C.border};
  border-left: 3px solid rgba(200, 90, 90, 0.65);
  color: ${C.dim};
}
.ld-panel--warm {
  border: 1px solid ${C.border};
  border-left: 3px solid ${C.lime};
  color: ${C.text};
  box-shadow: 0 0 28px rgba(196, 238, 82, 0.08), inset 0 0 0 1px rgba(196, 238, 82, 0.04);
}
.ld-divider {
  position: relative;
  width: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ld-divider::before {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 1px;
  background: linear-gradient(${C.border}, rgba(196, 238, 82, 0.4), ${C.border});
}
.ld-chip {
  position: relative;
  z-index: 1;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${C.bg};
  background: ${C.lime};
  padding: 5px 9px;
  border-radius: 999px;
  white-space: nowrap;
  box-shadow: 0 0 16px rgba(196, 238, 82, 0.4);
}
.ld-panel::-webkit-scrollbar { width: 9px; height: 9px; }
.ld-panel::-webkit-scrollbar-thumb {
  background: ${C.border};
  border-radius: 6px;
}
.ld-panel::-webkit-scrollbar-thumb:hover { background: ${C.faint}; }
.ld-panel::-webkit-scrollbar-track { background: transparent; }

.ld-line { display: block; }
.ld-line--fail { color: #d97070; background: rgba(200, 70, 70, 0.09); border-radius: 3px; }
.ld-line--ok { color: ${C.limeBright}; background: rgba(196, 238, 82, 0.08); border-radius: 3px; }
.ld-line--prompt { color: ${C.faint}; }
.ld-line--default {}

.ld-chip-sum {
  margin-left: auto;
  flex: none;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.08em;
  padding: 3px 7px;
  border-radius: 999px;
  white-space: nowrap;
}
.ld-chip-sum--fail { color: #d97070; background: rgba(200, 70, 70, 0.15); border: 1px solid rgba(200, 70, 70, 0.25); }
.ld-chip-sum--ok { color: ${C.bg}; background: ${C.lime}; }

@media (max-width: 720px) {
  .ld-arena { grid-template-columns: 1fr; gap: 14px; }
  .ld-divider {
    width: auto;
    height: 34px;
    transform: rotate(90deg);
  }
  .ld-divider::before { top: 50%; bottom: auto; left: 0; right: 0; width: 100%; height: 1px; }
  .ld-panel { max-height: 34vh; }
}
`;
