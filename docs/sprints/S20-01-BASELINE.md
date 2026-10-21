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
- [ ] Incorporar a definição vigente de `SP_DEDUPLICA_EDITORIAL`.
- [ ] Incorporar a definição vigente de `SP_DEDUPLICA_EDITORIAL_FINALIZA`.
- [ ] Incorporar o export sanitizado do `SUB | WEB Extrator Detalhes M360 v0.3 [ Core Editorial ]`.
- [ ] Confirmar o contrato de saída e os efeitos do Extrator Editorial.
- [ ] Registrar snapshots sanitizados de entrada e saída para cada ramo do fluxo.

## Manifesto

O manifesto estruturado está em [`docs/baselines/2026-10-21-m360-s20-01.json`](../baselines/2026-10-21-m360-s20-01.json). Os hashes representam os arquivos no commit de origem `112ceee22fd07ecaf4aa6dd32c356149765441bb`.

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

A implementação da SP não está disponível. Portanto, tipos, transações, filtros e garantias internas permanecem não confirmados.

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

O export do Extrator não está no repositório. Sua saída, gravações, chamadas externas e comportamento de erro continuam desconhecidos. Depois dele, o fluxo atual chama a finalização com `PUBLICADO` e insere o título, mas não é possível atribuir esses efeitos ao Extrator sem o export correspondente.

## Evidência de dados disponível

O baseline possui 51 candidatos e 153 pares provenientes de três lotes do ramo `SUSPEITO`. Todos os rótulos humanos continuam ausentes. Essa base serve para regressão do caminho analítico e não demonstra desempenho global do fluxo.

## Pendências bloqueadoras

### SPs editoriais

Obter em ambiente autorizado:

```sql
SHOW CREATE PROCEDURE SP_DEDUPLICA_EDITORIAL;
SHOW CREATE PROCEDURE SP_DEDUPLICA_EDITORIAL_FINALIZA;
```

O processo de sanitização está em [`sql/editorial/README.md`](../../sql/editorial/README.md).

### Extrator Editorial

Obter export JSON do subfluxo `SUB | WEB Extrator Detalhes M360 v0.3 [ Core Editorial ]`, remover credenciais e `pinData`, definir `active: false` e documentar entradas, saídas, efeitos e erros.

### Snapshots

Registrar amostras sanitizadas para `ALREADY_PROCESSING`, `EXACT_DUPLICATE`, `CHECK_SIMILARITY`, `DUPLICADO`, `SUSPEITO` e `NOVO`. IDs operacionais e dados pessoais não devem ser publicados.

## Critério de encerramento

A S20-01 poderá ser concluída quando as duas SPs, o contrato completo do Extrator e os snapshots dos ramos estiverem versionados ou quando uma decisão formal de escopo aceitar explicitamente alguma ausência. Até lá, o baseline permanece `EM ANDAMENTO`.
