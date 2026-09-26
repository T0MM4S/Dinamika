import type { EventRecord } from "./acmeData";

type ContainerState = { name?: string; status?: string };
type TelemetrySnapshot = {
  bgp?: { state?: string };
  ospf?: { state?: string; defaultRoute?: string };
  route?: { state?: string };
  containers?: ContainerState[];
};

export function deriveLiveEvents(previous: TelemetrySnapshot | undefined, current: TelemetrySnapshot, now = new Date()): EventRecord[] {
  if (!previous) return [];
  const time = now.toLocaleTimeString([], { hour12: false });
  const next: EventRecord[] = [];
  const push = (title: string, detail: string, source: string) => next.push({ time, kind: "routing", title, detail, source, mode: "LIVE" });
  if (previous.bgp?.state !== current.bgp?.state) push(`BGP state changed to ${current.bgp?.state ?? "UNKNOWN"}`, "hq-r1 ↔ isp-peer", "Live lab poll");
  if (previous.ospf?.state !== current.ospf?.state) push(`OSPF state changed to ${current.ospf?.state ?? "UNKNOWN"}`, "hq-r1 ↔ br-r1 · area 0", "Live lab poll");
  const previousRoute = previous.ospf?.defaultRoute ?? previous.route?.state;
  const currentRoute = current.ospf?.defaultRoute ?? current.route?.state;
  if (previousRoute !== currentRoute) push(`Default route changed to ${currentRoute ?? "UNKNOWN"}`, "0.0.0.0/0 branch propagation", "Live lab poll");
  const previousContainers = new Map((previous.containers ?? []).map((container) => [container.name, container.status]));
  for (const container of current.containers ?? []) {
    if (previousContainers.has(container.name) && previousContainers.get(container.name) !== container.status) push(`Container ${container.name ?? "UNKNOWN"} changed state`, container.status ?? "UNKNOWN", "Live lab poll");
  }
  return next;
}
