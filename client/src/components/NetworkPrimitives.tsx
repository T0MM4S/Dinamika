import { Server } from "lucide-react";
import React from "react";
import { Activity, ChevronRight, CircleDot, Clock3, Home as HomeIcon, Layers3, Menu, Network, Radio, Route as RouteIcon, Search, Shield, TerminalSquare, X } from "lucide-react";
import { navItems } from "@/lib/acmeData";
import { Link } from "wouter";

export const liveState = (value: string | undefined) => value === "ONLINE" || value === "ESTABLISHED" || value === "FULL" || value === "PRESENT";

export function StatusDot({ state = "unknown", className = "" }: { state?: string; className?: string }) {
  const tone = liveState(state) || state === "up" ? "green" : state === "down" || state === "OFFLINE" ? "red" : state === "modeled" ? "amber" : "blue";
  return <span className={`status-dot ${tone} ${className}`} />;
}

export function StateBadge({ label, state = "unknown", outlined = false }: { label: string; state?: string; outlined?: boolean }) {
  const tone = liveState(state) || state === "up" ? "text-[#69d5a5] border-[#2e6d58] bg-[#10251f]" : state === "down" || state === "OFFLINE" ? "text-[#ed7f85] border-[#713a40] bg-[#29161a]" : state === "modeled" ? "text-[#efc87c] border-[#6d5830] bg-[#252016]" : "text-[#9db0bd] border-[#34444f] bg-[#152029]";
  return <span className={`inline-flex items-center gap-1.5 border px-2 py-1 text-[10px] font-bold tracking-[.12em] ${outlined ? "bg-transparent" : tone} ${outlined ? "text-[#9db0bd] border-[#31404b]" : ""}`}><StatusDot state={state} />{label}</span>;
}

export function Icon({ name, size = 15 }: { name: string; size?: number }) {
  const props = { size, strokeWidth: 1.6 };
  const icons: Record<string, React.ReactNode> = {
    activity: <Activity {...props} />, network: <Network {...props} />, radio: <Radio {...props} />, server: <Server {...props} />, layers: <Layers3 {...props} />, route: <RouteIcon {...props} />, shield: <Shield {...props} />, clock: <Clock3 {...props} />, terminal: <TerminalSquare {...props} />,
  };
  return <>{icons[name] ?? <CircleDot {...props} />}</>;
}

export function Panel({ children, className = "", title, eyebrow, action }: { children: React.ReactNode; className?: string; title?: string; eyebrow?: string; action?: React.ReactNode }) {
  return <section className={`panel overflow-hidden ${className}`}>
    {(title || eyebrow || action) && <div className="panel-header flex items-center justify-between px-4 py-3">
      <div>{eyebrow && <div className="kicker mb-1">{eyebrow}</div>}{title && <h2 className="text-[13px] font-semibold tracking-wide text-[#dbe7ee]">{title}</h2>}</div>
      {action}
    </div>}
    {children}
  </section>;
}

export function Header({ mode, setMode, onMenu, query, setQuery }: { mode: "DEMO" | "LIVE"; setMode: (mode: "DEMO" | "LIVE") => void; onMenu: () => void; query: string; setQuery: (value: string) => void }) {
  return <header className="flex min-h-[70px] items-center justify-between border-b border-[#1d2a34] bg-[#0c1218]/95 px-5 lg:px-7">
    <div className="flex items-center gap-3">
      <Link href="/" aria-label="Return to ACME DINAMIKA home" title="Return to landing page" className="grid h-9 w-9 place-items-center border border-[#2d4654] bg-[#101c24] text-[#91c9e5] transition-colors hover:border-[#70b7d8] hover:bg-[#162b37]"><HomeIcon size={16} /></Link>
      <button onClick={onMenu} className="rounded border border-[#263945] p-2 text-[#8fa6b5] hover:bg-[#15222b] lg:hidden" aria-label="Open navigation"><Menu size={17} /></button>
      <div className="flex items-center gap-3">
        <div className="relative grid h-8 w-8 place-items-center border border-[#5b8ba5] bg-[#13232d] text-[#a6dcfb]"><Network size={17} strokeWidth={1.5} /><span className="absolute -bottom-1 -right-1 h-2 w-2 bg-[#69d5a5]" /></div>
        <div><div className="text-[14px] font-extrabold tracking-[.18em] text-[#eef6fb]">ACME DINAMIKA</div><div className="kicker mt-0.5">NETWORK OPERATIONS</div></div>
      </div>
    </div>
    <div className="hidden items-center gap-2 xl:flex">
      {["CAMPUS", "WAN LAB", "DOCKER", "CONTAINERLAB", "OSPF", "BGP"].map((item, index) => <div key={item} className="flex items-center gap-1.5 border-l border-[#24333e] px-3 text-[10px] font-bold tracking-[.12em] text-[#8196a5]"><StatusDot state={index < 2 ? "modeled" : index > 3 ? "up" : "unknown"} />{item}</div>)}
    </div>
    <div className="flex items-center gap-2.5">
      <div className="relative hidden md:block"><Search className="absolute left-2.5 top-2.5 text-[#627986]" size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search device, IP, VLAN…" className="h-9 w-[230px] border border-[#263945] bg-[#101920] pl-9 pr-3 text-[11px] text-[#d7e4eb] outline-none placeholder:text-[#657986] focus:border-[#527f9a]" /></div>
      <button onClick={() => setMode(mode === "DEMO" ? "LIVE" : "DEMO")} className={`flex h-9 items-center gap-2 border px-3 text-[10px] font-bold tracking-[.14em] transition-colors ${mode === "DEMO" ? "border-[#6a5730] bg-[#241e14] text-[#e7c27b] hover:bg-[#2b2418]" : "border-[#2b6f59] bg-[#10251f] text-[#6bd3a2] hover:bg-[#153126]"}`}><span className={`h-1.5 w-1.5 rounded-full ${mode === "DEMO" ? "bg-[#e7c27b]" : "bg-[#6bd3a2]"}`} />{mode} MODE</button>
    </div>
  </header>;
}

export function Sidebar({ path, open, onClose }: { path: string; open: boolean; onClose: () => void }) {
  return <aside className={`fixed inset-y-0 left-0 z-40 w-[228px] border-r border-[#1d2a34] bg-[#0b1117] transition-transform lg:static lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
    <div className="flex h-[70px] items-center justify-between border-b border-[#1d2a34] px-4"><div className="kicker text-[#5e7888]">ACME / NOC-01</div><button onClick={onClose} className="text-[#6e8492] lg:hidden"><X size={16} /></button></div>
    <div className="px-3 py-5"><div className="kicker mb-3 px-2">Command center</div>
      <nav className="space-y-0.5">{navItems.map((item) => { const active = path === item.path || (item.path !== "/app" && path.startsWith(item.path)); return <Link key={item.path} href={item.path} onClick={onClose} className={`group flex items-center justify-between border-l-2 px-3 py-2.5 transition-colors ${active ? "border-[#82c8ed] bg-[#12212b] text-[#e8f5fb]" : "border-transparent text-[#8196a5] hover:bg-[#101a22] hover:text-[#c5d6e0]"}`}><span className="flex items-center gap-3"><Icon name={item.icon} size={15} /><span className="text-[12px] font-semibold">{item.label}</span></span>{active && <ChevronRight size={13} className="text-[#70bce2]" />}</Link> })}</nav>
    </div>
    <div className="absolute bottom-0 left-0 right-0 border-t border-[#1d2a34] p-4"><div className="mb-2 flex items-center gap-2"><StatusDot state="modeled" /><span className="text-[10px] font-bold tracking-[.12em] text-[#a3b6c2]">SOURCE MODEL LOADED</span></div><p className="text-[10px] leading-4 text-[#617684]">Cisco-style campus topology is modeled from the supplied sandbox source. FRR nodes remain a separate runtime.</p></div>
  </aside>;
}

export function PageHeader({ eyebrow, title, detail, actions }: { eyebrow: string; title: string; detail: string; actions?: React.ReactNode }) {
  return <div className="mb-5 flex flex-wrap items-end justify-between gap-4"><div><div className="kicker mb-2 text-[#6aa9ca]">{eyebrow}</div><h1 className="text-[22px] font-semibold tracking-tight text-[#eef6fa]">{title}</h1><p className="mt-1 max-w-[720px] text-[12px] text-[#7c909e]">{detail}</p></div>{actions}</div>;
}

export function StatCell({ label, value, hint, state = "unknown" }: { label: string; value: string; hint?: string; state?: string }) {
  return <div className="border-l border-[#263742] pl-3 first:border-0"><div className="mb-2 flex items-center gap-2"><StatusDot state={state} /><span className="kicker">{label}</span></div><div className="mono text-[18px] font-medium text-[#deebf2]">{value}</div>{hint && <div className="mt-1 text-[10px] text-[#69808e]">{hint}</div>}</div>;
}
