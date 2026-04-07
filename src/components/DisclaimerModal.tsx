import { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const STORAGE_KEY = "mercadox_disclaimer_accepted";

export function DisclaimerModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setOpen(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="items-center text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-warning/20">
            <AlertTriangle className="h-6 w-6 text-warning" />
          </div>
          <DialogTitle className="text-xl">Aviso Importante: Mercado X</DialogTitle>
          <DialogDescription className="pt-3 space-y-3 text-sm text-muted-foreground">
            <span className="block">
              O Mercado X é um marketplace de previsões e contratos de eventos. Não somos uma casa de apostas tradicional.
            </span>
            <span className="block font-semibold text-foreground">
              Este site é destinado exclusivamente para maiores de 21 anos.
            </span>
          </DialogDescription>
        </DialogHeader>
        <Button size="lg" className="w-full mt-2" onClick={handleAccept}>
          Tenho mais de 21 anos e desejo continuar
        </Button>
      </DialogContent>
    </Dialog>
  );
}
