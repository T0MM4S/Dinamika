import { describe, expect, it } from "vitest";
import { deriveLiveEvents } from "../client/src/lib/telemetryEvents";

describe("live telemetry event generation", () => {
  it("emits only real state transitions", () => {
    const previous = {
      bgp: { state: "ESTABLISHED" },
      ospf: { state: "FULL", defaultRoute: "PRESENT" },
      containers: [{ name: "hq-r1", status: "Up" }],
    };
    const current = {
      bgp: { state: "DOWN" },
      ospf: { state: "FULL", defaultRoute: "MISSING" },
      containers: [{ name: "hq-r1", status: "Exited" }],
    };

    const result = deriveLiveEvents(previous, current, new Date("2026-09-26T16:00:00Z"));

    expect(result.map((event) => event.title)).toEqual([
      "BGP state changed to DOWN",
      "Default route changed to MISSING",
      "Container hq-r1 changed state",
    ]);
    expect(result.every((event) => event.mode === "LIVE")).toBe(true);
  });
});
