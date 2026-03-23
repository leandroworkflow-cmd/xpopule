import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Wallet, LogIn, LogOut, Shield, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, balance, isAdmin, signOut, loading } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border px-4 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <h1 className="text-sm font-medium text-muted-foreground hidden sm:block">
                Mercado de Previsões
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <Link to="/carteira" className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
                    <Wallet className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground hidden sm:inline">Saldo:</span>
                    <span className="font-bold text-foreground">
                      R$ {balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-2">
                        <User className="h-4 w-4" />
                        <span className="hidden sm:inline text-xs text-muted-foreground max-w-[120px] truncate">
                          {user.email}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover border-border">
                      {isAdmin && (
                        <DropdownMenuItem asChild>
                          <Link to="/admin" className="gap-2"><Shield className="h-4 w-4" /> Painel Admin</Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={signOut} className="gap-2 text-danger">
                        <LogOut className="h-4 w-4" /> Sair
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <Button variant="outline" size="sm" asChild>
                  <Link to="/login" className="gap-2">
                    <LogIn className="h-4 w-4" /> Entrar
                  </Link>
                </Button>
              )}
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
