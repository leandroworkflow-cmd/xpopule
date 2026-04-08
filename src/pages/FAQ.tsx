import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    q: "O que é o Mercado X?",
    a: "O Mercado X é um marketplace de previsões onde você compra contratos baseados em eventos do mundo real. Se sua previsão estiver correta, você recebe R$ 100,00 por contrato.",
  },
  {
    q: "Como funciona a compra de contratos?",
    a: "Escolha um mercado, selecione SIM ou NÃO, defina o valor do investimento e finalize o pagamento via PIX ou cartão. Os contratos são creditados automaticamente na sua carteira.",
  },
  {
    q: "Qual o valor mínimo para participar?",
    a: "O valor mínimo de investimento é R$ 1,00 por operação.",
  },
  {
    q: "Como recebo meus lucros?",
    a: "Quando um mercado é resolvido e sua previsão estava correta, o valor é creditado no seu saldo. Você pode solicitar a retirada via PIX a qualquer momento na página da Carteira.",
  },
  {
    q: "O que acontece se o evento for cancelado?",
    a: "Se um evento for cancelado ou não puder ser resolvido, todos os contratos são reembolsados integralmente aos participantes.",
  },
  {
    q: "Quais métodos de pagamento são aceitos?",
    a: "Aceitamos PIX (processamento instantâneo) e cartões de crédito/débito (Visa, Mastercard) via Stripe, uma plataforma de pagamentos segura e certificada.",
  },
  {
    q: "Como funciona a taxa de negociação?",
    a: "Cobramos uma taxa de 1% sobre o valor do investimento. Essa taxa é mostrada de forma transparente antes de você confirmar a compra.",
  },
  {
    q: "Meus dados estão seguros?",
    a: "Sim. Utilizamos criptografia SSL em todas as conexões e os pagamentos são processados pela Stripe, que possui certificação PCI DSS nível 1, o mais alto padrão de segurança do setor.",
  },
];

const FAQ = () => {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <HelpCircle className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Central de Ajuda</h1>
          <p className="text-sm text-muted-foreground">Perguntas frequentes sobre o Mercado X</p>
        </div>
      </div>

      <Accordion type="single" collapsible className="space-y-2">
        {faqs.map((faq, i) => (
          <AccordionItem
            key={i}
            value={`faq-${i}`}
            className="gradient-card rounded-xl border border-border/50 px-4 overflow-hidden"
          >
            <AccordionTrigger className="text-sm font-semibold text-foreground hover:text-primary py-4">
              {faq.q}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground pb-4 leading-relaxed">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default FAQ;
