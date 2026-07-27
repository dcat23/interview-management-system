"use client"

import * as React from "react"
import {
  RiBarChartBoxLine,
  RiCheckboxCircleLine,
  RiErrorWarningLine,
  RiFolder3Line,
  RiGitMergeLine,
  RiLayoutGridLine,
  RiLogoutBoxRLine,
  RiNotification3Line,
  RiRocketLine,
  RiSearchLine,
  RiSettings3Line,
  RiTeamLine,
  RiUser3Line,
  RiUserAddLine,
} from "@remixicon/react"
import { toast } from "sonner"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { Avatar, AvatarFallback, AvatarImage } from "@app/dashboard/components/ui/common/avatar"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@app/dashboard/components/ui/common/chart"
import { Badge } from "@app/dashboard/components/ui/common/badge"
import { Button } from "@app/dashboard/components/ui/common/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@app/dashboard/components/ui/common/card"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@app/dashboard/components/ui/common/command"
import { Kbd, KbdGroup } from "@app/dashboard/components/ui/common/kbd"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@app/dashboard/components/ui/common/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@app/dashboard/components/ui/common/sheet"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@app/dashboard/components/ui/common/sidebar"
import { Toaster } from "@app/dashboard/components/ui/common/sonner"
import { PROJECT_NAME } from "@app/dashboard/lib/constants/metadata"

const navItems = [
  { label: "Overview", icon: RiLayoutGridLine },
  { label: "Analytics", icon: RiBarChartBoxLine },
  { label: "Projects", icon: RiFolder3Line },
  { label: "Team", icon: RiTeamLine },
  { label: "Settings", icon: RiSettings3Line },
]

const stats = [
  { label: "Total revenue", value: "$48.2k", delta: "+12.4%" },
  { label: "Active users", value: "2,840", delta: "+5.1%" },
  { label: "Conversion", value: "3.6%", delta: "-0.8%" },
]

const performanceData = [
  { month: "Jan", revenue: 31_200 },
  { month: "Feb", revenue: 34_800 },
  { month: "Mar", revenue: 33_100 },
  { month: "Apr", revenue: 38_600 },
  { month: "May", revenue: 42_900 },
  { month: "Jun", revenue: 41_300 },
  { month: "Jul", revenue: 45_700 },
  { month: "Aug", revenue: 48_200 },
]

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--primary)",
  },
} satisfies ChartConfig

const activity = [
  {
    name: "Priya Nair",
    avatar: "https://i.pravatar.cc/150?img=45",
    icon: RiRocketLine,
    action: "deployed",
    target: "acme-web v2.4",
    time: "2 Min Ago",
  },
  {
    name: "Marco Diaz",
    avatar: "https://i.pravatar.cc/150?img=33",
    icon: RiGitMergeLine,
    action: "merged",
    target: "PR #482: checkout refactor",
    time: "1 Hour Ago",
  },
  {
    name: "Lena Fischer",
    avatar: "https://i.pravatar.cc/150?img=47",
    icon: RiCheckboxCircleLine,
    action: "closed",
    target: "8 tasks in Sprint 7",
    time: "3 Hours Ago",
  },
]

const notifications = [
  {
    id: 1,
    icon: RiRocketLine,
    title: "Deployment succeeded",
    detail: "acme-web v2.4 is live in production.",
    time: "2 Min Ago",
    unread: true,
    tone: "primary" as const,
  },
  {
    id: 2,
    icon: RiUserAddLine,
    title: "New team member",
    detail: "Priya Nair accepted your invite.",
    time: "1 Hour Ago",
    unread: true,
    tone: "primary" as const,
  },
  {
    id: 3,
    icon: RiErrorWarningLine,
    title: "Usage at 80%",
    detail: "You're approaching your monthly request limit.",
    time: "3 Hours Ago",
    unread: false,
    tone: "destructive" as const,
  },
]

const recentItems = [
  { label: "Acme Web Redesign", icon: RiFolder3Line },
  { label: "Q3 Analytics report", icon: RiBarChartBoxLine },
  { label: "Priya Nair", icon: RiUser3Line },
]

const commands = [
  { label: "Go to Overview", icon: RiLayoutGridLine, shortcut: ["G", "O"] },
  { label: "Go to Analytics", icon: RiBarChartBoxLine, shortcut: ["G", "A"] },
  { label: "Go to Projects", icon: RiFolder3Line, shortcut: ["G", "P"] },
  { label: "Go to Team", icon: RiTeamLine, shortcut: ["G", "T"] },
  { label: "Invite a teammate", icon: RiUserAddLine, shortcut: ["I"] },
  { label: "Open settings", icon: RiSettings3Line, shortcut: ["⌘", ","] },
]

export default function AppShellBlock({
  children,
}: {
  children?: React.ReactNode
}) {
  const [activeNav, setActiveNav] = React.useState("Overview")
  const [commandOpen, setCommandOpen] = React.useState(false)
  const [notes, setNotes] = React.useState(notifications)
  const unreadCount = notes.filter((n) => n.unread).length
  const markAllRead = () =>
    setNotes((prev) => prev.map((n) => ({ ...n, unread: false })))

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setCommandOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <SidebarProvider className="min-h-svh bg-muted/30 text-foreground">
      <Toaster />

      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex h-10 items-center gap-2 px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
              className="size-5 shrink-0 text-foreground"
            >
              <rect
                x="3"
                y="3"
                width="8"
                height="8"
                transform="rotate(-6 7 7)"
              />
              <rect
                x="3"
                y="13"
                width="8"
                height="8"
                transform="rotate(5 7 17)"
              />
              <rect
                x="13"
                y="13"
                width="8"
                height="8"
                transform="rotate(-4 17 17)"
              />
              <rect
                x="13"
                y="3"
                width="8"
                height="8"
                transform="rotate(15 17 7)"
              />
            </svg>
            <span className="truncate text-base font-semibold group-data-[collapsible=icon]:hidden">
              {PROJECT_NAME}
            </span>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    isActive={activeNav === item.label}
                    tooltip={item.label}
                    onClick={() => setActiveNav(item.label)}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <AccountMenu
                trigger={
                  <SidebarMenuButton
                    size="lg"
                    tooltip="Account"
                    className="gap-2 group-data-[collapsible=icon]:justify-center"
                  >
                    <Avatar size="sm">
                      <AvatarImage
                        src="https://i.pravatar.cc/150?img=15"
                        alt="Avery Cole"
                        className="grayscale"
                      />
                      <AvatarFallback>AC</AvatarFallback>
                    </Avatar>
                    <span className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
                      <span className="truncate text-xs font-medium">
                        Avery Cole
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        avery@acme.com
                      </span>
                    </span>
                  </SidebarMenuButton>
                }
              />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background px-4 sm:px-6">
          <SidebarTrigger className="-ml-1" />

          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="relative flex h-9 w-full max-w-sm items-center gap-2 border border-border bg-background px-3 text-sm text-muted-foreground transition-colors hover:bg-muted/50"
          >
            <RiSearchLine className="size-4 shrink-0" aria-hidden="true" />
            <span className="flex-1 text-left">Search projects, people...</span>
            <KbdGroup className="hidden sm:inline-flex">
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </KbdGroup>
          </button>

          <div className="ml-auto flex items-center gap-2">
            <Sheet>
              <SheetTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Notifications"
                    className="relative"
                  >
                    <RiNotification3Line className="size-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center bg-primary text-[9px] leading-none font-bold text-primary-foreground ring-2 ring-background">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                }
              />
              <SheetContent className="w-full sm:max-w-sm">
                <SheetHeader className="gap-0.5 border-b border-border">
                  <SheetTitle>Notifications</SheetTitle>
                  <SheetDescription>
                    {unreadCount > 0
                      ? `${unreadCount} unread updates`
                      : "You're all caught up"}
                  </SheetDescription>
                </SheetHeader>
                <div className="flex flex-1 flex-col overflow-y-auto">
                  {notes.map((note) => (
                    <button
                      key={note.id}
                      type="button"
                      onClick={() =>
                        setNotes((prev) =>
                          prev.map((n) =>
                            n.id === note.id ? { ...n, unread: false } : n
                          )
                        )
                      }
                      className={[
                        "flex items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                        note.unread ? "bg-muted/30" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <span
                        className={[
                          "mt-0.5 flex size-8 shrink-0 items-center justify-center",
                          note.tone === "destructive"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-primary/10 text-primary",
                        ].join(" ")}
                      >
                        <note.icon className="size-4" aria-hidden="true" />
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-foreground">
                            {note.title}
                          </p>
                          <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums">
                            {note.time}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {note.detail}
                        </p>
                      </div>
                      {note.unread && (
                        <span
                          className="mt-1.5 size-2 shrink-0 bg-primary"
                          aria-label="Unread"
                        />
                      )}
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between border-t border-border p-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={markAllRead}
                    disabled={unreadCount === 0}
                  >
                    Mark all read
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={() =>
                      toast("Notifications", {
                        description: "Opening all notifications.",
                      })
                    }
                  >
                    View all
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            <AccountMenu
              trigger={
                <Button variant="ghost" size="icon" aria-label="Account menu">
                  <Avatar>
                    <AvatarImage
                      src="https://i.pravatar.cc/150?img=15"
                      alt="Avery Cole"
                      className="grayscale"
                    />
                    <AvatarFallback>AC</AvatarFallback>
                  </Avatar>
                </Button>
              }
            />
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6">
          {children ?? (
            <div className="mx-auto w-full max-w-5xl space-y-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">
                    {activeNav}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Here is what is happening across Acme today.
                  </p>
                </div>
                <Badge variant="secondary">
                  <span className="size-2 rounded-full bg-primary" />
                  Live
                </Badge>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {stats.map((stat) => (
                  <Card key={stat.label}>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {stat.label}
                      </CardTitle>
                      <CardAction>
                        <Badge
                          variant={
                            stat.delta.startsWith("-")
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {stat.delta}
                        </Badge>
                      </CardAction>
                    </CardHeader>
                    <CardContent>
                      <span className="text-3xl font-semibold tracking-tight">
                        {stat.value}
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Performance</CardTitle>
                    <CardAction>
                      <Badge variant="secondary" className="tabular-nums">
                        +18.2% MoM
                      </Badge>
                    </CardAction>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={chartConfig}
                      className="h-56 w-full"
                    >
                      <AreaChart
                        data={performanceData}
                        margin={{ left: 0, right: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="fillRevenue"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="var(--color-revenue)"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor="var(--color-revenue)"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} />
                        <XAxis
                          dataKey="month"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                        />
                        <ChartTooltip
                          cursor={false}
                          content={
                            <ChartTooltipContent
                              formatter={(value) =>
                                "$" + Number(value).toLocaleString()
                              }
                            />
                          }
                        />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="var(--color-revenue)"
                          strokeWidth={2}
                          fill="url(#fillRevenue)"
                          dot={false}
                          activeDot={{ r: 4, strokeWidth: 0 }}
                        />
                      </AreaChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {activity.map((item) => (
                      <div key={item.target} className="flex items-start gap-3">
                        <div className="relative shrink-0">
                          <Avatar size="sm">
                            <AvatarImage
                              src={item.avatar}
                              alt={item.name}
                              className="grayscale"
                            />
                            <AvatarFallback className="text-[10px]">
                              {item.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="absolute -right-1 -bottom-1 flex size-4 items-center justify-center border border-border bg-card">
                            <item.icon className="size-2.5 text-muted-foreground" />
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm leading-snug">
                            <span className="font-medium text-foreground">
                              {item.name}
                            </span>{" "}
                            <span className="text-muted-foreground">
                              {item.action}
                            </span>{" "}
                            <span className="font-medium text-foreground">
                              {item.target}
                            </span>
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {item.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </main>
      </SidebarInset>

      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <Command>
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Recent">
              {recentItems.map((item) => (
                <CommandItem
                  key={item.label}
                  value={item.label}
                  onSelect={() => {
                    setCommandOpen(false)
                    toast(item.label, { description: "Opening recent item." })
                  }}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Commands">
              {commands.map((command) => (
                <CommandItem
                  key={command.label}
                  value={command.label}
                  onSelect={() => {
                    setCommandOpen(false)
                    toast(command.label, { description: "Command executed." })
                  }}
                >
                  <command.icon />
                  <span>{command.label}</span>
                  <CommandShortcut>
                    <KbdGroup>
                      {command.shortcut.map((key) => (
                        <Kbd key={key}>{key}</Kbd>
                      ))}
                    </KbdGroup>
                  </CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </SidebarProvider>
  )
}

function AccountMenu({ trigger }: { trigger: React.ReactElement }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={trigger} />
      <DropdownMenuContent align="end" className="w-48">
        <div className="flex flex-col px-2 py-1.5">
          <span className="text-xs font-medium text-foreground">
            Avery Cole
          </span>
          <span className="text-xs text-muted-foreground">avery@acme.com</span>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() =>
            toast("Account", { description: "Opening your account." })
          }
        >
          <RiUser3Line />
          Account
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            toast("Settings", { description: "Opening your settings." })
          }
        >
          <RiSettings3Line />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() =>
            toast.success("Logged out", { description: "See you soon." })
          }
        >
          <RiLogoutBoxRLine />
          Log Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
