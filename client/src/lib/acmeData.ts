export type DeviceCategory = "wan" | "edge" | "core" | "access" | "endpoint" | "live";
export type DeviceState = "modeled" | "up" | "unknown";
export type LinkState = "up" | "down" | "unknown";

export interface InterfaceRecord {
  name: string;
  ip?: string;
  prefix?: string;
  vlan?: number;
  state: "up" | "shutdown" | "unknown";
  connectedTo?: string;
  note?: string;
}

export interface DeviceRecord {
  id: string;
  label: string;
  category: DeviceCategory;
  vendor: string;
  model: string;
  role: string;
  state: DeviceState;
  site: "HQ" | "BR1" | "WAN" | "LIVE LAB";
  interfaces: InterfaceRecord[];
  vlans?: number[];
  protocols?: string[];
  configSource?: string;
  description?: string;
}

export interface LinkRecord {
  id: string;
  source: string;
  sourcePort: string;
  target: string;
  targetPort: string;
  state: LinkState;
  protocol?: string;
  label?: string;
}

export interface VlanRecord {
  id: number;
  name: string;
  gateway: string;
  subnet: string;
  site: "HQ" | "BR1";
  device: string;
  acl?: string;
  endpoints: string[];
}

export interface EventRecord {
  time: string;
  kind: "topology" | "routing" | "security" | "system";
  title: string;
  detail: string;
  source: string;
  mode: "DEMO" | "LIVE" | "STATIC";
}

export const devices: DeviceRecord[] = [
  {
    id: "isp-cloud-1",
    label: "ISP Cloud 1",
    category: "wan",
    vendor: "Modeled",
    model: "ISP Cloud",
    role: "External WAN",
    state: "modeled",
    site: "WAN",
    interfaces: [{ name: "uplink", ip: "203.0.113.1", prefix: "/24", state: "unknown", connectedTo: "R1" }],
    protocols: ["STATIC"],
    configSource: "sandbox topology",
  },
  {
    id: "r1",
    label: "R1",
    category: "edge",
    vendor: "Cisco",
    model: "router-4",
    role: "WAN Edge Router",
    state: "modeled",
    site: "HQ",
    interfaces: [
      { name: "Gi0/1", ip: "203.0.113.2", prefix: "/24", state: "up", connectedTo: "ISP Cloud 1" },
      { name: "Gi0/2", ip: "10.254.0.1", prefix: "/30", state: "up", connectedTo: "ASA1" },
      { name: "Gi0/0", state: "shutdown" },
      { name: "Gi0/3", state: "shutdown" },
    ],
    protocols: ["STATIC"],
    configSource: "sandbox topology",
    description: "Default route via 203.0.113.1",
  },
  {
    id: "asa1",
    label: "ASA1",
    category: "edge",
    vendor: "Cisco",
    model: "asa-5508-x / ASA 9.16",
    role: "Perimeter Firewall",
    state: "modeled",
    site: "HQ",
    interfaces: [
      { name: "Gi1/1 outside", ip: "10.254.0.2", prefix: "/30", state: "up", connectedTo: "R1", note: "security level 0" },
      { name: "Gi1/2 inside", ip: "10.254.1.2", prefix: "/30", state: "up", connectedTo: "CORE-SW1", note: "security level 100" },
    ],
    protocols: ["STATIC", "NAT", "ACL"],
    configSource: "sandbox topology",
    description: "Dynamic interface NAT toward outside; ICMP permitted on outside and inside",
  },
  {
    id: "core-sw1",
    label: "CORE-SW1",
    category: "core",
    vendor: "Cisco-style",
    model: "l3-switch-24",
    role: "Campus Core",
    state: "modeled",
    site: "HQ",
    interfaces: [
      { name: "Gi0/1", state: "up", connectedTo: "ACCESS-SW1", note: "802.1Q trunk" },
      { name: "Gi0/2", state: "up", connectedTo: "BR1-CORE", note: "access VLAN 99" },
      { name: "Gi0/3", state: "up", connectedTo: "ASA1", note: "access VLAN 98" },
      { name: "Vlan98", ip: "10.254.1.1", prefix: "/30", vlan: 98, state: "up" },
      { name: "Vlan99", ip: "10.255.0.1", prefix: "/30", vlan: 99, state: "up" },
    ],
    vlans: [10, 20, 21, 22, 23, 30, 40, 50, 51, 98, 99],
    protocols: ["OSPF", "L2", "ACL"],
    configSource: "sandbox topology",
    description: "OSPF process 1 / area 0; default-information originate; default route via 10.254.1.2",
  },
  {
    id: "access-sw1",
    label: "ACCESS-SW1",
    category: "access",
    vendor: "Cisco-style",
    model: "switch-24",
    role: "HQ Access Layer",
    state: "modeled",
    site: "HQ",
    interfaces: [
      { name: "Gi0/1", state: "up", connectedTo: "CORE-SW1", note: "trunk" },
      { name: "Gi0/4–Gi0/11", state: "up", note: "endpoint access ports" },
    ],
    vlans: [10, 20, 21, 22, 23, 30, 40, 50, 51],
    protocols: ["L2"],
    configSource: "sandbox topology",
  },
  {
    id: "br1-core",
    label: "BR1-CORE",
    category: "core",
    vendor: "Cisco-style",
    model: "l3-switch-24",
    role: "Branch Core",
    state: "modeled",
    site: "BR1",
    interfaces: [
      { name: "Gi0/1", ip: "10.255.0.2", prefix: "/30", vlan: 99, state: "up", connectedTo: "CORE-SW1", note: "WAN-HQ" },
      { name: "Gi0/2", state: "up", connectedTo: "BR1-ACCSS", note: "trunk" },
    ],
    vlans: [10, 20, 21, 23, 30, 40, 99],
    protocols: ["OSPF", "L2"],
    configSource: "sandbox topology",
    description: "OSPF process 1 / area 0",
  },
  {
    id: "br1-accss",
    label: "BR1-ACCSS",
    category: "access",
    vendor: "Cisco-style",
    model: "switch-24",
    role: "Branch Access Layer",
    state: "modeled",
    site: "BR1",
    interfaces: [
      { name: "Gi0/1", state: "up", connectedTo: "BR1-CORE", note: "trunk" },
      { name: "Gi0/3", state: "up", connectedTo: "PC8" },
      { name: "Gi0/4", state: "up", connectedTo: "PC9" },
    ],
    vlans: [10, 20, 21, 23, 30, 40],
    protocols: ["L2"],
    configSource: "sandbox topology",
  },
  ...[
    ["pc1", "PC1", 20, "10.10.20.10", "SALES", "Gi0/4"],
    ["pc2", "PC2", 21, "10.10.21.10", "Engineering", "Gi0/5"],
    ["pc3", "PC3", 22, "10.10.22.10", "Finance", "Gi0/6"],
    ["pc4", "PC4", 23, "10.10.23.10", "IT-OPS", "Gi0/7"],
    ["pc5", "PC5", 40, "10.10.40.10", "Guest", "Gi0/9"],
    ["pc6", "PC6", 50, "10.10.50.10", "Gen-Servers", "Gi0/10"],
    ["pc7", "PC7", 51, "10.10.51.10", "Fin-Servers", "Gi0/11"],
    ["pc8", "PC8", 20, "10.20.20.10", "Sales", "Gi0/3"],
    ["pc9", "PC9", undefined, undefined, "Unassigned", "Gi0/4"],
  ].map(([id, label, vlan, ip, role, port]) => ({
    id: id as string,
    label: label as string,
    category: "endpoint" as const,
    vendor: "Endpoint",
    model: "client",
    role: role as string,
    state: "modeled" as const,
    site: (id === "pc8" || id === "pc9" ? "BR1" : "HQ") as "HQ" | "BR1",
    interfaces: [{ name: port as string, ...(ip ? { ip: ip as string } : {}), ...(vlan ? { vlan: vlan as number } : {}), state: "up" as const, connectedTo: id === "pc8" || id === "pc9" ? "BR1-ACCSS" : "ACCESS-SW1" }],
    vlans: vlan ? [vlan as number] : [],
    protocols: ["L2"],
    configSource: "sandbox topology",
    description: ip ? `Gateway ${id === "pc8" ? "10.20.20.1" : `10.10.${vlan}.1`}` : "IP unset; unassigned endpoint",
  })),
  {
    id: "isp-peer",
    label: "isp-peer",
    category: "live",
    vendor: "FRRouting",
    model: "frrouting/frr:latest",
    role: "Live ISP Peer",
    state: "up",
    site: "LIVE LAB",
    interfaces: [{ name: "eth1", ip: "203.0.113.1", prefix: "/24", state: "up", connectedTo: "hq-r1" }],
    protocols: ["BGP"],
    configSource: "Containerlab / FRR",
    description: "AS65000; originates default route toward HQ",
  },
  {
    id: "hq-r1",
    label: "hq-r1",
    category: "live",
    vendor: "FRRouting",
    model: "frrouting/frr:latest",
    role: "Live HQ Router",
    state: "up",
    site: "LIVE LAB",
    interfaces: [
      { name: "eth1", ip: "203.0.113.2", prefix: "/24", state: "up", connectedTo: "isp-peer" },
      { name: "eth2", ip: "10.255.1.1", prefix: "/30", state: "up", connectedTo: "br-r1" },
      { name: "lo", ip: "10.100.0.1", prefix: "/32", state: "up" },
    ],
    protocols: ["BGP", "OSPF"],
    configSource: "Containerlab / FRR",
    description: "AS65001; advertises 10.10.0.0/16; originates default into OSPF",
  },
  {
    id: "br-r1",
    label: "br-r1",
    category: "live",
    vendor: "FRRouting",
    model: "frrouting/frr:latest",
    role: "Live Branch Router",
    state: "up",
    site: "LIVE LAB",
    interfaces: [{ name: "eth1", ip: "10.255.1.2", prefix: "/30", state: "up", connectedTo: "hq-r1" }],
    protocols: ["OSPF"],
    configSource: "Containerlab / FRR",
    description: "OSPF-only branch router; expected to learn 0.0.0.0/0 through OSPF",
  },
] as DeviceRecord[];

export const links: LinkRecord[] = [
  ["core-access", "core-sw1", "Gi0/1", "access-sw1", "Gi0/1", "unknown", "L2 trunk"],
  ["pc1", "pc1", "Gi0/4", "access-sw1", "Gi0/4", "unknown", "VLAN 20"],
  ["pc2", "pc2", "Gi0/5", "access-sw1", "Gi0/5", "unknown", "VLAN 21"],
  ["pc3", "pc3", "Gi0/6", "access-sw1", "Gi0/6", "unknown", "VLAN 22"],
  ["pc4", "pc4", "Gi0/7", "access-sw1", "Gi0/7", "unknown", "VLAN 23"],
  ["pc5", "pc5", "Gi0/9", "access-sw1", "Gi0/9", "unknown", "VLAN 40"],
  ["pc6", "pc6", "Gi0/10", "access-sw1", "Gi0/10", "unknown", "VLAN 50"],
  ["pc7", "pc7", "Gi0/11", "access-sw1", "Gi0/11", "unknown", "VLAN 51"],
  ["hq-branch", "core-sw1", "Gi0/2", "br1-core", "Gi0/1", "unknown", "WAN VLAN 99"],
  ["branch-access", "br1-accss", "Gi0/1", "br1-core", "Gi0/2", "unknown", "L2 trunk"],
  ["pc8", "pc8", "Gi0/3", "br1-accss", "Gi0/3", "unknown", "VLAN 20"],
  ["pc9", "br1-accss", "Gi0/4", "pc9", "Gi0/0", "unknown", "UNASSIGNED"],
  ["r1-isp", "r1", "Gi0/1", "isp-cloud-1", "uplink", "unknown", "203.0.113.0/24"],
  ["asa-r1", "asa1", "Gi1/1", "r1", "Gi0/2", "unknown", "10.254.0.0/30"],
  ["asa-core", "core-sw1", "Gi0/3", "asa1", "Gi1/2", "unknown", "10.254.1.0/30"],
  ["bgp", "isp-peer", "eth1", "hq-r1", "eth1", "up", "eBGP · AS65000 ↔ AS65001"],
  ["ospf", "hq-r1", "eth2", "br-r1", "eth1", "up", "OSPF area 0 · 10.255.1.0/30"],
].map(([id, source, sourcePort, target, targetPort, state, label]) => ({ id: id as string, source: source as string, sourcePort: sourcePort as string, target: target as string, targetPort: targetPort as string, state: state as LinkState, label: label as string }));

export const vlans: VlanRecord[] = [
  { id: 10, name: "MGMT", gateway: "10.10.1.1 / 10.20.1.1", subnet: "10.10.1.0/24 · 10.20.1.0/24", site: "HQ", device: "CORE-SW1 / BR1-CORE", endpoints: [], acl: "—" },
  { id: 20, name: "SALES", gateway: "10.10.20.1 / 10.20.20.1", subnet: "10.10.20.0/24 · 10.20.20.0/24", site: "HQ", device: "CORE-SW1 / BR1-CORE", endpoints: ["PC1", "PC8"], acl: "IT-OPS-ACL" },
  { id: 21, name: "ENGINEERING", gateway: "10.10.21.1 / 10.20.21.1", subnet: "10.10.21.0/24 · 10.20.21.0/24", site: "HQ", device: "CORE-SW1 / BR1-CORE", endpoints: ["PC2"], acl: "FIN-SERVERS-ACL" },
  { id: 22, name: "FINANCE", gateway: "10.10.22.1", subnet: "10.10.22.0/24", site: "HQ", device: "CORE-SW1", endpoints: ["PC3"], acl: "FIN-SERVERS-ACL" },
  { id: 23, name: "IT-OPS", gateway: "10.10.23.1 / 10.20.23.1", subnet: "10.10.23.0/24 · 10.20.23.0/24", site: "HQ", device: "CORE-SW1 / BR1-CORE", endpoints: ["PC4"], acl: "IT-OPS-ACL" },
  { id: 30, name: "VOICE", gateway: "10.10.30.1 / 10.20.30.1", subnet: "10.10.30.0/24 · 10.20.30.0/24", site: "HQ", device: "CORE-SW1 / BR1-CORE", endpoints: [], acl: "—" },
  { id: 40, name: "GUEST", gateway: "10.10.40.1 / 10.20.40.1", subnet: "10.10.40.0/24 · 10.20.40.0/24", site: "HQ", device: "CORE-SW1 / BR1-CORE", endpoints: ["PC5"], acl: "GUEST-ACL" },
  { id: 50, name: "GEN-SERVERS", gateway: "10.10.50.1", subnet: "10.10.50.0/24", site: "HQ", device: "CORE-SW1", endpoints: ["PC6"], acl: "—" },
  { id: 51, name: "FIN-SERVERS", gateway: "10.10.51.1", subnet: "10.10.51.0/24", site: "HQ", device: "CORE-SW1", endpoints: ["PC7"], acl: "FIN-SERVERS-ACL" },
  { id: 98, name: "WAN-EDGE", gateway: "10.254.1.1", subnet: "10.254.1.0/30", site: "HQ", device: "CORE-SW1", endpoints: [], acl: "—" },
  { id: 99, name: "WAN-BR1", gateway: "10.255.0.1 / 10.255.0.2", subnet: "10.255.0.0/30", site: "HQ", device: "CORE-SW1 / BR1-CORE", endpoints: [], acl: "—" },
];

export const aclPolicies = [
  { name: "FIN-SERVERS-ACL", scope: "10.10.51.0/24", rules: [{ verdict: "ALLOW", text: "Engineering VLAN 22 → Finance Servers" }, { verdict: "ALLOW", text: "IT-OPS VLAN 23 → Finance Servers" }, { verdict: "DENY", text: "All other traffic to 10.10.51.0/24" }, { verdict: "ALLOW", text: "Everything else" }] },
  { name: "GUEST-ACL", scope: "Guest VLAN 40", rules: [{ verdict: "DENY", text: "Guest VLAN 40 → 10.10.0.0/16" }, { verdict: "ALLOW", text: "Everything else" }] },
  { name: "IT-OPS-ACL", scope: "Sales VLAN", rules: [{ verdict: "ALLOW", text: "IT-OPS → Sales TCP/22" }, { verdict: "ALLOW", text: "IT-OPS → Sales TCP/3389" }, { verdict: "ALLOW", text: "Sales VLAN → itself" }, { verdict: "ALLOW", text: "10.20.20.0/24 → Sales VLAN" }, { verdict: "DENY", text: "Other traffic to Sales VLAN" }, { verdict: "ALLOW", text: "Everything else" }] },
];

export const demoTelemetry = {
  mode: "DEMO" as const,
  reachable: true,
  docker: "ONLINE" as const,
  containerlab: "ONLINE" as const,
  nodes: [
    { id: "isp-peer", container: "clab-acme-wan-lab-isp-peer", state: "RUNNING", asn: "65000", ip: "203.0.113.1/24" },
    { id: "hq-r1", container: "clab-acme-wan-lab-hq-r1", state: "RUNNING", asn: "65001", ip: "203.0.113.2/24 · 10.255.1.1/30", loopback: "10.100.0.1/32" },
    { id: "br-r1", container: "clab-acme-wan-lab-br-r1", state: "RUNNING", asn: "—", ip: "10.255.1.2/30" },
  ],
  bgp: { state: "ESTABLISHED", localAs: 65001, remoteAs: 65000, neighbor: "203.0.113.1", routesReceived: 1, routesSent: 1, prefixesReceived: 1, prefixesSent: 1, uptime: "seeded demo state", policy: "no ebgp-requires-policy" },
  ospf: { state: "FULL", routerId: "10.100.0.1", area: "0.0.0.0", neighbor: "br-r1 · 10.255.1.2", network: "10.255.1.0/30", defaultRoute: "PRESENT" },
  route: { prefix: "0.0.0.0/0", source: "isp-peer", protocol: "eBGP → OSPF", nextHop: "203.0.113.1", interface: "eth1 → eth2 → eth1", metric: "—" },
};

export const events: EventRecord[] = [
  { time: "16:03:22", kind: "routing", title: "BGP peer established", detail: "hq-r1 ↔ isp-peer · AS65001 / AS65000", source: "Containerlab seed", mode: "DEMO" },
  { time: "16:03:24", kind: "routing", title: "Default route received", detail: "0.0.0.0/0 via eBGP", source: "hq-r1", mode: "DEMO" },
  { time: "16:03:26", kind: "routing", title: "OSPF adjacency established", detail: "hq-r1 ↔ br-r1 · area 0", source: "Containerlab seed", mode: "DEMO" },
  { time: "16:03:29", kind: "routing", title: "Default route installed on branch", detail: "0.0.0.0/0 propagated through OSPF", source: "br-r1", mode: "DEMO" },
  { time: "—", kind: "topology", title: "Campus topology loaded", detail: "16 modeled devices · 15 physical links", source: "sandbox topology", mode: "STATIC" },
  { time: "—", kind: "security", title: "ACL set loaded", detail: "FIN-SERVERS-ACL · GUEST-ACL · IT-OPS-ACL", source: "CORE-SW1", mode: "STATIC" },
  { time: "—", kind: "topology", title: "PC9 endpoint loaded", detail: "IP unset · preserve unassigned state", source: "BR1-ACCSS Gi0/4", mode: "STATIC" },
];

export const configs: Record<string, string> = {
  "core-sw1": `hostname CORE-SW1\n!\ninterface Gi0/1\n description trunk to ACCESS-SW1\n switchport mode trunk\n!\ninterface Gi0/2\n switchport access vlan 99\n!\ninterface Gi0/3\n switchport access vlan 98\n!\nrouter ospf 1\n network 10.0.0.0 0.255.255.255 area 0\n default-information originate\n!\nip route 0.0.0.0 0.0.0.0 10.254.1.2\n!\naccess-list FIN-SERVERS-ACL ...`,
  asa1: `hostname ASA1\n!\ninterface Gi1/1\n nameif outside\n security-level 0\n ip address 10.254.0.2 255.255.255.252\n!\ninterface Gi1/2\n nameif inside\n security-level 100\n ip address 10.254.1.2 255.255.255.252\n!\nroute outside 0.0.0.0 0.0.0.0 10.254.0.1\nroute inside 10.0.0.0 255.0.0.0 10.254.1.1\n!\nnat (inside,outside) dynamic interface\naccess-list outside_access_in extended permit icmp any any\naccess-list inside_access_in extended permit icmp any any`,
  "hq-r1": `! Containerlab FRR node: hq-r1\nrouter bgp 65001\n bgp router-id 10.100.0.1\n neighbor 203.0.113.1 remote-as 65000\n network 10.10.0.0/16\n!\nrouter ospf\n network 10.255.1.0/30 area 0\n default-information originate\n!\n! no bgp ebgp-requires-policy`,
  "br-r1": `! Containerlab FRR node: br-r1\nrouter ospf\n ospf router-id 10.100.0.2\n network 10.255.1.0/30 area 0\n!\n! expected to learn 0.0.0.0/0 through OSPF`,
};

export const topologyPositions: Record<string, { x: number; y: number; w?: number; h?: number }> = {
  "isp-cloud-1": { x: 70, y: 92, w: 118, h: 58 }, r1: { x: 255, y: 92 }, asa1: { x: 445, y: 92 }, "core-sw1": { x: 650, y: 92 }, "access-sw1": { x: 870, y: 92 },
  "br1-core": { x: 650, y: 270 }, "br1-accss": { x: 870, y: 270 }, pc1: { x: 1050, y: 34 }, pc2: { x: 1050, y: 82 }, pc3: { x: 1050, y: 130 }, pc4: { x: 1050, y: 178 }, pc5: { x: 1050, y: 226 }, pc6: { x: 1050, y: 274 }, pc7: { x: 1050, y: 322 }, pc8: { x: 1050, y: 410 }, pc9: { x: 1050, y: 458 },
  "isp-peer": { x: 225, y: 570, w: 132, h: 62 }, "hq-r1": { x: 470, y: 570, w: 132, h: 62 }, "br-r1": { x: 715, y: 570, w: 132, h: 62 },
};

export const navItems = [
  { path: "/app", label: "Overview", icon: "activity" },
  { path: "/app/topology", label: "Topology", icon: "network" },
  { path: "/app/wan-lab", label: "WAN Lab", icon: "radio" },
  { path: "/app/devices", label: "Devices", icon: "server" },
  { path: "/app/vlans", label: "VLANs", icon: "layers" },
  { path: "/app/routing", label: "Routing", icon: "route" },
  { path: "/app/security", label: "Security", icon: "shield" },
  { path: "/app/events", label: "Events", icon: "clock" },
  { path: "/app/lab-console", label: "Lab Console", icon: "terminal" },
];
