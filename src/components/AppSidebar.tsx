import { TrendingUp, Landmark, Clapperboard, CloudSun, Trophy, LayoutGrid, Wallet, Briefcase, Shield, DollarSign } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const categories = [
  { title: "Todos", url: "/", icon: LayoutGrid },
  { title: "Economia", url: "/?cat=economia", icon: TrendingUp },
  { title: "Política", url: "/?cat=politica", icon: Landmark },
  { title: "Entretenimento", url: "/?cat=entretenimento", icon: Clapperboard },
  { title: "Clima", url: "/?cat=clima", icon: CloudSun },
  { title: "Esportes", url: "/?cat=esportes", icon: Trophy },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname + location.search;
  const { user, balance, isAdmin } = useAuth();

  const isActive = (url: string) => {
    if (url === "/") return location.pathname === "/" && !location.search;
    if (url.startsWith("/?")) return currentPath === url;
    return location.pathname === url;
  };

  const pages = [
    { title: "Portfólio", url: "/portfolio", icon: Briefcase },
    { title: "Carteira", url: "/carteira", icon: Wallet },
    ...(isAdmin ? [
      { title: "Admin", url: "/admin", icon: Shield },
      { title: "Financeiro", url: "/admin/financeiro", icon: DollarSign },
    ] : []),
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-foreground tracking-tight">MercadoX</span>
          </div>
        )}
        {collapsed && (
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
            <TrendingUp className="h-4 w-4 text-primary-foreground" />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider">
            Categorias
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {categories.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-accent/50 transition-colors"
                      activeClassName={isActive(item.url) ? "bg-accent text-primary font-medium" : ""}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider">
              Minha Conta
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {pages.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className="hover:bg-accent/50 transition-colors"
                        activeClassName="bg-accent text-primary font-medium"
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4">
        {!collapsed && user && (
          <div className="rounded-lg bg-accent p-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Wallet className="h-3 w-3" />
              Saldo Disponível
            </div>
            <div className="text-foreground font-bold text-lg">
              R$ {balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
