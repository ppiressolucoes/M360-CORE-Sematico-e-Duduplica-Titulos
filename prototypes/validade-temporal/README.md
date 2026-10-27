# Protótipo de validade temporal

Especificação executável da iniciativa `CORE-028`. A regra central é pura e não usa dependências externas. O Core v0.5.0 inclui um adaptador para Code node n8n em modo `OBSERVACAO`; o export permanece inativo e não foi importado nem executado em serviços.

## Executar

Na raiz do repositório:

```bash
node --test prototypes/validade-temporal/validade-temporal.test.js
node --test prototypes/validade-temporal/workflow-integration.test.js
node --test prototypes/validade-temporal/validate-rollout-checkpoint.test.js
node prototypes/validade-temporal/replay-datasets.js
```

O replay usa `data_analise` apenas como instante simulado de avaliação. Ele não inventa uma data original para os candidatos e evidencia separadamente a ausência dessa âncora.

## Escopo

O protótipo:

- recebe título, contexto, `iso_date`/`data`, instante de avaliação e timezone;
- resolve `hoje`, `amanhã`, `ontem`, dias da semana, datas `dd/mm[/aaaa]` e datas por extenso em português;
- separa conteúdo de serviço pré-evento de resultado pós-evento;
- reconhece sinais de resultado em português e inglês, como vitória, eliminação, vaga, pênaltis e melhores momentos;
- retorna `VALIDO`, `EXPIRADO` ou `INDETERMINADO` com evidências auditáveis;
- exige instante de avaliação explícito para que o replay seja determinístico;
- mantém `aplicado_automaticamente: false`.

## Integração de referência — Core v0.5.0

Os geradores reproduzíveis criam e sincronizam os artefatos revisáveis:

```bash
node prototypes/validade-temporal/build-n8n-code.js
node prototypes/validade-temporal/build-workflow.js
```

O workflow resultante executa `Start Dedup → Validade Temporal v0.1.0 → SP_DEDUPLICA_EDITORIAL`. O normalizador v0.3.0 e o retorno final preservam `core_versao: 0.5.0` e `validade_temporal`. `VALIDO`, `EXPIRADO` e `INDETERMINADO` seguem pela mesma saída para a SP: a integração mede o diagnóstico, mas ainda não altera a decisão funcional.

Para aplicação operacional, o [runbook M360 node a node](../../docs/operacao/CORE-028-ROLLOUT-M360-NODE-A-NODE.md) divide o alvo nos checkpoints `M360-T0` a `M360-T5`. `validate-rollout-checkpoint.js` verifica os exports sanitizados de T0 a T4 antes do avanço.

Ele ainda não:

- roteia ou bloqueia itens por estado temporal;
- valida o contrato do fluxo pai;
- consulta calendários ou horários externos;
- resolve eventos que atravessam a meia-noite;
- define a política final para agendas com datas mistas.

Antes da promoção para bloqueio, a semântica real dos campos `data` e `iso_date` precisa ser confirmada com snapshots sanitizados e tráfego representativo.
