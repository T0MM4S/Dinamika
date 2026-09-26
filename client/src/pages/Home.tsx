import { useEffect, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { devices, events, type EventRecord } from "@/lib/acmeData";
import { deriveLiveEvents } from "@/lib/telemetryEvents";
import { eventLinkId } from "@/lib/flowModel";
import { Header, Sidebar, StatusDot } from "@/components/NetworkPrimitives";
import { Inspector } from "@/components/Inspector";
import { LiveUnavailableBanner } from "@/components/LiveUnavailableBanner";
import Overview from "./Overview";
import Topology from "./Topology";
import WanLab from "./WanLab";
import Inventory from "./Devices";
import VlansPage from "./Vlans";
import RoutingPage from "./Routing";
import SecurityPage from "./Security";
import EventsPage from "./Events";
import ConsolePage from "./LabConsole";

export default function Home() {
  const [location, setLocation] = useLocation();
  const [mode, setMode] = useState<"DEMO" | "LIVE">("DEMO");
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [time, setTime] = useState(() => new Date());
  const [liveEvents, setLiveEvents] = useState<EventRecord[]>([]);
  const [demoReplayEvents, setDemoReplayEvents] = useState<EventRecord[]>([]);
  const [eventPulse, setEventPulse] = useState<{ linkId: string; key: number } | null>(null);
  const eventPulseTimer = useRef<number | null>(null);
  const previousLive = useRef<unknown>(undefined);
  const liveQuery = trpc.lab.snapshot.useQuery(undefined, { enabled: mode === "LIVE", refetchInterval: mode === "LIVE" ? 15000 : false, refetchOnWindowFocus: false, retry: false });
  const triggerEventPulse = (event: EventRecord) => { const linkId = eventLinkId(event); if (!linkId) return; setEventPulse({ linkId, key: Date.now() }); if (eventPulseTimer.current) window.clearTimeout(eventPulseTimer.current); eventPulseTimer.current = window.setTimeout(() => setEventPulse(null), 1800); };
  useEffect(() => { const timer = window.setInterval(() => setTime(new Date()), 1000); return () => window.clearInterval(timer); }, []);
  useEffect(() => {
    if (mode !== "LIVE") { previousLive.current = undefined; setLiveEvents([]); return; }
    if (!liveQuery.data) return;
    const next = deriveLiveEvents(previousLive.current as Parameters<typeof deriveLiveEvents>[0], liveQuery.data);
    if (next.length) { setLiveEvents((current) => [...next, ...current].slice(0, 40)); triggerEventPulse(next[0]); }
    previousLive.current = liveQuery.data;
  }, [mode, liveQuery.data]);
  useEffect(() => {
    if (mode !== "DEMO") { setDemoReplayEvents([]); return; }
    const replay = events.filter((event) => event.mode === "DEMO");
    let cursor = 0;
    const timer = window.setInterval(() => { const event = replay[cursor % replay.length]; cursor += 1; if (!event) return; setDemoReplayEvents((current) => [event, ...current].slice(0, 6)); triggerEventPulse(event); }, 7000);
    return () => window.clearInterval(timer);
  }, [mode]);
  const go = (path: string) => setLocation(path.startsWith("/app") ? path : `/app${path === "/" ? "" : path}`);
  const live = liveQuery.data ?? (mode === "LIVE" && liveQuery.error ? { mode: "LIVE" as const, reachable: false, docker: "OFFLINE", containerlab: "UNAVAILABLE", error: "Telemetry request failed", containers: [], bgp: { state: "UNKNOWN" }, ospf: { state: "UNKNOWN", defaultRoute: "UNKNOWN" }, route: { state: "UNKNOWN" } } : undefined);
  const appPath = location.startsWith("/app") ? location.slice(4) : "";
  const page = appPath === "" || appPath === "/" ? "overview" : appPath.slice(1);
  const displayEvents = mode === "LIVE" ? liveEvents : demoReplayEvents;
  const renderPage = () => { switch (page) { case "topology": return <Topology setSelected={setSelectedDevice} eventPulseLinkId={eventPulse?.linkId} eventPulseKey={eventPulse?.key} />; case "wan-lab": return <WanLab mode={mode} setMode={setMode} live={live} setSelected={setSelectedDevice} go={go} />; case "devices": return <Inventory setSelected={setSelectedDevice} />; case "vlans": return <VlansPage setSelected={setSelectedDevice} />; case "routing": return <RoutingPage mode={mode} live={live} />; case "security": return <SecurityPage setSelected={setSelectedDevice} />; case "events": return <EventsPage liveEvents={displayEvents} onEventSelect={(event) => { triggerEventPulse(event); if (eventLinkId(event)) go("/topology"); }} />; case "lab-console": return <ConsolePage mode={mode} />; default: return <Overview mode={mode} live={live} liveEvents={displayEvents} setSelected={setSelectedDevice} go={go} />; } };
  const searchResults = query ? devices.filter((device) => `${device.label} ${device.role} ${device.model} ${device.site} ${device.interfaces.map((i) => i.ip).join(" ")} ${device.protocols?.join(" ")}`.toLowerCase().includes(query.toLowerCase())).slice(0, 5) : [];
  return <div className="technical-grid min-h-screen"><div className="flex min-h-screen"><Sidebar path={location} open={menuOpen} onClose={() => setMenuOpen(false)} /><div className="min-w-0 flex-1"><Header mode={mode} setMode={setMode} onMenu={() => setMenuOpen(true)} query={query} setQuery={setQuery} />{searchResults.length > 0 && <div className="absolute right-5 top-[61px] z-30 w-[280px] border border-[#345263] bg-[#101b23] shadow-xl md:right-7"><div className="border-b border-[#263944] px-3 py-2 text-[10px] font-bold tracking-[.12em] text-[#75909f]">SEARCH RESULTS</div>{searchResults.map((device) => <button key={device.id} onClick={() => { setSelectedDevice(device.id); setQuery(""); }} className="flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-[#182934]"><span><span className="block text-[11px] font-semibold text-[#d9e7ed]">{device.label}</span><span className="block text-[10px] text-[#78919d]">{device.role}</span></span><ChevronRight size={13} className="text-[#7eb4cd]" /></button>)}</div>}<main className="mx-auto max-w-[1680px] p-5 lg:p-7">{mode === "LIVE" && (liveQuery.error || live?.docker === "OFFLINE") && <LiveUnavailableBanner error={liveQuery.error} poweredOff={!liveQuery.error && live?.docker === "OFFLINE"} />}{renderPage()}</main><footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#1b2932] px-5 py-4 text-[10px] text-[#637986] lg:px-7"><div className="flex items-center gap-4"><span>ACME DINAMIKA / NOC-01</span><span className="hidden text-[#374b57] sm:inline">•</span><span className="hidden sm:inline">source: supplied sandbox topology</span></div><div className="flex items-center gap-4"><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link><span className="mono">{time.toLocaleTimeString([], { hour12: false })} LOCAL</span><span className="flex items-center gap-1.5"><StatusDot state="up" /> UI READY</span></div></footer></div></div><Inspector deviceId={selectedDevice} onClose={() => setSelectedDevice(null)} mode={mode} live={live} /></div>;
}
