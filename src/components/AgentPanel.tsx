import { useState } from "react";
import type { AgentRun } from "../types/contract";
import { runAgent } from "../lib/api";

// One column per agent (Publisher / Consumer). Shows the run result + outcome badge.
// The before/after lives here: run cold -> fail, run after install -> success.
export function AgentPanel({
  title, agentId, task, onPublishable,
}: {
  title: string;
  agentId: string;
  task: string;
  onPublishable?: (run: AgentRun) => void; // publisher passes episodes up to reflect+publish
}) {
  const [run, setRun] = useState<AgentRun | null>(null);
  const [busy, setBusy] = useState(false);

  async function go() {
    setBusy(true);
    try {
      const r = await runAgent({ agent_id: agentId, task });
      setRun(r);
      onPublishable?.(r);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col rounded-2xl border border-zinc-200 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        {run && (
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            run.outcome === "success" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
          }`}>
            {run.outcome === "success" ? "✓ replied" : "✗ ignored"}
          </span>
        )}
      </div>
      <button
        onClick={go}
        disabled={busy}
        className="mt-3 rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
      >
        {busy ? "Working…" : "Run agent"}
      </button>
      <pre className="mt-3 min-h-[120px] whitespace-pre-wrap rounded-lg bg-zinc-50 p-3 text-xs text-zinc-700">
        {run?.result ?? "—"}
      </pre>
      {run?.applied_pack_id && (
        <p className="mt-1 text-[10px] text-emerald-600">applied installed skill: {run.applied_pack_id}</p>
      )}
    </div>
  );
}
