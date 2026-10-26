import AppNavigationMenu from "@/components/app-navigation-menu"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/toast"
import { Outlet, ScrollRestoration } from "react-router-dom"

export default function Layout() {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="bg-gray-100">
                <AppNavigationMenu />
                <main className="flex-1 p-4">
                    <Outlet />
                </main>
                <Toaster/>
            </SidebarInset>
            <ScrollRestoration />
        </SidebarProvider>
    )
}
