import type { SkillPack } from "../types/contract";

// The store card. The Install button + rep badge are the demo's visual payoff.
export function SkillPackCard({
  pack, onInstall, installing, justInstalled,
}: {
  pack: SkillPack;
  onInstall?: (id: string) => void;
  installing?: boolean;
  justInstalled?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 transition-all duration-300 ${
        justInstalled ? "border-emerald-400 shadow-lg shadow-emerald-200 scale-[1.02]" : "border-zinc-200"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-sm leading-tight">{pack.name}</h3>
        <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
          ★ {pack.rep_score}
        </span>
      </div>
      <p className="mt-2 text-xs text-zinc-600 line-clamp-3">{pack.lesson}</p>
      <p className="mt-2 text-[10px] uppercase tracking-wide text-zinc-400">
        {pack.domain} · {pack.provenance.episode_count} episodes
      </p>
      {onInstall && (
        <button
          onClick={() => onInstall(pack.id)}
          disabled={installing}
          className="mt-3 w-full rounded-lg bg-zinc-900 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {installing ? "Installing…" : justInstalled ? "Installed ✓" : "Install"}
        </button>
      )}
    </div>
  );
}
