# Core Editorial: fluxos n8n e procedures MySQL

Este repositório registra artefatos de referência recebidos para a funcionalidade de deduplicação editorial. Nesta fase, o trabalho cobre os fluxos de automação e as Stored Procedures MySQL. Os arquivos não são uma implantação nem comprovam o estado atual da instância de produção.

## Artefatos

| Caminho | Origem | Escopo |
| --- | --- | --- |
| `workflows/m360-deduplicacao-semantica.json` | Export do subfluxo M360 | Deduplicação e semântica editorial |
| `workflows/pel-deduplicacao-semantica.json` | Export do subfluxo PEL | Deduplicação e semântica editorial |
| `codes/m360/` | Code nodes extraídos do export M360 | Tratamento de dados organizado por node e versão |
| `codes/pel/` | Code nodes extraídos do export PEL | Tratamento de dados organizado por node e versão |
| `sql/README.md` | Inventário SQL | Disponibilidade e relação das SPs com os fluxos |
| `sql/storage/SP_Core_Storage_Reserva.sql` | `SP_Core_Storage_Reserva.txt` | Reserva de provedor de storage |
| `sql/storage/SP_Core_Storage_Finaliza.sql` | `SP_Core_Storage_Finaliza.txt` | Finalização de reserva de storage |

As duas procedures de storage são separadas da deduplicação editorial. As definições de `SP_DEDUPLICA_EDITORIAL` e `SP_DEDUPLICA_EDITORIAL_FINALIZA` não foram fornecidas; os workflows contêm apenas chamadas a elas. Por isso, as versões dessas SPs e o filtro de fontes internas do PEL não podem ser confirmados neste repositório.

O export M360 foi reconciliado em 20/10/2026 com o anexo mais recente: o ramo `NOVO` chama `Chamar Extrator Editorial`, e o retorno final preserva o campo `resultado`. A cópia no Git permanece desativada e sem credenciais ou `pinData`.

## Governança e planejamento

- [Backlog consolidado](docs/planejamento/BACKLOG.md): prioridades, dependências, critérios de aceite e ordem de implantação.
- [Sprint Deduplicação e Semântica Editorial v0.2.0](docs/sprints/SPRINT-V0.2.0-MODO-SOMBRA.md): roteiro para o modo sombra com evento, faceta, estado factual e aprendizado supervisionado.
- [Padrão de artefatos das sprints](docs/planejamento/ARTEFATOS-SPRINT.md): estrutura obrigatória para workflows, Code nodes e SQL.
- [Estratégia de evolução: evento, faceta e estado factual](docs/arquitetura/evolucao-evento-faceta-estado.md): arquitetura sombra e promoção gradual sem impacto no fluxo atual.
- [Governança e sincronização do repositório](docs/planejamento/GOVERNANCA-REPOSITORIO.md): fonte oficial, entregáveis obrigatórios e definição de concluído.
- [Histórico de mudanças](CHANGELOG.md): registro cronológico dos artefatos e análises incorporados ao repositório.

O backlog é a referência compartilhada para o estado das iniciativas. Alterações de fluxo, SP, regra ou telemetria devem atualizar o item correspondente e o histórico na mesma entrega. Uma ação relevante só é considerada consolidada depois que o commit está publicado e o HEAD remoto de `main` foi confirmado.

## Análises editoriais

- [13 alertas M360: evidências e proposta de evolução do Core Semântico (14/10/2026)](docs/analises/2026-10-14-m360-alertas.md), com [dataset dos casos e métricas](docs/analises/2026-10-14-m360-alertas-casos.json). As classificações analíticas são provisórias e não foram aplicadas ao fluxo.
- [16 novos alertas M360: contrastes e atualização da base de evidências (16/10/2026)](docs/analises/2026-10-16-m360-alertas.md), com [dataset do segundo lote](docs/analises/2026-10-16-m360-alertas-casos.json).
- [22 alertas M360: entidades, evento principal e fases factuais (20/10/2026)](docs/analises/2026-10-20-m360-alertas.md), com [dataset do terceiro lote](docs/analises/2026-10-20-m360-alertas-casos.json).
- [Índice acumulado de evidências M360](docs/telemetria/m360-indice.json): 51 candidatos e 153 pares exibidos nos três lotes. O catálogo está no Git; nenhuma recomendação analítica foi aplicada ao n8n ou ao MySQL.
- [Pasta de upload de alertas de referência](alertas/2026-10-20/README.md), com instruções para adicionar arquivos e compartilhar o link pelo GitHub.

## Preparação para controle de versão público

As cópias dos exports preservam nodes, parâmetros, conexões e código JavaScript. Antes de adicioná-las ao Git, foram removidas as referências a IDs de credenciais n8n e os dados fixados em `pinData`; `active` foi definido como `false` para impedir ativação involuntária após importação. As credenciais devem ser configuradas na instância de destino.

Nos scripts SQL, apenas a cláusula `DEFINER` foi removida para não publicar o nome da conta do servidor. Nenhuma procedure foi executada ou instalada. A identidade de execução e as permissões precisam ser revisadas antes de qualquer aplicação.

Os exports ainda contêm chamadas a workflows, envio de alerta e operações de escrita. Uma importação ou execução manual pode ter efeitos externos se as credenciais forem vinculadas. Valide os IDs de workflows chamados, o SQL efetivamente instalado, o destino dos alertas e o ambiente antes de ativar qualquer fluxo.
