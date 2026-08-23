import * as React from "react"
import {
  closestCenter,
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { Slot } from "@radix-ui/react-slot"
import { createPortal } from "react-dom"
import tunnel from "tunnel-rat"
import { motion, useReducedMotion } from "motion/react"

import { Button } from "@feature/ui/components/ui/common/button"
import { Field, FieldGroup, FieldLabel } from "@feature/ui/components/ui/common/field"
import { Input } from "@feature/ui/components/ui/common/input"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@feature/ui/components/ui/common/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@feature/ui/components/ui/common/select"
import { cn } from "@feature/ui/lib/ui/utils"

export interface TimelineSlotData {
  id: string
  rowId: string
  startTime: string
  duration: number
  [key: string]: unknown
}

export interface TimelineRowData {
  id: string
  label: string
  [key: string]: unknown
}

export interface TimelineConfig {
  startHour: number
  endHour: number
  snapIntervalMinutes?: number
  columnWidth?: number
}

type DragPreviewTunnel = ReturnType<typeof tunnel>

type TimelineContextValue = {
  config: TimelineConfig
  pixelsPerMinute: number
  timelineWidth: number
  timelineRef: React.RefObject<HTMLDivElement | null>
  columnRef: React.RefObject<HTMLDivElement | null>
  dragPreviewTunnel: DragPreviewTunnel
  onSlotPositionChange?: (
    slotId: string,
    newTime: string,
    newRowId: string
  ) => Promise<boolean> | boolean
  onSlotResize?: (
    slotId: string,
    newTime: string,
    newDuration: number,
    isComplete?: boolean
  ) => Promise<boolean> | boolean | void
  onValidateDrop?: (
    slotId: string,
    newTime: string,
    newRowId: string
  ) => boolean
  onSlotClick?: (slotId: string) => void
}

const TimelineContext = React.createContext<TimelineContextValue | null>(null)

const TIMELINE_AGENDA_BREAKPOINT = 700

export function useTimeline() {
  const context = React.useContext(TimelineContext)

  if (!context) {
    throw new Error("Timeline components must be used within TimelineProvider")
  }

  return context
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  return `${hours.toString().padStart(2, "0")}:${remainingMinutes
    .toString()
    .padStart(2, "0")}`
}

export interface TimelineProviderProps {
  children: React.ReactNode
  config: TimelineConfig
  percentageInView?: number
  onSlotPositionChange?: (
    slotId: string,
    newTime: string,
    newRowId: string
  ) => Promise<boolean> | boolean
  onSlotResize?: (
    slotId: string,
    newTime: string,
    newDuration: number,
    isComplete?: boolean
  ) => Promise<boolean> | boolean | void
  onValidateDrop?: (
    slotId: string,
    newTime: string,
    newRowId: string
  ) => boolean
  onSlotClick?: (slotId: string) => void
  style?: React.CSSProperties
  className?: string
}

export function TimelineProvider({
  children,
  config,
  percentageInView = 100,
  onSlotPositionChange,
  onSlotResize,
  onValidateDrop,
  onSlotClick,
  style,
  className,
}: TimelineProviderProps) {
  const [viewportWidth, setViewportWidth] = React.useState(0)
  const timelineRef = React.useRef<HTMLDivElement>(null)
  const columnRef = React.useRef<HTMLDivElement>(null)
  const dragPreviewTunnel = React.useMemo(() => tunnel(), [])
  const columnWidth = config.columnWidth ?? 112

  React.useEffect(() => {
    function measure() {
      if (timelineRef.current) {
        setViewportWidth(timelineRef.current.clientWidth - columnWidth)
      }
    }

    measure()
    window.addEventListener("resize", measure)
    const timeout = window.setTimeout(measure, 100)

    return () => {
      window.removeEventListener("resize", measure)
      window.clearTimeout(timeout)
    }
  }, [columnWidth])

  const totalMinutes = (config.endHour - config.startHour) * 60
  const basePixelsPerMinute =
    viewportWidth > 0 ? viewportWidth / totalMinutes : 10
  const pixelsPerMinute = basePixelsPerMinute * (100 / percentageInView)
  const timelineWidth = totalMinutes * pixelsPerMinute
  const contextValue = React.useMemo<TimelineContextValue>(
    () => ({
      config,
      pixelsPerMinute,
      timelineWidth,
      timelineRef,
      columnRef,
      dragPreviewTunnel,
      onSlotPositionChange,
      onSlotResize,
      onValidateDrop,
      onSlotClick,
    }),
    [
      config,
      dragPreviewTunnel,
      onSlotClick,
      onSlotPositionChange,
      onSlotResize,
      onValidateDrop,
      pixelsPerMinute,
      timelineWidth,
    ]
  )

  return (
    <TimelineContext.Provider value={contextValue}>
      <div
        data-slot="timeline-wrapper"
        style={
          {
            "--timeline-column-width": `${columnWidth}px`,
            "--timeline-width": `${timelineWidth}px`,
            "--timeline-pixels-per-minute": pixelsPerMinute,
            ...style,
          } as React.CSSProperties
        }
        className={cn("relative w-full", className)}
      >
        {children}
      </div>
    </TimelineContext.Provider>
  )
}

type TimelineInjectedProps = {
  slots?: TimelineSlotData[]
  rows?: TimelineRowData[]
  activeSlotId?: string | null
  overRowId?: string | null
  draggedNewTime?: string | null
  isValidDrop?: boolean
  getSnappedDelta?: (deltaX: number) => number
  _showDropRegion?: boolean
  _dropRegionTime?: string | null
}

export interface TimelineProps {
  slots: TimelineSlotData[]
  rows: TimelineRowData[]
  children: React.ReactNode
  mobileMode?: "auto" | "agenda" | "scroll"
  afterGrid?: React.ReactNode
  onSlotCreate?: (slot: TimelineSlotData) => void
  onExternalDrop?: (
    activeId: string,
    overId: string | null
  ) => Promise<void> | void
  className?: string
}

export function Timeline({
  slots,
  rows,
  children,
  mobileMode = "auto",
  afterGrid,
  onSlotCreate,
  onExternalDrop,
  className,
}: TimelineProps) {
  const {
    config,
    pixelsPerMinute,
    timelineRef,
    dragPreviewTunnel,
    onSlotClick,
    onSlotPositionChange,
    onValidateDrop,
  } = useTimeline()
  const [mousePosition, setMousePosition] = React.useState<{
    x: number
    y: number
  } | null>(null)
  const [localActiveSlot, setLocalActiveSlot] = React.useState<string | null>(
    null
  )
  const [localOverRow, setLocalOverRow] = React.useState<string | null>(null)
  const [localDraggedTime, setLocalDraggedTime] = React.useState<string | null>(
    null
  )
  const [isValid, setIsValid] = React.useState(true)
  const DragPreviewOut = dragPreviewTunnel.Out
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )
  const reduceMotion = useReducedMotion()
  const snapInterval = config.snapIntervalMinutes ?? 15
  const columnWidth = config.columnWidth ?? 112
  const rowIds = React.useMemo(
    () => new Set(rows.map((row) => String(row.id))),
    [rows]
  )
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = React.useState(0)

  React.useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const measure = () => setContainerWidth(element.clientWidth)
    const observer = new ResizeObserver(measure)

    measure()
    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  function snapToInterval(minutes: number): number {
    return Math.round(minutes / snapInterval) * snapInterval
  }

  function getSnappedDelta(deltaX: number): number {
    const deltaMinutes = deltaX / pixelsPerMinute
    const snappedDeltaMinutes =
      Math.round(deltaMinutes / snapInterval) * snapInterval

    return snappedDeltaMinutes * pixelsPerMinute
  }

  function calculateNewTime(originalTime: string, deltaX: number): string {
    const originalMinutes = timeToMinutes(originalTime)
    const deltaMinutes = Math.round(deltaX / pixelsPerMinute)
    const newMinutes = originalMinutes + deltaMinutes
    const snappedMinutes = snapToInterval(newMinutes)
    const clampedMinutes = Math.max(
      config.startHour * 60,
      Math.min((config.endHour - 1) * 60, snappedMinutes)
    )

    return minutesToTime(clampedMinutes)
  }

  function handleMouseMove(event: React.MouseEvent) {
    if (!timelineRef.current) return

    const rect = timelineRef.current.getBoundingClientRect()
    setMousePosition({
      x: event.clientX - rect.left + timelineRef.current.scrollLeft,
      y: event.clientY - rect.top,
    })
  }

  function handleMouseLeave() {
    setMousePosition(null)
  }

  const mouseTime = mousePosition
    ? minutesToTime(
        Math.floor((mousePosition.x - columnWidth) / pixelsPerMinute) +
          config.startHour * 60
      )
    : null

  function handleDragStart(event: DragStartEvent) {
    const activeId = String(event.active.id)
    const isSlotDrag = slots.some((slot) => slot.id === activeId)
    setLocalActiveSlot(isSlotDrag ? activeId : null)
  }

  function handleDragOver(event: DragOverEvent) {
    if (localActiveSlot && event.over && rowIds.has(String(event.over.id))) {
      setLocalOverRow(String(event.over.id))
    } else {
      setLocalOverRow(null)
      setLocalDraggedTime(null)
    }
  }

  function handleDragMove(event: DragMoveEvent) {
    const { over, active, delta } = event

    if (localActiveSlot && over && rowIds.has(String(over.id))) {
      const slot = slots.find((item) => item.id === active.id)

      if (slot) {
        const newTime = calculateNewTime(slot.startTime, delta.x)
        const overId = String(over.id)
        setLocalDraggedTime(newTime)
        setIsValid(
          onValidateDrop ? onValidateDrop(slot.id, newTime, overId) : true
        )
      }
    } else if (localActiveSlot) {
      setLocalDraggedTime(null)
      setIsValid(true)
    }
  }

  const collisionDetection: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args)

    if (pointerCollisions.length > 0) {
      const externalCollision = pointerCollisions.find(
        (collision) => !rowIds.has(String(collision.id))
      )

      if (externalCollision) {
        return [externalCollision]
      }

      return pointerCollisions
    }

    return closestCenter(args)
  }

  function handleDragCancel() {
    setLocalActiveSlot(null)
    setLocalOverRow(null)
    setLocalDraggedTime(null)
    setIsValid(true)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over, delta } = event

    setLocalActiveSlot(null)
    setLocalOverRow(null)
    setLocalDraggedTime(null)
    setIsValid(true)

    const activeId = String(active.id)

    if (over) {
      const overId = String(over.id)
      const isRowTarget = rows.some((row) => row.id === overId)
      const slot = slots.find((item) => item.id === active.id)

      if (!slot || !isRowTarget) {
        await onExternalDrop?.(activeId, overId)
        return
      }

      const newTime = calculateNewTime(slot.startTime, delta.x)
      const newRowId = overId

      if (onValidateDrop && !onValidateDrop(slot.id, newTime, newRowId)) {
        return
      }

      if (slot.rowId === newRowId && slot.startTime === newTime) {
        return
      }

      await onSlotPositionChange?.(activeId, newTime, newRowId)
    } else if (onExternalDrop && !slots.some((slot) => slot.id === activeId)) {
      await onExternalDrop(activeId, null)
    }
  }

  const activeSlot = localActiveSlot
    ? slots.find((slot) => slot.id === localActiveSlot)
    : null
  const showAgenda =
    mobileMode === "agenda" ||
    (mobileMode === "auto" &&
      containerWidth > 0 &&
      containerWidth < TIMELINE_AGENDA_BREAKPOINT)
  const showGrid = mobileMode === "scroll" || !showAgenda

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div ref={containerRef} className="relative w-full">
        {showAgenda ? (
          <TimelineAgenda
            slots={slots}
            rows={rows}
            onSlotClick={onSlotClick}
            onSlotCreate={onSlotCreate}
            reduceMotion={reduceMotion}
          />
        ) : null}
        {showGrid && mousePosition && mouseTime && !localActiveSlot ? (
          <TimelineMouseIndicator mouseX={mousePosition.x} time={mouseTime} />
        ) : null}

        {showGrid ? (
          <div
            ref={timelineRef}
            data-slot="timeline-grid"
            className={cn("relative overflow-auto border bg-background", className)}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {React.Children.map(children, (child) => {
              if (!React.isValidElement<TimelineInjectedProps>(child))
                return child

              return React.cloneElement(child, {
                slots,
                rows,
                activeSlotId: localActiveSlot,
                overRowId: localOverRow,
                draggedNewTime: localDraggedTime,
                isValidDrop: isValid,
                getSnappedDelta,
                _showDropRegion: Boolean(localActiveSlot && localDraggedTime),
                _dropRegionTime: localDraggedTime,
              })
            })}
          </div>
        ) : null}

        {afterGrid}

        {typeof document !== "undefined"
          ? createPortal(
              <DragOverlay dropAnimation={null}>
                {localActiveSlot && activeSlot ? (
                  <div
                    data-slot="timeline-drag-overlay"
                    style={{
                      width: `${Math.max(activeSlot.duration * pixelsPerMinute, 60)}px`,
                      height: "54px",
                      position: "relative",
                    }}
                  >
                    <DragPreviewOut />
                  </div>
                ) : null}
              </DragOverlay>,
              document.body
            )
          : null}
      </div>
    </DndContext>
  )
}

function TimelineAgenda({
  slots,
  rows,
  onSlotClick,
  onSlotCreate,
  reduceMotion,
}: {
  slots: TimelineSlotData[]
  rows: TimelineRowData[]
  onSlotClick?: (slotId: string) => void
  onSlotCreate?: (slot: TimelineSlotData) => void
  reduceMotion: boolean | null
}) {
  const rowMap = React.useMemo(
    () => new Map(rows.map((row) => [row.id, row])),
    [rows]
  )
  const sortedSlots = React.useMemo(
    () =>
      slots
        .slice()
        .sort(
          (left, right) =>
            timeToMinutes(left.startTime) - timeToMinutes(right.startTime)
        ),
    [slots]
  )

  return (
    <div
      data-slot="timeline-agenda"
      className="grid gap-3 rounded-md border bg-background p-3"
    >
      <div className="flex items-start justify-between gap-3 border-b pb-3">
        <div>
          <div className="text-sm font-semibold">Agenda</div>
          <div className="text-xs text-muted-foreground">
            {sortedSlots.length} scheduled items
          </div>
        </div>
        <div className="rounded-full border bg-muted/40 px-2 py-1 text-xs font-medium">
          {rows.length} lanes
        </div>
      </div>
      <div className="grid gap-2">
        {sortedSlots.map((slot, index) => {
          const row = rowMap.get(slot.rowId)
          const nextSlot = sortedSlots[index + 1]

          return (
            <React.Fragment key={slot.id}>
              <motion.button
                type="button"
                onClick={() => onSlotClick?.(slot.id)}
                className="grid grid-cols-[4.5rem_1fr] gap-3 rounded-md border bg-card p-3 text-left shadow-xs transition-colors hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: reduceMotion ? 0 : 0.16,
                  delay: reduceMotion ? 0 : index * 0.02,
                }}
              >
                <div className="text-xs font-medium tabular-nums text-muted-foreground">
                  <div className="text-foreground">{slot.startTime}</div>
                  <div className="mt-1">
                    {formatTimelineDuration(slot.duration)}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {String(slot.title ?? slot.label ?? "Timeline item")}
                      </div>
                      <div className="mt-1 truncate text-xs text-muted-foreground">
                        {row?.label ?? slot.rowId}
                      </div>
                    </div>
                    {slot.owner ? (
                      <div className="shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {String(slot.owner)}
                      </div>
                    ) : null}
                  </div>
                </div>
              </motion.button>
              {onSlotCreate ? (
                <TimelineAgendaCreateSlot
                  rows={rows}
                  afterSlot={slot}
                  beforeSlot={nextSlot}
                  onSlotCreate={onSlotCreate}
                />
              ) : null}
            </React.Fragment>
          )
        })}
        {sortedSlots.length === 0 && onSlotCreate ? (
          <TimelineAgendaCreateSlot
            rows={rows}
            onSlotCreate={onSlotCreate}
          />
        ) : null}
      </div>
    </div>
  )
}

function TimelineAgendaCreateSlot({
  rows,
  afterSlot,
  beforeSlot,
  onSlotCreate,
}: {
  rows: TimelineRowData[]
  afterSlot?: TimelineSlotData
  beforeSlot?: TimelineSlotData
  onSlotCreate: (slot: TimelineSlotData) => void
}) {
  const startMinutes = afterSlot
    ? timeToMinutes(afterSlot.startTime) + afterSlot.duration
    : 9 * 60
  const nextStartMinutes = beforeSlot ? timeToMinutes(beforeSlot.startTime) : null
  const defaultStart = minutesToTime(startMinutes)
  const defaultEnd = minutesToTime(
    nextStartMinutes && nextStartMinutes > startMinutes
      ? Math.min(nextStartMinutes, startMinutes + 60)
      : startMinutes + 60
  )
  const [open, setOpen] = React.useState(false)
  const [title, setTitle] = React.useState("New slot")
  const [startTime, setStartTime] = React.useState(defaultStart)
  const [endTime, setEndTime] = React.useState(defaultEnd)
  const [rowId, setRowId] = React.useState(
    afterSlot?.rowId ?? rows[0]?.id ?? "default"
  )

  React.useEffect(() => {
    if (!open) return

    setStartTime(defaultStart)
    setEndTime(defaultEnd)
    setRowId(afterSlot?.rowId ?? rows[0]?.id ?? "default")
  }, [afterSlot?.rowId, defaultEnd, defaultStart, open, rows])

  function createSlot(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const start = timeToMinutes(startTime)
    const end = timeToMinutes(endTime)
    const duration = Math.max(15, end > start ? end - start : 60)

    onSlotCreate({
      id: `slot-${Date.now()}`,
      rowId,
      startTime,
      duration,
      title: title.trim() || "New slot",
    })
    setTitle("New slot")
    setOpen(false)
  }

  return (
    <div className="group/timeline-create relative -my-1 flex h-2 items-center justify-center">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute top-1/2 z-1 size-6 -translate-y-1/2 scale-95 bg-transparent opacity-0 shadow-none transition-all duration-150 hover:bg-transparent focus:bg-transparent active:bg-transparent data-open:bg-transparent data-[state=open]:bg-transparent aria-expanded:bg-transparent focus-visible:scale-100 focus-visible:bg-transparent focus-visible:opacity-100 group-hover/timeline-create:scale-100 group-hover/timeline-create:opacity-100 group-focus-within/timeline-create:scale-100 group-focus-within/timeline-create:opacity-100"
            aria-label="Add timeline slot"
          >
            +
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72" align="center">
          <PopoverHeader>
            <PopoverTitle>Add slot</PopoverTitle>
            <PopoverDescription>
              Create a scheduled item in the agenda.
            </PopoverDescription>
          </PopoverHeader>
          <form onSubmit={createSlot}>
            <FieldGroup className="gap-3">
              <Field>
                <FieldLabel htmlFor="timeline-slot-title">Title</FieldLabel>
                <Input
                  id="timeline-slot-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field>
                  <FieldLabel htmlFor="timeline-slot-start">From</FieldLabel>
                  <Input
                    id="timeline-slot-start"
                    type="time"
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="timeline-slot-end">To</FieldLabel>
                  <Input
                    id="timeline-slot-end"
                    type="time"
                    value={endTime}
                    onChange={(event) => setEndTime(event.target.value)}
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel>Lane</FieldLabel>
                <Select value={rowId} onValueChange={setRowId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose lane" />
                  </SelectTrigger>
                  <SelectContent>
                    {rows.map((row) => (
                      <SelectItem key={row.id} value={row.id}>
                        {row.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Button type="submit" className="w-full">
                Add slot
              </Button>
            </FieldGroup>
          </form>
        </PopoverContent>
      </Popover>
    </div>
  )
}

function formatTimelineDuration(duration: number) {
  if (duration < 60) return `${duration}m`
  const hours = Math.floor(duration / 60)
  const minutes = duration % 60
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`
}

export interface TimelineHeaderProps {
  className?: string
  columnLabel?: React.ReactNode
}

export function TimelineHeader({
  className,
  columnLabel = "Row",
}: TimelineHeaderProps) {
  const { config, pixelsPerMinute, columnRef } = useTimeline()
  const hourMarkers = []

  for (let hour = config.startHour; hour < config.endHour; hour += 1) {
    hourMarkers.push({
      hour,
      label: `${hour}:00`,
      position: (hour - config.startHour) * 60 * pixelsPerMinute,
    })
  }

  return (
    <div
      data-slot="timeline-header"
      className={cn("sticky top-0 z-10 border-b bg-background", className)}
    >
      <div className="flex h-12">
        <div
          ref={columnRef}
          data-slot="timeline-header-column"
          className="sticky left-0 z-1 flex w-[var(--timeline-column-width)] items-center border-r bg-background px-3 text-xs font-semibold"
        >
          {columnLabel}
        </div>
        <div data-slot="timeline-header-markers" className="relative flex-1">
          {hourMarkers.map((marker) => (
            <div
              key={marker.hour}
              data-slot="timeline-hour-marker"
              className="absolute top-0 bottom-0 flex items-center pl-2 text-xs text-muted-foreground"
              style={{ left: `${marker.position}px` }}
            >
              {marker.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export interface TimelineRowProps extends TimelineInjectedProps {
  row: TimelineRowData
  slots: TimelineSlotData[]
  children: (slot: TimelineSlotData) => React.ReactNode
  renderRowHeader?: (row: TimelineRowData) => React.ReactNode
  renderRowExtras?: (row: TimelineRowData) => React.ReactNode
  className?: string
  asChild?: boolean
}

export function TimelineRow({
  row,
  slots,
  children,
  renderRowHeader,
  renderRowExtras,
  className,
  asChild,
  ...props
}: TimelineRowProps) {
  const { config, pixelsPerMinute, timelineWidth } = useTimeline()
  const Comp = asChild ? Slot : "div"
  const { setNodeRef, isOver } = useDroppable({
    id: row.id,
  })
  const rowSlots = slots.filter((slot) => slot.rowId === row.id)
  const isValidDrop = props.isValidDrop !== false
  const isHovered = isOver || props.overRowId === row.id
  const hourMarkers = []

  for (let hour = config.startHour; hour <= config.endHour; hour += 1) {
    hourMarkers.push({
      hour,
      position: (hour - config.startHour) * 60 * pixelsPerMinute,
    })
  }

  const quarterHourMarkers = []
  const totalMinutes = (config.endHour - config.startHour) * 60

  for (let minutes = 15; minutes < totalMinutes; minutes += 15) {
    if (minutes % 60 !== 0) {
      quarterHourMarkers.push({
        position: minutes * pixelsPerMinute,
      })
    }
  }

  return (
    <Comp
      ref={setNodeRef}
      data-slot="timeline-row"
      data-state={
        isHovered ? (isValidDrop ? "hover-valid" : "hover-invalid") : "idle"
      }
      className={cn(
        "flex h-12 border-b",
        isHovered && isValidDrop && "ring-2 ring-blue-500 ring-inset",
        isHovered && !isValidDrop && "ring-2 ring-red-500 ring-inset",
        className
      )}
    >
      <div
        data-slot="timeline-row-label"
        className="sticky left-0 z-[5] flex w-[var(--timeline-column-width)] items-center border-r bg-inherit text-xs font-medium"
      >
        {renderRowHeader ? (
          renderRowHeader(row)
        ) : (
          <span className="px-3">{row.label}</span>
        )}
      </div>

      <div
        data-slot="timeline-row-grid"
        className="relative flex-1"
        style={{ width: `${timelineWidth}px` }}
      >
        {quarterHourMarkers.map((marker, index) => (
          <div
            key={`quarter-${index}`}
            data-slot="timeline-grid-line-quarter"
            className="absolute top-0 bottom-0 w-px bg-border/30"
            style={{ left: `${marker.position}px` }}
          />
        ))}
        {hourMarkers.map((marker) => (
          <div
            key={marker.hour}
            data-slot="timeline-grid-line-hour"
            className="absolute top-0 bottom-0 w-px bg-border"
            style={{ left: `${marker.position}px` }}
          />
        ))}

        {renderRowExtras ? renderRowExtras(row) : null}

        {rowSlots.map((slot) => {
          const slotElement = children(slot)

          return (
            <React.Fragment key={slot.id}>
              {React.isValidElement<TimelineSlotInjectedProps>(slotElement)
                ? React.cloneElement(slotElement, {
                    activeSlotId: props.activeSlotId,
                    getSnappedDelta: props.getSnappedDelta,
                  })
                : slotElement}
            </React.Fragment>
          )
        })}

        {isHovered && props.draggedNewTime && props.activeSlotId ? (
          <TimelineDropGhost
            activeSlotId={props.activeSlotId}
            allSlots={slots}
            newTime={props.draggedNewTime}
            isValid={isValidDrop}
            pixelsPerMinute={pixelsPerMinute}
            config={config}
          />
        ) : null}
      </div>
    </Comp>
  )
}

type TimelineSlotInjectedProps = {
  activeSlotId?: string | null
  getSnappedDelta?: (deltaX: number) => number
}

export interface TimelineSlotProps extends TimelineSlotInjectedProps {
  slot: TimelineSlotData
  children: React.ReactNode
  className?: string
  asChild?: boolean
}

export function TimelineSlot({
  slot,
  children,
  className,
  asChild,
  ...props
}: TimelineSlotProps) {
  const {
    config,
    pixelsPerMinute,
    onSlotClick,
    onSlotResize,
    dragPreviewTunnel,
  } = useTimeline()
  const Comp = asChild ? Slot : "div"
  const DragPreviewIn = dragPreviewTunnel.In
  const { attributes, listeners, setNodeRef, isDragging, transform } =
    useDraggable({
      id: slot.id,
    })
  const startMinutes = timeToMinutes(slot.startTime)
  const endMinutes = startMinutes + slot.duration
  const left = (startMinutes - config.startHour * 60) * pixelsPerMinute
  const width = slot.duration * pixelsPerMinute
  const isActiveSlot = props.activeSlotId === slot.id
  const snapInterval = config.snapIntervalMinutes ?? 15

  function handleResizeStart(
    event: React.PointerEvent,
    edge: "left" | "right"
  ) {
    if (!onSlotResize) return

    event.stopPropagation()
    event.preventDefault()

    const target = event.currentTarget as HTMLElement
    target.setPointerCapture(event.pointerId)

    const initialX = event.clientX
    const initialStart = startMinutes
    const initialEnd = endMinutes
    const timelineStart = config.startHour * 60
    const timelineEnd = config.endHour * 60
    const minDuration = snapInterval

    function getDeltaMinutes(clientX: number) {
      const rawDeltaMinutes = (clientX - initialX) / pixelsPerMinute
      return Math.round(rawDeltaMinutes / snapInterval) * snapInterval
    }

    function getNextSize(clientX: number) {
      const deltaMinutes = getDeltaMinutes(clientX)

      if (edge === "left") {
        const newStart = Math.max(
          timelineStart,
          Math.min(initialStart + deltaMinutes, initialEnd - minDuration)
        )

        return {
          start: newStart,
          duration: initialEnd - newStart,
        }
      }

      const newEnd = Math.max(
        initialStart + minDuration,
        Math.min(initialEnd + deltaMinutes, timelineEnd)
      )

      return {
        start: initialStart,
        duration: newEnd - initialStart,
      }
    }

    function handlePointerMove(moveEvent: PointerEvent) {
      const next = getNextSize(moveEvent.clientX)
      void onSlotResize?.(
        slot.id,
        minutesToTime(next.start),
        next.duration,
        false
      )
    }

    function handlePointerUp(upEvent: PointerEvent) {
      const next = getNextSize(upEvent.clientX)
      void onSlotResize?.(
        slot.id,
        minutesToTime(next.start),
        next.duration,
        true
      )
      target.releasePointerCapture(upEvent.pointerId)
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp)
  }

  const style =
    transform && props.getSnappedDelta
      ? {
          left: `${left}px`,
          width: `${Math.max(width, 60)}px`,
          top: 0,
          bottom: 0,
          transform: `translate3d(${props.getSnappedDelta(transform.x)}px, 0px, 0)`,
        }
      : {
          left: `${left}px`,
          width: `${Math.max(width, 60)}px`,
          top: 0,
          bottom: 0,
        }
  const slotContent = (
    <Comp
      data-slot="timeline-slot"
      data-state={isDragging ? "dragging" : "idle"}
      data-active={isActiveSlot}
      className={cn(
        "group/timeline-slot absolute inset-1 cursor-move overflow-hidden rounded transition-all",
        isDragging
          ? "opacity-40 shadow-sm ring-2 ring-foreground/50"
          : "shadow-md",
        onSlotClick && "cursor-pointer hover:ring-2 hover:ring-foreground/30",
        className
      )}
      onClick={(event: React.MouseEvent) => {
        if (onSlotClick && !isDragging) {
          event.stopPropagation()
          onSlotClick(slot.id)
        }
      }}
      style={
        {
          "--slot-start-time": slot.startTime,
          "--slot-duration": `${slot.duration}min`,
        } as React.CSSProperties
      }
    >
      {children}
      {onSlotResize ? (
        <>
          <div
            aria-hidden="true"
            className="absolute top-0 bottom-0 left-0 z-20 w-4 -translate-x-1/2 cursor-col-resize"
            onPointerDown={(event) => handleResizeStart(event, "left")}
          />
          <div
            aria-hidden="true"
            className="absolute top-0 right-0 bottom-0 z-20 w-4 translate-x-1/2 cursor-col-resize"
            onPointerDown={(event) => handleResizeStart(event, "right")}
          />
          <div className="pointer-events-none absolute top-1 bottom-1 left-0 w-1 rounded-r-sm bg-transparent group-hover/timeline-slot:bg-foreground/20" />
          <div className="pointer-events-none absolute top-1 right-0 bottom-1 w-1 rounded-l-sm bg-transparent group-hover/timeline-slot:bg-foreground/20" />
        </>
      ) : null}
    </Comp>
  )

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="absolute"
      style={style}
    >
      {slotContent}

      {isActiveSlot && isDragging ? (
        <DragPreviewIn>
          <Comp
            data-slot="timeline-slot-preview"
            className={cn(
              "h-full w-full cursor-move overflow-hidden rounded shadow-lg",
              className
            )}
            style={
              {
                "--slot-start-time": slot.startTime,
                "--slot-duration": `${slot.duration}min`,
              } as React.CSSProperties
            }
          >
            {children}
          </Comp>
        </DragPreviewIn>
      ) : null}
    </div>
  )
}

export interface TimelineSlotLabelProps extends React.ComponentProps<"div"> {
  asChild?: boolean
}

export function TimelineSlotLabel({
  asChild,
  className,
  ...props
}: TimelineSlotLabelProps) {
  const Comp = asChild ? Slot : "div"

  return (
    <Comp
      data-slot="timeline-slot-label"
      className={cn("truncate text-xs font-medium", className)}
      {...props}
    />
  )
}

export interface TimelineSlotContentProps extends React.ComponentProps<"div"> {
  asChild?: boolean
}

export function TimelineSlotContent({
  asChild,
  className,
  ...props
}: TimelineSlotContentProps) {
  const Comp = asChild ? Slot : "div"

  return (
    <Comp
      data-slot="timeline-slot-content"
      className={cn("text-xs", className)}
      {...props}
    />
  )
}

export function TimelineMouseIndicator({
  mouseX,
  time,
}: {
  mouseX: number
  time: string
}) {
  return (
    <div
      data-slot="timeline-mouse-indicator"
      className="pointer-events-none absolute top-0 bottom-0 z-20"
      style={{ left: `${mouseX}px` }}
    >
      <div className="absolute top-0 bottom-0 left-0 w-px bg-accent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 rounded bg-accent px-2 py-1 text-xs font-semibold whitespace-nowrap text-accent-foreground shadow-md">
        {time}
      </div>
    </div>
  )
}

export interface TimelineDropRegionProps {
  startTime: string
  duration: number
}

export function TimelineDropRegion({
  startTime,
  duration,
}: TimelineDropRegionProps) {
  const { config, pixelsPerMinute } = useTimeline()
  const columnWidth = config.columnWidth ?? 112
  const startMinutes = timeToMinutes(startTime)
  const endMinutes = startMinutes + duration
  const endTime = minutesToTime(endMinutes)
  const startPosition =
    (startMinutes - config.startHour * 60) * pixelsPerMinute + columnWidth
  const endPosition =
    (endMinutes - config.startHour * 60) * pixelsPerMinute + columnWidth
  const width = endPosition - startPosition

  return (
    <div
      data-slot="timeline-drop-region"
      className="pointer-events-none absolute top-0 bottom-0 z-[12]"
      style={{ left: `${startPosition}px`, width: `${width}px` }}
    >
      <div className="absolute top-2 left-1/2 -translate-x-1/2 rounded bg-accent px-3 py-1.5 text-sm font-semibold whitespace-nowrap text-accent-foreground shadow-md">
        {startTime} - {endTime}
      </div>
      <div className="absolute top-0 bottom-0 left-0 w-0.5 bg-accent" />
      <div className="absolute top-0 right-0 bottom-0 w-0.5 bg-accent" />
      <div className="absolute inset-0 bg-accent/[0.07]" />
    </div>
  )
}

export interface TimelineCurrentTimeProps {
  className?: string
  nowLabel?: string
}

export function TimelineCurrentTime({
  className,
  nowLabel = "Now",
}: TimelineCurrentTimeProps) {
  const { config, pixelsPerMinute } = useTimeline()
  const columnWidth = config.columnWidth ?? 112
  const [now, setNow] = React.useState(new Date())

  React.useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60000)
    return () => window.clearInterval(interval)
  }, [])

  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const position =
    (currentMinutes - config.startHour * 60) * pixelsPerMinute + columnWidth

  if (
    currentMinutes < config.startHour * 60 ||
    currentMinutes > config.endHour * 60
  ) {
    return null
  }

  return (
    <div
      data-slot="timeline-current-time"
      className={cn(
        "pointer-events-none absolute top-0 bottom-0 z-[15] w-0.5 bg-secondary",
        className
      )}
      style={{ left: `${position}px` }}
    >
      <div className="absolute top-0 left-1/2 z-50 -translate-x-1/2 rounded bg-secondary px-2 py-1 text-xs font-medium whitespace-nowrap text-foreground shadow-md">
        {nowLabel}: {minutesToTime(currentMinutes)}
      </div>
    </div>
  )
}

export interface TimelineGridProps extends TimelineInjectedProps {
  children: React.ReactNode
  className?: string
}

export function TimelineGrid({
  children,
  className,
  ...props
}: TimelineGridProps) {
  const { timelineWidth } = useTimeline()
  const activeSlot =
    props._showDropRegion && props.slots
      ? props.slots.find((slot) => slot.id === props.activeSlotId)
      : null

  return (
    <div
      data-slot="timeline-grid-container"
      className={cn("relative", className)}
      style={{ minWidth: `${timelineWidth + 200}px` }}
    >
      {React.Children.map(children, (child) => {
        if (!React.isValidElement<TimelineInjectedProps>(child)) return child
        return React.cloneElement(child, props)
      })}

      {props._showDropRegion && props._dropRegionTime && activeSlot ? (
        <TimelineDropRegion
          startTime={props._dropRegionTime}
          duration={activeSlot.duration}
        />
      ) : null}
    </div>
  )
}

function TimelineDropGhost({
  activeSlotId,
  allSlots,
  newTime,
  isValid,
  config,
  pixelsPerMinute,
}: {
  activeSlotId: string
  allSlots: TimelineSlotData[]
  newTime: string
  isValid: boolean
  config: TimelineConfig
  pixelsPerMinute: number
}) {
  const slot = allSlots.find((item) => item.id === activeSlotId)
  if (!slot || !isValid) return null

  const startMinutes = timeToMinutes(newTime)
  const left = (startMinutes - config.startHour * 60) * pixelsPerMinute
  const width = slot.duration * pixelsPerMinute

  return (
    <div
      data-slot="timeline-drop-ghost"
      className="pointer-events-none absolute rounded-md bg-foreground/20"
      style={{
        left: `${left}px`,
        width: `${Math.max(width, 60)}px`,
        top: "2px",
        bottom: "2px",
        zIndex: 100,
      }}
    />
  )
}
