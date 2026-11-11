# PEL: persistencia de analise em observacao

Preparacao para aplicacao manual; nao executada no banco ou n8n. Primeiro criar a tabela do arquivo `sql/editorial/tables/PEL_analise_observacao.sql` no banco PEL e conferir `SHOW CREATE TABLE`. Nao altera a tabela de revisao anteriormente proposta, cujo estado de criacao no banco nao foi confirmado.

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
