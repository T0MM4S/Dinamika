# ACME WAN Lab — Containerlab + FRRouting

This is the OSPF/BGP layer of the ACME Dinamika project, per ADR-000's platform split.
It is intentionally separate from the SwitchLab campus-LAN build — this proves real
routing-protocol behavior (eBGP + OSPF + redistribution) that SwitchLab's simulated
ASA/router objects cannot reliably validate.

## Topology

```
isp-peer (AS 65000)  --eth1/eth1--  hq-r1 (AS 65001)  --eth2/eth1--  br-r1
   203.0.113.1/24        203.0.113.2/24      10.255.1.1/30   10.255.1.2/30
```

- **isp-peer**: simulates the internet edge. Originates a default route (0.0.0.0/0)
  to hq-r1 via eBGP. Reuses `203.0.113.0/24` — the same block as the SwitchLab
  ISP cloud — for a consistent addressing story across both labs.
- **hq-r1**: eBGP peer to isp-peer (AS65001 ↔ AS65000), advertises an aggregate
  `10.10.0.0/16` upstream (summarized, not a full route leak). Runs OSPF area 0
  toward the branch and redistributes the learned default route into OSPF via
  `default-information originate` — this is the actual mechanism that gets the
  branch a path to the internet.
- **br-r1**: OSPF-only. Should learn a `0.0.0.0/0` default route via OSPF, sourced
  from hq-r1, once BGP and OSPF are both up.

## Prerequisites

- [Containerlab](https://containerlab.dev/install/) installed
- Docker running
- `frrouting/frr:latest` image (Containerlab will pull it automatically on deploy)

## Deploy

```bash
sudo containerlab deploy -t acme-wan-lab.clab.yml
```

## Verify

**1. Check eBGP session is up:**
```bash
docker exec -it clab-acme-wan-lab-hq-r1 vtysh -c "show ip bgp summary"
```
Look for the neighbor `203.0.113.1` in `Established` state.

**2. Confirm hq-r1 received the default route via BGP:**
```bash
docker exec -it clab-acme-wan-lab-hq-r1 vtysh -c "show ip route bgp"
```

**3. Check OSPF neighbor between hq-r1 and br-r1:**
```bash
docker exec -it clab-acme-wan-lab-br-r1 vtysh -c "show ip ospf neighbor"
```

**4. Confirm br-r1 learned the default route via OSPF (the real proof point):**
```bash
docker exec -it clab-acme-wan-lab-br-r1 vtysh -c "show ip route ospf"
```
You should see `O*E2  0.0.0.0/0 [110/1] via 10.255.1.1, eth1` — this is the chain
working end-to-end: ISP → BGP → hq-r1 → OSPF redistribution → branch.

**5. Confirm isp-peer sees the aggregate route from hq-r1:**
```bash
docker exec -it clab-acme-wan-lab-isp-peer vtysh -c "show ip bgp"
```
Should show `10.10.0.0/16` learned from AS 65001.

## Teardown

```bash
sudo containerlab destroy -t acme-wan-lab.clab.yml
```

## Next steps

- Add a monitoring/automation container (e.g. a lightweight host running `ping`
  loops, or a Prometheus/Grafana pair) attached to br-r1's LAN side, per the
  "Containerlab for automation, monitoring targets" scope in ADR-000.
- If/when the ISP/CPE/Mikrotik WAN-edge concept from the original SwitchLab
  canvas note gets built for real, this is the natural place for it — a
  MikroTik CHR container could sit between isp-peer and hq-r1, or replace
  hq-r1 entirely, once that placement decision (flagged as an open ADR-000
  action item) is made.
