# PEL — aplicação informada da decisão observacional

Data do registro: 19/11/2026.

O operador confirmou que aplicou manualmente o node `Decisão Autônoma Editorial PEL v0.1.0` ao fluxo PEL em produção. Uma primeira saída foi recebida; a confirmação da persistência e do roteamento final continua pendente.

Este registro documenta o relato do operador e o JSON de execução fornecido; não é verificação independente da instância n8n. Ainda não foi fornecido export posterior à aplicação nem a execução completa dos nodes seguintes.

## Primeira amostra recebida

O JSON colado pelo operador contém a saída com `decisao_autonoma_pel` para um candidato recebido como `CHECK_SIMILARITY`:

- 310 comparáveis recebidos; `duplicate_exact` igual a zero.
- Vocabulário v0.1.0 carregado da fonte BANCO; nenhuma faceta reconhecida no candidato.
- Similaridade lexical: `NOVO`, 10,64%. Análise contextual PEL: `INDETERMINADO`.
- O novo node executou e retornou `INDETERMINADO`, confiança `BAIXA`, motivo `EVIDENCIA_INSUFICIENTE_PARA_CLASSIFICAR` e revisão humana necessária.
- As flags observadas foram `aplicado_automaticamente: false`, `altera_status_core: false`, `altera_roteamento: false` e `publica_ou_finaliza: false`.

O resultado é coerente com a evidência apresentada: nenhum dos três comparáveis contextuais trouxe relação positiva; um tinha apenas um token comum e os demais não apresentaram correspondência lexical no TOP 3. A recomendação conservadora não converteu ausência de evidência em `NOVO` nem alterou o status lexical.

### Limites e ajuste identificado

- Dois dos três comparáveis contextuais retornaram `score_lexical: null` e `tokens_comuns: null`. O node v0.1.0 procura essas métricas apenas no TOP 3 lexical, enquanto a análise contextual pode selecionar outros itens dentre os 310 comparáveis. O resultado final permaneceu indeterminado, mas a trilha explicativa desses pares ficou incompleta.
- Este snapshot não contém a resposta de `SQL | Persiste Observação`, nem a saída após `SWITCH | Similaridade Editorial`; portanto ainda não comprova gravação da recomendação nem o ramo funcional percorrido.
- A janela contém 310 comparáveis, mas a completude do histórico não foi comprovada.

Validação parcial: execução e contrato observacional confirmados neste snapshot; persistência, roteamento final e avaliação editorial humana continuam pendentes. Corrigir ou explicitar a ausência das métricas lexical/contextual nos pares fora do TOP 3 lexical antes de interpretar consenso por par.

## Validação pendente

- Confirmar que `SWITCH | Similaridade Editorial` continuou roteando pelo status lexical original.
- Confirmar que `SQL | Persiste Observação` gravou `decisao_autonoma_pel` junto das demais evidências.
- Conferir uma amostra com vocabulário carregado e, se ocorrer naturalmente, um caso de vocabulário indisponível ou evidência insuficiente.
- Comparar sugestão, status lexical e revisão editorial humana; não usar a sugestão como rótulo.

## Estado

`CORE-031` permanece EM ANDAMENTO. A implantação do node em produção foi confirmada pelo operador, e esta amostra confirma a emissão da recomendação. Persistência, roteamento final e qualidade editorial aguardam evidências adicionais.

Referências: [implementação v0.1.0](2026-11-18-PEL-DECISAO-AUTONOMA-IMPLEMENTACAO.md), [alinhamento](2026-11-18-PEL-DECISAO-AUTONOMA-ALINHAMENTO.md) e [backlog](../planejamento/BACKLOG.md).
