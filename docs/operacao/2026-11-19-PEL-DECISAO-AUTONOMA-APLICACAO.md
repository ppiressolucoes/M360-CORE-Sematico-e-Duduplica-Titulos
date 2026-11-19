# PEL — aplicação informada da decisão observacional

Data do registro: 19/11/2026.

O operador informou que aplicou manualmente o node `Decisão Autônoma Editorial PEL v0.1.0` ao fluxo n8n PEL. A próxima passagem de candidato está pendente para validar a execução e a persistência da saída observacional.

Este registro documenta o relato do operador; não é verificação independente da instância n8n. Ainda não foi fornecido export posterior à aplicação nem uma execução de candidato com a saída do novo node.

## Validação pendente

- Confirmar que o node recebeu a saída completa de `Análise Editorial PEL v0.5.1` e preservou o JSON recebido.
- Confirmar que `SWITCH | Similaridade Editorial` continuou roteando pelo status lexical original.
- Confirmar que `SQL | Persiste Observação` gravou `decisao_autonoma_pel` junto das demais evidências.
- Conferir uma amostra com vocabulário carregado e, se ocorrer naturalmente, um caso de vocabulário indisponível ou evidência insuficiente.
- Comparar sugestão, status lexical e revisão editorial humana; não usar a sugestão como rótulo.

## Estado

`CORE-031` permanece EM ANDAMENTO. A aplicação do node foi informada; comportamento em execução, gravação e qualidade das recomendações aguardam evidência da próxima passagem de candidato.

Referências: [implementação v0.1.0](2026-11-18-PEL-DECISAO-AUTONOMA-IMPLEMENTACAO.md), [alinhamento](2026-11-18-PEL-DECISAO-AUTONOMA-ALINHAMENTO.md) e [backlog](../planejamento/BACKLOG.md).
