export const TRACKS = [
  {
    id: 'admin', label: 'Apoio técnico-administrativo · Administrativo', short: 'Administrativo',
    institution: 'Universidades e órgãos federais', icon: 'Building2', color: 'blue',
    description: 'Rotinas administrativas, Administração Pública, legislação e atendimento.'
  },
  {
    id: 'tae-ti', label: 'Apoio técnico-administrativo · Técnico de TI', short: 'Técnico de TI',
    institution: 'Instituições federais de ensino', icon: 'Code2', color: 'violet',
    description: 'Base comum de concursos federais e aprofundamento técnico em TI.'
  },
  {
    id: 'caixa', label: 'Técnico Bancário Novo · CAIXA', short: 'CAIXA · TBN',
    institution: 'CAIXA Econômica Federal', icon: 'Landmark', color: 'green',
    description: 'Conhecimentos bancários, matemática financeira, ética e atendimento.'
  },
  {
    id: 'caixa-ti', label: 'Técnico Bancário Novo · Tecnologia da Informação', short: 'CAIXA · TBN-TI',
    institution: 'CAIXA Econômica Federal', icon: 'Database', color: 'violet',
    description: 'Base bancária e conteúdos aprofundados de Tecnologia da Informação.'
  },
  {
    id: 'bnb', label: 'Analista Bancário 1 · Banco do Nordeste', short: 'BNB · Analista',
    institution: 'Banco do Nordeste do Brasil', icon: 'Banknote', color: 'amber',
    description: 'Matemática/Raciocínio Lógico e forte ênfase em Conhecimentos Bancários.'
  },
];

export const TRACK_GROUPS = [
  { id: 'administrativo', label: 'Área administrativa', tracks: ['admin'] },
  { id: 'ti', label: 'Área de tecnologia', tracks: ['tae-ti', 'caixa-ti'] },
  { id: 'bancaria', label: 'Área bancária', tracks: ['caixa', 'caixa-ti', 'bnb'] },
];

export const SUBJECTS = [
  {
    id: 'portugues', title: 'Língua Portuguesa', category: 'Base comum', icon: 'BookOpenText', color: 'blue',
    tracks: ['admin', 'tae-ti', 'caixa', 'caixa-ti', 'bnb'], priority: 'Máxima', estimate: '6 h/semana',
    description: 'Prioridade central do plano: compreensão, gramática aplicada e resolução de questões.',
    groups: [
      { title: '01 · Compreensão e interpretação de textos', items: [
        'Identificação do tema, assunto e ideia central', 'Localização de informações explícitas', 'Inferências e informações implícitas', 'Tese, ponto de vista e intenção comunicativa do autor', 'Finalidade do texto e perfil do público-alvo', 'Fato, opinião, pressuposto e subentendido', 'Argumentos, evidências, exemplos e contra-argumentos', 'Relação entre linguagem verbal, imagens, gráficos e tabelas', 'Interpretação de textos informativos, opinativos, publicitários e institucionais', 'Leitura atenta de enunciados e identificação do comando da questão'
      ]},
      { title: '02 · Tipologia, gêneros e organização textual', items: [
        'Tipos textuais: narração, descrição, exposição, argumentação e injunção', 'Gêneros textuais e suas funções sociais', 'Estrutura de introdução, desenvolvimento e conclusão', 'Organização temática e progressão das ideias', 'Sequências textuais predominantes e combinação de tipos', 'Discurso direto, indireto e indireto livre', 'Intertextualidade, citação, alusão e paráfrase', 'Recursos persuasivos e escolhas lexicais', 'Textos multimodais e linguagem não verbal'
      ]},
      { title: '03 · Coesão, coerência e articulação de ideias', items: [
        'Coerência global e compatibilidade entre ideias', 'Coesão referencial: anáfora, catáfora e retomadas', 'Pronomes e expressões que retomam termos anteriores', 'Substituição, elipse, repetição e paralelismo', 'Conectores de adição, oposição, causa, consequência e conclusão', 'Relações de condição, concessão, finalidade, comparação e conformidade', 'Sequenciação temporal e lógica dos parágrafos', 'Ambiguidade, contradição, redundância e quebra de progressão'
      ]},
      { title: '04 · Semântica e efeitos de sentido', items: [
        'Sinônimos, antônimos, homônimos e parônimos', 'Denotação e conotação', 'Polissemia e significado contextual', 'Sentido literal, figurado e expressões idiomáticas', 'Sentido de palavras e expressões no contexto', 'Figuras de linguagem mais recorrentes', 'Ambiguidade lexical e estrutural', 'Reescrita sem alteração de sentido', 'Adequação vocabular, precisão e concisão'
      ]},
      { title: '05 · Ortografia, acentuação e hífen', items: [
        'Emprego de letras e grafias de uso frequente', 'Uso de s, z, x, ch, g e j em vocábulos comuns', 'Acentuação de oxítonas, paroxítonas e proparoxítonas', 'Acentuação de hiatos, ditongos e verbos', 'Acentos diferenciais e casos específicos', 'Emprego do hífen em prefixos e palavras compostas', 'Novo Acordo Ortográfico', 'Divisão silábica e identificação da sílaba tônica'
      ]},
      { title: '06 · Morfologia e classes de palavras', items: [
        'Substantivo, adjetivo, artigo e numeral', 'Pronomes pessoais, possessivos, demonstrativos, relativos e indefinidos', 'Verbos: tempos, modos, vozes e formas nominais', 'Advérbios e locuções adverbiais', 'Preposições e relações de sentido', 'Conjunções coordenativas e subordinativas', 'Interjeições e palavras denotativas', 'Flexão nominal e verbal', 'Radicais, prefixos, sufixos e processos de formação de palavras', 'Emprego das classes gramaticais no contexto'
      ]},
      { title: '07 · Sintaxe da oração e do período', items: [
        'Frase, oração e período simples ou composto', 'Sujeito: tipos, identificação e casos de sujeito inexistente', 'Predicado verbal, nominal e verbo-nominal', 'Verbos de ligação, transitividade e predicação verbal', 'Objeto direto, objeto indireto, complemento nominal e agente da passiva', 'Adjunto adnominal, adjunto adverbial, aposto e vocativo', 'Orações coordenadas: assindéticas e sindéticas', 'Orações subordinadas substantivas, adjetivas e adverbiais', 'Valores semânticos das orações e das conjunções', 'Paralelismo sintático e correção de estruturas'
      ]},
      { title: '08 · Concordância, regência, crase e colocação pronominal', items: [
        'Concordância verbal com sujeito simples, composto e casos especiais', 'Concordância nominal e expressões de concordância', 'Regência verbal e sentidos que alteram a regência', 'Regência nominal e preposições exigidas', 'Crase: condições de ocorrência e casos proibidos', 'Crase facultativa e casos especiais', 'Próclise, mesóclise e ênclise', 'Fatores de atração do pronome átono', 'Colocação pronominal em locuções verbais'
      ]},
      { title: '09 · Pontuação e reescrita', items: [
        'Uso da vírgula em enumerações e intercalações', 'Vírgula entre orações e em adjuntos deslocados', 'Proibição de separar sujeito e predicado por vírgula', 'Ponto e vírgula, dois-pontos, travessão e parênteses', 'Pontuação de orações explicativas e restritivas', 'Relação entre pontuação e sentido', 'Substituição de palavras e expressões', 'Reordenação de termos, orações e parágrafos', 'Correção gramatical e manutenção do sentido original'
      ]},
      { title: '10 · Redação oficial e comunicação objetiva', tracks: ['admin', 'caixa', 'caixa-ti'], items: [
        'Características da redação oficial: clareza, precisão, objetividade e concisão', 'Impessoalidade, formalidade e padronização', 'Adequação da linguagem ao destinatário e à finalidade', 'Estrutura básica de comunicações formais', 'Pronomes de tratamento e vocativos conforme a situação', 'Manual de Redação da Presidência da República: consulta e aplicação', 'E-mails profissionais, comunicados e textos administrativos', 'Revisão de ambiguidade, prolixidade e inadequações de registro'
      ]},
    ]
  },
  {
    id: 'matematica-logica', title: 'Matemática básica e Raciocínio Lógico', category: 'Base de apoio', icon: 'Workflow', color: 'teal',
    tracks: ['admin', 'tae-ti', 'caixa', 'caixa-ti', 'bnb'], priority: 'Alta', estimate: '2 h/semana + revisões',
    description: 'A base matemática será aprofundada conforme o programa e a banca de cada edital.',
    groups: [
      { title: '01 · Aritmética e conjuntos numéricos', items: [
        'Números naturais, inteiros, racionais, irracionais e reais', 'Operações fundamentais e prioridade de operações', 'Frações: equivalência, simplificação e operações', 'Números decimais e conversões fração-decimal', 'Potenciação, propriedades de potências e radiciação', 'Múltiplos, divisores, números primos, MDC e MMC', 'Expressões numéricas e problemas aritméticos', 'Unidades de medida, conversões e escalas'
      ]},
      { title: '02 · Razão, proporção e porcentagem', items: [
        'Razão entre grandezas e interpretação de proporções', 'Proporcionalidade direta e inversa', 'Regra de três simples e composta', 'Divisão em partes proporcionais', 'Porcentagem: cálculo direto, aumento e desconto', 'Variações percentuais sucessivas', 'Acréscimos e reduções sobre bases diferentes', 'Médias aritmética, ponderada e geométrica', 'Problemas com tabelas, indicadores e taxas'
      ]},
      { title: '03 · Álgebra, equações e funções', items: [
        'Expressões algébricas, produtos notáveis e fatoração', 'Equações e inequações de primeiro grau', 'Equações e inequações de segundo grau', 'Sistemas de equações lineares', 'Funções: domínio, imagem, gráfico e interpretação', 'Função afim e função quadrática', 'Noções de função exponencial e logarítmica', 'Sequências numéricas e padrões', 'Problemas algébricos contextualizados'
      ]},
      { title: '04 · Lógica proposicional', items: [
        'Proposição simples e composta', 'Conectivos: negação, conjunção, disjunção, condicional e bicondicional', 'Tabelas-verdade e número de linhas', 'Negação de proposições simples e compostas', 'Equivalências lógicas e leis de De Morgan', 'Tautologia, contradição e contingência', 'Condição necessária e condição suficiente', 'Argumentos, premissas, conclusão e validade', 'Diagramas lógicos e interpretação de enunciados', 'Quantificadores e negação de proposições quantificadas quando previstos'
      ]},
      { title: '05 · Conjuntos, contagem e probabilidade', items: [
        'Representação de conjuntos e relação de pertinência', 'União, interseção, diferença e complementar', 'Diagramas de Venn e problemas de inclusão', 'Princípio fundamental da contagem', 'Permutações simples e com repetição', 'Arranjos e combinações', 'Espaço amostral e eventos', 'Probabilidade simples, complementar e união de eventos', 'Probabilidade condicional e independência, quando previstas'
      ]},
      { title: '06 · Estatística descritiva e gráficos', items: [
        'Leitura de tabelas simples e de dupla entrada', 'Interpretação de gráficos de barras, linhas e setores', 'Média, mediana e moda', 'Amplitude, variância e desvio-padrão', 'Frequência absoluta, relativa e acumulada', 'Distribuição de dados e comparação de conjuntos', 'Noções de amostragem e interpretação de indicadores', 'Cuidados com escalas e conclusões indevidas em gráficos'
      ]},
      { title: '07 · Geometria essencial, se prevista', items: [
        'Perímetro e área de figuras planas usuais', 'Ângulos, triângulos e relações básicas', 'Área e volume de sólidos mais comuns', 'Teorema de Pitágoras e aplicações', 'Escalas, mapas e proporcionalidade geométrica'
      ]},
    ]
  },
  {
    id: 'mat-fin-estatistica', title: 'Matemática Financeira e Estatística', category: 'Área bancária', icon: 'Calculator', color: 'teal',
    tracks: ['caixa', 'caixa-ti', 'bnb'], priority: 'Alta', estimate: '1 h/semana + questões',
    description: 'Tópicos com presença em concursos bancários; peso e profundidade dependem do edital.',
    groups: [
      { title: '01 · Fundamentos financeiros', items: [
        'Capital, juros, montante, prazo e taxa', 'Valor do dinheiro no tempo', 'Taxas percentuais e conversão de períodos', 'Valor presente e valor futuro', 'Fluxos de caixa e representação de operações', 'Taxas nominais, efetivas, proporcionais e equivalentes'
      ]},
      { title: '02 · Juros simples e compostos', items: [
        'Cálculo de juros simples e montante', 'Cálculo de juros compostos e montante', 'Capitalização e descapitalização', 'Comparação entre regime simples e composto', 'Taxas equivalentes em períodos diferentes', 'Taxa real, taxa aparente e inflação', 'Descontos simples e compostos', 'Resolução de problemas com tempo fracionário'
      ]},
      { title: '03 · Descontos, séries e amortização', items: [
        'Desconto comercial e racional, quando previstos', 'Desconto simples e composto', 'Sistemas de amortização: SAC e Price', 'Tabela de evolução de saldo devedor', 'Parcelas, juros e amortização', 'Custo efetivo de empréstimos e financiamentos', 'Valor atual de uma série uniforme', 'Taxa interna de retorno: interpretação básica, quando prevista'
      ]},
      { title: '04 · Estatística e probabilidade aplicada', items: [
        'Média, mediana, moda e medidas de dispersão', 'Leitura de gráficos e tabelas financeiras', 'Probabilidade simples e eventos complementares', 'Princípios de contagem aplicados a problemas', 'Interpretação de risco e frequência de eventos', 'Noções de distribuição de dados e amostragem'
      ]},
      { title: '05 · Revisão operacional', items: [
        'Identificar os dados e a incógnita do problema', 'Escolher fórmula e unidade de tempo corretas', 'Conferir se a taxa está compatível com o prazo', 'Utilizar calculadora sem substituir o raciocínio', 'Resolver questões cronometradas e classificar erros'
      ]},
    ]
  },
  {
    id: 'legislacao', title: 'Legislação e Administração Pública', category: 'Área administrativa', icon: 'Scale', color: 'blue',
    tracks: ['admin', 'tae-ti'], priority: 'Alta', estimate: '1 h/semana + revisão',
    description: 'Matriz preliminar para órgãos federais e instituições de ensino; confirme as leis do edital.',
    groups: [
      { title: '01 · Constituição Federal: Administração Pública', items: [
        'Princípios expressos do art. 37: legalidade, impessoalidade, moralidade, publicidade e eficiência', 'Regras de acesso a cargos, empregos e funções públicas', 'Concurso público, prazo de validade e convocação', 'Acumulação de cargos, empregos e funções', 'Responsabilidade dos agentes públicos e deveres funcionais', 'Estabilidade, avaliação de desempenho e perda do cargo', 'Noções dos arts. 37 a 41 da Constituição Federal'
      ]},
      { title: '02 · Regime jurídico dos servidores — Lei nº 8.112/1990', items: [
        'Provimento, nomeação, posse, exercício e vacância', 'Estágio probatório e estabilidade', 'Direitos e vantagens: vencimento, remuneração, férias e licenças', 'Afastamentos, concessões e tempo de serviço', 'Deveres e proibições dos servidores', 'Acumulação, responsabilidades e penalidades', 'Sindicância e processo administrativo disciplinar', 'Prescrição e aplicação de penalidades, conforme texto vigente'
      ]},
      { title: '03 · Carreira dos técnico-administrativos em educação', items: [
        'Lei nº 11.091/2005: estrutura do PCCTAE', 'Níveis de classificação e capacitação, conforme legislação vigente', 'Desenvolvimento na carreira e progressão', 'Ambiente organizacional e atribuições gerais', 'Alterações legislativas posteriores e regras de transição', 'Verificar vigência e versão consolidada da norma no edital'
      ]},
      { title: '04 · Processo e organização administrativa', items: [
        'Lei nº 9.784/1999: princípios e critérios do processo administrativo federal', 'Competência, delegação e avocação', 'Direitos e deveres dos administrados', 'Impedimento, suspeição, motivação e forma dos atos', 'Instrução, consulta, decisão, recurso e revisão', 'Prazos, comunicação e anulação ou revogação de atos'
      ]},
      { title: '05 · Transparência, dados e integridade', items: [
        'Lei de Acesso à Informação — Lei nº 12.527/2011', 'Transparência ativa e passiva', 'Informação pessoal, sigilo e classificação de informações', 'LGPD — Lei nº 13.709/2018: princípios e bases legais', 'Direitos do titular e tratamento de dados pelo poder público', 'Segurança, prevenção e responsabilização no tratamento de dados', 'Lei de Improbidade Administrativa — Lei nº 8.429/1992 e alterações', 'Lei Anticorrupção — Lei nº 12.846/2013, quando prevista'
      ]},
      { title: '06 · Licitações e contratos', items: [
        'Lei nº 14.133/2021: princípios, objetivos e âmbito de aplicação', 'Agentes públicos e fases da contratação', 'Modalidades e critérios de julgamento', 'Planejamento, estudo técnico preliminar e termo de referência', 'Dispensa e inexigibilidade de licitação', 'Contratos administrativos, fiscalização e sanções', 'Gestão de riscos e transparência nas contratações', 'Aplicar somente os tópicos efetivamente previstos no edital'
      ]},
      { title: '07 · Ética no serviço público', items: [
        'Princípios éticos e interesse público', 'Decreto nº 1.171/1994: regras deontológicas, deveres e vedações', 'Ética, moralidade, integridade e conflito de interesses', 'Uso responsável de recursos públicos e informações', 'Relacionamento com cidadãos, colegas e fornecedores', 'Comissões de ética e consequências de condutas inadequadas'
      ]},
      { title: '08 · Organização da Administração Pública', items: [
        'Administração direta e indireta', 'Autarquias, fundações públicas, empresas públicas e sociedades de economia mista', 'Centralização, descentralização, concentração e desconcentração', 'Órgãos públicos e distribuição de competências', 'Poderes administrativos e limites de atuação', 'Atos administrativos: elementos, atributos, espécies e extinção', 'Controle administrativo, legislativo e judicial', 'Responsabilidade civil do Estado: noções gerais'
      ]},
    ]
  },
  {
    id: 'administracao', title: 'Administração Geral e Rotinas Administrativas', category: 'Área administrativa', icon: 'ClipboardList', color: 'blue',
    tracks: ['admin', 'bnb'], priority: 'Alta', estimate: '1 h/semana + questões',
    description: 'Competências de organização, processos, atendimento, documentos e suporte operacional.',
    groups: [
      { title: '01 · Fundamentos e funções administrativas', items: [
        'Conceitos, objetivos e níveis da Administração', 'Planejamento estratégico, tático e operacional', 'Organização, estrutura e departamentalização', 'Direção, liderança, motivação e comunicação', 'Controle, indicadores e avaliação de resultados', 'Eficiência, eficácia e efetividade', 'Tomada de decisão e resolução de problemas'
      ]},
      { title: '02 · Estruturas, pessoas e trabalho em equipe', items: [
        'Estruturas formal e informal', 'Organogramas, autoridade, responsabilidade e delegação', 'Liderança situacional e estilos de liderança', 'Motivação, clima e cultura organizacional', 'Comunicação interpessoal e institucional', 'Equipes, colaboração e gestão de conflitos', 'Negociação, feedback e reuniões produtivas'
      ]},
      { title: '03 · Processos, qualidade e melhoria contínua', items: [
        'Conceito de processo, atividade, tarefa e procedimento', 'Mapeamento de processos e fluxogramas', 'Identificação de gargalos e desperdícios', 'Ciclo PDCA e melhoria contínua', 'Indicadores, metas e níveis de serviço', 'Padronização, manuais e procedimentos operacionais', 'Noções de gestão de projetos e acompanhamento de entregas'
      ]},
      { title: '04 · Atendimento ao público e comunicação', items: [
        'Atendimento presencial, telefônico e digital', 'Escuta ativa, cordialidade e comunicação clara', 'Identificação da necessidade e encaminhamento correto', 'Tratamento de reclamações e situações difíceis', 'Acessibilidade, inclusão e atendimento respeitoso', 'Sigilo, proteção de dados e postura profissional', 'Qualidade percebida e satisfação do usuário'
      ]},
      { title: '05 · Documentos, protocolo e arquivo', items: [
        'Recebimento, registro, classificação e distribuição de documentos', 'Protocolo, tramitação, expedição e controle de prazos', 'Arquivamento corrente, intermediário e permanente', 'Classificação, ordenação, temporalidade e destinação documental', 'Documentos físicos e digitais', 'Correspondência oficial, memorandos, ofícios e atas, conforme padrão vigente', 'Preservação, acesso, confidencialidade e rastreabilidade'
      ]},
      { title: '06 · Materiais, patrimônio e apoio logístico', items: [
        'Recebimento, armazenamento e distribuição de materiais', 'Controle de estoque, inventário e registro de movimentação', 'Noções de compras, requisições e cotação', 'Patrimônio, tombamento, transferência e baixa', 'Organização de ambientes e recursos de trabalho', 'Consumo consciente e sustentabilidade operacional'
      ]},
      { title: '07 · Ferramentas de escritório e dados', items: [
        'Editor de texto: formatação, tabelas, estilos e revisão', 'Planilhas: referências, fórmulas, funções básicas e filtros', 'Classificação, validação e limpeza de dados', 'Gráficos, tabelas dinâmicas e indicadores simples', 'Apresentações: organização de conteúdo e legibilidade', 'E-mail, agenda, armazenamento em nuvem e colaboração', 'Segurança de arquivos, senhas e cópias de segurança'
      ]},
      { title: '08 · Gestão pública e foco em resultados', items: [
        'Princípios da gestão pública e orientação ao cidadão', 'Planejamento, programas, metas e indicadores', 'Transparência, prestação de contas e controle social', 'Sustentabilidade e responsabilidade no uso dos recursos', 'Gestão por competências e capacitação', 'Transformação digital e serviços públicos digitais'
      ]},
    ]
  },
  {
    id: 'ti', title: 'Tecnologia da Informação', category: 'Área de tecnologia', icon: 'Code2', color: 'violet',
    tracks: ['tae-ti', 'caixa-ti'], priority: 'Alta', estimate: '1 h 30 min/semana + laboratório',
    description: 'Conteúdo-base técnico; compare a lista com a versão oficial do edital de cada instituição.',
    groups: [
      { title: '01 · Arquitetura e organização de computadores', items: [
        'Componentes: CPU, memória, placa-mãe, armazenamento e periféricos', 'Representação de dados, bits, bytes e unidades de capacidade', 'Memória RAM, ROM, cache e memória virtual', 'Discos rígidos, SSDs e sistemas de armazenamento', 'BIOS/UEFI, inicialização e configuração de equipamentos', 'Especificação de estações, notebooks e periféricos', 'Diagnóstico básico de falhas de hardware e manutenção preventiva'
      ]},
      { title: '02 · Sistemas operacionais Windows e Linux', items: [
        'Arquivos, diretórios, caminhos e sistemas de arquivos', 'Contas, grupos, permissões e controle de acesso', 'Processos, serviços, inicialização e encerramento', 'Instalação, atualização e remoção de programas', 'Configurações de rede, impressoras e periféricos', 'Terminal, shell e comandos básicos de Linux', 'PowerShell e ferramentas administrativas básicas do Windows', 'Logs, monitoramento, diagnóstico e resolução de problemas', 'Backup, restauração e pontos de recuperação'
      ]},
      { title: '03 · Redes de computadores', items: [
        'Modelos OSI e TCP/IP e suas camadas', 'Ethernet, Wi-Fi, LAN, WAN e topologias', 'Endereçamento IPv4/IPv6, máscara e gateway', 'Sub-redes e noções de cálculo de endereçamento', 'ARP, ICMP, TCP e UDP', 'DNS, DHCP, HTTP, HTTPS, SSH, FTP/SFTP e SMTP/IMAP', 'Switches, roteadores, pontos de acesso e VLANs', 'NAT, VPN, proxy, firewall e segmentação', 'Ferramentas de diagnóstico: ping, tracert/traceroute, ipconfig/ifconfig e nslookup', 'Conceitos básicos de disponibilidade, latência, perda e largura de banda'
      ]},
      { title: '04 · Segurança da informação', items: [
        'Confidencialidade, integridade, disponibilidade e autenticidade', 'Princípio do menor privilégio e controle de acesso', 'Autenticação, autorização, MFA e gestão de identidades', 'Criptografia simétrica, assimétrica, hash e certificados digitais', 'Malware, phishing, engenharia social e prevenção', 'Atualizações, hardening, antivírus e firewall', 'Backup, recuperação, continuidade e recuperação de desastre', 'Classificação da informação, política de segurança e conscientização', 'Gestão de incidentes, evidências e resposta inicial', 'Noções de vulnerabilidades web e OWASP Top 10'
      ]},
      { title: '05 · Banco de dados e SQL', items: [
        'Conceitos de SGBD, banco relacional, tabela, linha e coluna', 'Modelo entidade-relacionamento e cardinalidade', 'Chaves primária, estrangeira e restrições de integridade', 'Normalização e redução de redundância', 'SQL: SELECT, WHERE, ORDER BY e DISTINCT', 'SQL: INSERT, UPDATE e DELETE', 'JOINs, funções agregadas, GROUP BY e HAVING', 'Subconsultas, views e índices', 'Transações, ACID, concorrência e bloqueios', 'Backup, restauração, permissões e segurança de dados'
      ]},
      { title: '06 · Programação e algoritmos', items: [
        'Lógica de programação, variáveis, tipos e operadores', 'Estruturas condicionais e de repetição', 'Vetores, matrizes, listas, pilhas, filas e mapas', 'Funções, parâmetros, retorno e escopo', 'Algoritmos de busca e ordenação: noções', 'Complexidade temporal e espacial: conceitos básicos', 'Programação orientada a objetos: classes, objetos e encapsulamento', 'Herança, polimorfismo e abstração', 'Tratamento de erros, depuração e testes unitários', 'Leitura de código, pseudocódigo e fluxogramas'
      ]},
      { title: '07 · Desenvolvimento web e integração', items: [
        'HTML semântico e estrutura de documentos', 'CSS: seletores, cascata, layout e responsividade', 'JavaScript: variáveis, funções, objetos e eventos', 'HTTP, métodos, códigos de status, cabeçalhos e cookies', 'APIs REST, JSON e consumo de serviços', 'Autenticação, autorização e gestão de sessões', 'Validação de dados, tratamento de erros e logs', 'Acessibilidade, usabilidade e segurança no desenvolvimento'
      ]},
      { title: '08 · Engenharia de software e qualidade', items: [
        'Ciclo de vida e modelos de desenvolvimento de software', 'Requisitos funcionais e não funcionais', 'Casos de uso, histórias de usuário e critérios de aceitação', 'Arquitetura, modularidade, coesão e acoplamento', 'UML e diagramas essenciais, quando previstos', 'Testes unitários, integração, sistema e aceitação', 'Versionamento com Git: commit, branch, merge e pull request', 'Ágil: Scrum, Kanban, papéis, eventos e artefatos', 'Integração e entrega contínuas (CI/CD): conceitos', 'Documentação técnica, revisão de código e manutenção'
      ]},
      { title: '09 · Infraestrutura, virtualização e nuvem', items: [
        'Virtualização, hipervisores e máquinas virtuais', 'Containers e imagens: conceitos básicos', 'Computação em nuvem: IaaS, PaaS e SaaS', 'Nuvem pública, privada, híbrida e multicloud', 'Escalabilidade, elasticidade e alta disponibilidade', 'Armazenamento, redes virtuais e gerenciamento de recursos', 'Monitoramento, métricas, logs e alertas', 'Noções de custos, governança e responsabilidade compartilhada'
      ]},
      { title: '10 · Suporte técnico e operação de serviços', items: [
        'Registro, classificação e priorização de chamados', 'Diagnóstico estruturado e documentação da solução', 'Incidente, problema, requisição e mudança', 'Noções de ITIL e gerenciamento de serviços de TI', 'Inventário de ativos e ciclo de vida dos equipamentos', 'Suporte remoto, atendimento ao usuário e comunicação', 'Catálogo de serviços, SLA e escalonamento', 'Procedimentos operacionais, base de conhecimento e melhoria contínua'
      ]},
      { title: '11 · Dados, inteligência artificial e tendências', items: [
        'Conceitos de dados, informação, conhecimento e qualidade de dados', 'Análise exploratória e indicadores básicos', 'Noções de BI, dashboards e visualização de dados', 'Fundamentos de aprendizado de máquina e IA generativa', 'Limitações, vieses, privacidade e validação de resultados de IA', 'Uso responsável de ferramentas digitais em contextos institucionais'
      ]},
    ]
  },
  {
    id: 'bancarios', title: 'Conhecimentos Bancários', category: 'Área bancária', icon: 'Landmark', color: 'green',
    tracks: ['caixa', 'caixa-ti', 'bnb'], priority: 'Alta', estimate: '1 h/semana + revisão',
    description: 'Núcleo comum de conhecimentos bancários, com módulos próprios para CAIXA e BNB.',
    groups: [
      { title: '01 · Sistema Financeiro Nacional (SFN)', items: [
        'Estrutura e finalidade do Sistema Financeiro Nacional', 'Conselho Monetário Nacional: atribuições e políticas', 'Banco Central do Brasil: funções, supervisão e instrumentos', 'Comissão de Valores Mobiliários: mercado de valores mobiliários', 'SUSEP e PREVIC: escopo de atuação', 'Instituições financeiras, cooperativas e instituições de pagamento', 'Bancos comerciais, múltiplos, de investimento e de desenvolvimento', 'Instituições financeiras públicas federais e seus papéis'
      ]},
      { title: '02 · Mercados e política monetária', items: [
        'Mercados monetário, de crédito, de capitais e cambial', 'Moeda, funções da moeda e agregados monetários', 'Inflação, índices de preços e poder de compra', 'Política monetária expansionista e contracionista', 'Taxa Selic, operações compromissadas e instrumentos monetários', 'Títulos públicos, Tesouro Nacional e dívida pública: noções', 'Taxa de câmbio, regimes cambiais e operações básicas', 'Balanço de pagamentos, fluxos de capitais e risco-país: conceitos'
      ]},
      { title: '03 · Produtos, serviços e operações bancárias', items: [
        'Conta corrente, conta poupança, depósitos à vista e a prazo', 'Cartões de crédito e débito, tarifas e meios de pagamento', 'Empréstimos, financiamentos, desconto e adiantamentos', 'Crédito pessoal, CDC e capital de giro', 'CDB, RDB, fundos de investimento e títulos de capitalização', 'Previdência privada, seguros e consórcios', 'Crédito imobiliário e crédito rural: noções', 'Correspondentes bancários e canais de atendimento', 'Cadastro, análise de perfil e documentação do cliente', 'Risco de crédito, mercado, liquidez, operacional e sistêmico'
      ]},
      { title: '04 · Pagamentos, bancos digitais e inovação', items: [
        'Internet banking e mobile banking', 'PIX: participantes, modalidades e funcionamento', 'Open Finance e compartilhamento consentido de dados', 'Fintechs, startups e big techs', 'Modelos digitais de negócio e transformação digital', 'Blockchain, criptoativos e moedas digitais de bancos centrais: conceitos', 'DREX: acompanhar nomenclatura e situação vigentes no edital', 'Shadow banking e riscos de intermediação fora do sistema tradicional', 'Cibersegurança, autenticação e prevenção a fraudes'
      ]},
      { title: '05 · Crédito, risco e relacionamento', items: [
        'Conceito, elementos e requisitos de crédito', 'Cadastro de pessoas físicas e jurídicas', 'Capacidade de pagamento, garantias e análise de risco', 'Inadimplência, provisões e recuperação de crédito: noções', 'Operações de crédito geral e especializado', 'Atendimento consultivo e identificação das necessidades', 'Venda responsável, adequação do produto e transparência', 'Sigilo bancário, proteção de dados e prevenção de fraudes'
      ]},
      { title: '06 · Crédito e desenvolvimento regional — foco BNB', tracks: ['bnb'], items: [
        'Banco do Nordeste: finalidade, atuação e papel no desenvolvimento regional', 'Fundo Constitucional de Financiamento do Nordeste (FNE): finalidade e diretrizes', 'Programa Nacional de Fortalecimento da Agricultura Familiar (PRONAF)', 'Crédito rural: custeio, investimento e comercialização', 'Microcrédito urbano e produtivo orientado', 'Crediamigo e Agroamigo: estudar programas conforme materiais oficiais vigentes', 'BNDES/FINAME e Fundo de Amparo ao Trabalhador (FAT): noções', 'Financiamento ao comércio, indústria, serviços e agroindústria', 'Políticas de desenvolvimento regional e inclusão produtiva'
      ]},
      { title: '07 · Produtos e regras institucionais — foco CAIXA', tracks: ['caixa', 'caixa-ti'], items: [
        'Estatuto Social da CAIXA e papel institucional', 'Programas sociais e benefícios do trabalhador', 'FGTS: noções do papel da CAIXA como agente operador', 'Poupança, crédito imobiliário e financiamento habitacional: conceitos', 'Produtos de varejo e canais de atendimento', 'Política de responsabilidade socioambiental e sustentabilidade', 'Atualização dos produtos, programas e estatuto em fontes oficiais'
      ]},
      { title: '08 · Mercado de capitais, investimentos e câmbio', items: [
        'Ações, debêntures e valores mobiliários: noções', 'Mercado primário e secundário', 'Renda fixa, renda variável, risco e retorno', 'Fundos de investimento e diversificação', 'Câmbio pronto e operações básicas', 'Taxas nominais e reais e impactos do câmbio', 'Relação entre juros internos, externos e fluxo de capitais', 'Suitability e adequação de produtos ao perfil do investidor, quando prevista'
      ]},
      { title: '09 · Sistema de crédito e microfinanças — foco BNB', tracks: ['bnb'], items: [
        'Crédito rural: beneficiários, finalidades e preceitos gerais', 'Microfinanças e inclusão financeira', 'Crédito para micro, pequenas e médias empresas', 'Garantias, cadastro e monitoramento de operações', 'Risco socioambiental e análise responsável', 'Fundos constitucionais: governança, aplicação e fiscalização'
      ]},
    ]
  },
  {
    id: 'etica-compliance', title: 'Ética, Compliance e Comportamentos Digitais', category: 'Área bancária', icon: 'ShieldCheck', color: 'amber',
    tracks: ['caixa', 'caixa-ti', 'bnb'], priority: 'Média-alta', estimate: 'Revisão semanal',
    description: 'Ética organizacional, integridade, privacidade, controles e cultura digital.',
    groups: [
      { title: '01 · Ética e conduta profissional', items: [
        'Princípios éticos, integridade e responsabilidade individual', 'Conflitos de interesses e uso de informação privilegiada', 'Relacionamento com clientes, fornecedores e colegas', 'Assédio, discriminação e respeito à diversidade', 'Brindes, presentes, hospitalidades e situações de risco', 'Canais de denúncia, proteção contra retaliação e apuração', 'Código de ética e políticas específicas da instituição-alvo'
      ]},
      { title: '02 · Compliance e prevenção a ilícitos', items: [
        'Conceito de compliance e cultura de conformidade', 'Controles internos, gestão de riscos e linhas de defesa', 'Lei nº 12.846/2013 e Decreto nº 11.129/2022, quando previstos', 'Prevenção à lavagem de dinheiro e ao financiamento do terrorismo', 'Conheça seu cliente (KYC), monitoramento e comunicação de operações', 'Sanções, consequências disciplinares e responsabilização', 'Governança corporativa e prestação de contas'
      ]},
      { title: '03 · Sigilo, privacidade e proteção de dados', items: [
        'Sigilo bancário e Lei Complementar nº 105/2001', 'LGPD: princípios, bases legais e direitos do titular', 'Dados pessoais, dados sensíveis e dados anonimizados', 'Minimização, finalidade, necessidade e retenção', 'Compartilhamento de dados e consentimento quando aplicável', 'Incidentes de segurança e comunicação responsável', 'Boas práticas de senha, autenticação e trabalho remoto'
      ]},
      { title: '04 · Comportamentos digitais e inovação', items: [
        'Cultura digital, colaboração e comunicação em ambientes virtuais', 'Orientação ao cliente e experiência do usuário', 'Metodologias ágeis e melhoria incremental', 'Tomada de decisão baseada em dados', 'Aprendizagem contínua e adaptação tecnológica', 'Privacidade, segurança e responsabilidade no uso de IA', 'Responsabilidade socioambiental e sustentabilidade'
      ]},
    ]
  },
  {
    id: 'ingles', title: 'Língua Inglesa', category: 'Área bancária', icon: 'Languages', color: 'amber',
    tracks: ['caixa', 'caixa-ti'], priority: 'Média', estimate: '30 min/semana',
    description: 'Ênfase em vocabulário e compreensão de textos, conforme programas bancários anteriores.',
    groups: [
      { title: '01 · Estratégias de leitura', items: [
        'Identificação do assunto e da ideia principal', 'Localização de informações específicas (scanning)', 'Leitura global para compreender o sentido geral (skimming)', 'Inferência de significado pelo contexto', 'Identificação de opinião, propósito e tom do autor', 'Uso de títulos, subtítulos, cognatos e elementos visuais'
      ]},
      { title: '02 · Vocabulário e gramática aplicada', items: [
        'Vocabulário de alta frequência e expressões comuns', 'Cognatos e falsos cognatos', 'Pronomes, artigos, preposições e conjunções', 'Tempos verbais mais frequentes em textos', 'Modal verbs e relações de possibilidade, obrigação e conselho', 'Comparativos, superlativos e quantificadores', 'Conectores, referência pronominal e formação de palavras'
      ]},
      { title: '03 · Contextos digitais e financeiros', items: [
        'Vocabulário básico de tecnologia, internet e segurança', 'Vocabulário de serviços financeiros e atendimento', 'Compreensão de instruções e mensagens curtas', 'Interpretação de e-mails e textos informativos', 'Revisão por questões da banca e registro de vocabulário recorrente'
      ]},
    ]
  },
  {
    id: 'redacao', title: 'Redação e produção textual', category: 'Competência transversal', icon: 'PenLine', color: 'rose',
    tracks: ['admin', 'caixa', 'caixa-ti'], priority: 'Média', estimate: '30 min/semana',
    description: 'Prática recorrente de escrita; o formato e os critérios dependem do edital publicado.',
    groups: [
      { title: '01 · Texto dissertativo-argumentativo', items: [
        'Leitura do tema e delimitação do problema', 'Tese clara e compatível com a proposta', 'Organização de introdução, desenvolvimento e conclusão', 'Argumentos apoiados em explicação, exemplo e consequência', 'Progressão lógica e conexão entre parágrafos', 'Conclusão coerente, sem introduzir argumento inesperado'
      ]},
      { title: '02 · Norma-padrão e revisão', items: [
        'Concordância, regência e pontuação em texto próprio', 'Coesão referencial e uso de conectivos', 'Precisão vocabular, clareza e concisão', 'Identificação e eliminação de repetição desnecessária', 'Revisão final de ortografia e estrutura', 'Adequação ao gênero e às regras de extensão da prova'
      ]},
      { title: '03 · Rotina de treino', items: [
        'Planejamento em tópicos antes de escrever', 'Produção cronometrada com limite de linhas', 'Autoavaliação por critérios de conteúdo, organização e linguagem', 'Reescrita após correção', 'Arquivo de repertórios e exemplos relevantes, com fontes verificáveis'
      ]},
    ]
  },
];

export const SOURCES = [
  { name: 'UFRN / COMPERVE — programas de estudo de concursos técnico-administrativos', url: 'https://comperve.ufrn.br/conteudo/concursos/ufrn_202287/programas.php', note: 'Referência institucional para cargos administrativos e de TI em edital anterior.' },
  { name: 'UFRN / COMPERVE — edital 2025, programas de estudo', url: 'https://comperve.ufrn.br/conteudo/concursos/ufrn_2025_22_23/programas.php', note: 'Página oficial com programas de cargos técnico-administrativos.' },
  { name: 'CAIXA — Edital nº 01/2024/NM (TBN e TBN-TI)', url: 'https://www.caixa.gov.br/Downloads/concurso-publico-editais/EDITAL_N_01_2024_NM_DE_22_DE_FEVEREIRO_DE_2024_.pdf', note: 'Referência para conhecimentos bancários, TI, ética, matemática financeira, estatística e Português.' },
  { name: 'Banco do Nordeste — Edital nº 1/2024 (Analista Bancário 1)', url: 'https://www.bnb.gov.br/documents/45807/5758094/Edital%2Bn%C2%BA%2B1%2B-%2BAbertura%2Bde%2Bconcurso%2Bp%C3%BAblico%2B2024.pdf', note: 'Referência para Português, Matemática/Raciocínio Lógico Quantitativo e Conhecimentos Bancários.' },
];

export function slug(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function flattenSubject(subject) {
  return subject.groups.flatMap((group, groupIndex) => {
    const topicId = `${subject.id}-${slug(group.title)}`;
    return group.items.map((label, index) => ({
      id: `${topicId}-${index + 1}`,
      topicId,
      topicTitle: group.title,
      subjectId: subject.id,
      subjectTitle: subject.title,
      label,
      tracks: group.tracks || subject.tracks,
      groupIndex,
      index,
    }));
  });
}
