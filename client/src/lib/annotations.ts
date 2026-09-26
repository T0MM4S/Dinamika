export const annotations: Record<string, string> = {
  "hq-branch": "VLAN 99 carries the HQ↔Branch WAN adjacency through SVI-style switching because the supplied campus model explicitly uses an access VLAN on both core interfaces.",
  "asa-core": "VLAN 98 is the firewall inside transit segment: CORE-SW1 reaches ASA1 through the modeled access VLAN rather than an invented routed port.",
  "hq-r1": "OSPF is used inside the WAN lab for branch reachability, while BGP is reserved for the ISP-facing relationship at hq-r1.",
  "asa1": "ASA1 keeps outside at security level 0 and inside at 100; the split makes the inside-to-outside trust boundary explicit in the supplied configuration.",
  "core-sw1": "IT-OPS-ACL follows least privilege: only the listed administrative flows reach the Sales VLAN; other traffic to that scope is denied.",
  "__todo__": "TODO: add more walkthrough notes only when they are supported by the supplied topology or configuration.",
};
