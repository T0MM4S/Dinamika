import { describe, expect, it } from "vitest";
import { parseBGP, runDiagnostic } from "./services/wanTelemetry";

describe("wan telemetry parser", () => {
  it("extracts the received prefix count from FRR BGP summary output", () => {
    const result = parseBGP("BGP neighbor 203.0.113.1, remote AS 65000\nBGP state = Established\n1 received");

    expect(result.state).toBe("ESTABLISHED");
    expect(result.prefixesReceived).toBe(1);
  });

  it("rejects nodes outside the Containerlab inventory", async () => {
    const result = await runDiagnostic("bgp-summary", "rogue-node");

    expect(result).toEqual({ ok: false, output: "Node not allowed" });
  });

  it("rejects operations outside the supported diagnostics", async () => {
    const result = await runDiagnostic("shell" as never, "hq-r1");

    expect(result).toEqual({ ok: false, output: "Diagnostic not allowed" });
  });
});
