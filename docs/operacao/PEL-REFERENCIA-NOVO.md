# PEL: registrar referencia WordPress em NOVO

Preparado para aplicacao manual, nao implantado. A resposta observada de `Chamar Publicar Editorial` possui `id`, `link`, `status: publish`. O codigo `codes/pel/prepara-referencia-publicada-v0.1.0.js` usa esse retorno e recupera o item pareado de `Análise Editorial PEL v0.5.1`, no mesmo workflow. O nome deve ser exatamente igual ao node real. Configurar o Code em Run Once for Each Item. Apenas post `publish` e URL HTTPS do site PEL sao aceitos; draft/erro segue para tratamento proprio, nunca para esta gravacao.

Manter os ramos funcionais existentes apos o publicador. Acrescentar uma derivacao: `Chamar Publicar Editorial -> Prepara Referência Publicada PEL -> SQL | Persiste Referência Publicada`. Nao conectar a saida da escrita ao caminho de finalizacao existente. Configure tratamento de erro monitorado e teste em ambiente isolado: a derivacao visual nao garante continuidade se ocorrer erro nem ordem entre ramos. Nao executar publicacao de teste em producao.

No MySQL, query parametrizada:

```sql
INSERT INTO ADM_analise_editorial_observacao
 (dsc_portal, registro_id, dsc_execucao_id, versao_analise, dados_json, criado_utc,
  wp_post_id, wp_url, wp_status, wp_confirmado_utc)
VALUES ($1, $2, $3, $4, $5, UTC_TIMESTAMP(), $6, $7, $8, UTC_TIMESTAMP())
ON DUPLICATE KEY UPDATE
 wp_url = IF(wp_post_id IS NULL OR wp_post_id = VALUES(wp_post_id), VALUES(wp_url), wp_url),
 wp_status = IF(wp_post_id IS NULL OR wp_post_id = VALUES(wp_post_id), VALUES(wp_status), wp_status),
 wp_confirmado_utc = IF(wp_post_id IS NULL OR wp_post_id = VALUES(wp_post_id), UTC_TIMESTAMP(), wp_confirmado_utc),
 wp_post_id = IF(wp_post_id IS NULL OR wp_post_id = VALUES(wp_post_id), VALUES(wp_post_id), wp_post_id);
```

Query Parameters como expressao:

```javascript
{{ [ $json.portal, $json.registro_id, $json.execucao_id,
     $json.versao_analise, $json.dados_json,
     $json.wp_post_id, $json.wp_url, $json.wp_status ] }}
```

O insert cobre a situacao em que o ramo da publicacao chegue antes da gravacao de observacao; se ela ja existir, atualiza apenas os campos WP. O insert de observacao existente nao sobrescreve os campos WP. Chave: portal, registro, execucao pai e versao. Na repeticao com mesmo post, a data de confirmacao e atualizada; com post_id diferente, nenhuma referencia WP e trocada. Esse conflito nao gera erro SQL, portanto precisa ser detectado e monitorado por consulta posterior; nao interpretar `success` como prova de correspondencia.

Antes de publicar o desenho, testar em banco isolado ambas as ordens, repeticao, IDs conflitantes, falta de analise, falha de banco e item pairing. Verificar por SELECT a linha completa e conferir o estado e ID no WordPress. Essa etapa nao implementa recuperacao do historico nem revisao humana.
