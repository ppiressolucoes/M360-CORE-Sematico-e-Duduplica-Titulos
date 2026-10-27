# S20-01 — Congelar o baseline

Status: **EM ANDAMENTO**

Abertura: **21/10/2026**

Sprint: [Deduplicação e Semântica Editorial v0.2.0](SPRINT-V0.2.0-MODO-SOMBRA.md)

## Objetivo da história

Fixar uma referência reproduzível do fluxo M360 antes da criação do modo sombra. O baseline reúne hashes, versões, contratos observados e dependências ainda não disponíveis.

Esta abertura não consulta MySQL, não importa workflows no n8n e não altera produção.

## Progresso

- [x] Confirmar o commit remoto usado como origem.
- [x] Calcular hashes do workflow e dos Code nodes M360.
- [x] Calcular hashes do índice de telemetria e dos três datasets.
- [x] Documentar o contrato mínimo de entrada do subfluxo.
- [x] Documentar a chamada e o retorno esperado da `SP_DEDUPLICA_EDITORIAL` a partir do workflow.
- [x] Documentar roteamentos e saída final observáveis.
- [x] Documentar a chamada observável do Extrator Editorial.
- [x] Incorporar o export sanitizado do `SUB | WEB Extrator Detalhes M360 v0.3 [ Core Editorial ]`.
- [x] Mapear os subfluxos, transformações e efeitos externos observáveis do Extrator.
- [x] Incorporar a definição vigente de `SP_DEDUPLICA_EDITORIAL` para M360.
- [x] Incorporar a definição vigente de `SP_DEDUPLICA_EDITORIAL_FINALIZA` para M360.
- [x] Confirmar compatibilidade entre assinaturas, retornos e nodes MySQL do M360.
- [x] Incorporar o DDL e os índices de `ADM_deduplica_editorial` e `titulos_deduplica`.
- [ ] Confirmar com snapshot o contrato de saída real do Extrator Editorial.
- [ ] Incorporar os exports sanitizados dos cinco subfluxos chamados pelo Extrator.
- [ ] Registrar snapshots sanitizados de entrada e saída para cada ramo do fluxo.

## Manifesto

O manifesto estruturado está em [`docs/baselines/2026-10-21-m360-s20-01.json`](../baselines/2026-10-21-m360-s20-01.json). Os hashes do Core de deduplicação representam os arquivos no commit de origem `112ceee22fd07ecaf4aa6dd32c356149765441bb`; o Extrator e as duas SPs foram acrescentados a partir dos exports recebidos em 21/10/2026.

O índice acumulado usado nesse baseline foi preservado em [`docs/baselines/2026-10-21-m360-indice.json`](../baselines/2026-10-21-m360-indice.json). O arquivo vivo em `docs/telemetria/` continua evoluindo com os lotes posteriores sem alterar o hash histórico da S20-01.

## Versões observadas

| Componente | Versão / configuração |
| --- | --- |
| Workflow | `SUB | Deduplicação e Semântica - M360 [ Core Editorial ]` |
| Estado do export público | `active: false`, sem credenciais e sem `pinData` |
| Normalização | `Normaliza Deduplica Editorial v0.2.2` |
| Similaridade | `Similaridade Editorial v0.4.0` |
| Consenso | `Consenso Editorial v0.1.0` |
| Modo declarado pela similaridade | `HOMOLOGACAO` |
| Janela enviada à SP | 7 dias |
| TOP matches | 3 |
| Limite de duplicidade | 0,78 e mínimo de 4 tokens comuns |
| Limite de suspeito | 0,58 e mínimo de 3 tokens comuns |

## Contrato de entrada observado

O `Start Dedup` usa passthrough. A normalização exige título e link, aceitando os aliases abaixo:

| Campo canônico | Aliases aceitos | Obrigatório |
| --- | --- | --- |
| `titulo` | `titulo`, `title` | Sim |
| `link` | `link`, `url` | Sim |
| `fonte` | `fonte`, `source`, fallback da SP | Não |
| `iso_date` | `iso_date`, `isoDate` | Não |
| `thumbnail_small` | `thumbnail_small`, `thumbnailSmall` | Não |

Também são preservados, quando presentes: `position`, `autores`, `data`, `thumbnail`, `termos_encontrados`, `score_tematico`, `idade_horas` e `post_id`.

## Chamada observada da SP de entrada

O node MySQL chama `SP_DEDUPLICA_EDITORIAL` com sete argumentos, nesta ordem:

1. portal fixo `M360`;
2. título escapado;
3. origem fixa `extracao-WEB`;
4. URL escapada;
5. caminho derivado da URL;
6. janela de 7 dias;
7. ID da execução n8n.

A implementação versionada confirma a assinatura, as transações, os filtros e os result sets. A análise está em [SPs editoriais M360 v0.2.2](../arquitetura/sp-deduplicacao-editorial-m360-v0.2.2.md).

## Retorno da SP consumido pela normalização

A normalização procura linhas com `row_type`.

Linha `CONTROL`:

- `resultado`;
- `duplicate_exact`;
- `registro_id`;
- `legacy_id`;
- `titulo_referencia`;
- `portal`;
- `source_host`;
- `post_id`;
- `chave_dedup`;
- `status_registro`;
- `janela_dias`.

Linhas `COMPARABLE`:

- `legacy_id`;
- `titulo_comparavel`;
- `categoria_comparavel`;
- `data_comparavel`;
- `post_id_comparavel`;
- `source_host_comparavel`.

Essa lista representa somente os campos consumidos pelo Code node. Não comprova a assinatura completa do result set da SP.

## Roteamentos observados

| Origem | Valor | Destino |
| --- | --- | --- |
| Resultado da SP | `ALREADY_PROCESSING` | `Retorno Final` |
| Resultado da SP | `EXACT_DUPLICATE` | `Retorno Final` |
| Resultado da SP | `CHECK_SIMILARITY` | `Similaridade Editorial v0.4.0` |
| Similaridade | `DUPLICADO` | `SP | Finaliza DUPLICADO` |
| Similaridade | `SUSPEITO` | `SP | Finaliza SUSPEITO`, Consenso e alerta |
| Similaridade | `NOVO` | `Chamar Extrator Editorial` |

O `Retorno Final` expõe `concluido`, `resultado` e o nome estático do workflow. A cardinalidade e os valores efetivos ainda precisam ser confirmados com snapshots sanitizados de execução.

## Contrato observável do Extrator Editorial

O node chama `SUB | WEB Extrator Detalhes M360 v0.3 [ Core Editorial ]` uma vez por item, aguarda a conclusão e envia:

| Entrada do Extrator | Origem |
| --- | --- |
| `Título` | `candidato.titulo` |
| `Link` | `candidato.link` |

O export sanitizado está em [`workflows/m360-extrator-detalhes-v0.3.json`](../../workflows/m360-extrator-detalhes-v0.3.json), com hash SHA-256 `fd98f486baf9133a9192424a56b0308f6dfd41b8a0cbd1030565d2cb2c4d73d6`. O mapeamento detalhado está em [Contrato do Extrator M360 v0.3](../arquitetura/m360-extrator-v0.3.md).

O Extrator possui efeitos funcionais: cria rascunho, grava foco SEO no MySQL, trata ou gera imagem, registra storage, associa mídia e publica o post. Ele não pode ser chamado pelo modo sombra. Sua saída final é a resposta implícita do request de publicação, sem um node que normalize o contrato; o formato real continua pendente de snapshot.

## Evidência de dados disponível

O baseline possui 51 candidatos e 153 pares provenientes de três lotes do ramo `SUSPEITO`. Todos os rótulos humanos continuam ausentes. Essa base serve para regressão do caminho analítico e não demonstra desempenho global do fluxo.

## Stored Procedures editoriais

As duas definições M360 foram incorporadas sem `DEFINER`:

- [`SP_DEDUPLICA_EDITORIAL.sql`](../../sql/editorial/SP_DEDUPLICA_EDITORIAL.sql), versão interna 0.2.2;
- [`SP_DEDUPLICA_EDITORIAL_FINALIZA.sql`](../../sql/editorial/SP_DEDUPLICA_EDITORIAL_FINALIZA.sql).

As assinaturas correspondem às chamadas do workflow. A SP principal retorna também `ERROR`, resultado que não possui regra no `SWITCH | Resultado`. A finalização permite status `ERROR`, mas o fluxo atual não apresenta um caminho que o utilize. A análise completa está em [SPs editoriais M360 v0.2.2](../arquitetura/sp-deduplicacao-editorial-m360-v0.2.2.md).

## Estruturas das tabelas editoriais

Os DDLs recebidos do Mengão 360 foram incorporados como baseline:

- [`ADM_deduplica_editorial.sql`](../../sql/editorial/tables/ADM_deduplica_editorial.sql);
- [`titulos_deduplica.sql`](../../sql/editorial/tables/titulos_deduplica.sql).

A tabela administrativa usa InnoDB, chave primária `BIGINT UNSIGNED` e chave única em `dsc_chave_dedup`; isso confirma a compatibilidade com as SPs e a garantia necessária ao `INSERT IGNORE`. A tabela histórica também usa InnoDB, mas não declara chave primária nem índice em `dth_executado`. Seus limites de categoria e URL são menores que os parâmetros equivalentes da SP. Esses riscos foram registrados no documento de arquitetura; nenhuma migração foi aplicada.

## Pendências bloqueadoras

### Dependências do Extrator Editorial

Obter os exports sanitizados dos subfluxos chamados:

- `SUB1 - AI Reescreve Conteudo v0.2 [ Core Editorial ]`;
- `SUB - M360 | Categoria | Autor | Tags`;
- `SUB3 - AI PROMPT DE IMG`;
- `SUB4 - AI GERAR IMAGEM API [Cross]`;
- `SUB | Storage Media External`.

Registrar também um snapshot sanitizado da resposta final de `HTTP WP Publish`. Os efeitos externos já estão mapeados, mas a forma concreta da saída permanece não confirmada.

### Snapshots

Registrar amostras sanitizadas para `ALREADY_PROCESSING`, `EXACT_DUPLICATE`, `CHECK_SIMILARITY`, `DUPLICADO`, `SUSPEITO` e `NOVO`. IDs operacionais e dados pessoais não devem ser publicados.

## Critério de encerramento

A S20-01 poderá ser concluída quando a saída real do Extrator, os subfluxos dependentes e os snapshots dos ramos estiverem versionados ou quando uma decisão formal de escopo aceitar explicitamente alguma ausência. Até lá, o baseline permanece `EM ANDAMENTO`.
