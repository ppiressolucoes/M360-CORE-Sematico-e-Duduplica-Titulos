# Inventário SQL do Core

## Deduplicação editorial

| Stored Procedure | Utilização observada | Definição no repositório |
| --- | --- | --- |
| `SP_DEDUPLICA_EDITORIAL` | Reserva/consulta do candidato e comparáveis no M360 | [`editorial/SP_DEDUPLICA_EDITORIAL.sql`](editorial/SP_DEDUPLICA_EDITORIAL.sql), versão interna 0.2.2 recebida em 21/10/2026 |
| `SP_DEDUPLICA_EDITORIAL_FINALIZA` | Finalização como `DUPLICADO`, `SUSPEITO`, `PUBLICADO` ou `ERROR` | [`editorial/SP_DEDUPLICA_EDITORIAL_FINALIZA.sql`](editorial/SP_DEDUPLICA_EDITORIAL_FINALIZA.sql), recebida em 21/10/2026 |

| Tabela | Utilização observada | Definição no repositório |
| --- | --- | --- |
| `ADM_deduplica_editorial` | Reserva atômica, lease e estado da decisão | [`editorial/tables/ADM_deduplica_editorial.sql`](editorial/tables/ADM_deduplica_editorial.sql), recebida em 21/10/2026 |
| `titulos_deduplica` | Histórico legado e fonte de comparáveis | [`editorial/tables/titulos_deduplica.sql`](editorial/tables/titulos_deduplica.sql), recebida em 21/10/2026 |

As assinaturas recebidas são compatíveis com as chamadas do workflow M360. Os arquivos de procedure foram versionados sem a cláusula `DEFINER`; os DDLs tiveram apenas os contadores mutáveis de `AUTO_INCREMENT` removidos. Nenhuma definição foi executada ou instalada. A origem foi informada como Mengão 360, mas a versão efetivamente instalada não foi consultada por este repositório.

O inventário técnico e as dependências de schema estão em [`editorial/README.md`](editorial/README.md).

## Storage

| Stored Procedure | Arquivo | Relação com a deduplicação editorial |
| --- | --- | --- |
| `SP_Core_Storage_Reserva` | `storage/SP_Core_Storage_Reserva.sql` | Componente de reserva de provedor de storage; não é a SP de deduplicação |
| `SP_Core_Storage_Finaliza` | `storage/SP_Core_Storage_Finaliza.sql` | Componente de finalização de storage; não é a SP de deduplicação |

As SPs de storage foram recebidas como artefatos completos e tiveram apenas a cláusula `DEFINER` removida para versionamento público. Nenhuma SP foi executada ou instalada por este repositório.
