import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import {
  GripVertical, Eye, EyeOff, Pencil, Check, X, RotateCcw,
  Loader2, Save, Plus, ArrowRight, ChevronUp, ChevronDown
} from 'lucide-react'

interface MenuItem {
  id: string; module_id: string; label: string; href: string
  icon: string; section: string; sort_order: number; visible: boolean
}

const DEFAULT_SECTION_LABELS: Record<string, string> = {
  proyectos: 'Proyectos',
  recursos: 'Recursos',
  presupuesto: 'Presupuesto',
  administracion: 'Administración',
}

export default function EditMenus() {
  const qc = useQueryClient()
  const [items, setItems] = useState<MenuItem[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editingSectionKey, setEditingSectionKey] = useState<string | null>(null)
  const [editSectionLabel, setEditSectionLabel] = useState('')
  const [dragItem, setDragItem] = useState<string | null>(null)
  const [dragOverItem, setDragOverItem] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [movingItem, setMovingItem] = useState<string | null>(null)
  const [sectionLabels, setSectionLabels] = useState<Record<string, string>>({ ...DEFAULT_SECTION_LABELS })
  const [sectionOrder, setSectionOrder] = useState<string[]>([])
  const [dragSection, setDragSection] = useState<string | null>(null)
  const [dragOverSection, setDragOverSection] = useState<string | null>(null)
  const editInputRef = useRef<HTMLInputElement>(null)
  const sectionInputRef = useRef<HTMLInputElement>(null)

  const { data: serverItems = [], isLoading } = useQuery<MenuItem[]>({
    queryKey: ['menu-config'],
    queryFn: () => api.get('/api/menu-config'),
  })

  useEffect(() => {
    if (serverItems.length > 0 && items.length === 0) {
      setItems(serverItems)
      // Derive section order from data
      const order: string[] = []
      serverItems.forEach(i => { if (!order.includes(i.section)) order.push(i.section) })
      setSectionOrder(order)
      // Load saved section labels
      try {
        const saved = localStorage.getItem('sectionLabels')
        if (saved) setSectionLabels(prev => ({ ...prev, ...JSON.parse(saved) }))
      } catch {}
    }
  }, [serverItems])

  const saveBulk = useMutation({
    mutationFn: (data: MenuItem[]) => api.put('/api/menu-config', {
      items: data.map(item => ({
        id: item.id, label: item.label, section: item.section,
        sort_order: item.sort_order, visible: item.visible, icon: item.icon,
      }))
    }),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ['menu-config'] })
      setItems(data)
      localStorage.setItem('sectionLabels', JSON.stringify(sectionLabels))
      localStorage.setItem('sectionOrder', JSON.stringify(sectionOrder))
      setHasChanges(false)
      toast.success('Menús guardados correctamente')
    },
    onError: (e: any) => toast.error(e.message),
  })

  const resetMenus = useMutation({
    mutationFn: () => api.post('/api/menu-config/reset', {}),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ['menu-config'] })
      setItems(data)
      setSectionLabels({ ...DEFAULT_SECTION_LABELS })
      setSectionOrder(['proyectos', 'recursos', 'presupuesto', 'administracion'])
      localStorage.removeItem('sectionLabels')
      localStorage.removeItem('sectionOrder')
      setHasChanges(false)
      toast.success('Menús restaurados a valores por defecto')
    },
    onError: (e: any) => toast.error(e.message),
  })

  const getItemsBySection = (section: string) =>
    items.filter(i => i.section === section).sort((a, b) => a.sort_order - b.sort_order)

  // ── Rename item ─────────────────────────────────────────────────────────
  const startEdit = (item: MenuItem) => {
    setEditingId(item.id); setEditLabel(item.label)
    setTimeout(() => editInputRef.current?.focus(), 50)
  }
  const confirmEdit = () => {
    if (!editingId || !editLabel.trim()) return
    setItems(prev => prev.map(i => i.id === editingId ? { ...i, label: editLabel.trim() } : i))
    setEditingId(null); setHasChanges(true)
  }
  const cancelEdit = () => { setEditingId(null); setEditLabel('') }

  // ── Rename section ──────────────────────────────────────────────────────
  const startSectionEdit = (key: string) => {
    setEditingSectionKey(key); setEditSectionLabel(sectionLabels[key] || key)
    setTimeout(() => sectionInputRef.current?.focus(), 50)
  }
  const confirmSectionEdit = () => {
    if (!editingSectionKey || !editSectionLabel.trim()) return
    setSectionLabels(prev => ({ ...prev, [editingSectionKey!]: editSectionLabel.trim() }))
    setEditingSectionKey(null); setHasChanges(true)
  }
  const cancelSectionEdit = () => { setEditingSectionKey(null) }

  // ── Visibility toggle ───────────────────────────────────────────────────
  const toggleVisible = (id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, visible: !i.visible } : i))
    setHasChanges(true)
  }

  // ── Drag items within/between sections ─────────────────────────────────
  const handleItemDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('type', 'item')
    setDragItem(id)
  }
  const handleItemDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault(); setDragOverItem(id)
  }
  const handleItemDrop = (targetId: string, targetSection: string) => {
    if (!dragItem || dragItem === targetId) { setDragItem(null); setDragOverItem(null); return }
    setItems(prev => {
      const updated = [...prev]
      const dragIdx = updated.findIndex(i => i.id === dragItem)
      const targetIdx = updated.findIndex(i => i.id === targetId)
      if (dragIdx === -1 || targetIdx === -1) return prev
      updated[dragIdx] = { ...updated[dragIdx], section: targetSection }
      const [moved] = updated.splice(dragIdx, 1)
      const newTargetIdx = updated.findIndex(i => i.id === targetId)
      updated.splice(newTargetIdx, 0, moved)
      const sectionCounts: Record<string, number> = {}
      return updated.map(item => {
        const count = sectionCounts[item.section] || 0
        sectionCounts[item.section] = count + 1
        return { ...item, sort_order: count }
      })
    })
    setDragItem(null); setDragOverItem(null); setHasChanges(true)
  }

  // ── Drag sections to reorder ───────────────────────────────────────────
  const handleSectionDragStart = (e: React.DragEvent, section: string) => {
    e.dataTransfer.setData('type', 'section')
    setDragSection(section)
  }
  const handleSectionDragOver = (e: React.DragEvent, section: string) => {
    e.preventDefault(); setDragOverSection(section)
  }
  const handleSectionDrop = (targetSection: string) => {
    if (!dragSection || dragSection === targetSection) {
      setDragSection(null); setDragOverSection(null); return
    }
    setSectionOrder(prev => {
      const updated = [...prev]
      const fromIdx = updated.indexOf(dragSection!)
      const toIdx = updated.indexOf(targetSection)
      if (fromIdx === -1 || toIdx === -1) return prev
      const [moved] = updated.splice(fromIdx, 1)
      updated.splice(toIdx, 0, moved)
      return updated
    })
    setDragSection(null); setDragOverSection(null); setHasChanges(true)
  }

  // ── Move section up/down ───────────────────────────────────────────────
  const moveSectionUp = (section: string) => {
    setSectionOrder(prev => {
      const idx = prev.indexOf(section)
      if (idx <= 0) return prev
      const updated = [...prev]
      ;[updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]]
      return updated
    })
    setHasChanges(true)
  }
  const moveSectionDown = (section: string) => {
    setSectionOrder(prev => {
      const idx = prev.indexOf(section)
      if (idx === -1 || idx >= prev.length - 1) return prev
      const updated = [...prev]
      ;[updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]]
      return updated
    })
    setHasChanges(true)
  }

  // ── Move item to section ───────────────────────────────────────────────
  const moveToSection = (itemId: string, newSection: string) => {
    setItems(prev => {
      const updated = prev.map(i => i.id === itemId ? { ...i, section: newSection, sort_order: 999 } : i)
      const sectionCounts: Record<string, number> = {}
      return updated.sort((a, b) => a.sort_order - b.sort_order).map(item => {
        const count = sectionCounts[item.section] || 0
        sectionCounts[item.section] = count + 1
        return { ...item, sort_order: count }
      })
    })
    setMovingItem(null); setHasChanges(true)
  }

  const handleSave = () => {
    localStorage.setItem('sectionLabels', JSON.stringify(sectionLabels))
    localStorage.setItem('sectionOrder', JSON.stringify(sectionOrder))
    saveBulk.mutate(items)
  }

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary"/></div>
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Editar Menús</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Arrastra secciones o elementos para reordenar. Haz clic en el lápiz para renombrar.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Las rutas (URLs) no se modifican — solo cambia la presentación visual del menú.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => resetMenus.mutate()} disabled={resetMenus.isPending}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium hover:bg-muted transition-colors">
            <RotateCcw className="h-3.5 w-3.5"/> Restaurar
          </button>
          <button onClick={handleSave} disabled={!hasChanges || saveBulk.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {saveBulk.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <Save className="h-3.5 w-3.5"/>}
            Guardar cambios
          </button>
        </div>
      </div>

      {hasChanges && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-sm text-amber-800 font-medium">
          Tienes cambios sin guardar.
        </div>
      )}

      {/* Sections — draggable */}
      <div className="space-y-4">
        {sectionOrder.map((section, sIdx) => {
          const sectionItems = getItemsBySection(section)
          return (
            <div
              key={section}
              draggable
              onDragStart={(e) => handleSectionDragStart(e, section)}
              onDragOver={(e) => handleSectionDragOver(e, section)}
              onDrop={() => handleSectionDrop(section)}
              onDragEnd={() => { setDragSection(null); setDragOverSection(null) }}
              className={`bg-card border rounded-xl overflow-hidden transition-all ${
                dragOverSection === section ? 'ring-2 ring-primary' : ''
              } ${dragSection === section ? 'opacity-50' : ''}`}
            >
              {/* Section header — draggable + editable */}
              <div className="px-4 py-3 border-b bg-muted/30 flex items-center gap-2">
                <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
                  <GripVertical className="h-4 w-4"/>
                </div>

                {editingSectionKey === section ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      ref={sectionInputRef}
                      className="border rounded px-2 py-1 text-sm font-semibold flex-1 focus:outline-none focus:ring-2 focus:ring-primary/30"
                      value={editSectionLabel}
                      onChange={e => setEditSectionLabel(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') confirmSectionEdit(); if (e.key === 'Escape') cancelSectionEdit() }}
                    />
                    <button onClick={confirmSectionEdit} className="p-1 rounded hover:bg-green-50 text-green-600"><Check className="h-3.5 w-3.5"/></button>
                    <button onClick={cancelSectionEdit} className="p-1 rounded hover:bg-red-50 text-red-500"><X className="h-3.5 w-3.5"/></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-1">
                    <h3 className="font-semibold text-sm">{sectionLabels[section] || section}</h3>
                    <button onClick={() => startSectionEdit(section)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
                      <Pencil className="h-3 w-3"/>
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-1">
                  <button onClick={() => moveSectionUp(section)} disabled={sIdx === 0}
                    className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-30">
                    <ChevronUp className="h-3.5 w-3.5"/>
                  </button>
                  <button onClick={() => moveSectionDown(section)} disabled={sIdx === sectionOrder.length - 1}
                    className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-30">
                    <ChevronDown className="h-3.5 w-3.5"/>
                  </button>
                </div>

                <span className="text-xs text-muted-foreground ml-2">{sectionItems.length} elementos</span>
              </div>

              {/* Items */}
              <div className="divide-y">
                {sectionItems.map(item => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => { e.stopPropagation(); handleItemDragStart(e, item.id) }}
                    onDragOver={(e) => handleItemDragOver(e, item.id)}
                    onDrop={(e) => { e.stopPropagation(); handleItemDrop(item.id, section) }}
                    onDragEnd={() => { setDragItem(null); setDragOverItem(null) }}
                    className={`flex items-center gap-3 px-4 py-2.5 transition-all ${
                      dragOverItem === item.id ? 'bg-primary/10 border-t-2 border-primary' : ''
                    } ${dragItem === item.id ? 'opacity-40' : ''} ${!item.visible ? 'opacity-50' : ''}`}
                  >
                    <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground pl-4">
                      <GripVertical className="h-3.5 w-3.5"/>
                    </div>

                    <div className="flex-1 min-w-0">
                      {editingId === item.id ? (
                        <div className="flex items-center gap-2">
                          <input ref={editInputRef}
                            className="border rounded px-2 py-1 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-primary/30"
                            value={editLabel} onChange={e => setEditLabel(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') confirmEdit(); if (e.key === 'Escape') cancelEdit() }}/>
                          <button onClick={confirmEdit} className="p-1 rounded hover:bg-green-50 text-green-600"><Check className="h-3.5 w-3.5"/></button>
                          <button onClick={cancelEdit} className="p-1 rounded hover:bg-red-50 text-red-500"><X className="h-3.5 w-3.5"/></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{item.label}</span>
                          <button onClick={() => startEdit(item)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
                            <Pencil className="h-3 w-3"/>
                          </button>
                        </div>
                      )}
                      <p className="text-[11px] text-muted-foreground">{item.href}</p>
                    </div>

                    <div className="relative">
                      <button onClick={() => setMovingItem(movingItem === item.id ? null : item.id)}
                        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground" title="Mover a otra sección">
                        <ArrowRight className="h-3.5 w-3.5"/>
                      </button>
                      {movingItem === item.id && (
                        <div className="absolute right-0 top-full mt-1 bg-card border rounded-lg shadow-xl z-50 w-48 overflow-hidden">
                          <p className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase border-b">Mover a</p>
                          {sectionOrder.filter(s => s !== section).map(s => (
                            <button key={s} onClick={() => moveToSection(item.id, s)}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors">
                              {sectionLabels[s] || s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <button onClick={() => toggleVisible(item.id)}
                      className={`p-1.5 rounded transition-colors ${item.visible ? 'text-green-600 hover:bg-green-50' : 'text-muted-foreground hover:bg-muted'}`}
                      title={item.visible ? 'Visible' : 'Oculto'}>
                      {item.visible ? <Eye className="h-4 w-4"/> : <EyeOff className="h-4 w-4"/>}
                    </button>
                  </div>
                ))}
                {sectionItems.length === 0 && (
                  <div className="px-5 py-4 text-center text-sm text-muted-foreground">
                    Arrastra elementos aquí
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
