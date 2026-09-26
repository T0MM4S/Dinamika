import { Activity, Database } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Panel, StateBadge } from "./NetworkPrimitives";

function Timeline({ label, rows, field }: { label: string; rows: Array<Record<string, unknown>>; field: "bgpState" | "ospfState" }) {
  return <div className="border-t border-[#243640] px-4 py-4 first:border-t-0"><div className="mb-2 flex items-center justify-between"><span className="kicker">{label}</span><span className="mono text-[10px] text-[#6f8793]">{rows.length} polls</span></div><div className="flex h-7 items-center gap-1">{rows.map((row, index) => { const state = String(row[field] ?? "UNKNOWN"); const healthy = field === "bgpState" ? state === "ESTABLISHED" : state === "FULL"; const unknown = state === "UNKNOWN"; return <div key={`${String(row.polledAt)}-${index}`} title={`${state} · ${String(row.polledAt)}`} className={`h-5 min-w-[3px] flex-1 ${unknown ? "bg-[#455661]" : healthy ? "bg-[#54bd91]" : "bg-[#b85d68]"}`} />; })}</div><div className="mt-2 flex justify-between text-[9px] text-[#637985]"><span>oldest stored poll</span><span>newest stored poll</span></div></div>;
}

export function HistoryStrip({ mode }: { mode: "DEMO" | "LIVE" }) {
  const history = trpc.lab.history.useQuery({ limit: 120 }, { enabled: mode === "LIVE", refetchInterval: mode === "LIVE" ? 15000 : false, refetchOnWindowFocus: false, retry: false });
  if (mode === "DEMO") return <Panel title="Historical uptime" eyebrow="Persisted telemetry"><div className="flex items-start gap-3 p-5 text-[11px] leading-5 text-[#849aa5]"><Database size={16} className="mt-0.5 shrink-0 text-[#c1a668]" /><span>History requires LIVE mode. DEMO mode does not fabricate a timeline.</span></div></Panel>;
  const rows = history.data?.rows ?? [];
  return <Panel title="Historical uptime" eyebrow="Last 2 hours · persisted live polls" action={<StateBadge label={rows.length ? `${rows.length} RECORDED` : "NO HISTORY"} state={rows.length ? "up" : "unknown"} />}>
    {history.isError ? <div className="p-5 text-[11px] text-[#d7878b]">History could not be fetched from the backend.</div> : rows.length === 0 ? <div className="flex items-start gap-3 p-5 text-[11px] leading-5 text-[#849aa5]"><Activity size={16} className="mt-0.5 shrink-0 text-[#718c9a]" /><span>NO HISTORY RECORDED YET</span></div> : <><Timeline label="BGP · Established" rows={rows as Array<Record<string, unknown>>} field="bgpState" /><Timeline label="OSPF · Full" rows={rows as Array<Record<string, unknown>>} field="ospfState" /><div className="flex flex-wrap gap-5 border-t border-[#243640] px-4 py-4 text-[10px] text-[#8ca2ad]"><span><strong className="mono text-[#d8e6eb]">{history.data?.bgpChanges ?? 0}</strong> BGP state changes recorded this session</span><span><strong className="mono text-[#d8e6eb]">{history.data?.ospfChanges ?? 0}</strong> OSPF state changes recorded</span></div></>}
  </Panel>;
}
