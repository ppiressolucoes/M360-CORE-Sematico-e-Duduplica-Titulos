# Histórico de mudanças

As datas registram a incorporação ao repositório e não comprovam a data de emissão dos alertas nem uma implantação em produção.

## 21/10/2026 — Abertura da S20-01

- Alterado o estado da história S20-01 para `EM ANDAMENTO`.
- Congelados hashes do workflow M360, Code nodes, índice de telemetria e três datasets de alertas.
- Documentados os contratos observáveis de entrada, retorno da SP, roteamentos, similaridade e chamada do Extrator Editorial.
- Incorporado o export sanitizado e inativo do Extrator Editorial M360 v0.3.
- Extraído o Code node `GERA SLUG` para revisão independente.
- Documentados reescrita, classificação, publicação WordPress, metadados SEO, tratamento/geração de imagem, storage e associação de mídia.
- Incorporadas as definições M360 de `SP_DEDUPLICA_EDITORIAL` v0.2.2 e `SP_DEDUPLICA_EDITORIAL_FINALIZA`, sem `DEFINER`.
- Confirmada a compatibilidade das assinaturas com o workflow M360 e documentados estados, comparáveis e concorrência.
- Registrado que o retorno `ERROR` da SP principal não possui rota no switch atual.
- Incorporados os DDLs de `ADM_deduplica_editorial` e `titulos_deduplica`, removendo apenas os próximos valores mutáveis de `AUTO_INCREMENT`.
- Confirmada a chave única de `dsc_chave_dedup`, necessária à reserva atômica da SP.
- Registrados como backlog a ausência de chave primária e índice de janela no histórico, além dos limites menores de categoria e URL.
- Mantidas como pendências da S20-01 a saída real do Extrator, os exports dos subfluxos dependentes e os snapshots dos ramos.
- Nenhuma consulta foi executada no MySQL e nenhum workflow foi importado ou ativado.

## 20/10/2026 — Sprint Editorial v0.2.0

- Consolidado o roteiro da Sprint para criação do modo sombra M360.
- Agrupadas as iniciativas `CORE-005` a `CORE-014` em histórias executáveis.
- Definidos contrato de contexto, compatibilidade por par, similaridade contextual, decisão sombra, telemetria e feedback editorial.
- Estabelecido aprendizado supervisionado e versionado, sem autoalteração das regras em execução.
- Separada a conclusão da Sprint dos gates posteriores de ativação e automação em produção.

## 20/10/2026 — Artefatos gerais das sprints

- Organizados os Code nodes existentes em `codes/m360` e `codes/pel`.
- Mantidos os exports JSON completos em `workflows` como referência dos fluxos.
- Criado inventário das SPs presentes e das definições editoriais ainda pendentes.
- Definido o padrão mínimo de artefatos para as próximas sprints.
- Nenhum código, query, regra ou comportamento dos fluxos foi modificado nessa extração.

## 20/10/2026 — Governança do repositório

- Formalizada a branch `main` remota como fonte oficial compartilhada.
- Definida a atualização conjunta de backlog, histórico e artefatos afetados.
- Estabelecida a verificação do HEAD remoto como parte da conclusão de cada entrega.
- Documentadas regras para não publicar credenciais, `pinData`, cabeçalhos de e-mail ou anexos brutos com dados pessoais.

## 20/10/2026 — Planejamento e sincronização da referência M360

- Reconciliado o export sanitizado M360 com o anexo mais recente.
- Atualizado o ramo `NOVO` de `Chamar Publicar Editorial` para `Chamar Extrator Editorial`.
- Preservado `resultado` no `Retorno Final`.
- Documentada a arquitetura sombra para evento, faceta e estado factual.
- Criado backlog compartilhado com prioridades, dependências, critérios de aceite e promoção gradual.
- Mantidos `active: false`, ausência de credenciais e ausência de `pinData` no artefato público.

## 20/10/2026 — Terceiro lote de alertas M360

- Incorporados 22 candidatos e 66 pares reproduzidos.
- Atualizado o acumulado para 51 candidatos e 153 pares.
- Documentados eventos diferentes, entidades críticas, fase factual, modalidade, divisão e identidade temporal.
- Criada a pasta pública de referência para novos alertas.

## 16/10/2026 — Segundo lote de alertas M360

- Incorporados 16 candidatos e 48 pares.
- Criado o índice acumulado de evidências e fingerprints entre lotes.
- Preservada a distinção entre hipóteses analíticas e decisões humanas.

## 14/10/2026 — Baseline do repositório

- Incorporados os exports sanitizados dos fluxos M360 e PEL.
- Incorporadas as SPs de storage sem cláusula `DEFINER`.
- Registrado o primeiro lote de 13 candidatos e 39 pares M360.
- Confirmado que as definições das SPs editoriais permanecem ausentes.
