import { useEffect, useState } from "react";
import type { SkillPack } from "../types/contract";
import { DEMO } from "../types/contract";
import { search, install, rate } from "../lib/api";
import { SkillPackCard } from "./SkillPackCard";
import { AgentPanel } from "./AgentPanel";

// Main demo screen: store grid (left) + Publisher/Consumer agents (right).
export function Market() {
  const [packs, setPacks] = useState<SkillPack[]>([]);
  const [q, setQ] = useState("");
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [justInstalled, setJustInstalled] = useState<string | null>(null);

  async function refresh() { setPacks(await search(q)); }
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [q]);

  async function onInstall(packId: string) {
    setInstallingId(packId);
    try {
      await install(DEMO.consumerId, packId);
      setJustInstalled(packId);
      await rate(packId);     // good outcome bumps rep -> market self-curates
      await refresh();
    } finally {
      setInstallingId(null);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-[1.3fr_1fr]">
      {/* STORE */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Swarm Market</h1>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search skill-packs…"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
          {packs.map(p => (
            <SkillPackCard
              key={p.id}
              pack={p}
              onInstall={onInstall}
              installing={installingId === p.id}
              justInstalled={justInstalled === p.id}
            />
          ))}
          {packs.length === 0 && (
            <p className="col-span-full text-sm text-zinc-400">No packs yet. Run the Publisher to create one.</p>
          )}
        </div>
      </section>

      {/* AGENTS */}
      <section className="flex flex-col gap-4">
        <AgentPanel title="Publisher agent" agentId={DEMO.publisherId} task={DEMO.task} />
        <AgentPanel title="Consumer agent (cold)" agentId={DEMO.consumerId} task={DEMO.task} />
      </section>
    </div>
  );
}
