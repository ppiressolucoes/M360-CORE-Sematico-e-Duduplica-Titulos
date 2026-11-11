# PEL: persistencia de analise em observacao

Atualizacao: o operador confirmou a criacao e a gravacao de analises nessa tabela. A [migracao incremental](../../sql/editorial/migrations/PEL_analise_observacao_referencias_wp.sql) prepara quatro campos opcionais de WordPress sem alterar registros existentes; ainda nao foi executada. A tabela auxiliar de referencias originalmente proposta foi substituida por esta abordagem.

Cada linha continua pertencendo a uma execucao/versao especifica. Uma futura atualizacao WordPress deve localizar a linha por `analise_id` ou pela chave completa `(dsc_portal, registro_id, dsc_execucao_id, versao_analise)`, nunca atualizar todas as analises do candidato. `wp_post_id` e o ID interno do WordPress, distinto de `dsc_post_id` da fonte. `wp_status` e `wp_confirmado_utc` devem refletir uma resposta confirmada do WordPress; draft nao significa publicado. Sem resposta, campos permanecem NULL. Repeticoes e respostas fora de ordem exigem regra de atualizacao idempotente antes de integrar.

O JSON atual inclui apenas os campos de `candidato` efetivamente recebidos; resumo e data da fonte nao sao garantidos. Antes de armazenar novos campos, verificar sua passagem pelo normalizador e manter proveniencia e truncamento claros. Nao atualizar JSON historico nem presumir vinculo WordPress para execucoes antigas. Esta tabela de analise nao e inventario completo das publicacoes: inclui somente o ramo que passou pela analise e gravou com sucesso.

O fluxo publicador e a captura das decisoes humanas ainda nao foram ligados a estes campos. Necessario inspecionar resposta real de draft e publish, definir tratamento de erro, ordem de eventos e validacao isolada antes de usar os campos como autoridade operacional.

Contrato original da gravacao, cuja tabela e primeiras execucoes foram confirmadas pelo operador. Nao altera a tabela de revisao anteriormente proposta, cujo estado de criacao no banco nao foi confirmado.

Adicionar um ramo de auditoria a partir de `Análise Editorial PEL v0.5.1`; manter a ligacao existente da analise ao `SWITCH | Similaridade Editorial`. A escrita deve usar a credencial do banco PEL, modo uma execucao por item, query parametrizada e politica de erro explicitamente monitorada. Uma falha de gravacao nao comprova que o candidato tenha sido bloqueado ou concluido. Nao ligar a saida MySQL novamente ao switch, pois ela nao contem o candidato original.

Query para o node MySQL, usando marcadores numerados como validados no ambiente PEL:

```sql
INSERT INTO ADM_analise_editorial_observacao
  (dsc_portal, registro_id, dsc_execucao_id, versao_analise, dados_json, criado_utc)
VALUES ($1, $2, $3, $4, $5, UTC_TIMESTAMP())
ON DUPLICATE KEY UPDATE analise_id = analise_id;
```

Em Options -> Query Parameters, usar expressao:

```javascript
{{ [
  'PEL',
  $json.registro_id,
  String($execution.id),
  $json.analise_editorial_pel.versao,
  JSON.stringify({
    candidato: $json.candidato,
    decisao_lexical: $json.duplicidade_editorial,
    analise: $json.analise_editorial_pel,
    vocabulario: {
      versao: $json.vocabulario_editorial?.versao ?? null,
      total_regras: $json.contexto_vocabulario_pel?.total_regras ?? null,
      status: $json.contexto_vocabulario_pel?.status ?? null
    }
  })
] }}
```

Uma linha representa a analise TOP 3 de uma execucao, inclusive quando nao ha comparavel ou a relacao e INDETERMINADO. O JSON inclui a saida lexical e evidencias; nao armazena automaticamente os 300 titulos fora do TOP. A chave torna repeticao da mesma execucao e versao uma operacao sem mudanca; outra execucao gera outra linha. O conflito nao substitui dados, mesmo que uma repeticao apresente payload diferente: investigar divergencias pelo identificador de execucao.

Validar em ambiente isolado: escrita de uma analise, repeticao idempotente, caso sem comparavel, preservacao de acentos e apostrofos, falha de banco e continuidade do ramo funcional, sem publicar conteudo de teste. A integracao com WordPress e a captura de decisoes humanas ainda nao foram implementadas. Dados de decisao humana devem permanecer separados das sugestoes automaticas.
