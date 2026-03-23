import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, CheckCircle, Pencil, Users, BarChart3, Activity, Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type MarketRow = Tables<"markets">;

const categories = [
  { value: "economia", label: "Economia" },
  { value: "politica", label: "Política" },
  { value: "entretenimento", label: "Entretenimento" },
  { value: "clima", label: "Clima" },
  { value: "esportes", label: "Esportes" },
];

export default function Admin() {
  const { isAdmin, loading: authLoading, user } = useAuth();
  const navigate = useNavigate();
  const [markets, setMarkets] = useState<MarketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showResolve, setShowResolve] = useState<MarketRow | null>(null);
  const [showEdit, setShowEdit] = useState<MarketRow | null>(null);
  const [metrics, setMetrics] = useState({ users: 0, volume: 0, active: 0 });
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({ title: "", category: "economia", yes_price: 50, no_price: 50, end_date: "", resolution_rule: "" });

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      toast.error("Acesso restrito a administradores.");
      navigate("/");
    }
  }, [authLoading, isAdmin, navigate]);

  const fetchData = async () => {
    const [mRes, pRes] = await Promise.all([
      supabase.from("markets").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
    ]);
    const mkts = mRes.data || [];
    setMarkets(mkts);
    setMetrics({
      users: pRes.count || 0,
      volume: mkts.reduce((s, m) => s + m.volume, 0),
      active: mkts.filter((m) => m.status === "active").length,
    });
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin]);

  const handleCreate = async () => {
    if (!form.title || !form.end_date) { toast.error("Preencha título e data."); return; }
    setSaving(true);
    const { error } = await supabase.from("markets").insert({
      title: form.title,
      category: form.category,
      yes_price: form.yes_price,
      no_price: form.no_price,
      end_date: form.end_date,
      resolution_rule: form.resolution_rule,
      created_by: user?.id,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Mercado criado!");
    setShowCreate(false);
    setForm({ title: "", category: "economia", yes_price: 50, no_price: 50, end_date: "", resolution_rule: "" });
    fetchData();
  };

  const handleEdit = async () => {
    if (!showEdit) return;
    setSaving(true);
    const { error } = await supabase.from("markets").update({
      title: form.title,
      category: form.category,
      yes_price: form.yes_price,
      no_price: form.no_price,
      end_date: form.end_date,
      resolution_rule: form.resolution_rule,
    }).eq("id", showEdit.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Mercado atualizado!");
    setShowEdit(null);
    fetchData();
  };

  const handleResolve = async (result: "resolved_yes" | "resolved_no") => {
    if (!showResolve) return;
    setSaving(true);
    const { error } = await supabase.from("markets").update({ status: result }).eq("id", showResolve.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Mercado resolvido como ${result === "resolved_yes" ? "SIM" : "NÃO"}!`);
    setShowResolve(null);
    fetchData();
  };

  const openEdit = (m: MarketRow) => {
    setForm({ title: m.title, category: m.category, yes_price: m.yes_price, no_price: m.no_price, end_date: m.end_date, resolution_rule: m.resolution_rule });
    setShowEdit(m);
  };

  if (authLoading || loading) return <div className="flex items-center justify-center h-64 text-muted-foreground"><Loader2 className="animate-spin h-6 w-6" /></div>;
  if (!isAdmin) return null;

  const statusLabel: Record<string, string> = { active: "Ativo", resolved_yes: "Sim ✅", resolved_no: "Não ❌", cancelled: "Cancelado" };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Painel Admin</h1>
          <p className="text-sm text-muted-foreground">Gerencie mercados e visualize métricas.</p>
        </div>
        <Button onClick={() => { setForm({ title: "", category: "economia", yes_price: 50, no_price: 50, end_date: "", resolution_rule: "" }); setShowCreate(true); }}>
          <Plus /> Criar Mercado
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="gradient-card rounded-xl border border-border p-4 flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <div><div className="text-xs text-muted-foreground">Total de Usuários</div><div className="text-xl font-bold text-foreground">{metrics.users}</div></div>
        </div>
        <div className="gradient-card rounded-xl border border-border p-4 flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          <div><div className="text-xs text-muted-foreground">Volume Total</div><div className="text-xl font-bold text-foreground">{(metrics.volume / 1000).toFixed(0)}k</div></div>
        </div>
        <div className="gradient-card rounded-xl border border-border p-4 flex items-center gap-3">
          <Activity className="h-8 w-8 text-primary" />
          <div><div className="text-xs text-muted-foreground">Mercados Ativos</div><div className="text-xl font-bold text-foreground">{metrics.active}</div></div>
        </div>
      </div>

      {/* Markets Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-accent/30">
              <TableHead>Título</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Sim/Não</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {markets.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium text-foreground max-w-[250px] truncate">{m.title}</TableCell>
                <TableCell><Badge variant="secondary">{m.category}</Badge></TableCell>
                <TableCell className="text-sm"><span className="text-success">{m.yes_price}¢</span> / <span className="text-danger">{m.no_price}¢</span></TableCell>
                <TableCell><Badge variant={m.status === "active" ? "default" : "secondary"}>{statusLabel[m.status] || m.status}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(m)} disabled={m.status !== "active"}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="outline" onClick={() => setShowResolve(m)} disabled={m.status !== "active"}>
                      <CheckCircle className="h-4 w-4" /> Resolver
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={showCreate || !!showEdit} onOpenChange={() => { setShowCreate(false); setShowEdit(null); }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">{showEdit ? "Editar Mercado" : "Criar Novo Mercado"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground">Título (Pergunta)</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-background border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Categoria</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">Preço Sim (¢)</Label>
                <Input type="number" min="1" max="99" value={form.yes_price} onChange={(e) => { const v = Number(e.target.value); setForm({ ...form, yes_price: v, no_price: 100 - v }); }} className="bg-background border-border" />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Preço Não (¢)</Label>
                <Input type="number" value={form.no_price} disabled className="bg-background border-border opacity-60" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Data de Encerramento</Label>
              <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="bg-background border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Regras de Resolução</Label>
              <Textarea value={form.resolution_rule} onChange={(e) => setForm({ ...form, resolution_rule: e.target.value })} className="bg-background border-border" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={showEdit ? handleEdit : handleCreate} disabled={saving}>
              {saving && <Loader2 className="animate-spin" />}
              {showEdit ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Modal */}
      <Dialog open={!!showResolve} onOpenChange={() => setShowResolve(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Resolver Mercado</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-2">{showResolve?.title}</p>
          <p className="text-sm text-foreground mb-4">Qual foi o resultado final?</p>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="success" className="h-14 text-lg" onClick={() => handleResolve("resolved_yes")} disabled={saving}>
              {saving && <Loader2 className="animate-spin" />} SIM ✅
            </Button>
            <Button variant="danger" className="h-14 text-lg" onClick={() => handleResolve("resolved_no")} disabled={saving}>
              {saving && <Loader2 className="animate-spin" />} NÃO ❌
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
