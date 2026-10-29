# Core Editorial: fluxos n8n e procedures MySQL

Retomada de 29/10: [migração do vocabulário para banco e Retorno Final v0.2.2](docs/operacao/2026-10-29-M360-VOCAB-BANCO.md). A Similaridade v0.5.2 está preparada para implantação manual, ainda sem evidência produtiva.

Este repositório registra artefatos de referência recebidos para a funcionalidade de deduplicação editorial. Nesta fase, o trabalho cobre os fluxos de automação e as Stored Procedures MySQL. Os arquivos não são uma implantação nem comprovam o estado atual da instância de produção.

## Artefatos

| Caminho | Origem | Escopo |
| --- | --- | --- |
| `workflows/m360-deduplicacao-semantica.json` | Export de referência do subfluxo M360 | Core v0.5.0 com validade temporal em observação, deduplicação e semântica editorial |
| `workflows/m360-extrator-detalhes-v0.3.json` | Export do Extrator Editorial M360 | Reescrita, classificação, mídia e publicação editorial |
| `workflows/pel-deduplicacao-semantica.json` | Export do subfluxo PEL | Deduplicação e semântica editorial |
| `codes/m360/` | Code nodes extraídos do export M360 | Tratamento de dados organizado por node e versão |
| `codes/m360-extrator/` | Code node extraído do Extrator M360 | Geração de slug e nome do arquivo de mídia |
| `codes/pel/` | Code nodes extraídos do export PEL | Tratamento de dados organizado por node e versão |
| `prototypes/validade-temporal/` | Especificação executável de `CORE-028` | Validador puro, geradores dos artefatos n8n, testes de integração e replay sem efeitos externos |
| `sql/README.md` | Inventário SQL | Disponibilidade e relação das SPs com os fluxos |
| `sql/editorial/tables/` | DDLs recebidos do Mengão 360 | Estruturas operacionais de reserva e histórico de títulos |
| `sql/storage/SP_Core_Storage_Reserva.sql` | `SP_Core_Storage_Reserva.txt` | Reserva de provedor de storage |
| `sql/storage/SP_Core_Storage_Finaliza.sql` | `SP_Core_Storage_Finaliza.txt` | Finalização de reserva de storage |

As duas procedures de storage são separadas da deduplicação editorial. As definições M360 de `SP_DEDUPLICA_EDITORIAL` e `SP_DEDUPLICA_EDITORIAL_FINALIZA` foram incorporadas em 21/10/2026 e estão no [inventário SQL](sql/README.md). A SP principal recebida aceita apenas o portal `M360`; portanto, ela não confirma a implementação homônima nem os filtros internos usados pelo PEL.

A [análise estática das SPs editoriais M360 v0.2.2](docs/arquitetura/sp-deduplicacao-editorial-m360-v0.2.2.md) documenta assinaturas, estados, comparáveis, estruturas das tabelas e pontos de atenção.

O export M360 foi evoluído em 27/10/2026 para o Core v0.5.0: `Validade Temporal v0.1.0` executa antes da SP principal, o normalizador v0.3.0 preserva a auditoria e o retorno informa `core_versao` e `validade_temporal`. A avaliação está em `OBSERVACAO`; todos os estados seguem pelo roteamento anterior e nenhum bloqueio foi habilitado. A cópia no Git permanece desativada e sem credenciais ou `pinData`.

O [contrato observado do Extrator M360 v0.3](docs/arquitetura/m360-extrator-v0.3.md) registra seus subfluxos, transformações e efeitos externos. O export público também permanece desativado e sanitizado.

## Governança e planejamento

- [Backlog consolidado](docs/planejamento/BACKLOG.md): prioridades, dependências, critérios de aceite e ordem de implantação.
- [Sprint Deduplicação e Semântica Editorial v0.2.0](docs/sprints/SPRINT-V0.2.0-MODO-SOMBRA.md): roteiro para o modo sombra com evento, faceta, estado factual e aprendizado supervisionado.
- [Padrão de artefatos das sprints](docs/planejamento/ARTEFATOS-SPRINT.md): estrutura obrigatória para workflows, Code nodes e SQL.
- [Estratégia de evolução: evento, faceta e estado factual](docs/arquitetura/evolucao-evento-faceta-estado.md): arquitetura sombra e promoção gradual sem impacto no fluxo atual.
- [Validade temporal antes da publicação](docs/arquitetura/validade-temporal-publicacao.md): gate proposto para impedir publicação de conteúdo de serviço cujo evento já ocorreu.
- [Rollout M360 node a node](docs/operacao/CORE-028-ROLLOUT-M360-NODE-A-NODE.md): checkpoints, gates e rollback para aplicar a observação temporal sem substituir o fluxo produtivo de uma vez.
- [Governança e sincronização do repositório](docs/planejamento/GOVERNANCA-REPOSITORIO.md): fonte oficial, entregáveis obrigatórios e definição de concluído.
- [Histórico de mudanças](CHANGELOG.md): registro cronológico dos artefatos e análises incorporados ao repositório.

O backlog é a referência compartilhada para o estado das iniciativas. Alterações de fluxo, SP, regra ou telemetria devem atualizar o item correspondente e o histórico na mesma entrega. Uma ação relevante só é considerada consolidada depois que o commit está publicado e o HEAD remoto de `main` foi confirmado.

## Análises editoriais

- [13 alertas M360: evidências e proposta de evolução do Core Semântico (14/10/2026)](docs/analises/2026-10-14-m360-alertas.md), com [dataset dos casos e métricas](docs/analises/2026-10-14-m360-alertas-casos.json). As classificações analíticas são provisórias e não foram aplicadas ao fluxo.
- [16 novos alertas M360: contrastes e atualização da base de evidências (16/10/2026)](docs/analises/2026-10-16-m360-alertas.md), com [dataset do segundo lote](docs/analises/2026-10-16-m360-alertas-casos.json).
- [22 alertas M360: entidades, evento principal e fases factuais (20/10/2026)](docs/analises/2026-10-20-m360-alertas.md), com [dataset do terceiro lote](docs/analises/2026-10-20-m360-alertas-casos.json).
- [47 alertas M360: edições temporais, fase factual e escopo editorial (27/10/2026)](docs/analises/2026-10-27-m360-alertas.md), com [dataset do quarto lote](docs/analises/2026-10-27-m360-alertas-casos.json).
- [Índice acumulado de evidências M360](docs/telemetria/m360-indice.json): 98 candidatos e 294 pares exibidos nos quatro lotes. O catálogo está no Git; nenhuma recomendação analítica foi aplicada ao n8n ou ao MySQL.
- [Replay observacional da validade temporal v0.1](docs/analises/2026-10-24-replay-validade-temporal-v0.1.md): 98 candidatos avaliados, cobertura temporal medida e ausência de datas originais confirmada.
- [Pasta de upload de alertas de referência](alertas/2026-10-20/README.md), com instruções para adicionar arquivos e compartilhar o link pelo GitHub.

## Preparação para controle de versão público

As cópias dos exports preservam nodes, parâmetros, conexões e código JavaScript. Antes de adicioná-las ao Git, foram removidas as referências a IDs de credenciais n8n e os dados fixados em `pinData`; `active` foi definido como `false` para impedir ativação involuntária após importação. As credenciais devem ser configuradas na instância de destino.

Nos scripts das procedures, apenas a cláusula `DEFINER` foi removida para não publicar o nome da conta do servidor. Nos DDLs, somente os próximos valores de `AUTO_INCREMENT` foram retirados por representarem estado mutável da instância. Nenhum SQL foi executado ou instalado. A identidade de execução e as permissões precisam ser revisadas antes de qualquer aplicação.

Os exports ainda contêm chamadas a workflows, envio de alerta e operações de escrita. Uma importação ou execução manual pode ter efeitos externos se as credenciais forem vinculadas. Valide os IDs de workflows chamados, o SQL efetivamente instalado, o destino dos alertas e o ambiente antes de ativar qualquer fluxo.
