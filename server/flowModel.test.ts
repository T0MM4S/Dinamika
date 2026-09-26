import { describe, expect, it } from "vitest";
import { eventLinkId, ambientDirection } from "../client/src/lib/flowModel";

describe("flow model", () => {
  it("maps only logged routing events to their real links", () => {
    expect(eventLinkId({ title: "BGP peer established", detail: "hq-r1 ↔ isp-peer" })).toBe("bgp");
    expect(eventLinkId({ title: "OSPF adjacency established", detail: "hq-r1 ↔ br-r1" })).toBe("ospf");
    expect(eventLinkId({ title: "Campus topology loaded", detail: "16 modeled devices" })).toBeUndefined();
  });

  it("keeps ambient WAN direction deterministic", () => {
    expect(ambientDirection({ id: "r1-isp", source: "r1", sourcePort: "Gi0/1", target: "isp-cloud-1", targetPort: "uplink", state: "unknown" })).toBe("reverse");
  });
});
