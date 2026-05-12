import {
  AuthNotebookShell,
  AuthPanelHeader,
  AuthStickerLink
} from "@/components/layout/AuthNotebookShell";
import { PaperCard } from "@/components/ui/PaperCard";

const helpItems = [
  {
    title: "Nao consigo entrar",
    description:
      "Confira se o backend do Gelu - Menu esta rodando em http://localhost:8080/api/v1. Se aparecer falha de fetch, a API pode estar desligada ou outra aplicacao pode estar usando a porta 8080."
  },
  {
    title: "Esqueci minha senha",
    description:
      "Use a recuperacao de senha. Em ambiente local, o token de desenvolvimento aparece na tela quando o backend estiver configurado para expor o token."
  },
  {
    title: "Fui jogado para fora da area interna",
    description:
      "Isso acontece quando a sessao local expirou ou o backend rejeitou o token. Entre novamente para criar uma sessao nova."
  }
];

export default function AccessHelpPage() {
  return (
    <AuthNotebookShell featureLabel="Ajuda da cozinha">
      <AuthPanelHeader
        eyebrow="Ajuda de acesso"
        title="Vamos destravar sua entrada"
        subtitle="Algumas verificacoes rapidas resolvem a maior parte dos problemas de login local."
      />

      <div className="mt-6 space-y-4">
        {helpItems.map((item) => (
          <PaperCard className="bg-surface-container-lowest p-4" key={item.title} tape="none">
            <h2 className="font-display text-2xl font-bold text-tertiary">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">{item.description}</p>
          </PaperCard>
        ))}
      </div>

      <div className="mt-7">
        <AuthStickerLink href="/login">Voltar ao Login</AuthStickerLink>
      </div>
    </AuthNotebookShell>
  );
}
