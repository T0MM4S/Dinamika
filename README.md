# ACME Dinamika

A simulated multi-site enterprise network, paired with a real BGP/OSPF routing lab — and a NOC-style web app that visualizes both, honestly.

Built by [T0MM4S](https://github.com/T0MM4S) ([LinkedIn](https://www.linkedin.com/in/gent-bajrami-8637b72a2)) — a portfolio project built while transitioning from a NOC Engineer role into Network Engineering.

**[Live demo →](#)** *(add your published URL here)*

![ACME Dinamika topology](./docs/topology-sandbox.png)
*Full HQ + Branch 1 + WAN edge topology, built and configured in SwitchLab.dev*

---

## What this is

This project has two parts:

1. **A designed enterprise network** — headquarters + a branch office, built and configured from scratch in [SwitchLab.dev](https://switchlab.dev): VLAN segmentation by department, inter-VLAN routing, least-privilege ACLs (a locked-down finance-server zone, isolated guest network, scoped IT administrative access), OSPF routing between sites over a real WAN link, and a Cisco ASA firewall enforcing a proper security-zone model at the internet edge.
2. **A real routing lab** — three [FRRouting](https://frrouting.org/) containers running in Docker via [Containerlab](https://containerlab.dev/), forming an actual eBGP peering session with a simulated ISP and OSPF carrying a default route down to a branch router. This is genuine protocol behavior, not a simulation of one.

This web app is how both come together: a **NOC-style command center** that visualizes the designed topology and, when the lab is running, pulls real live BGP/OSPF state directly from the containers via `docker exec`.

The app never blurs the line between the two systems, and never fakes data — when the live lab isn't running, it says so plainly instead of pretending.

## Why it exists

Configuring a network is one skill. Explaining *why* you designed it that way — and proving you can operate and observe what you built — is another. This project exists to demonstrate both, as a portfolio piece for network engineering interviews and applications.

## LIVE vs. DEMO mode

- **LIVE mode** — the app's backend runs real, allow-listed `docker` / `docker exec ... vtysh` commands against the actual `clab-acme-wan-lab-*` containers and displays genuine BGP/OSPF state, container status, and route information.
- **DEMO mode** — used automatically when the live lab isn't reachable (e.g. when viewing the hosted version without the lab running locally). Uses fixed, clearly-labeled seed data reflecting the lab's known-good working state. DEMO and LIVE are never mixed, and the UI always tells you which one you're looking at.

> Because LIVE mode depends on a local Docker/Containerlab environment, it only works when the app is run alongside that environment on the same machine (see [Running the live lab](#running-the-live-lab) below). The hosted version runs in DEMO mode.

## Features

- **Landing page** — project overview, animated topology hero, links to this repo and LinkedIn
- **Topology** — interactive, pannable/zoomable network graph ([React Flow](https://reactflow.dev/)) with category and protocol filters, ambient link-activity animation, and event-linked traffic flow
- **Devices** — full inventory across campus, branch, edge, and the live lab, each with a configuration inspector
- **VLANs** — VLAN table across both sites with gateways, subnets, and associated ACLs
- **Routing** — OSPF/BGP status panels and a route-path visualizer that shows exactly where the path breaks if a protocol goes down
- **Security** — firewall (ASA) security levels, NAT, and a plain-language breakdown of every configured ACL
- **Events** — a real event log driven by actual telemetry state changes when LIVE, plus historical topology/config events
- **WAN Lab** — a dedicated page for the real Containerlab BGP/OSPF lab and its live protocol state
- **Lab Console** — a safe, read-only panel of pre-defined diagnostic commands (BGP summary, OSPF neighbors, route tables, etc.) run against the real containers

## Architecture

```
Browser (React + Vite + TypeScript + Tailwind)
        │
        │  tRPC (type-safe RPC)
        ▼
Node.js / Express backend
        │
        │  allow-listed commands only
        ▼
docker exec → clab-acme-wan-lab-{isp-peer, hq-r1, br-r1}
        (FRRouting containers, run via Containerlab)
```

The backend never exposes the Docker socket to the browser and never accepts arbitrary shell input — only a fixed set of allow-listed diagnostic commands, parsed into structured data.

## Tech stack

**Frontend:** React, Vite, TypeScript, Tailwind CSS, React Flow, Framer Motion
**Backend:** Node.js, Express, tRPC, Drizzle ORM (MySQL)
**Lab environment:** Docker, Containerlab, FRRouting

## Project structure

```
client/
  src/
    pages/        — one file per page (Landing, Overview, Topology, VLANs, ...)
    components/   — shared UI (inspector, config viewer, layout shell, ...)
    lib/          — acmeData.ts: the single source of truth for topology data
server/
  services/       — wanTelemetry.ts: real Docker/Containerlab integration
  routers.ts      — tRPC API definition
drizzle/          — DB schema and migrations
docs/             — topology diagrams / screenshots
```

## Getting started

**Requirements:** Node.js 20+, a MySQL database, and (optionally, for LIVE mode) Docker + Containerlab.

```bash
git clone https://github.com/T0MM4S/acme-dinamika.git
cd acme-dinamika
npm install
```

Create a `.env` file:
```
DATABASE_URL=mysql://user:password@host:3306/acme_dinamika
```

Run migrations, then start the dev server:
```bash
npm run db:push
npm run dev
```

The app runs in DEMO mode by default. To enable LIVE mode, see below.

## Running the live lab

The real BGP/OSPF lab is defined for [Containerlab](https://containerlab.dev/) using FRRouting images:

- `isp-peer` (AS 65000) — eBGP peer simulating the ISP, originates a default route
- `hq-r1` (AS 65001) — eBGP to the ISP, OSPF area 0 toward the branch, advertises `10.10.0.0/16` upstream
- `br-r1` — OSPF-only branch router, learns the default route via OSPF

Deploy it locally with Docker + Containerlab running, then start the app on the same machine — LIVE mode activates automatically once the containers are reachable.

## The enterprise network design

This is the core of the project — the part meant to demonstrate design reasoning, not just configuration syntax. Everything below was built and tested end-to-end in the SwitchLab.dev sandbox.

### Why two sites, and why segment by department

The design models ACME Dinamika as a headquarters plus one branch office. Rather than one flat network, every user is placed into a VLAN by **function/department**, not by physical location — Sales, Engineering, Finance, and IT-Ops exist as separate broadcast domains at HQ, with the same VLAN IDs reused at Branch 1 (minus Finance, which is HQ-only) so the same department can be identified consistently across sites.

The reasoning: a single flat network means every broadcast, and every compromised device, has an unobstructed path to everything else. VLANs create real broadcast-domain and trust boundaries. Reusing VLAN IDs across sites (e.g. VLAN 20 = Sales at both HQ and Branch 1, on different subnets) was a deliberate choice to keep the addressing scheme templatable — the same VLAN/ACL pattern proven at HQ was directly reapplied to Branch 1 rather than redesigned from scratch.

### IP addressing

Addressing is hierarchical by site, so each site summarizes to a single route:

| Site | Block |
|---|---|
| HQ | `10.10.0.0/16` |
| Branch 1 | `10.20.0.0/16` |
| WAN/transit links | `10.254.0.0/16`, `10.255.0.0/16` |

Within each site, one `/24` per VLAN (e.g. HQ Sales = `10.10.20.0/24`, Branch 1 Sales = `10.20.20.0/24`).

### VLANs and least-privilege segmentation

HQ VLANs: Mgmt (10), Sales (20), Engineering (21), Finance (22), IT-Ops (23), Voice (30), Guest (40), general servers (50), finance servers (51), plus two edge-transit VLANs (98, 99 — see below). Branch 1: the same set minus Finance and the server VLANs (a 50-person branch doesn't justify local server infrastructure — it reaches HQ's servers over the WAN instead).

Segmentation is enforced with ACLs applied at the routing layer (on each site's core switch SVIs), following a **default-deny-between-departments, explicit-exceptions-only** model:

- **Finance servers (VLAN 51)** are reachable only from Finance and IT-Ops — every other department is explicitly denied, nothing else can reach financial data at all.
- **Guest (VLAN 40)** is denied any path into the internal `10.0.0.0/16` range entirely — guest traffic has no legitimate reason to reach anything internal.
- **IT-Ops** is given *scoped* administrative access into other departments — SSH (TCP 22) and RDP (TCP 3389) only — rather than blanket reachability. This was a deliberate rejection of the common "IT admin VLAN can reach everything" pattern: broad admin access turns IT's own workstations into the single highest-value target on the network. Least-privilege applies to admins too, not just end users.
- A same-department, cross-site exception was added explicitly (e.g. Branch 1 Sales ↔ HQ Sales) once the network became multi-site — proving the segmentation model adapts to a design that changed after the fact, rather than being a fixed diagram.
- **General servers (VLAN 50)** are reachable by every department, but only on the specific ports the services actually need (DNS, NTP) — not full access, even though they're meant to be shared infrastructure.

### Routing

- **Inter-VLAN routing**: SVIs on each site's Layer 3 core switch.
- **Inter-site routing**: OSPF (area 0) between HQ and Branch 1 over a dedicated WAN link, with the default route originated at HQ and propagated to Branch 1 via `default-information originate` — the branch reaches the internet through HQ's edge rather than needing its own.
- **A real platform constraint, documented rather than hidden**: the sandbox's Layer 3 switches don't support turning a physical port into a routed interface (`no switchport` is rejected). The workaround used throughout — for the HQ↔Branch1 WAN link and the firewall-facing link — is a dedicated VLAN with the IP address assigned to that VLAN's SVI instead of the raw port. Functionally identical to a routed port, achieved differently because of a real hardware/platform limitation.

### Firewall and edge

The internet-facing edge is `Cloud/ISP → CPE Router → Cisco ASA Firewall → HQ Core`. The ASA enforces a proper trust hierarchy via **security levels** — outside interface at 0 (untrusted), inside at 100 (fully trusted) — which is what actually gives the firewall its default-deny-inbound behavior, rather than relying on ACLs alone the way the internal routers do. Stateful ICMP inspection is explicitly enabled, since ASAs don't track ICMP as a connection by default the way TCP/UDP are tracked.

### Why SwitchLab + a separate Containerlab lab, not one platform

SwitchLab.dev (the sandbox used for all of the above) is a guided, browser-based lab platform — closer to Packet Tracer than a full network emulator — and does not support external automation or real device access (no real SSH/API reachability from outside the browser). Rather than fake automation against a platform that can't support it, the routing-protocol validation piece was moved entirely to a second, genuinely real environment: Docker + Containerlab running actual FRRouting containers, reachable over real `docker exec`. The two systems are related conceptually (both represent parts of the same fictional network) but are never merged into one fake runtime — the app is explicit throughout about which parts are a modeled Cisco-style design and which parts are real, running infrastructure.

See the `docs/` folder and the app's own Devices/Security pages for full configuration detail on every device.

## License

MIT

---

*This is a personal portfolio and demonstration project. It does not represent any real company or production network.*
