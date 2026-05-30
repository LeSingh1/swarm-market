// Frontend API client (Person B). One function per route.
import { API } from "../types/contract";
import type {
  AgentRun, RunRequest, ReflectResponse, Episode,
  SearchResponse, InstallResponse, RateResponse, PublishResponse, SkillPack,
} from "../types/contract";

async function post<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`${API.base}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${path} ${r.status}`);
  return r.json();
}

export const runAgent  = (b: RunRequest) => post<AgentRun>(API.run, b);
export const reflect   = (agent_id: string, episodes: Episode[]) =>
  post<ReflectResponse>(API.reflect, { agent_id, episodes });
export const publish   = (pack: SkillPack) => post<PublishResponse>(API.publish, { pack });
export const install   = (agent_id: string, pack_id: string) =>
  post<InstallResponse>(API.install, { agent_id, pack_id });
export const rate      = (pack_id: string) => post<RateResponse>(API.rate, { pack_id, delta: 1 });

export async function search(q = ""): Promise<SkillPack[]> {
  const r = await fetch(`${API.base}${API.search}?q=${encodeURIComponent(q)}`);
  if (!r.ok) throw new Error(`search ${r.status}`);
  return ((await r.json()) as SearchResponse).packs;
}
