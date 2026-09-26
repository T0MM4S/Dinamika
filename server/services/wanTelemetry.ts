import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { insertTelemetrySnapshot } from "../db";

const execFileAsync = promisify(execFile);
const allowedNodes = new Set(["isp-peer", "hq-r1", "br-r1"]);
const containerNames: Record<string, string> = {
  "isp-peer": "clab-acme-wan-lab-isp-peer",
  "hq-r1": "clab-acme-wan-lab-hq-r1",
  "br-r1": "clab-acme-wan-lab-br-r1",
};

export type DiagnosticName = "docker-status" | "container-status" | "bgp-summary" | "bgp-routes" | "ospf-neighbors" | "ospf-routes" | "route-table" | "interface-status";
const commands: Record<DiagnosticName, (node?: string) => string[]> = {
  "docker-status": () => ["ps", "--format", "{{.Names}}\\t{{.Status}}"],
  "container-status": () => ["ps", "--filter", "name=clab-acme-wan-lab-", "--format", "{{.Names}}\\t{{.Status}}"],
  "bgp-summary": (node = "hq-r1") => ["exec", containerNames[node], "vtysh", "-c", "show ip bgp summary"],
  "bgp-routes": (node = "hq-r1") => ["exec", containerNames[node], "vtysh", "-c", "show ip route bgp"],
  "ospf-neighbors": (node = "br-r1") => ["exec", containerNames[node], "vtysh", "-c", "show ip ospf neighbor"],
  "ospf-routes": (node = "br-r1") => ["exec", containerNames[node], "vtysh", "-c", "show ip route ospf"],
  "route-table": (node = "br-r1") => ["exec", containerNames[node], "vtysh", "-c", "show ip route"],
  "interface-status": (node = "hq-r1") => ["exec", containerNames[node], "vtysh", "-c", "show interface brief"],
};

async function run(args: string[]) {
  try {
    const result = await execFileAsync("docker", args, { timeout: 4500, maxBuffer: 120_000 });
    return { ok: true, output: result.stdout.trim() || result.stderr.trim() };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Docker command failed";
    return { ok: false, output: message };
  }
}

function parseContainers(output: string) {
  return output.split(String.fromCharCode(10)).filter(Boolean).map((line) => {
    const [name, ...status] = line.split(String.fromCharCode(9));
    return { name, status: status.join(" ") || "UNKNOWN" };
  });
}

export function parseBGP(output: string) {
  const neighbor = output.match(/(203\.0\.113\.1)\s+4\s+(65000)/);
  const established = /Established|established/.test(output);
  const prefixes = output.match(/(\d+)\s+received/);
  return { state: established ? "ESTABLISHED" : neighbor ? "DOWN" : "UNKNOWN", neighbor: neighbor?.[1] ?? "203.0.113.1", remoteAs: Number(neighbor?.[2] ?? 65000), prefixesReceived: Number(prefixes?.[1] ?? 0) };
}

function parseOspf(output: string) {
  const full = /Full|FULL/.test(output);
  const neighbor = output.match(/(10\.255\.1\.2)/);
  return { state: full ? "FULL" : neighbor ? "DOWN" : "UNKNOWN", neighbor: neighbor?.[1] ?? "10.255.1.2" };
}

export async function getLiveTelemetry() {
  const containers = await run(commands["container-status"]());
  if (!containers.ok) {
    const unavailable = { mode: "LIVE" as const, reachable: false, docker: "OFFLINE", containerlab: "UNAVAILABLE", error: "Docker daemon unavailable", containers: [], bgp: { state: "UNKNOWN" }, ospf: { state: "UNKNOWN" }, route: { state: "UNKNOWN" } };
    await recordTelemetry(unavailable);
    return unavailable;
  }
  const names = parseContainers(containers.output);
  const bgpRaw = await run(commands["bgp-summary"]("hq-r1"));
  const ospfRaw = await run(commands["ospf-neighbors"]("br-r1"));
  const routesRaw = await run(commands["ospf-routes"]("br-r1"));
  const bgp = bgpRaw.ok ? parseBGP(bgpRaw.output) : { state: "UNKNOWN" };
  const ospf = ospfRaw.ok ? parseOspf(ospfRaw.output) : { state: "UNKNOWN" };
  const hasDefault = routesRaw.ok && routesRaw.output.includes("0.0.0.0/0");
  const telemetry = { mode: "LIVE" as const, reachable: true, docker: "ONLINE", containerlab: names.length ? "ONLINE" : "UNAVAILABLE", containers: names, bgp, ospf: { ...ospf, defaultRoute: hasDefault ? "PRESENT" : "MISSING" }, route: { state: hasDefault ? "PRESENT" : "MISSING", prefix: "0.0.0.0/0", protocol: "OSPF", raw: routesRaw.output } };
  await recordTelemetry(telemetry);
  return telemetry;
}

async function recordTelemetry(telemetry: { docker: string; bgp: { state: string }; ospf: { state: string; defaultRoute?: string }; route: { state: string } }) {
  try {
    await insertTelemetrySnapshot({ dockerStatus: telemetry.docker, bgpState: telemetry.bgp.state, ospfState: telemetry.ospf.state, defaultRouteState: telemetry.ospf.defaultRoute ?? telemetry.route.state });
  } catch (error) {
    console.warn("[Telemetry] Failed to persist history row:", error);
  }
}

export async function runDiagnostic(name: DiagnosticName, node?: string) {
  if (!(name in commands)) return { ok: false, output: "Diagnostic not allowed" };
  if (node && !allowedNodes.has(node)) return { ok: false, output: "Node not allowed" };
  return run(commands[name](node));
}
