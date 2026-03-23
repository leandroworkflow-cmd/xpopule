import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes("type=recovery")) {
      toast.error("Link de recuperação inválido.");
      navigate("/login");
    }
  }, [navigate]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { toast.error("As senhas não conferem."); return; }
    if (password.length < 6) { toast.error("Mínimo 6 caracteres."); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Senha atualizada com sucesso!");
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md bg-card border-border">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-primary flex items-center justify-center mb-2">
            <TrendingUp className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-foreground text-2xl">Nova Senha</CardTitle>
          <CardDescription className="text-muted-foreground">Defina sua nova senha</CardDescription>
        </CardHeader>
        <form onSubmit={handleReset}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground">Nova Senha</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-background border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Confirmar Nova Senha</Label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="bg-background border-border" />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="animate-spin" />}
              Redefinir Senha
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
