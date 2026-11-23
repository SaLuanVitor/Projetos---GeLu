# 🎨 Guia Oficial de Design System, Usabilidade, Segurança e Auditoria — GeLu Menu

## 1. Visão Geral e Princípios

O **GeLu Menu** segue uma metáfora visual de **caderno artesanal / livro de receitas e rotinas familiar** (estética calorosa, tons de papel, bege, laranja terra-cota, verde oliva e anotações desenhadas), combinada com **engenharia de software moderna, alta usabilidade, contraste acessível e robustez transacional**.

### Princípios Norteadores:
1. **Acolhimento com Clareza:** A estética de papel não pode comprometer o contraste, a legibilidade ou a hierarquia das informações.
2. **Foco e Exclusividade de Ação:** O usuário nunca deve ser exposto a múltiplos formulários abertos simultaneamente na mesma visualização. Uma ação de cada vez.
3. **Segurança por Padrão:** Nenhuma ação destrutiva (excluir família, remover membro, excluir receita, excluir atividade, arquivar recado) pode ser executada sem confirmação explícita.
4. **Transparência e Rastreabilidade (Auditoria):** Toda alteração relevante no ambiente compartilhado da família deve ser auditada (quem, quando, o que mudou).

---

## 2. Padrões de Design System e Componentes Base

### 2.1. Modais e Diálogos de Sobreposição (`Modal.tsx`)
- **Portal Obrigatório:** Todos os modais devem utilizar React Portal (`createPortal(..., document.body)`).
- **Stacking Context Isolado:** Nunca posicione modais diretamente dentro de tags `<main>` ou containers com regras de `position: relative; z-index: 2` (para evitar que o `<footer>` ou outros elementos irmãos fiquem sobrepostos ao modal).
- **Camada Z:** Todos os modais usam `z-[100]`.
- **Acessibilidade:** Suporte nativo à tecla `ESC`, clique no backdrop para fechar, bloqueio do scroll do body (`overflow: hidden`) enquanto aberto, e foco contido.

### 2.2. Confirmação de Ações Destrutivas (`ConfirmDialog.tsx`)
- **Regra:** Todo botão de exclusão, remoção ou reset deve abrir um `ConfirmDialog`.
- **Estrutura:**
  - **Ícone:** Alerta contextual em amarelo ou vermelho suave.
  - **Título:** Pergunta explícita com o nome do item a ser excluído (ex: *Excluir Família "GeLu"?*).
  - **Mensagem:** Texto explicativo avisando claramente se a ação é irreversível.
  - **Botões:** "Cancelar" (neutro) à esquerda e "Excluir" (destrutivo/vermelho com spinner durante a requisição).

### 2.3. Formulários e Inputs (`FormField.tsx`)
- **Contraste WCAG AA:** Os inputs devem possuir fundo nítido (`bg-white/95`), borda bem definida (`border-stone-300`) e foco com anel suave (`focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20`).
- **Separação Rótulo x Dica x Exemplo:**
  - `label`: Fica **acima** do campo, em caixa alta suave, peso semi-bold e cor nítida (`text-xs font-bold uppercase tracking-wider text-stone-700`).
  - `placeholder`: Utilizado exclusivamente como exemplo de preenchimento (`placeholder:text-stone-400`), nunca como substituto do rótulo.
  - `hint`: Dica opcional abaixo do campo em cinza médio.
  - `error`: Mensagem de validação em vermelho vivo abaixo do campo.
- **Layout Flex / Grid:** O container do campo (`FormField`) recebe a prop `containerClassName` (ex: `flex-1`, `w-full`), permitindo que inputs em linha expandam adequadamente sem colapsar a largura.

### 2.4. Feedback ao Usuário (`Toast.tsx`)
- Notificações globais através do hook `useToast()`:
  - `toast.success("Mensagem")`: Verde esmeralda para confirmações de sucesso.
  - `toast.error("Mensagem")`: Vermelho para falhas e mensagens amigáveis de API.
  - `toast.warning("Mensagem")`: Âmbar para avisos e confirmações pendentes.
  - `toast.info("Mensagem")`: Informações gerais.
- Duração padrão de 4 segundos com encerramento suave e botão de dispensar manual.

---

## 3. Padrões de Usabilidade (UX) e Prevenção de Sobrecarga

1. **Ações Mutuamente Exclusivas:**
   - Telas administrativas (como `/familia`) devem utilizar **Modais focados** para criação de registros e inserção de membros, em vez de formulários inline que se acumulam e poluem a página.
2. **Feedback Imediato:**
   - Botões de submissão entram imediatamente em estado de carregamento (`disabled` + texto explicativo ou spinner).
3. **Empty States Ilustrados:**
   - Telas ou listas vazias devem exibir um ícone ilustrado, título acolhedor, descrição curta e um botão de ação primária destacado (Call to Action).

---

## 4. Arquitetura de Auditoria (`audit_logs`)

### 4.1. Estrutura do Banco de Dados (`V009__create_audit_logs_table.sql`)
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    family_id UUID,
    action VARCHAR(50) NOT NULL,
    user_id UUID NOT NULL,
    user_name VARCHAR(150) NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    CONSTRAINT fk_audit_family FOREIGN KEY (family_id) REFERENCES families (id) ON DELETE CASCADE
);
```

### 4.2. Ações Rastreadas (`AuditAction`)
- `CREATE`: Criação de família, membro, atividade de agenda, receita ou recado.
- `UPDATE`: Alteração de nome, descrição ou configurações.
- `DELETE`: Exclusão de família, membro, receita ou atividade.
- `ROLE_CHANGE`: Alteração de papel do membro (`ADMIN`, `MEMBER`, `VIEWER`).
- `ACKNOWLEDGE`: Confirmações de visualização ("Visto com ❤️").

### 4.3. Como Consumir na UI
- Toda tela familiar possui o botão **"📜 Histórico"**, abrindo um modal com a linha do tempo completa de ações, identificando quem realizou, a hora e o resumo da alteração.

---

## 5. Diretrizes para Futuras Sprints (Roadmap)

Qualquer nova funcionalidade deve obrigatoriamente cumprir o checklist antes do merge/deploy:

- [ ] **Modais e Drawers:** Usam o componente `Modal` com React Portal e `z-[100]`.
- [ ] **Ações Destrutivas:** Usam `ConfirmDialog` com descrição detalhada do impacto.
- [ ] **Inputs:** Utilizam `TextInput` / `FormField` com label no topo e contraste AA.
- [ ] **Feedback:** Chamam `toast.success` ou `toast.error` após cada mutação.
- [ ] **Auditoria:** Chamam `auditLogService.log(...)` para qualquer criação, edição ou exclusão no backend.
- [ ] **Internacionalização:** Todas as mensagens passam pelos dicionários `pt-BR.json` e `en.json`.
