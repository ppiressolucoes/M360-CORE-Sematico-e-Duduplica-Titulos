# Backlog consolidado — Core Semântico e Deduplicação de Títulos

Última atualização: 20/10/2026.

## Objetivo e escopo

Este backlog coordena a evolução dos fluxos n8n e das Stored Procedures MySQL do Core Editorial. A etapa atual é de desenho, telemetria e validação. Nenhuma iniciativa abaixo autoriza alteração direta de produção, publicação de conteúdo ou aplicação automática de uma hipótese analítica.

O [índice acumulado de evidências](../telemetria/m360-indice.json) contém 51 candidatos e 153 pares provenientes de alertas do ramo `SUSPEITO`. Os casos não possuem validação humana completa e não representam os ramos `NOVO` e `DUPLICADO`; por isso, ainda não permitem medir precisão ou recall do Core.

## Convenções

| Estado | Significado |
| --- | --- |
| `CONCLUÍDO` | Evidência e artefato foram incorporados ao repositório |
| `PRONTO` | Escopo definido e sem dependência conhecida para iniciar |
| `DEPENDÊNCIA` | Requer artefato, acesso ou decisão ainda não disponível |
| `PLANEJADO` | Depende de itens anteriores |

Prioridade `P0` protege rastreabilidade ou operação; `P1` entrega a nova capacidade analítica; `P2` promove a capacidade depois de validada.

## Agora — referência e contratos

| ID | Prioridade | Estado | Iniciativa | Critério de aceite / dependência |
| --- | --- | --- | --- | --- |
| CORE-001 | P0 | CONCLUÍDO | Consolidar os três lotes de alertas M360 | 51 candidatos, 153 pares, hashes e análises disponíveis no índice acumulado |
| CORE-002 | P0 | CONCLUÍDO | Reconciliar o export M360 mais recente | Cópia pública desativada e sanitizada; ramo `NOVO` aponta para `Chamar Extrator Editorial`; retorno inclui `resultado` |
| CORE-020 | P0 | CONCLUÍDO | Formalizar governança e sincronização do repositório | Política versionada; backlog e histórico obrigatórios na mesma entrega; commit publicado e HEAD remoto verificado |
| CORE-021 | P0 | CONCLUÍDO | Organizar artefatos gerais das sprints | Exports JSON preservados; oito Code nodes extraídos e organizados por fluxo; inventário SQL identifica SPs presentes e ausentes |
| CORE-003 | P0 | DEPENDÊNCIA | Incorporar as SPs editoriais vigentes | Obter `SHOW CREATE PROCEDURE` ou scripts versionados de `SP_DEDUPLICA_EDITORIAL` e `SP_DEDUPLICA_EDITORIAL_FINALIZA`; remover `DEFINER` antes do Git público |
| CORE-004 | P0 | DEPENDÊNCIA | Confirmar o contrato do subfluxo chamado pelo ramo `NOVO` | Registrar ID, nome e contrato de entrada/saída do `Chamar Extrator Editorial` na instância n8n, sem publicar credenciais |
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
| CORE-013 | P1 | PLANEJADO | Reprocessar a base histórica | Executar 51 candidatos e 153 pares sem acesso de escrita à produção; comparar decisões antiga e sombra com relatório reproduzível |
| CORE-014 | P1 | PRONTO | Criar coleta de decisão humana | Registrar classe, par determinante, motivo, observação, responsável e data; não reutilizar a sugestão automática como rótulo humano |

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

## Critérios de segurança para qualquer promoção

- O fluxo atual permanece como fonte de verdade durante a fase sombra.
- A nova execução usa tabelas e SPs analíticas separadas.
- Toda decisão registra entrada, versão, regras, bloqueadores e evidências.
- Falha ou baixa confiança resulta em revisão; nunca em publicação automática.
- A decisão final considera todos os pares relevantes, e não apenas o TOP1.
- A avaliação inclui amostras humanas dos ramos `NOVO`, `SUSPEITO` e `DUPLICADO`.
- Cada promoção possui feature flag, canário, monitoramento e rollback verificado.

## Próxima entrega recomendada

Executar CORE-003 a CORE-006: versionar as SPs editoriais vigentes, confirmar o contrato do Extrator Editorial e aprovar os contratos de contexto e de decisão. Esses artefatos permitem desenhar o DDL e o fluxo sombra sem adivinhar o comportamento da produção.
