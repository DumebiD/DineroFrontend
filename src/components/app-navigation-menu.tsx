import { Bell, Dot, Search } from "lucide-react";
import { Badge } from "./ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbSeparator } from "./ui/breadcrumb";
import { NavigationMenu, NavigationMenuItem, NavigationMenuList } from "./ui/navigation-menu";
import { SidebarTrigger } from "./ui/sidebar";

export default function AppNavigationMenu() {
    return (
        <header className="flex w-full items-center border-b bg-white px-4 py-6 justify-between">
            <NavigationMenu>
                <NavigationMenuList>
                    <SidebarTrigger className="pl-2" />
                    <NavigationMenuItem>
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    Administration
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    Payment Rules
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </NavigationMenuItem>

                </NavigationMenuList>
            </NavigationMenu>
            <div className="flex gap-4 justify-center items-center">
                <Badge className="rounded-md bg-green-50 text-primary hover:bg-green-50 py-3">
                    <Dot size={36} strokeWidth={8}/>
                    Live Environment
                </Badge>
                <Badge className="rounded-md bg-blue-50 text-blue-500 hover:bg-blue-50 py-3">
                    Admin Console                    
                </Badge>
                <Search className="text-gray-400" size={20}/>
                <Bell className="text-gray-400" size={20}/>
            </div>
        </header>
    )
}