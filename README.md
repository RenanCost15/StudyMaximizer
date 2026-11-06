# StudyMaximizer — React + Supabase

Aplicação React/Vite para acompanhar cronograma, conteúdo programático, questões, horas de estudo, curva de aprendizagem e gamificação. Esta versão pode sincronizar os dados entre computadores usando Supabase Auth, PostgreSQL e Realtime.

## 1. Criar a tabela segura no Supabase

1. Abra o painel do seu projeto Supabase.
2. Entre em **SQL Editor** e crie uma nova consulta.
3. Abra `supabase/schema.sql` neste projeto, copie todo o conteúdo e cole no SQL Editor.
4. Clique em **Run**.
5. Confirme em **Table Editor** que existe a tabela `public.studymaximizer_user_data`.

O SQL cria uma linha privada por usuário, ativa Row Level Security (RLS) e cria políticas que só permitem que cada conta leia ou altere a própria linha. Também inclui a tabela na publicação `supabase_realtime` para permitir atualizações em tempo real. Não é necessário criar a tabela manualmente.

## 2. Copiar a URL e a chave pública do projeto

No painel Supabase, abra **Connect** ou **Project Settings → API Keys**. Copie:

- **Project URL**;
- **Publishable key** (ou a chave pública `anon` legada, caso seja a opção disponibilizada no seu projeto).

**Não use nem compartilhe a `service_role`/secret key.** A chave publishable é destinada ao frontend; o isolamento entre usuários é imposto pelas políticas RLS no banco.

## 3. Configurar execução local (opcional)

Na raiz do projeto, copie `.env.example` para `.env.local` e substitua os valores de exemplo:

```dotenv
VITE_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_SUA_CHAVE_PUBLICA
```

Depois execute:

```bash
npm install
npm run dev
```

Como alternativa no PowerShell do Windows:

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```

O arquivo `.env.local` está ignorado pelo Git e não deve ser enviado ao repositório. O projeto continuará em modo local se as duas variáveis não estiverem configuradas.

## 4. Configurar o GitHub Pages

O site é compilado pelo GitHub Actions. Para fornecer as variáveis durante o build:

1. Abra seu repositório no GitHub.
2. Entre em **Settings → Secrets and variables → Actions → Variables**.
3. Clique em **New repository variable** e crie estas duas variáveis, com os nomes exatos:
   - `VITE_SUPABASE_URL` — valor da Project URL do Supabase;
   - `VITE_SUPABASE_PUBLISHABLE_KEY` — valor da Publishable key.
4. Em **Settings → Pages → Build and deployment → Source**, selecione **GitHub Actions**.
5. Faça commit/push dos arquivos atualizados para a branch configurada no workflow (por padrão, `main`).
6. Abra **Actions** e confirme que `Deploy StudyMaximizer to GitHub Pages` terminou com sucesso.

As variáveis `VITE_*` são incorporadas no bundle durante o build e ficam visíveis no navegador. Isso é esperado para a Project URL e a publishable key. **Nunca coloque uma chave secreta ou `service_role` em variáveis `VITE_*`.** O acesso aos registros é protegido por autenticação e RLS.

## 5. Configurar os redirecionamentos de autenticação

No Supabase, abra **Authentication → URL Configuration**:

- Configure **Site URL** para o endereço do seu site no GitHub Pages, por exemplo `https://SEU-USUARIO.github.io/SEU-REPOSITORIO/`.
- Em **Redirect URLs**, permita o mesmo endereço com `/**` ao final, e `http://localhost:5173/**` para desenvolvimento local.
- Salve as alterações.

Substitua os exemplos acima pelo endereço real do seu repositório. Se a confirmação de e-mail estiver ativa no Supabase, ao criar uma conta será necessário abrir o e-mail de confirmação antes de fazer login.

## 6. Primeiro login e migração dos dados locais

1. Abra o StudyMaximizer publicado.
2. Crie uma conta com seu e-mail e uma senha de pelo menos seis caracteres, ou entre em uma conta existente.
3. Na primeira autenticação, se a conta ainda não tiver registro na nuvem, o StudyMaximizer tenta migrar o progresso local deste navegador para a conta.
4. Espere o indicador mudar para **Sincronizado na nuvem** antes de fechar a aba.
5. Entre com a mesma conta em outro computador; o cronograma, tarefas, sessões, tópicos, meta, XP e tema serão carregados da nuvem.

Se já existir uma linha para a conta na nuvem, os dados da nuvem serão tratados como a versão principal e substituirão o estado exibido na sessão. O cache local por conta e o backup JSON são mantidos como recursos complementares. Por segurança, uma conta diferente no mesmo navegador não deve importar automaticamente o estado de outra conta.

## Como funciona a sincronização

- As mudanças ficam em cache local para manter a interface responsiva e são enviadas à nuvem automaticamente após uma pequena pausa.
- Supabase Realtime propaga atualizações para outras máquinas conectadas, sem precisar recarregar a página.
- A sincronização depende de conexão ativa com a internet. Se ficar offline, não feche a aba sem verificar que as alterações voltaram a sincronizar.
- Se duas máquinas editarem exatamente o mesmo campo ao mesmo tempo, pode haver conflito. O app combina listas de sessões e estados de conteúdo distintos, mas não substitui um sistema transacional de colaboração multiusuário. Para uso pessoal, evite editar a mesma informação simultaneamente em dois dispositivos.
- Continue usando **Exportar backup** em Configurações e fontes como cópia adicional de segurança.

## Problemas comuns

**A tela fica em “Não foi possível carregar seus dados”**: confirme se o SQL foi executado e se o nome da tabela é exatamente `studymaximizer_user_data`. O texto de erro aparece na tela de carregamento.

**O site funciona em modo local mesmo após configurar o Supabase**: confira se as duas variáveis foram salvas em **Settings → Secrets and variables → Actions → Variables**. Execute novamente o workflow após criar ou alterar variáveis; elas só são injetadas no próximo build.

**A confirmação de e-mail retorna erro de redirecionamento**: revise **Authentication → URL Configuration** e adicione a URL exata do GitHub Pages em Redirect URLs.

**O build falha**: abra **Actions**, selecione a execução vermelha e consulte o log da etapa `Build`.

## Conteúdo programático

A matriz é uma base preliminar inspirada em editais anteriores, não uma previsão de que todos os tópicos serão cobrados nos próximos concursos. Ajuste os tópicos aos futuros editais, pesos, banca e critérios eliminatórios.

- [UFRN / COMPERVE — programas de estudo técnico-administrativos](https://comperve.ufrn.br/conteudo/concursos/ufrn_202287/programas.php)
- [UFRN / COMPERVE — programas de estudo de 2025](https://comperve.ufrn.br/conteudo/concursos/ufrn_2025_22_23/programas.php)
- [CAIXA — edital de 2024](https://www.caixa.gov.br/Downloads/concurso-publico-editais/EDITAL_N_01_2024_NM_DE_22_DE_FEVEREIRO_DE_2024_.pdf)
- [Banco do Nordeste — edital de 2024](https://www.bnb.gov.br/documents/45807/5758094/Edital%2Bn%C2%BA%2B1%2B-%2BAbertura%2Bde%2Bconcurso%2Bp%C3%BAblico%2B2024.pdf)

## 7. Idioma e aparência

- O idioma inicial é inferido pelo idioma preferido do navegador (português do Brasil como padrão; inglês se o navegador estiver configurado para inglês). A seleção manual é guardada neste navegador.
- O tema começa em **Seguir sistema**, respeitando `prefers-color-scheme` e as mudanças de tema do dispositivo. É possível escolher claro ou escuro na tela de login, na tela de sincronização e nas configurações. A preferência de tema também é mantida no estado do StudyMaximizer.
- A interface e as mensagens operacionais mais importantes de autenticação, sincronização, erros e notificações têm traduções revisadas para português e inglês. O conteúdo programático continua em português para preservar a terminologia dos concursos.
- A tela de login detecta também o link de recuperação de senha do Supabase; o usuário pode definir uma nova senha e continuar para o ambiente de estudos.
- Não há chamada a uma API pública de tradução automática: isso poderia enviar textos do aplicativo a terceiros, variar as traduções de mensagens de segurança e depender de um serviço externo. Para adicionar outros idiomas com qualidade, a aplicação usa um catálogo extensível em `src/i18n.js`. Uma API de tradução pode ser integrada por uma função de servidor/Edge Function, nunca com uma chave secreta embutida no frontend estático.

## 8. Personalizar o e-mail de confirmação do Supabase

O projeto inclui um template HTML bilíngue com layout de e-mail responsivo:

- `supabase/templates/confirm-signup.html` — corpo HTML;
- `supabase/templates/confirm-signup-subject.txt` — assunto bilíngue.

Para ativar o template:

1. No painel Supabase, abra **Authentication → Email Templates → Confirm signup** (o nome pode aparecer como “Confirm sign up”).
2. No campo **Subject**, cole o conteúdo de `confirm-signup-subject.txt`.
3. No campo de corpo HTML, cole o arquivo `confirm-signup.html` completo.
4. Salve a configuração e use o recurso de teste, quando disponível, ou crie uma conta de teste para conferir a entrega, a aparência e o link.
5. Confirme em **Authentication → URL Configuration** que a URL do GitHub Pages está autorizada em `Redirect URLs`.

O template usa `{{ .ConfirmationURL }}`, variável oficial do Supabase. A mensagem apresenta português e inglês no mesmo e-mail, já que o template padrão do Supabase não seleciona automaticamente um idioma por navegador do destinatário sem implementação adicional.


### Mensagens de autenticação e privacidade

- No login, o Supabase retorna uma falha genérica para credenciais inválidas; o cliente não tenta consultar a tabela interna de usuários para descobrir se o e-mail existe. Isso evita expor a lista de contas por tentativas de login. A interface oferece cadastro e recuperação de senha como próximos passos.
- Quando o Supabase permite reconhecer uma tentativa de cadastro duplicada, o StudyMaximizer informa que o e-mail já está associado a uma conta e oferece as ações de reenviar confirmação e redefinir a senha. O estado de confirmação não é inferido por uma consulta administrativa no navegador. Se o login retornar explicitamente `email_not_confirmed`, a mensagem informa que a confirmação está pendente.
- Para manter as mensagens de autenticação precisas e consistentes, português e inglês usam um catálogo de traduções revisado em `src/i18n.js`. Uma API de tradução automática não é chamada diretamente do navegador: isso pode expor textos do aplicativo, criar dependência de terceiros e traduzir incorretamente mensagens de segurança. Idiomas adicionais podem ser adicionados ao catálogo; uma API de tradução opcional deve ser chamada por uma Edge Function com credenciais mantidas no servidor.
