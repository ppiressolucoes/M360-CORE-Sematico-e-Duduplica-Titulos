# Backlog consolidado — Core Semântico e Deduplicação de Títulos

Última atualização: 29/10/2026.

## Objetivo e escopo

Este backlog coordena a evolução dos fluxos n8n e das Stored Procedures MySQL do Core Editorial. A implantação M360 relatada pelo operador está registrada no [checkpoint de 29/10](../operacao/2026-10-29-M360-CHECKPOINT.md). Este documento não autoriza novas alterações diretas de produção nem aplicação automática de hipóteses analíticas.

O [índice acumulado de evidências](../telemetria/m360-indice.json) contém 98 candidatos e 294 pares provenientes de alertas do ramo `SUSPEITO`. Os casos não possuem validação humana completa e não representam os ramos `NOVO` e `DUPLICADO`; por isso, ainda não permitem medir precisão ou recall do Core.

## Convenções

| Estado | Significado |
| --- | --- |
| `CONCLUÍDO` | Evidência e artefato foram incorporados ao repositório |
| `EM ANDAMENTO` | Execução iniciada, com evidências e pendências registradas |
| `PRONTO` | Escopo definido e sem dependência conhecida para iniciar |
| `DEPENDÊNCIA` | Requer artefato, acesso ou decisão ainda não disponível |
| `PLANEJADO` | Depende de itens anteriores |

Prioridade `P0` protege rastreabilidade ou operação; `P1` entrega a nova capacidade analítica; `P2` promove a capacidade depois de validada.

## Sprint selecionada

A [Sprint Deduplicação e Semântica Editorial v0.2.0](../sprints/SPRINT-V0.2.0-MODO-SOMBRA.md) agrupa `CORE-005` a `CORE-014`. O resultado esperado é um piloto M360 em modo sombra, capaz de sugerir decisões explicáveis e aprender com rótulos editoriais sem alterar o status funcional. Operação com tráfego real e automação permanecem nos gates `CORE-015` a `CORE-019`.

A proteção temporal `CORE-028` é uma frente paralela no Core atual. Ela não faz parte do aprendizado sombra: seu objetivo é impedir que conteúdo de serviço já vencido chegue ao Extrator Editorial, após validação em observação e promoção controlada.

| História | Estado | Registro | Pendências para conclusão |
| --- | --- | --- | --- |
| S20-01 — Congelar o baseline | EM ANDAMENTO | [Baseline e contratos observados](../sprints/S20-01-BASELINE.md) | Saída real do Extrator; exports dos subfluxos dependentes; snapshots completos dos ramos |

## Agora — referência e contratos

| ID | Prioridade | Estado | Iniciativa | Critério de aceite / dependência |
| --- | --- | --- | --- | --- |
| CORE-001 | P0 | CONCLUÍDO | Consolidar os quatro lotes de alertas M360 | 98 candidatos, 294 pares, hashes, reprodução offline e análises disponíveis no índice acumulado |
| CORE-002 | P0 | CONCLUÍDO | Reconciliar o export M360 mais recente | Cópia pública desativada e sanitizada; ramo `NOVO` aponta para `Chamar Extrator Editorial`; retorno inclui `resultado` |
| CORE-020 | P0 | CONCLUÍDO | Formalizar governança e sincronização do repositório | Política versionada; avanços, alinhamentos, decisões, ações, evidências e aprendizados das conversas registrados no repositório; backlog e histórico atualizados na mesma entrega; commit publicado e HEAD remoto verificado |
| CORE-021 | P0 | CONCLUÍDO | Organizar artefatos gerais das sprints | Exports JSON preservados; oito Code nodes extraídos e organizados por fluxo; inventário SQL identifica SPs presentes e ausentes |
| CORE-022 | P0 | CONCLUÍDO | Consolidar a Sprint Editorial v0.2.0 | Escopo, histórias, dependências, critérios de aceite, telemetria e gates do modo sombra versionados no repositório |
| CORE-003 | P0 | CONCLUÍDO | Incorporar as SPs editoriais vigentes do M360 | Definições recebidas em 21/10/2026, sem `DEFINER`, com assinaturas compatíveis com o workflow M360 e análise estática versionada |
| CORE-004 | P0 | EM ANDAMENTO | Confirmar o contrato do subfluxo chamado pelo ramo `NOVO` | Export principal incorporado; ainda faltam snapshot da saída e exports dos cinco subfluxos dependentes |
| CORE-024 | P0 | CONCLUÍDO | Versionar o DDL das tabelas editoriais | Estruturas recebidas em 21/10/2026; unicidade de `dsc_chave_dedup`, tipos, engine e índices analisados e registrados no baseline |
| CORE-028 | P0 | EM ANDAMENTO | Validar temporalidade do evento antes da publicação | [Checkpoint M360 de 29/10](../operacao/2026-10-29-M360-CHECKPOINT.md): Validade Temporal v0.1.2, gate e retorno terminal informados como implantados; desvio bloqueado testado no SUB e caminho `SEGUIR` testado pelo PAI. Falta comprovar `BLOQUEAR` no PAI e monitorar rollback/efeitos externos; PEL fora do escopo. |
| CORE-029 | P1 | EM ANDAMENTO | Migrar vocabulário editorial M360 para banco | Fonte BANCO da v0.5.1 comprovada no registro 1341; [v0.5.2 aplicada manualmente e validada no registro 1347](../operacao/2026-10-29-M360-VOCAB-BANCO.md): 72 regras, decisão lexical NOVO, retorno com origem dinâmica correta. [Normaliza v0.2.1 e Similaridade interna v0.5.3 aplicadas](../operacao/2026-10-29-M360-FACETAS-BANCO.md). Regras 73/74 `FACETA_EDITORIAL` ativas; registros 1353, 1359 e 1361 comprovaram leitura de 74 regras e fonte BANCO. Os retornos 1359/1361 confirmaram origem v0.5.3 e decisão lexical NOVO. A faceta financeira ainda não foi acionada em candidato novo. As sugestões contextuais divergentes seguem somente observacionais; no 1361, `RELACIONADO` veio de participantes compartilhados, sem faceta reconhecida. Não promover sem avaliação humana. Facetas legadas/estados ainda em código, versionamento expansível, governança de propostas e outros domínios seguem pendentes. |
| CORE-005 | P1 | PRONTO | Definir o contrato semântico v0.1 | Especificar evento principal, participantes e papéis, competição/divisão, data, faceta, estado factual, modalidade, confiança e campos desconhecidos |
| CORE-006 | P1 | PRONTO | Definir taxonomia editorial | Aprovar `DUPLICADO`, `NOVO`, `RELACIONADO`, `ATUALIZAÇÃO` e `INDETERMINADO`, com exemplos e regras para cada classe |

## Próximo — telemetria e execução sombra

| ID | Prioridade | Estado | Iniciativa | Critério de aceite / dependência |
| --- | --- | --- | --- | --- |
| CORE-007 | P1 | PLANEJADO | Modelar tabelas analíticas separadas | DDL revisado para execução, contexto, comparação por par, decisão sugerida e validação humana; nenhuma FK ou escrita em tabelas funcionais na primeira fase |
| CORE-008 | P1 | PLANEJADO | Criar SPs analíticas idempotentes | Gravação repetível por execução, candidato, comparável e versão; sem chamar SPs de finalização produtiva |
| CORE-009 | P1 | PLANEJADO | Construir fluxo n8n sombra | Consumir cópia dos dados após o fluxo atual; não publicar, inserir título funcional, enviar alerta operacional nem alterar status |
| CORE-010 | P1 | PLANEJADO | Extrair evento, faceta e estado factual antes da similaridade | Produzir contrato v0.1 para candidato e comparáveis; valor ausente permanece `DESCONHECIDO` |
| CORE-011 | P1 | PLANEJADO | Implementar compatibilidade por par | Registrar bloqueadores e relações editoriais antes do score: adversário, pessoa, competição, rodada/data, objeto, faceta e estágio factual |
| CORE-012 | P1 | PLANEJADO | Calcular similaridade contextual | Manter score v0.4.0 como baseline e registrar novo score somente em pares compatíveis; explicar diferenças por regra e versão |
| CORE-013 | P1 | PLANEJADO | Reprocessar a base histórica | Executar 98 candidatos e 294 pares sem acesso de escrita à produção; comparar decisões antiga e sombra com relatório reproduzível |
| CORE-014 | P1 | PRONTO | Criar coleta de decisão humana | Registrar classe, par determinante, motivo, observação, responsável e data; não reutilizar a sugestão automática como rótulo humano |
| CORE-023 | P1 | PRONTO | Tratar retorno `ERROR` da SP principal | Criar rota explícita, observabilidade e finalização `ERROR`; impedir encerramento silencioso fora do switch atual |
| CORE-025 | P1 | PLANEJADO | Validar propriedade e concorrência da reserva | Testar lease, retomada e finalização concorrente; decidir validação de `p_execucao_id` antes de alterar o estado |
| CORE-026 | P1 | PRONTO | Otimizar acesso ao histórico legado | Medir `EXPLAIN` e volume; desenhar migração reversível para `PRIMARY KEY`, índice de janela e identidade normalizada sem bloquear a ingestão |
| CORE-027 | P1 | PRONTO | Alinhar limites do histórico legado | Mapear o processo que grava `titulos_deduplica`; decidir validação ou ampliação de categoria 45→100 e URL 255→500; comprovar ausência de truncamento |

## Depois — promoção controlada

| ID | Prioridade | Estado | Iniciativa | Critério de aceite / dependência |
| --- | --- | --- | --- | --- |
| CORE-015 | P2 | PLANEJADO | Operar em sombra com tráfego real | Zero efeito funcional; monitorar falhas, latência, cobertura de extração e divergência por versão |
| CORE-016 | P2 | PLANEJADO | Introduzir veto conservador | Contradição crítica pode encaminhar um possível duplicado para revisão; feature flag, auditoria e rollback testados |
| CORE-017 | P2 | PLANEJADO | Liberar decisão assistida | Exibir sugestão e justificativa ao editor sem alterar automaticamente o status |
| CORE-018 | P2 | PLANEJADO | Executar canário de automação restrita | Apenas classes e contextos com amostra rotulada suficiente; limite de erro acordado, métricas por versão e desligamento imediato |
| CORE-019 | P2 | PLANEJADO | Ampliar automação por classe | Promoções independentes para duplicidade, relação e atualização; nenhuma ampliação baseada somente em threshold lexical |

## Casos de regressão prioritários

| Tema | Casos | Comportamento esperado |
| --- | --- | --- |
| Pessoa e estado contratual | C07 | Jogadores ou prazos diferentes bloqueiam equivalência; negociação e acordo concluído são estados distintos |
| Evento principal versus contexto | C11 | Participante mencionado como contexto não entra automaticamente no confronto principal |
| Possível paráfrase abaixo do threshold | C16 | Mesmo evento e mesmo fato podem prevalecer sobre score lexical abaixo de 78%, mediante evidência confirmada |
| Escalação, disponibilidade e anúncio | C10, C13, C14, C15 | Preservar equipe enfocada, lista, estado provável/confirmado e referência temporal |
| Competição e divisão | C17 | Série A e Série B permanecem distintas antes da tokenização |
| Identidade temporal | A04, C19, C21 | Data do evento e edição da informação recorrente participam da identidade |
| Modalidade e fase factual | C12, C22 | Pré-jogo, resultado, hipótese e decisão confirmada não são canonizados como o mesmo fato |
| Validade temporal da pauta | VT-01 a VT-06 | Conteúdo pré-evento vencido não chega ao Extrator; resultado/retrospectiva não sofre falso bloqueio; ausência de âncora resulta em revisão segura |
| Edições recorrentes com score máximo | D05, D06 | Rodada e data explícitas distinguem edições mesmo quando o score lexical é 100% |
| Fase factual no mesmo evento | D17, D23, D30, D35, D38, D39, D42 | Pré-jogo, ao vivo, resultado, eliminação e melhores momentos permanecem estados editoriais distintos |

## Critérios de segurança para qualquer promoção

- O fluxo atual permanece como fonte de verdade durante a fase sombra.
- A nova execução usa tabelas e SPs analíticas separadas.
- Toda decisão registra entrada, versão, regras, bloqueadores e evidências.
- Falha ou baixa confiança resulta em revisão; nunca em publicação automática.
- A decisão final considera todos os pares relevantes, e não apenas o TOP1.
- A avaliação inclui amostras humanas dos ramos `NOVO`, `SUSPEITO` e `DUPLICADO`.
- Cada promoção possui feature flag, canário, monitoramento e rollback verificado.

## Próxima entrega recomendada

Concluir CORE-004 e executar CORE-005 e CORE-006: confirmar a saída e os subfluxos do Extrator Editorial e aprovar os contratos de contexto e de decisão. Em paralelo, observar o primeiro bloqueio temporal do CORE-028 no PAI, comprovar ausência de efeitos externos no ramo bloqueado e preparar a migração controlada do CORE-029; executar CORE-026 e CORE-027 para tratar performance e limites do DDL histórico antes de outra migração funcional.
