import { CircleDashed } from "lucide-react";
import { StateBadge } from "./NetworkPrimitives";

type RouteTelemetry = { bgp?: { state?: string }; ospf?: { state?: string; defaultRoute?: string }; route?: { state?: string } } | undefined;

export function RoutePath({ telemetry, mode, compact = false }: { telemetry: RouteTelemetry; mode: "DEMO" | "LIVE"; compact?: boolean }) {
  const bgpHealthy = telemetry?.bgp?.state === "ESTABLISHED";
  const ospfHealthy = telemetry?.ospf?.state === "FULL";
  const routeHealthy = telemetry?.route?.state === "PRESENT" || telemetry?.ospf?.defaultRoute === "PRESENT";
  const raw = [bgpHealthy, ospfHealthy, routeHealthy];
  let broken = false;
  const hops = ["ISP-PEER", "HQ-R1", "BR-R1"].map((label, index) => {
    const healthy = mode === "DEMO" ? true : index === 0 ? true : raw[index - 1] && !broken;
    const firstBreak = mode === "LIVE" && !healthy && !broken;
    if (!healthy) broken = true;
    return { label, healthy, firstBreak, state: mode === "DEMO" ? "seeded" : healthy ? "healthy" : firstBreak ? "broken" : "unreachable" };
  });
  const terminalHealthy = mode === "DEMO" || !broken;
  return <div className={compact ? "p-4" : "p-5"}><div className="mb-3 flex items-center justify-between"><div><div className="kicker">ROUTE PATH</div><div className="mono mt-1 text-[15px] text-[#dbe9ef]">0.0.0.0/0</div></div><StateBadge label={mode === "DEMO" ? "DEMO" : terminalHealthy ? "PRESENT" : "BROKEN"} state={mode === "DEMO" ? "modeled" : terminalHealthy ? "up" : "down"} /></div><div className="flex items-center gap-1">{hops.map((hop, index) => <div key={hop.label} className="flex min-w-0 flex-1 items-center gap-1">{index > 0 && <div className={`relative h-px flex-1 ${hop.healthy ? "bg-[#56c99b]" : hop.firstBreak ? "bg-[#d76e77]" : "bg-[#465761]"}`}>{hop.healthy && <span className="route-marker" />}</div>}<div className={`min-w-[70px] flex-1 border px-2 py-2 ${mode === "DEMO" ? "border-[#735f36] bg-[#241e15]" : hop.healthy ? "border-[#2f6b58] bg-[#10251f]" : hop.firstBreak ? "border-[#6a3a40] bg-[#29171b]" : "border-[#34434b] bg-[#121b21]"}`}><div className="truncate text-[9px] font-bold text-[#cfdfe6]">{hop.label}</div><div className={`mt-1 text-[9px] ${mode === "DEMO" ? "text-[#ddbd78]" : hop.healthy ? "text-[#65d5a5]" : hop.firstBreak ? "text-[#df7f87]" : "text-[#778b94]"}`}>{hop.state}</div></div></div>)}</div><div className="mt-3 flex items-center gap-2 text-[10px] text-[#718793]"><CircleDashed size={12} /> eBGP → OSPF → default route · flow stops at the first broken hop.</div></div>;
}
