# Rollout M360 node a node — validade temporal

Data da decisão: 27/10/2026.

Iniciativa: `CORE-028`.

Workflow exclusivo: `SUB | Deduplicação e Semântica - M360 [ Core Editorial ]`.

## Decisão de escopo

A validação temporal será aplicada primeiro no M360, onde se concentra a maior recorrência de alertas analisados. O fluxo PEL, as Stored Procedures, os thresholds de similaridade, o consenso editorial e o Extrator Editorial ficam fora deste rollout.

O [export Core v0.5.0](../../workflows/m360-deduplicacao-semantica.json) é o alvo técnico consolidado, não uma instrução para substituição integral do workflow ativo. A aplicação operacional deve avançar pelos checkpoints abaixo, um node por vez.

## Progresso

| Checkpoint | Estado | Evidência / dependência |
| --- | --- | --- |
| `M360-T0` | CONCLUÍDO | [Baseline produtivo sanitizado e validado em 27/10/2026](2026-10-27-CORE-028-M360-T0.md) |
| `M360-T1` | EM ANDAMENTO | [Node criado conforme relato operacional](2026-10-27-CORE-028-M360-T1-INICIO.md); aguardando export sanitizado e testes isolados; deve permanecer desconectado |
| `M360-T2` | PLANEJADO | Depende do aceite de T1 |
| `M360-T3` | PLANEJADO | Depende do aceite de T2 |
| `M360-T4` | DEPENDÊNCIA | Requer contrato do fluxo pai |
| `M360-T5` | PLANEJADO | Depende do aceite de T0–T4 e janela operacional |

## Invariantes de segurança

- Trabalhar primeiro em uma cópia inativa do workflow M360.
- Congelar e guardar um export sanitizado do workflow vigente antes de qualquer edição.
- Manter `modo: OBSERVACAO` e `aplicado_automaticamente: false`.
- Não criar saída de bloqueio para `EXPIRADO` ou `INDETERMINADO` nesta fase.
- Não modificar SP, switch, threshold, consenso, alerta, Extrator ou fluxo pai no mesmo checkpoint.
- Não usar `pinData`, credenciais, payloads reais ou identificadores operacionais no repositório.
- Promover somente um checkpoint por janela; o próximo começa após aceite e evidência do anterior.
- Em qualquer divergência funcional, executar o rollback do checkpoint antes de investigar.

## Checkpoints

### M360-T0 — Congelar o estado vigente

1. Exportar o workflow ativo antes da edição.
2. Criar uma cópia inativa para ensaio.
3. Sanitizar o export, calcular SHA-256 e registrar data/hora em `America/Sao_Paulo`.
4. Confirmar a rota vigente `Start Dedup → SP DEDUPLICA EDITORIAL | M360`.
5. Registrar volume, erros e latência do período usado como comparação.

Gate: export reproduzível, rollback disponível e nenhuma edição funcional realizada.

Rollback: não se aplica; este checkpoint é somente leitura.

### M360-T1 — Adicionar `Validade Temporal v0.1.0` desconectado

1. Criar somente o Code node usando [`validade-temporal-v0.1.0.js`](../../codes/m360/validade-temporal-v0.1.0.js).
2. Manter o node sem entrada e sem saída.
3. Executá-lo isoladamente na cópia inativa com casos sanitizados:
   - pauta de serviço passada → `EXPIRADO`;
   - resultado pós-evento → `VALIDO`;
   - `hoje` sem data original → `INDETERMINADO`.
4. Confirmar que título, link e campos adicionais são preservados na saída.

Gate: os três estados são auditáveis, nenhum node externo é chamado e o fluxo original continua intacto.

Rollback: remover o node desconectado.

### M360-T2 — Conectar a observação antes da SP

1. Alterar somente a aresta de entrada para `Start Dedup → Validade Temporal v0.1.0 → SP DEDUPLICA EDITORIAL | M360`.
2. Manter temporariamente `Normaliza Deduplica Editorial v0.2.2` e o `Retorno Final` vigente.
3. Confirmar que o node temporal possui uma única saída e que todos os estados seguem para a SP.
4. Executar casos controlados na cópia inativa e comparar, antes/depois:
   - chamada e retorno da SP;
   - `resultado` e `duplicate_exact`;
   - quantidade e conteúdo dos comparáveis;
   - ramo selecionado no `SWITCH | Resultado`.

Gate: zero divergência funcional e zero nova falha nos casos controlados. A latência adicional deve ser medida e registrada, sem limite inventado durante a execução.

Rollback: reconectar `Start Dedup` diretamente à SP e desconectar o node temporal.

### M360-T3 — Atualizar somente o normalizador

1. Substituir o Code node pela versão [`Normaliza Deduplica Editorial v0.3.0`](../../codes/m360/normaliza-deduplica-editorial-v0.3.0.js).
2. Não alterar nenhum outro node ou conexão.
3. Comparar a saída com a v0.2.2, admitindo apenas os novos campos:
   - `core_versao: 0.5.0`;
   - `validade_temporal` no topo;
   - os mesmos campos dentro de `candidato`.
4. Confirmar que `resultado`, identificadores, comparáveis e roteamento permanecem iguais.

Gate: contrato anterior preservado e diagnóstico temporal disponível até o switch.

Rollback: restaurar o código e o nome `Normaliza Deduplica Editorial v0.2.2`.

### M360-T4 — Expor auditoria no retorno

Pré-requisito obrigatório: confirmar que o fluxo pai tolera campos adicionais no retorno.

1. Atualizar somente `Retorno Final` com [`retorno-final.js`](../../codes/m360/retorno-final.js).
2. Confirmar que `concluido`, `resultado` e `workflow` não mudaram.
3. Validar que `core_versao` e `validade_temporal` chegam ao fluxo pai sem alterar sua decisão.

Gate: fluxo pai comprovadamente compatível e resultado funcional idêntico.

Rollback: restaurar o Code node de retorno congelado em M360-T0.

### M360-T5 — Observação controlada

Somente após T0–T4 aprovados, aplicar os mesmos deltas, na mesma ordem, ao workflow M360 da janela operacional acordada. Após cada checkpoint:

1. interromper a sequência;
2. verificar execuções, erros, latência e contagem por ramo;
3. registrar evidência sanitizada;
4. obter aceite operacional antes do próximo node.

Durante T5, `EXPIRADO` e `INDETERMINADO` continuam pelo fluxo existente. O objetivo é medir cobertura e segurança do contrato, não impedir publicação.

## Critérios de parada imediata

- erro novo no Code node temporal ou no normalizador;
- item que deixe de chegar à SP;
- mudança em `resultado`, `duplicate_exact`, comparáveis ou ramo selecionado;
- falha ou rejeição no fluxo pai;
- chamada diferente ao Extrator Editorial;
- crescimento de latência sem medição e aceite;
- ausência de evidência suficiente para comparar antes/depois.

Qualquer critério implica rollback do último checkpoint. A investigação ocorre depois que a rota anterior estiver restabelecida.

## Evidência mínima por checkpoint

Registrar sem payload bruto:

| Campo | Conteúdo |
| --- | --- |
| Checkpoint | `M360-T0` a `M360-T5` |
| Ambiente | cópia inativa, homologação ou produção |
| Data/hora | `America/Sao_Paulo` |
| Responsável | operador da mudança |
| Hash antes/depois | SHA-256 dos exports sanitizados |
| Alteração | único node ou aresta modificada |
| Casos executados | quantidade e classes, sem conteúdo sensível |
| Resultado | aprovado, reprovado ou rollback |
| Métricas | erros, latência e contagem por ramo |
| Observação | divergências e decisão de avanço |

## Validação automatizada dos exports

Depois de sanitizar cada export intermediário:

```bash
node prototypes/validade-temporal/validate-rollout-checkpoint.js M360-T0 caminho/do/export.json
node prototypes/validade-temporal/validate-rollout-checkpoint.js M360-T1 caminho/do/export.json
node prototypes/validade-temporal/validate-rollout-checkpoint.js M360-T2 caminho/do/export.json
node prototypes/validade-temporal/validate-rollout-checkpoint.js M360-T3 caminho/do/export.json
node prototypes/validade-temporal/validate-rollout-checkpoint.js M360-T4 caminho/do/export.json
```

O validador verifica escopo M360, sanitização, nodes esperados, topologia e contratos mínimos. Ele não comprova importação, execução no n8n nem segurança produtiva; essas evidências devem ser registradas separadamente.

## Fora deste rollout

Bloqueio de `EXPIRADO`, fila de revisão para `INDETERMINADO`, feature flag e retorno `EVENTO_EXPIRADO` pertencem a uma promoção posterior. Ela só começa após snapshots com data original, observação representativa, contrato do fluxo pai e rollback comprovado.
