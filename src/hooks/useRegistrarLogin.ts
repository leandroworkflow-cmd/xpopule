// hooks/useRegistrarLogin.ts
// ─────────────────────────────────────────────────────────────────────────────
// Substitui o hook anterior do AdminLoginPanel.tsx
// Chama a Edge Function que captura IP real + geolocalização
//
// Como usar: importe e chame em App.tsx ou Layout.tsx (após auth estar pronto)
//
//   import { useRegistrarLogin } from "@/hooks/useRegistrarLogin";
//   function Layout() {
//     useRegistrarLogin();
//     return <Outlet />;
//   }
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useRegistrarLogin() {
  useEffect(() => {
    const registrar = async () => {
      // Pega sessão atual
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Evita duplicar no mesmo tab (sessionStorage sobrevive a re-renders)
      const key = `login_edge_${session.user.id}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");

      try {
        const { error } = await supabase.functions.invoke("registrar-login", {
          body: {
            evento: "login",
            nome:
              session.user.user_metadata?.full_name ||
              session.user.user_metadata?.name ||
              null,
          },
        });

        if (error) {
          console.warn("[useRegistrarLogin] Edge Function error:", error);
        }
      } catch (err) {
        // Não bloqueia a navegação se falhar
        console.warn("[useRegistrarLogin] Falha silenciosa:", err);
      }
    };

    registrar();
  }, []);
}

// ─────────────────────────────────────────────────────────────────────────────
// Opcional: registrar logout explícito
// Chame registrarLogout() no botão de sair antes do supabase.auth.signOut()
//
//   import { registrarLogout } from "@/hooks/useRegistrarLogin";
//   async function handleSair() {
//     await registrarLogout();
//     await supabase.auth.signOut();
//   }
// ─────────────────────────────────────────────────────────────────────────────

export async function registrarLogout() {
  try {
    await supabase.functions.invoke("registrar-login", {
      body: { evento: "logout" },
    });
  } catch {
    // silencioso
  }
}
