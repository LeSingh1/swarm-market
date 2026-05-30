import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface InstallSnippetProps {
  packId: string;
  packName: string;
  onClose: () => void;
}

type SnippetKey = "mcp" | "http";

export default function InstallSnippet({ packId, packName, onClose }: InstallSnippetProps) {
  const [copied, setCopied] = useState<SnippetKey | null>(null);

  const mcpSnippet = JSON.stringify(
    {
      tool: "install_pack",
      arguments: { agent_id: "your-agent", pack_id: packId },
    },
    null,
    2
  );

  const httpSnippet =
    `curl -X POST http://localhost:8787/api/market/install \\\n` +
    `  -H 'Content-Type: application/json' \\\n` +
    `  -d '{"agent_id":"your-agent","pack_id":"${packId}"}'`;

  const copy = useCallback((key: SnippetKey, text: string) => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      window.setTimeout(() => {
        setCopied((cur) => (cur === key ? null : cur));
      }, 1500);
    });
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        className="is-snippet-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
        role="presentation"
      >
        <motion.div
          className="is-snippet-modal"
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.94 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={`Install ${packName}`}
        >
          <style>{snippetCss}</style>

          <div className="is-snippet-head">
            <div>
              <div className="is-snippet-eyebrow">One-Call Install</div>
              <h2 className="is-snippet-title">{packName}</h2>
            </div>
            <button
              type="button"
              className="is-snippet-close"
              onClick={onClose}
              aria-label="Close"
            >
              &#10005;
            </button>
          </div>

          <p className="is-snippet-sub">
            Copy-paste one of these to install this skill-pack against your own agent.
          </p>

          {/* MCP tool call */}
          <section className="is-snippet-block">
            <div className="is-snippet-label-row">
              <span className="is-snippet-label">MCP Tool Call</span>
              <button
                type="button"
                className={`is-snippet-copy${copied === "mcp" ? " is-copied" : ""}`}
                onClick={() => copy("mcp", mcpSnippet)}
              >
                {copied === "mcp" ? "Copied ✓" : "Copy"}
              </button>
            </div>
            <pre className="is-snippet-code">
              <code>{mcpSnippet}</code>
            </pre>
          </section>

          {/* HTTP / curl */}
          <section className="is-snippet-block">
            <div className="is-snippet-label-row">
              <span className="is-snippet-label">HTTP / cURL</span>
              <button
                type="button"
                className={`is-snippet-copy${copied === "http" ? " is-copied" : ""}`}
                onClick={() => copy("http", httpSnippet)}
              >
                {copied === "http" ? "Copied ✓" : "Copy"}
              </button>
            </div>
            <pre className="is-snippet-code">
              <code>{httpSnippet}</code>
            </pre>
          </section>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

const snippetCss = `
.is-snippet-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(5, 6, 8, 0.72);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}
.is-snippet-modal {
  width: 100%;
  max-width: 560px;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  background: #121419;
  border: 1px solid #23262f;
  border-radius: 14px;
  padding: 26px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(196, 238, 82, 0.04);
  font-family: 'Space Grotesk', system-ui, sans-serif;
  color: #ECEDF0;
}
.is-snippet-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.is-snippet-eyebrow {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #c4ee52;
  margin-bottom: 6px;
}
.is-snippet-title {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  line-height: 1.15;
  color: #ECEDF0;
}
.is-snippet-close {
  flex: none;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #171a21;
  border: 1px solid #23262f;
  border-radius: 10px;
  color: #9a9da8;
  font-size: 13px;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}
.is-snippet-close:hover {
  color: #ECEDF0;
  border-color: #5d616e;
  background: #1c1f28;
}
.is-snippet-sub {
  margin: 14px 0 22px;
  font-size: 13.5px;
  line-height: 1.5;
  color: #9a9da8;
}
.is-snippet-block {
  margin-bottom: 18px;
}
.is-snippet-block:last-child {
  margin-bottom: 0;
}
.is-snippet-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.is-snippet-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #5d616e;
}
.is-snippet-copy {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 5px 12px;
  border-radius: 8px;
  border: 1px solid #23262f;
  background: #171a21;
  color: #9a9da8;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}
.is-snippet-copy:hover {
  color: #ECEDF0;
  border-color: #5d616e;
}
.is-snippet-copy.is-copied {
  color: #0a0b0e;
  background: #c4ee52;
  border-color: #d2f56a;
  box-shadow: 0 0 16px rgba(196, 238, 82, 0.35);
}
.is-snippet-code {
  margin: 0;
  padding: 16px;
  background: #0a0b0e;
  border: 1px solid #23262f;
  border-radius: 12px;
  overflow-x: auto;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12.5px;
  line-height: 1.6;
  color: #ECEDF0;
  white-space: pre;
}
.is-snippet-code code {
  font-family: inherit;
  color: inherit;
}
`;
