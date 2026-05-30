import { useEffect } from "react";
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

const SAMPLE_COLD = `> task: route the delivery fleet around the closed bridge

thinking… picking the shortest line on the map.
plan: send all 6 trucks straight down Mission Blvd.

✗ Mission Blvd is the CLOSED bridge approach.
✗ no fallback path computed.
✗ ETA: failed — fleet stuck at barrier (0/6 delivered)

result: FAILED
confidence: 0.91 (overconfident, wrong)`;

const SAMPLE_WARM = `> task: route the delivery fleet around the closed bridge
> using: NavigatorPro skill-pack

read closures layer → Mission Blvd bridge = CLOSED.
build detour graph → Warm Springs ▸ Auto Mall Pkwy ▸ Kato.
validate each leg against live closures ✓

plan: 6 trucks split across 2 detours (load-balanced).
✓ no truck routed through the closed approach
✓ fallback path cached for re-routes
✓ ETA: +7 min vs ideal, 6/6 delivered

result: SUCCESS
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

export default function LiveDiff(props: LiveDiffProps) {
  const { cold, warm, packName, onClose } = props;
  const coldText = cold && cold.trim().length > 0 ? cold : SAMPLE_COLD;
  const warmText = warm && warm.trim().length > 0 ? warm : SAMPLE_WARM;
  const name = packName && packName.trim().length > 0 ? packName : "NavigatorPro";

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
              </div>
              <pre className="ld-panel ld-panel--cold">
                <code>{coldText}</code>
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
              </div>
              <pre className="ld-panel ld-panel--warm">
                <code>{warmText}</code>
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
