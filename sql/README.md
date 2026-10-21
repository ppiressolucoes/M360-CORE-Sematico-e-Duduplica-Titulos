# Inventário SQL do Core

## Deduplicação editorial

| Stored Procedure | Utilização observada | Definição no repositório |
| --- | --- | --- |
| `SP_DEDUPLICA_EDITORIAL` | Reserva/consulta do candidato e comparáveis nos fluxos M360 e PEL | Pendente |
| `SP_DEDUPLICA_EDITORIAL_FINALIZA` | Finalização como `DUPLICADO`, `SUSPEITO` ou `PUBLICADO` nos fluxos M360 e PEL | Pendente |

Os exports contêm somente chamadas a essas procedures. A assinatura aparente foi documentada a partir dos nodes MySQL, mas a implementação, permissões, filtros internos e versão instalada não podem ser confirmados sem o DDL original.

O procedimento para obter e incorporar essas definições está em [`editorial/README.md`](editorial/README.md).

## Storage

| Stored Procedure | Arquivo | Relação com a deduplicação editorial |
| --- | --- | --- |
| `SP_Core_Storage_Reserva` | `storage/SP_Core_Storage_Reserva.sql` | Componente de reserva de provedor de storage; não é a SP de deduplicação |
| `SP_Core_Storage_Finaliza` | `storage/SP_Core_Storage_Finaliza.sql` | Componente de finalização de storage; não é a SP de deduplicação |

As SPs de storage foram recebidas como artefatos completos e tiveram apenas a cláusula `DEFINER` removida para versionamento público. Nenhuma SP foi executada ou instalada por este repositório.
