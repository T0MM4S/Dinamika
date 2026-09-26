import type { EventRecord, LinkRecord } from "./acmeData";

/** Decorative ambient flow is never derived from event data. */
export type FlowKind = "ambient" | "event";

/** Map only genuinely logged routing events to the real lab link they describe. */
export function eventLinkId(event: Pick<EventRecord, "title" | "detail">): string | undefined {
  const text = `${event.title} ${event.detail}`.toLowerCase();
  if (text.includes("bgp") || text.includes("ebgp") || text.includes("isp-peer")) return "bgp";
  if (text.includes("ospf") || text.includes("br-r1") || text.includes("hq-r1 ↔ br-r1")) return "ospf";
  return undefined;
}

/** Keep the visual ambient direction aligned with endpoint → access → core → WAN edge. */
export function ambientDirection(link: LinkRecord): "forward" | "reverse" {
  return link.id === "r1-isp" ? "reverse" : "forward";
}
