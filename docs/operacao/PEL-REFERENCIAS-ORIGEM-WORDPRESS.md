# PEL — referências de origem e WordPress

Tabela auxiliar preparada para aplicacao manual: `sql/editorial/tables/PEL_referencia_publicacao.sql`. Nao foi criada no banco nem ligada ao fluxo. Um registro por portal e reserva editorial; sem FK para nao assumir constraints ou relacao de bancos ainda nao verificadas.

## Contrato

- `registro_id` identifica `ADM_deduplica_editorial.id` no mesmo portal. `dsc_post_id` existente e caminho da fonte, nao ID WordPress.
- `titulo_origem`, `url_origem`, `resumo_origem` e `data_publicacao_origem` sao dados informados pelo extrator. A data e texto bruto, nao data do evento; resumo pode ser truncado. NULL significa nao disponivel.
- `wp_post_id`, `wp_url`, `wp_status` e `titulo_publicado` so devem vir de uma resposta confirmada do WordPress PEL. Um ID de draft nao e evidencia de publicacao. `wp_status` deve refletir a ultima resposta confirmada, e falhas de publicacao nao devem ser mascaradas.
- Nenhum resumo ou conteudo completo reescrito e armazenado nesta tabela. Consulta ao WordPress podera enriquecer uma comparacao posterior.

## Integracao pendente

1. Confirmar por uma resposta real do publicador os campos de ID, status, URL e titulo, e como o fluxo os devolve ao Core depois de criar draft ou publicar.
2. Criar escrita parametrizada e idempotente por portal/registro; preservar valores conhecidos quando um dado novo estiver ausente. Tratar eventos fora de ordem para impedir que uma resposta antiga de draft sobrescreva uma publicacao posterior. Essa politica ainda nao foi implementada.
3. Persistir referencia sem finalizar a reserva como PUBLICADO quando o WordPress retornar draft. O ciclo de revisao e as transicoes das SPs ainda precisam ser definidos.
4. Validar em ambiente isolado: ausencia de dados opcionais, criacao de draft, publicacao, falha de API, repeticao, ordenacao e retomada. Nao reprocessar publicacoes antigas.

O registro destas referencias nao e um rotulo humano de duplicidade nem uma decisao automatica. Antes da aplicacao, conferir banco, escopo, tamanho dos dados e a estrutura retornada por `SHOW CREATE TABLE`.
