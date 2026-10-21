# SQL de deduplicação editorial

Origem informada: ambiente **Mengão 360**, exportado em 21/10/2026.

## Stored Procedures

| Procedure | Arquivo | SHA-256 |
| --- | --- | --- |
| `SP_DEDUPLICA_EDITORIAL` | [`SP_DEDUPLICA_EDITORIAL.sql`](SP_DEDUPLICA_EDITORIAL.sql) | `a583fcc92c4917014c6187ad37efa03d212ec51c67871ab489ee02d314efde53` |
| `SP_DEDUPLICA_EDITORIAL_FINALIZA` | [`SP_DEDUPLICA_EDITORIAL_FINALIZA.sql`](SP_DEDUPLICA_EDITORIAL_FINALIZA.sql) | `0396db414505f4f9762ac77f77bb95c70eea897add9219c18b31c0bc77c40790` |

Apenas a cláusula `DEFINER` foi removida. O corpo, parâmetros, comentários e consultas foram preservados. Os arquivos são referências de implementação e não incluem comandos `DROP`, seleção de schema ou delimitadores do cliente MySQL.

## Estruturas de tabelas

| Tabela | Arquivo | SHA-256 |
| --- | --- | --- |
| `ADM_deduplica_editorial` | [`tables/ADM_deduplica_editorial.sql`](tables/ADM_deduplica_editorial.sql) | `f19a86dde7ebb2626306f348bbdf0e062df1fd43eddbb2f07295260fa8df4566` |
| `titulos_deduplica` | [`tables/titulos_deduplica.sql`](tables/titulos_deduplica.sql) | `574f7828f4259b5918796de5e94ab0307b29e60a98f51463765da136a3146e18` |

Os DDLs preservam colunas, tipos, defaults, chaves, índices, engine, charset e collation recebidos. Somente o próximo valor de `AUTO_INCREMENT`, que representa estado mutável da instância, foi removido.

## Compatibilidade observada

O workflow M360 chama `SP_DEDUPLICA_EDITORIAL` com sete argumentos compatíveis com a assinatura recebida e chama `SP_DEDUPLICA_EDITORIAL_FINALIZA` com quatro argumentos compatíveis.

A SP principal valida explicitamente `p_portal = 'M360'`. Ela não deve ser assumida como implementação do PEL, mesmo que o export PEL use procedures com os mesmos nomes.

## Dependências de schema

As procedures usam:

- `ADM_deduplica_editorial` para reserva, lease e estado;
- `titulos_deduplica` como histórico de títulos e fonte de comparáveis;
- a chave única `uq_adm_dedup_editorial_chave (dsc_chave_dedup)` para que `INSERT IGNORE` implemente a reserva atômica pretendida.

Os tipos da tabela administrativa correspondem aos parâmetros e variáveis das procedures. A tabela histórica possui duas diferenças relevantes: `txt_categoria` aceita 45 caracteres, enquanto a entrada aceita 100, e `dsc_URL_origem` aceita 255 caracteres, enquanto a entrada aceita 500. A SP não grava nessa tabela, mas qualquer processo que forme o histórico precisa tratar esses limites para evitar truncamento ou rejeição.

`titulos_deduplica` tem apenas uma chave única em `id`; não declara `PRIMARY KEY` nem índice em `dth_executado`, origem ou post ID. Assim, o filtro de janela dos comparáveis pode percorrer toda a tabela. A busca exata também aplica funções à origem e ao post ID, o que impede o aproveitamento direto de índices simples nesses campos. Qualquer alteração de índice deve passar por `EXPLAIN`, medição de volume e homologação; os DDLs desta pasta registram o baseline recebido sem propor migração.

## Aplicação

Antes de instalar em qualquer ambiente:

1. confirmar schema e versão do MySQL;
2. revisar privilégios do usuário invocador;
3. validar os índices com o volume e os planos de execução do ambiente de destino;
4. envolver a definição com o delimitador exigido pelo cliente usado;
5. testar em homologação os ramos de reserva, retomada, duplicidade e finalização;
6. registrar versão, resultado e plano de rollback.

O versionamento dessas definições não autoriza execução no MySQL. A análise funcional está em [SPs editoriais M360 v0.2.2](../../docs/arquitetura/sp-deduplicacao-editorial-m360-v0.2.2.md).
