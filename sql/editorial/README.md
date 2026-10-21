# Stored Procedures de deduplicação editorial

Origem informada: ambiente **Mengão 360**, exportado em 21/10/2026.

## Arquivos

| Procedure | Arquivo | SHA-256 |
| --- | --- | --- |
| `SP_DEDUPLICA_EDITORIAL` | [`SP_DEDUPLICA_EDITORIAL.sql`](SP_DEDUPLICA_EDITORIAL.sql) | `a583fcc92c4917014c6187ad37efa03d212ec51c67871ab489ee02d314efde53` |
| `SP_DEDUPLICA_EDITORIAL_FINALIZA` | [`SP_DEDUPLICA_EDITORIAL_FINALIZA.sql`](SP_DEDUPLICA_EDITORIAL_FINALIZA.sql) | `0396db414505f4f9762ac77f77bb95c70eea897add9219c18b31c0bc77c40790` |

Apenas a cláusula `DEFINER` foi removida. O corpo, parâmetros, comentários e consultas foram preservados. Os arquivos são referências de implementação e não incluem comandos `DROP`, seleção de schema ou delimitadores do cliente MySQL.

## Compatibilidade observada

O workflow M360 chama `SP_DEDUPLICA_EDITORIAL` com sete argumentos compatíveis com a assinatura recebida e chama `SP_DEDUPLICA_EDITORIAL_FINALIZA` com quatro argumentos compatíveis.

A SP principal valida explicitamente `p_portal = 'M360'`. Ela não deve ser assumida como implementação do PEL, mesmo que o export PEL use procedures com os mesmos nomes.

## Dependências de schema

As procedures usam:

- `ADM_deduplica_editorial` para reserva, lease e estado;
- `titulos_deduplica` como histórico de títulos e fonte de comparáveis;
- uma restrição ou índice que torne `dsc_chave_dedup` único para que `INSERT IGNORE` implemente a reserva atômica pretendida.

O DDL dessas tabelas e seus índices ainda não está no repositório. Até sua incorporação, atomicidade, performance e compatibilidade de tipos não estão completamente comprovadas.

## Aplicação

Antes de instalar em qualquer ambiente:

1. confirmar schema e versão do MySQL;
2. revisar privilégios do usuário invocador;
3. validar DDL e índices das tabelas dependentes;
4. envolver a definição com o delimitador exigido pelo cliente usado;
5. testar em homologação os ramos de reserva, retomada, duplicidade e finalização;
6. registrar versão, resultado e plano de rollback.

O versionamento dessas definições não autoriza execução no MySQL. A análise funcional está em [SPs editoriais M360 v0.2.2](../../docs/arquitetura/sp-deduplicacao-editorial-m360-v0.2.2.md).
