import * as React from "react"

import {
  SidebarGroup,
  SidebarGroupContent
} from "@app/dashboard/components/ui/common/sidebar"
import { NavItem } from "@feature/base/server"
import AppSidebarNavMenu from "./app-sidebar-nav-menu"

export function AppSidebarNavSecondary({
  items,
  ...props
}: {
  items: NavItem[]
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <AppSidebarNavMenu navigation={items} />
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
