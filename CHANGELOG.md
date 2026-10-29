# Histórico de mudanças

As datas registram a incorporação ao repositório e não comprovam a data de emissão dos alertas nem uma implantação em produção.

## 29/10/2026 — Retomada da migração de vocabulário M360

- Registradas saídas dos nodes Normaliza v0.2.1 e Similaridade interna v0.5.3 no registro 1347: 72 regras, fonte BANCO e equivalência com a v0.5.2 na mesma entrada (`NOVO`, 51,5%, mesmo melhor match e contexto). Sem retorno terminal novo nem faceta adicional ativa nessa evidência.
- Preparados Normaliza v0.2.1 e Similaridade interna v0.5.3 para facetas opcionais do banco em observação, com aplicação manual node a node; as 72 regras atuais preservam as saídas e nenhuma regra nova foi ativada. Suíte completa: 113 testes aprovados.
- Operador aplicou a Similaridade v0.5.2 e apresentou execução do registro 1347: fonte BANCO, 72 regras, resultado lexical NOVO (51,5%) e Retorno Final com origem `similaridade_editorial_v0.5.2`. A sugestão contextual RELACIONADO ficou em observação; evidência e limite de validação registrados.
- Registrados Retorno Final v0.2.2 e evidência do registro 1341: versão interna v0.5.1, fonte BANCO, 72 regras e zero divergências em 243 comparáveis; retorno NOVO com origem dinâmica informado pelo operador.
- Preparada Similaridade v0.5.2 com aliases exclusivamente do banco, sem cadastro estático de fallback. Vocabulário ausente/inválido resulta em contexto indisponível, sem sugestão relacional, preservando a decisão lexical.
- Preservadas regras lexicais e facetas/estados contextuais ainda em código; nenhuma regra adicional, SP ou workflow produtivo alterado automaticamente.
- Adicionados replay offline dos 98 casos em três condições de carga e testes do retorno; plano manual e limitações documentados em `docs/operacao/2026-10-29-M360-VOCAB-BANCO.md`.
- Recuperado acesso ao executor deste chat após falhas de inicialização; nenhuma configuração do ambiente alterada nesta entrega.

## 27/10/2026 — Checkpoint M360-T1 iniciado

- Registrado o relato operacional de criação do node `Validade Temporal v0.1.0` junto ao workflow M360.
- Alterado T1 para `EM ANDAMENTO`, sem marcá-lo como concluído por ainda faltar o export atualizado e a execução dos testes isolados.
- Reforçado que o node deve permanecer sem conexões e em `OBSERVACAO` até a validação automatizada do checkpoint.
- Nenhuma conexão com a SP ou alteração produtiva foi validada por este registro.

## 27/10/2026 — Checkpoint M360-T0 concluído

- Recebido e verificado o export vigente do workflow M360 com 15 nodes, ativo, contendo `pinData` e referências de credenciais.
- Mantido o arquivo bruto fora do Git; publicado somente snapshot sanitizado, inativo, sem `pinData` e sem credenciais.
- Confirmada a topologia `Start Dedup → SP DEDUPLICA EDITORIAL → Normaliza v0.2.2`, ainda sem node temporal.
- Comprovada equivalência lógica com a baseline de 21/10, desconsiderando apenas ordem do array de nodes e `versionId`.
- Aprovado o validador automatizado para `M360-T0`; `M360-T1` está pronto para adicionar o node temporal desconectado em cópia inativa.
- Nenhuma alteração foi aplicada à instância n8n ou à produção.

## 27/10/2026 — Rollout M360 node a node

- Restringida a primeira aplicação da validade temporal ao workflow `SUB | Deduplicação e Semântica - M360 [ Core Editorial ]`; PEL permanece fora do escopo.
- Definidos checkpoints `M360-T0` a `M360-T5`, começando por baseline e node desconectado, seguidos de conexão observacional, normalizador, retorno e observação controlada.
- Registrados gates, critérios de parada, rollback por checkpoint e evidência sanitizada obrigatória.
- Adicionado validador automatizado dos exports intermediários, com sete testes para topologia, contrato observacional e sanitização.
- O alvo continua em `OBSERVACAO`, sem bloqueio temporal; nenhuma alteração foi aplicada à instância n8n ou à produção.

## 27/10/2026 — Core v0.5.0 com validade temporal em observação

- Inserido `Validade Temporal v0.1.0` entre `Start Dedup` e `SP_DEDUPLICA_EDITORIAL` no export M360 de referência.
- Evoluído o normalizador M360 para v0.3.0, preservando `validade_temporal` e `core_versao` no contrato; a v0.2.2 histórica foi mantida para reprodução da baseline.
- Ampliado o retorno final com `core_versao: 0.5.0` e o diagnóstico temporal, sem alterar o valor funcional de `resultado`.
- Mantido `modo: OBSERVACAO` e `aplicado_automaticamente: false`: `VALIDO`, `EXPIRADO` e `INDETERMINADO` seguem para a SP sem desvio ou bloqueio.
- Adicionados geradores reproduzíveis do Code node e do workflow, além de seis testes de integração; 20 testes temporais e de contrato foram aprovados.
- Preservados snapshots imutáveis do workflow e do retorno da S20-01 para manter os hashes históricos verificáveis.
- O export permanece `active: false`, sem credenciais e sem `pinData`; nenhum workflow foi importado ou executado e nenhum serviço externo foi alterado.

## 27/10/2026 — Quarto lote de alertas M360

- Incorporados 47 candidatos e 141 pares sanitizados, elevando o acumulado a 98 candidatos e 294 pares.
- Reproduzidos offline os 141 scores e as 47 decisões de Similaridade v0.4.0 e Consenso v0.1.0, sem diferença percentual.
- Registrado um título repetido em URL nova, sem repetição de hash ou URL entre lotes.
- Documentados seis casos com score de 100%: quatro paráfrases/escopos prováveis e duas edições claramente diferentes por rodada ou data.
- Confirmado que todos os 14 TOP1 acumulados com score de pelo menos 78% têm menos de quatro tokens comuns.
- Acrescentados contrastes de pré-jogo, ao vivo, resultado, eliminação, atualização factual, equipe enfocada e evento diferente.
- Ampliado o protótipo temporal para sinais de resultado em português e inglês; 14 testes estão aprovados.
- Atualizado o replay temporal para 98 candidatos, com 38 saídas `INDETERMINADO` e nenhuma data original preservada.
- Preservado o índice de três lotes usado pela S20-01 em snapshot imutável, mantendo seu hash histórico.
- Nenhum workflow, threshold, SP ou roteamento produtivo foi alterado e nenhum `.msg` bruto foi publicado.

## 24/10/2026 — Protótipo e replay da validade temporal

- Implementada uma especificação executável pura para `CORE-028`, sem dependências externas ou integração com serviços.
- Automatizados VT-01 a VT-06 e cinco controles adicionais; 11 testes foram aprovados sem falhas.
- Adicionado suporte a expressões relativas, dias da semana, datas numéricas e datas por extenso em português.
- Executado replay observacional dos 51 candidatos: 10 possuem expressão temporal, 17 têm intenção pré-evento e 21 resultam `INDETERMINADO`.
- Confirmado que nenhum candidato histórico preserva `data`, `iso_date` ou `isoDate`; nenhum vencimento foi inferido artificialmente.
- Alterado `CORE-028` para `EM ANDAMENTO` e mantida a promoção funcional bloqueada até existirem snapshots temporais e contrato do fluxo pai.
- Nenhum workflow foi modificado, importado ou executado e nenhum efeito externo foi produzido.

## 23/10/2026 — Proposta de validade temporal antes da publicação

- Criada a iniciativa `CORE-028` para identificar conteúdo de serviço cujo evento já ocorreu antes de chamar o Extrator Editorial.
- Documentada a separação entre data original do conteúdo, data do evento e instante de avaliação no fuso `America/Sao_Paulo`.
- Definido que expressões relativas, como `hoje`, sejam ancoradas na data original do conteúdo e não reinterpretadas no processamento tardio.
- Propostos os estados `VALIDO`, `EXPIRADO` e `INDETERMINADO`, com bloqueio seguro, auditoria e casos de regressão VT-01 a VT-06.
- Registrada implantação gradual por replay, observação, feature flag e rollback antes de qualquer efeito funcional.
- Nenhum workflow foi modificado, importado ou executado e nenhuma alteração produtiva foi realizada.

## 23/10/2026 — Continuidade das conversas no repositório

- Determinado que avanços, alinhamentos, decisões, ações, evidências e aprendizados relevantes das conversas de trabalho sejam registrados no repositório remoto.
- Reforçado que o chat e o workspace local não substituem a consolidação versionada na branch `main`.
- Estabelecido que bloqueios e próximos passos também sejam documentados quando uma ação não puder ser concluída.
- Atualizado o critério de aceite de `CORE-020` para refletir essa regra permanente de governança.

## 21/10/2026 — Abertura da S20-01

- Alterado o estado da história S20-01 para `EM ANDAMENTO`.
- Congelados hashes do workflow M360, Code nodes, índice de telemetria e três datasets de alertas.
- Documentados os contratos observáveis de entrada, retorno da SP, roteamentos, similaridade e chamada do Extrator Editorial.
- Incorporado o export sanitizado e inativo do Extrator Editorial M360 v0.3.
- Extraído o Code node `GERA SLUG` para revisão independente.
- Documentados reescrita, classificação, publicação WordPress, metadados SEO, tratamento/geração de imagem, storage e associação de mídia.
- Incorporadas as definições M360 de `SP_DEDUPLICA_EDITORIAL` v0.2.2 e `SP_DEDUPLICA_EDITORIAL_FINALIZA`, sem `DEFINER`.
- Confirmada a compatibilidade das assinaturas com o workflow M360 e documentados estados, comparáveis e concorrência.
- Registrado que o retorno `ERROR` da SP principal não possui rota no switch atual.
- Incorporados os DDLs de `ADM_deduplica_editorial` e `titulos_deduplica`, removendo apenas os próximos valores mutáveis de `AUTO_INCREMENT`.
- Confirmada a chave única de `dsc_chave_dedup`, necessária à reserva atômica da SP.
- Registrados como backlog a ausência de chave primária e índice de janela no histórico, além dos limites menores de categoria e URL.
- Mantidas como pendências da S20-01 a saída real do Extrator, os exports dos subfluxos dependentes e os snapshots dos ramos.
- Nenhuma consulta foi executada no MySQL e nenhum workflow foi importado ou ativado.

## 20/10/2026 — Sprint Editorial v0.2.0

- Consolidado o roteiro da Sprint para criação do modo sombra M360.
- Agrupadas as iniciativas `CORE-005` a `CORE-014` em histórias executáveis.
- Definidos contrato de contexto, compatibilidade por par, similaridade contextual, decisão sombra, telemetria e feedback editorial.
- Estabelecido aprendizado supervisionado e versionado, sem autoalteração das regras em execução.
- Separada a conclusão da Sprint dos gates posteriores de ativação e automação em produção.

## 20/10/2026 — Artefatos gerais das sprints

- Organizados os Code nodes existentes em `codes/m360` e `codes/pel`.
- Mantidos os exports JSON completos em `workflows` como referência dos fluxos.
- Criado inventário das SPs presentes e das definições editoriais ainda pendentes.
- Definido o padrão mínimo de artefatos para as próximas sprints.
- Nenhum código, query, regra ou comportamento dos fluxos foi modificado nessa extração.

## 20/10/2026 — Governança do repositório

- Formalizada a branch `main` remota como fonte oficial compartilhada.
- Definida a atualização conjunta de backlog, histórico e artefatos afetados.
- Estabelecida a verificação do HEAD remoto como parte da conclusão de cada entrega.
- Documentadas regras para não publicar credenciais, `pinData`, cabeçalhos de e-mail ou anexos brutos com dados pessoais.

## 20/10/2026 — Planejamento e sincronização da referência M360

- Reconciliado o export sanitizado M360 com o anexo mais recente.
- Atualizado o ramo `NOVO` de `Chamar Publicar Editorial` para `Chamar Extrator Editorial`.
- Preservado `resultado` no `Retorno Final`.
- Documentada a arquitetura sombra para evento, faceta e estado factual.
- Criado backlog compartilhado com prioridades, dependências, critérios de aceite e promoção gradual.
- Mantidos `active: false`, ausência de credenciais e ausência de `pinData` no artefato público.

## 20/10/2026 — Terceiro lote de alertas M360

- Incorporados 22 candidatos e 66 pares reproduzidos.
- Atualizado o acumulado para 51 candidatos e 153 pares.
- Documentados eventos diferentes, entidades críticas, fase factual, modalidade, divisão e identidade temporal.
- Criada a pasta pública de referência para novos alertas.

## 16/10/2026 — Segundo lote de alertas M360

- Incorporados 16 candidatos e 48 pares.
- Criado o índice acumulado de evidências e fingerprints entre lotes.
- Preservada a distinção entre hipóteses analíticas e decisões humanas.

## 14/10/2026 — Baseline do repositório

- Incorporados os exports sanitizados dos fluxos M360 e PEL.
- Incorporadas as SPs de storage sem cláusula `DEFINER`.
- Registrado o primeiro lote de 13 candidatos e 39 pares M360.
- Confirmado que as definições das SPs editoriais permanecem ausentes.
