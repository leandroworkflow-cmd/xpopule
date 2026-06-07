import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Users, LogIn, Clock, Globe, Shield,
  Search, RefreshCw, ChevronDown, ChevronUp,
  Monitor, Smartphone, AlertCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";

// ─── tipos ────────────────────────────────────────────────────────────────────

interface LoginLog {
  id: string;
  user_id: string;
  email: string;
  nome: string | null;
  evento: "login" | "logout";
  ip: string | null;
  user_agent: string | null;
  cidade: string | null;
  pais: string | null;
  created_at: string;
}

interface UsuarioResumo {
  user_id: string;
  email: string;
  nome: string | null;
  ultimo_login: string | null;
  total_logins: number;
  ultimo_ip: string | null;
  ultima_cidade: string | null;
  ultimo_pais: string | null;
}

// ─── utilitários ──────────────────────────────────────────────────────────────

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function tempoRelativo(iso: string | null) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const min  = Math.floor(diff / 60000);
  const h    = Math.floor(min / 60);
  const d    = Math.floor(h / 24);
  if (min < 1)  return "agora mesmo";
  if (min < 60) return `${min}min atrás`;
  if (h < 24)   return `${h}h atrás`;
  return `${d}d atrás`;
}

function isMobile(ua: string | null) {
  if (!ua) return false;
  return /mobile|android|iphone|ipad/i.test(ua);
}

function avatarColor(email: string) {
  const colors = [
    "bg-emerald-500", "bg-blue-500", "bg-violet-500",
    "bg-orange-500", "bg-pink-500", "bg-cyan-500",
  ];
  const idx = email.charCodeAt(0) % colors.length;
  return colors[idx];
}

function initials(nome: string | null, email: string) {
  if (nome) return nome.slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

// ─── hook: registra login automaticamente ─────────────────────────────────────
// Importe e chame useRegistrarLogin() em qualquer componente que renderize
// após o usuário estar autenticado (ex: Layout.tsx ou App.tsx).

export function useRegistrarLogin() {
  useEffect(() => {
    const registrar = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Evita duplicar no mesmo tab: salva flag na sessionStorage
      const key = `login_registrado_${user.id}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");

      await supabase.from("login_logs").insert({
        user_id:    user.id,
        email:      user.email ?? "",
        nome:       user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
        evento:     "login",
        user_agent: navigator.userAgent,
        // IP e geolocalização: preencha com uma edge function se quiser precisão
        ip:         null,
        cidade:     null,
        pais:       null,
      });
    };
    registrar();
  }, []);
}

// ─── subcomponentes ────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: string | number; color: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 flex items-center gap-3">
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-lg font-bold text-foreground leading-tight">{value}</p>
      </div>
    </div>
  );
}

function UsuarioRow({ u, onExpand, expanded }: {
  u: UsuarioResumo; onExpand: () => void; expanded: boolean;
}) {
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-accent/30 transition-colors"
        onClick={onExpand}
      >
        {/* Avatar */}
        <div className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${avatarColor(u.email)}`}>
          {initials(u.nome, u.email)}
        </div>

        {/* Info principal */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{u.nome || u.email}</p>
          {u.nome && <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>}
        </div>

        {/* Último login */}
        <div className="hidden sm:flex flex-col items-end shrink-0">
          <p className="text-xs font-medium text-foreground">{tempoRelativo(u.ultimo_login)}</p>
          <p className="text-[10px] text-muted-foreground">{fmtDate(u.ultimo_login)}</p>
        </div>

        {/* Total logins */}
        <div className="hidden md:flex items-center gap-1 shrink-0">
          <LogIn className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{u.total_logins}x</span>
        </div>

        {/* Localização */}
        {(u.ultima_cidade || u.ultimo_pais) && (
          <div className="hidden lg:flex items-center gap-1 shrink-0">
            <Globe className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {[u.ultima_cidade, u.ultimo_pais].filter(Boolean).join(", ")}
            </span>
          </div>
        )}

        {/* IP */}
        {u.ultimo_ip && (
          <span className="hidden lg:block text-[10px] font-mono text-muted-foreground shrink-0 bg-muted px-2 py-0.5 rounded">
            {u.ultimo_ip}
          </span>
        )}

        <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </div>

      {/* Detalhes expandidos */}
      {expanded && (
        <div className="border-t border-border/50 px-4 py-3 bg-muted/20 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">User ID</p>
            <p className="text-[10px] font-mono text-foreground break-all">{u.user_id}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Total logins</p>
            <p className="text-sm font-bold text-emerald-400">{u.total_logins}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Último IP</p>
            <p className="text-xs font-mono text-foreground">{u.ultimo_ip || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Localização</p>
            <p className="text-xs text-foreground">{[u.ultima_cidade, u.ultimo_pais].filter(Boolean).join(", ") || "—"}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function LogRow({ log }: { log: LoginLog }) {
  const mobile = isMobile(log.user_agent);
  const isLogin = log.evento === "login";

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/20 transition-colors border-b border-border/30 last:border-0">
      {/* Evento badge */}
      <span className={`shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full border ${
        isLogin
          ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
          : "text-red-400 bg-red-500/10 border-red-500/20"
      }`}>
        {isLogin ? "LOGIN" : "LOGOUT"}
      </span>

      {/* Avatar mini */}
      <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 ${avatarColor(log.email)}`}>
        {initials(log.nome, log.email)}
      </div>

      {/* Email */}
      <span className="text-xs text-foreground truncate flex-1 min-w-0">{log.email}</span>

      {/* Dispositivo */}
      <span className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
        {mobile ? <Smartphone className="h-3 w-3" /> : <Monitor className="h-3 w-3" />}
        {mobile ? "Mobile" : "Desktop"}
      </span>

      {/* IP */}
      {log.ip && (
        <span className="hidden md:block text-[10px] font-mono text-muted-foreground shrink-0 bg-muted px-1.5 py-0.5 rounded">
          {log.ip}
        </span>
      )}

      {/* Localização */}
      {(log.cidade || log.pais) && (
        <span className="hidden lg:block text-[10px] text-muted-foreground shrink-0">
          {[log.cidade, log.pais].filter(Boolean).join(", ")}
        </span>
      )}

      {/* Data */}
      <span className="text-[10px] text-muted-foreground shrink-0 text-right">
        {tempoRelativo(log.created_at)}
      </span>
    </div>
  );
}

// ─── componente principal ─────────────────────────────────────────────────────

type Tab = "usuarios" | "historico";

export function AdminLoginPanel() {
  const [tab, setTab]           = useState<Tab>("usuarios");
  const [search, setSearch]     = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Usuários — view agregada
  const { data: usuarios = [], isLoading: loadingU, refetch: refetchU } = useQuery<UsuarioResumo[]>({
    queryKey: ["admin_usuarios_acesso"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("usuarios_ultimo_acesso")
        .select("*")
        .order("ultimo_login", { ascending: false });
      if (error) throw error;
      return (data || []) as UsuarioResumo[];
    },
    refetchInterval: 30_000,
  });

  // Histórico de logs
  const { data: logs = [], isLoading: loadingL, refetch: refetchL } = useQuery<LoginLog[]>({
    queryKey: ["admin_login_logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("login_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as LoginLog[];
    },
    refetchInterval: 15_000,
  });

  // Stats
  const totalUsuarios  = usuarios.length;
  const hoje           = new Date(); hoje.setHours(0, 0, 0, 0);
  const loginsHoje     = logs.filter((l) => l.evento === "login" && new Date(l.created_at) >= hoje).length;
  const loginsSemana   = useMemo(() => {
    const semana = new Date(Date.now() - 7 * 86400_000);
    return logs.filter((l) => l.evento === "login" && new Date(l.created_at) >= semana).length;
  }, [logs]);

  // Filtro de busca
  const usuariosFiltrados = useMemo(() =>
    usuarios.filter((u) =>
      !search ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.nome || "").toLowerCase().includes(search.toLowerCase())
    ), [usuarios, search]);

  const logsFiltrados = useMemo(() =>
    logs.filter((l) =>
      !search ||
      l.email.toLowerCase().includes(search.toLowerCase()) ||
      (l.nome || "").toLowerCase().includes(search.toLowerCase())
    ), [logs, search]);

  const isLoading = tab === "usuarios" ? loadingU : loadingL;
  const refetch   = tab === "usuarios" ? refetchU : refetchL;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Shield className="h-4 w-4 text-violet-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Painel de Acessos</h2>
            <p className="text-[10px] text-muted-foreground">Monitoramento de logins e usuários</p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 hover:bg-accent transition-colors"
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
          Atualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard icon={Users}  label="Usuários"       value={totalUsuarios} color="bg-violet-500" />
        <StatCard icon={LogIn}  label="Logins hoje"    value={loginsHoje}    color="bg-emerald-500" />
        <StatCard icon={Clock}  label="Logins 7 dias"  value={loginsSemana}  color="bg-blue-500" />
      </div>

      {/* Tabs + busca */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {(["usuarios", "historico"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-xs font-semibold px-4 py-1.5 rounded-md transition-all ${
                tab === t
                  ? "bg-card text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "usuarios" ? `👤 Usuários (${totalUsuarios})` : `📋 Histórico (${logs.length})`}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar por email ou nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs w-56 bg-card border-border rounded-lg"
          />
        </div>
      </div>

      {/* Conteúdo */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span className="text-sm">Carregando...</span>
        </div>
      ) : tab === "usuarios" ? (
        usuariosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
            <AlertCircle className="h-8 w-8 opacity-30" />
            <p className="text-sm">Nenhum usuário encontrado.</p>
            <p className="text-xs opacity-60">Os registros aparecem após o primeiro login.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {usuariosFiltrados.map((u) => (
              <UsuarioRow
                key={u.user_id}
                u={u}
                expanded={expandedId === u.user_id}
                onExpand={() => setExpandedId(expandedId === u.user_id ? null : u.user_id)}
              />
            ))}
          </div>
        )
      ) : (
        logsFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
            <AlertCircle className="h-8 w-8 opacity-30" />
            <p className="text-sm">Nenhum log encontrado.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-2 border-b border-border/40 bg-muted/30">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider w-14">Evento</span>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex-1">Usuário</span>
              <span className="hidden sm:block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Dispositivo</span>
              <span className="hidden md:block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">IP</span>
              <span className="hidden lg:block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Local</span>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Quando</span>
            </div>
            {logsFiltrados.map((log) => (
              <LogRow key={log.id} log={log} />
            ))}
          </div>
        )
      )}

      {/* Nota sobre IP */}
      <p className="text-[10px] text-muted-foreground text-center opacity-60">
        💡 IP e geolocalização ficam nulos até você configurar uma Edge Function no Supabase para capturá-los.
      </p>
    </div>
  );
}

export default AdminLoginPanel;
