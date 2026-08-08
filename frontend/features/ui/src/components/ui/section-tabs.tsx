import { Tabs, TabsContent, TabsList, TabsTrigger } from "@feature/ui/components//ui/common/tabs"

export type SectionTab = {
  value: string
  label: string
  content: string
}

export function SectionTabs({ tabs }: { tabs: SectionTab[] }) {
  return (
    <Tabs defaultValue={tabs[0]?.value} className="w-full">
      <TabsList
        className="grid w-full"
        style={{
          gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`,
        }}
      >
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent
          key={tab.value}
          value={tab.value}
          className="rounded-md border p-4 text-sm text-muted-foreground"
        >
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  )
}
