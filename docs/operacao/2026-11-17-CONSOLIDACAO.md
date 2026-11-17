# Consolidação das atividades — 17/11/2026

Este registro reúne o estado documentado no repositório entre 21/10 e 12/11/2026. A data deste arquivo é a data da consolidação, não a data de execução de atividades em produção.

## M360

- A base de alertas SUSPEITO foi ampliada para 98 candidatos e 294 pares. Ainda não há rotulagem humana completa; os dados apoiam análise de casos, sem medir precisão ou recall.
- `CORE-028` evoluiu a validade temporal e o rollout node a node. Os registros relatam gate, retorno terminal e testes de caminhos no SUB/PAI. Permanece pendente comprovar o ramo `BLOQUEAR` no fluxo pai, incluindo continuidade do loop e ausência de efeitos externos, além de monitoramento e rollback.
- `CORE-029` registra vocabulário e facetas no banco, com regras 73/74 ativas segundo evidência do operador e versões de normalização/similaridade avaliadas nos registros indicados no backlog. As sugestões contextuais continuam observacionais; falta avaliação editorial humana antes de promoção.
- Continuam pendentes a saída real do Extrator e seus subfluxos, snapshots dos ramos, validação de carga/limites do histórico legado (`CORE-026`/`CORE-027`) e os contratos semânticos da Sprint sombra.

## PEL

- `CORE-030` reúne normalização da entrada, consulta de vocabulário, análise contextual v0.5.1 em observação, persistência de observações e referências a publicações WordPress.
- O checkpoint de 12/11 registra evidências de vínculos WordPress para candidatos novos e preserva a similaridade lexical v0.4.0 como responsável pela decisão.
- Permanecem pendentes testes isolados de falhas e conflitos na persistência, rótulos humanos, cobertura do vínculo com histórico, avaliação de sinais fortes e confirmação do status WordPress antes de finalizar automaticamente como `PUBLICADO`.
- Não há evidência de export atualizado do workflow, de teste completo de falha nem de envio do alerta de observação nos materiais consolidados.

## Limites e governança

- Os checkpoints refletem artefatos e relatos registrados; não são prova independente do estado atual dos ambientes n8n ou MySQL.
- Nenhuma alteração de produção foi feita como parte desta consolidação.
- As sugestões semânticas permanecem em observação. Decisões editoriais exigem validação humana e evidência por classe antes de qualquer automação.
- A referência remota consolidada nesta atualização era `main` no commit `a0c4d8a` (`docs(pel): consolidar evolucao e evidencias do core`, 12/11/2026).

## Próxima sequência recomendada

1. Completar evidência do `CORE-028` no fluxo pai, incluindo bloqueio, avanço do loop e ausência de chamadas ao Extrator/WordPress.
2. Tratar falhas e conflitos do `CORE-030` em ambiente isolado e validar status real do WordPress antes da finalização.
3. Coletar decisões editoriais humanas para amostras M360 e PEL antes de ajustar sinais, limiares ou promover sugestões contextuais.
4. Concluir dependências da S20-01 e executar `CORE-026`/`CORE-027` com planos e volume observados no MySQL de homologação.

## Referências

- [Backlog consolidado](../planejamento/BACKLOG.md)
- [Checkpoint PEL de 12/11](2026-11-12-PEL-CHECKPOINT.md)
- [Rollout temporal M360](CORE-028-ROLLOUT-M360-NODE-A-NODE.md)
- [Checkpoint operacional M360 de 29/10](2026-10-29-M360-CHECKPOINT.md)
