"use client";
import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragEndEvent,
  DragStartEvent,
  useDroppable,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import LeadCard from "./LeadCard";
import { COLUMNS, type ColumnId } from "@/lib/columns";
import type { Lead } from "@/lib/types";

export default function KanbanBoard({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } })
  );

  useEffect(() => {
    const t = setInterval(refresh, 6000);
    return () => clearInterval(t);
  }, []);

  async function refresh() {
    const r = await fetch("/api/leads", { cache: "no-store" });
    if (r.ok) {
      const data = (await r.json()) as { leads: Lead[] };
      setLeads(data.leads);
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter((l) =>
      [l.entreprise, l.ville, l.secteur, l.quartier, l.email]
        .filter(Boolean)
        .some((s) => (s as string).toLowerCase().includes(q))
    );
  }, [leads, search]);

  const grouped = useMemo(() => {
    const map = new Map<ColumnId, Lead[]>();
    for (const c of COLUMNS) map.set(c.id, []);
    for (const l of filtered) map.get(l.status)?.push(l);
    return map;
  }, [filtered]);

  const activeLead = useMemo(() => {
    if (!activeId?.startsWith("lead-")) return null;
    const id = Number(activeId.slice(5));
    return leads.find((l) => l.id === id) ?? null;
  }, [activeId, leads]);

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  async function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const overId = String(over.id);
    const activeStr = String(active.id);
    if (!activeStr.startsWith("lead-")) return;
    const leadId = Number(activeStr.slice(5));
    const dropCol = overId.startsWith("col-")
      ? (overId.slice(4) as ColumnId)
      : (leads.find((l) => `lead-${l.id}` === overId)?.status ?? null);
    if (!dropCol) return;
    const current = leads.find((l) => l.id === leadId);
    if (!current || current.status === dropCol) return;

    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: dropCol } : l)));

    const r = await fetch(`/api/leads/${leadId}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: dropCol }),
    });
    if (r.ok) {
      const data = (await r.json()) as { lead: Lead };
      setLeads((prev) => prev.map((l) => (l.id === data.lead.id ? data.lead : l)));
    } else {
      refresh();
    }
  }

  return (
    <section>
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <h2 className="text-lg font-bold">Pipeline Kanban</h2>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher (entreprise, ville, secteur)…"
          className="w-full sm:w-80 px-3 py-1.5 rounded border bg-white text-sm"
        />
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto scroll-x pb-3 -mx-1 px-1">
          {COLUMNS.map((col) => {
            const items = grouped.get(col.id) ?? [];
            return <Column key={col.id} id={col.id} title={col.title} emoji={col.emoji} accent={col.accent} items={items} />;
          })}
        </div>
        <DragOverlay>{activeLead ? <LeadCard lead={activeLead} /> : null}</DragOverlay>
      </DndContext>
    </section>
  );
}

function Column({
  id,
  title,
  emoji,
  accent,
  items,
}: {
  id: ColumnId;
  title: string;
  emoji: string;
  accent: string;
  items: Lead[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${id}`, data: { type: "column", columnId: id } });
  return (
    <div
      ref={setNodeRef}
      className={`min-w-[280px] w-[280px] sm:w-[300px] flex-shrink-0 rounded-xl border ${accent} ${
        isOver ? "ring-2 ring-brand-500/60" : ""
      }`}
    >
      <div className="px-3 py-2 flex items-center justify-between">
        <div className="font-semibold text-sm flex items-center gap-1.5">
          <span>{emoji}</span>
          <span>{title}</span>
        </div>
        <span className="text-xs bg-white/70 border rounded-full px-2 py-0.5">{items.length}</span>
      </div>
      <SortableContext items={items.map((l) => `lead-${l.id}`)} strategy={verticalListSortingStrategy}>
        <div className="p-2 space-y-2 min-h-[80px] max-h-[70vh] overflow-y-auto">
          {items.length === 0 ? (
            <div className="text-[11px] text-slate-400 italic px-1">Aucun lead</div>
          ) : (
            items.map((l) => <LeadCard key={l.id} lead={l} />)
          )}
        </div>
      </SortableContext>
    </div>
  );
}
