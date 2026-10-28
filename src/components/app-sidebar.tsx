"use client"

import * as React from "react"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { GalleryVerticalEndIcon, AudioLinesIcon, TerminalIcon, TerminalSquareIcon, BotIcon, BookOpenIcon, Settings2Icon, FrameIcon, PieChartIcon, MapIcon, Workflow, ShieldCheck, RotateCcwClock, ArrowLeftRight, Landmark, ChartNoAxesCombined, Users, LayoutDashboard } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { useAuth } from "@/context/auth/AuthProvider"



const workspaceItems = [
  { title: "Overview", url: "/overview", icon: LayoutDashboard },
  { title: "Payments", url: "/payments", icon: ArrowLeftRight },
  { title: "Recipients", url: "/recipients", icon: Users },
  { title: "Accounts", url: "/accounts", icon: Landmark },
  { title: "Reports", url: "/reports", icon: ChartNoAxesCombined }
]

const adminItems = [
  { title: "Payment Rules", url: "/rules", icon: Workflow },
  { title: "Team & Access", url: "/team", icon: ShieldCheck },
  { title: "Audit Log", url: "/audit", icon: RotateCcwClock }
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { pathname } = useLocation()
  const {user} = useAuth()
  // console.log(pathname)

  const data = {
    user: {
      name: `${user?.firstName} ${user?.lastName}`,
      email: `${user?.email}`,
      avatar: "/avatars/shadcn.jpg",
    },
    teams: [
      {
        name: "Dumi Inc",
        logo: (
          <GalleryVerticalEndIcon
          />
        ),
        plan: "Enterprise",
      },
      {
        name: "Dumi Corp.",
        logo: (
          <AudioLinesIcon
          />
        ),
        plan: "Startup",
      },
      {
        name: "GiveMeMoney Corp.",
        logo: (
          <TerminalIcon
          />
        ),
        plan: "Free",
      },
    ],
    navMain: [
      {
        title: "Playground",
        url: "#",
        icon: (
          <TerminalSquareIcon
          />
        ),
        isActive: true,
        items: [
          {
            title: "History",
            url: "#",
          },
          {
            title: "Starred",
            url: "#",
          },
          {
            title: "Settings",
            url: "#",
          },
        ],
      },
      {
        title: "Models",
        url: "#",
        icon: (
          <BotIcon
          />
        ),
        items: [
          {
            title: "Genesis",
            url: "#",
          },
          {
            title: "Explorer",
            url: "#",
          },
          {
            title: "Quantum",
            url: "#",
          },
        ],
      },
      {
        title: "Documentation",
        url: "#",
        icon: (
          <BookOpenIcon
          />
        ),
        items: [
          {
            title: "Introduction",
            url: "#",
          },
          {
            title: "Get Started",
            url: "#",
          },
          {
            title: "Tutorials",
            url: "#",
          },
          {
            title: "Changelog",
            url: "#",
          },
        ],
      },
      {
        title: "Settings",
        url: "#",
        icon: (
          <Settings2Icon
          />
        ),
        items: [
          {
            title: "General",
            url: "#",
          },
          {
            title: "Team",
            url: "#",
          },
          {
            title: "Billing",
            url: "#",
          },
          {
            title: "Limits",
            url: "#",
          },
        ],
      },
    ],
    projects: [
      {
        name: "Design Engineering",
        url: "#",
        icon: (
          <FrameIcon
          />
        ),
      },
      {
        name: "Sales & Marketing",
        url: "#",
        icon: (
          <PieChartIcon
          />
        ),
      },
      {
        name: "Travel",
        url: "#",
        icon: (
          <MapIcon
          />
        ),
      },
    ],
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="uppercase">Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {
                workspaceItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton isActive={pathname === item.url} className="text-gray-500 hover:bg-green-50 hover:text-green-700 data-active:bg-green-100 data-active:text-green-700 data-active:font-medium">
                      <Link to={item.url} className="flex gap-1">
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              }
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="uppercase">Administration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {
                adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton isActive={pathname === item.url} className="text-gray-500 hover:bg-green-50 hover:text-green-700 data-active:bg-green-100 data-active:text-green-700 data-active:font-medium">
                      <Link to={item.url} className="flex gap-1">
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              }
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
