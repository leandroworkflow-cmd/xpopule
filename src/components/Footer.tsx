import { Link } from "react-router-dom";
import { Shield, Lock, CreditCard, HelpCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/30 backdrop-blur-sm mt-8">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Payment & Security badges */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full">
            <Lock className="h-3.5 w-3.5 text-success" />
            Conexão Segura SSL
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full">
            <CreditCard className="h-3.5 w-3.5" />
            PIX
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full">
            <CreditCard className="h-3.5 w-3.5" />
            Visa / Mastercard
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full">
            <Shield className="h-3.5 w-3.5 text-primary" />
            Stripe Checkout
          </div>
        </div>

        {/* Links */}
        <div className="flex flex-wrap items-center justify-center gap-6 mb-6 text-xs text-muted-foreground">
          <Link to="/faq" className="hover:text-primary transition-colors flex items-center gap-1">
            <HelpCircle className="h-3.5 w-3.5" />
            Central de Ajuda
          </Link>
          <span>•</span>
          <span>Termos de Uso</span>
          <span>•</span>
          <span>Política de Privacidade</span>
        </div>

        {/* Copyright */}
        <p className="text-center text-[11px] text-muted-foreground/60">
          © {new Date().getFullYear()} Mercado X — Marketplace de previsões e contratos de eventos.
          <br />
          Este site é destinado exclusivamente para maiores de 18 anos.
        </p>
      </div>
    </footer>
  );
}
