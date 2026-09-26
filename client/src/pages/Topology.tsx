import { useEffect, useMemo, useState } from "react";
import { Background, Controls, Handle, MiniMap, Position, ReactFlow, type Edge, type Node, type NodeProps, useEdgesState, useNodesState } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Eye, EyeOff, Filter, Search, SlidersHorizontal } from "lucide-react";
import { devices, links, topologyPositions, type DeviceCategory, type DeviceRecord } from "@/lib/acmeData";
import { annotations } from "@/lib/annotations";
import { ambientDirection } from "@/lib/flowModel";
import { Panel, PageHeader, StateBadge } from "@/components/NetworkPrimitives";

type GraphData = { device: DeviceRecord; annotation?: string; walkthrough: boolean; onSelect: (id: string) => void; };
type GraphNode = Node<GraphData, "acme">;

const categoryTone: Record<DeviceCategory, { border: string; bg: string; text: string }> = {
  wan: { border: "#bea873", bg: "#211f18", text: "#e3cc8e" },
  edge: { border: "#d69468", bg: "#251c18", text: "#e9b08c" },
  core: { border: "#69b3db", bg: "#122532", text: "#a8dbf2" },
  access: { border: "#778e9b", bg: "#172128", text: "#b2c5ce" },
  endpoint: { border: "#8fabb8", bg: "#182229", text: "#c0d2da" },
  live: { border: "#5dcea0", bg: "#112820", text: "#8fe0bc" },
};

function AcmeNode({ data }: NodeProps<GraphNode>) {
  const tone = categoryTone[data.device.category];
  return <div className="relative min-w-[154px] border px-3 py-2 shadow-xl" style={{ borderColor: tone.border, background: tone.bg }} onClick={() => data.onSelect(data.device.id)}>
    <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-0" style={{ background: tone.border }} />
    <div className="flex items-center justify-between gap-3"><div className="truncate text-[11px] font-semibold" style={{ color: tone.text }}>{data.device.label}</div><span className="h-1.5 w-1.5 rounded-full" style={{ background: data.device.category === "live" ? "#64d5a6" : "#d8b670" }} /></div>
    <div className="mono mt-1 text-[9px] uppercase tracking-[.08em] text-[#718894]">{data.device.role}</div>
    {data.walkthrough && data.annotation && <div className="mt-2 border-t border-[#36505b] pt-2 text-[9px] leading-4 text-[#d4c08b]">{data.annotation}</div>}
    <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-0" style={{ background: tone.border }} />
  </div>;
}

const nodeTypes = { acme: AcmeNode };

function filterDevices(category: string, protocol: string, search: string, showEndpoints: boolean) {
  return devices.filter((device) => {
    if (!showEndpoints && device.category === "endpoint") return false;
    const categoryMatch = category === "all" || category === "campus" && device.site !== "LIVE LAB" || category === "wan" && device.category === "wan" || category === "branch" && device.site === "BR1" || category === "security" && (device.id === "asa1" || device.protocols?.includes("ACL")) || category === "servers" && device.vlans?.includes(50) || category === "clients" && device.category === "endpoint" || category === "live" && device.site === "LIVE LAB";
    const protocolMatch = protocol === "all" || device.protocols?.includes(protocol);
    const searchMatch = !search || `${device.label} ${device.role} ${device.model} ${device.site}`.toLowerCase().includes(search.toLowerCase());
    return categoryMatch && protocolMatch && searchMatch;
  });
}

export default function Topology({ setSelected, eventPulseLinkId, eventPulseKey }: { setSelected: (id: string) => void; eventPulseLinkId?: string; eventPulseKey?: number }) {
  const [category, setCategory] = useState("all");
  const [protocol, setProtocol] = useState("all");
  const [search, setSearch] = useState("");
  const [showEndpoints, setShowEndpoints] = useState(true);
  const [walkthrough, setWalkthrough] = useState(false);
  const [selectedAnnotation, setSelectedAnnotation] = useState("");
  const visibleDevices = useMemo(() => filterDevices(category, protocol, search, showEndpoints), [category, protocol, search, showEndpoints]);
  const visibleIds = useMemo(() => new Set(visibleDevices.map((device) => device.id)), [visibleDevices]);
  const initialNodes = useMemo<GraphNode[]>(() => visibleDevices.map((device) => ({ id: device.id, type: "acme", position: topologyPositions[device.id] ?? { x: 40, y: 40 }, data: { device, annotation: annotations[device.id], walkthrough, onSelect: setSelected }})), [visibleDevices, walkthrough, setSelected]);
  const initialEdges = useMemo<Edge[]>(() => links.filter((link) => visibleIds.has(link.source) && visibleIds.has(link.target)).map((link) => { const eventLinked = link.id === eventPulseLinkId; const reverse = ambientDirection(link) === "reverse"; return { id: link.id, source: reverse ? link.target : link.source, target: reverse ? link.source : link.target, label: link.label, animated: link.state === "up" || eventLinked, className: `${link.state === "up" ? "acme-ambient-edge" : ""} ${eventLinked ? "acme-event-edge" : ""}`, style: { stroke: eventLinked ? "#f5d77d" : link.state === "up" ? "#67d5a7" : "#526974", strokeWidth: eventLinked ? 3.5 : link.state === "up" ? 2 : 1.2, strokeDasharray: link.state === "up" ? undefined : "5 5" }, labelStyle: { fill: "#8aa0ab", fontSize: 9 }, labelBgStyle: { fill: "#0b1218", fillOpacity: .88 } }; }), [visibleIds, eventPulseLinkId, eventPulseKey]);
  const [nodes, setNodes, onNodesChange] = useNodesState<GraphNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  useEffect(() => setNodes(initialNodes), [initialNodes, setNodes]);
  useEffect(() => setEdges(initialEdges), [initialEdges, setEdges]);
  useEffect(() => { if (!walkthrough) setSelectedAnnotation(""); }, [walkthrough]);
  return <div><PageHeader eyebrow="Operations / Topology" title="Network topology" detail="Interactive source model with separate live FRR routing lab. Drag nodes, zoom, fit the graph, and click any device to inspect it." actions={<StateBadge label={`${visibleDevices.length} NODES`} state="modeled" />} />
    <div className="mb-4 flex flex-wrap items-center gap-2"><button onClick={() => setWalkthrough((value) => !value)} className={`flex items-center gap-2 border px-3 py-2 text-[10px] font-bold tracking-[.1em] ${walkthrough ? "border-[#a88c52] bg-[#2a2418] text-[#e1bd72]" : "border-[#334854] bg-[#14212a] text-[#a1b4be]"}`}>{walkthrough ? <Eye size={13} /> : <EyeOff size={13} />} WALKTHROUGH {walkthrough ? "ON" : "OFF"}</button><div className="relative"><Search size={13} className="absolute left-2.5 top-2.5 text-[#718793]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Filter nodes" className="h-8 w-[180px] border border-[#2d424d] bg-[#101a21] pl-8 text-[11px] text-[#d9e6ec] outline-none" /></div><div className="flex items-center gap-1 text-[#79909c]"><Filter size={13} />{["all", "campus", "wan", "branch", "security", "servers", "clients", "live"].map((item) => <button key={item} onClick={() => setCategory(item)} className={`border px-2 py-1.5 text-[9px] font-bold uppercase tracking-[.1em] ${category === item ? "border-[#74bfe2] bg-[#173243] text-[#c1e4f2]" : "border-[#2b3d47] text-[#7d939e]"}`}>{item === "live" ? "LIVE LAB" : item}</button>)}</div><button onClick={() => setShowEndpoints((value) => !value)} className="flex items-center gap-2 border border-[#334854] bg-[#14212a] px-3 py-2 text-[10px] font-bold tracking-[.1em] text-[#a1b4be]"><SlidersHorizontal size={13} />{showEndpoints ? "HIDE" : "SHOW"} ENDPOINTS</button></div>
    <div className="mb-4 flex flex-wrap gap-2">{["all", "OSPF", "BGP", "STATIC", "L2", "ACL", "NAT"].map((item) => <button key={item} onClick={() => setProtocol(item)} className={`border px-3 py-1.5 text-[9px] font-bold tracking-[.1em] ${protocol === item ? "border-[#c3a668] bg-[#2b2418] text-[#e5c984]" : "border-[#2c404b] text-[#7d939e]"}`}>{item}</button>)}</div>
    <Panel><div className="border-b border-[#263945] px-4 py-3"><div className="kicker">{visibleDevices.length} nodes visible · {walkthrough ? "walkthrough annotations on" : "drag / zoom / inspect"}</div><div className="mt-1 text-[12px] font-semibold text-[#dce8ed]">React Flow topology canvas</div></div>{walkthrough && selectedAnnotation && <div className="border-b border-[#5f5438] bg-[#211c13] px-4 py-3 text-[11px] leading-5 text-[#d8bd7f]">{selectedAnnotation}</div>}<div className="h-[650px] bg-[#091118]"><ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onEdgeClick={(_, edge) => setSelectedAnnotation(annotations[edge.id] ?? "No walkthrough annotation is available for this link yet.")} fitView minZoom={.25} maxZoom={1.8} nodesDraggable nodesConnectable={false} elementsSelectable><Background color="#20323c" gap={24} size={1} /><Controls showInteractive={false} /><MiniMap nodeColor={(node) => categoryTone[(node.data as GraphData).device.category].border} maskColor="rgba(6,12,17,.78)" /></ReactFlow></div></Panel>
  </div>;
}
