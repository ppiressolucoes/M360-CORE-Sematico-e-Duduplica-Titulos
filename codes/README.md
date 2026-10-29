# Code nodes dos fluxos n8n

Esta pasta contém cópias legíveis dos campos `parameters.jsCode` dos exports em `workflows/`. A extração organiza o tratamento de dados por fluxo e por node; não transforma os arquivos em aplicações JavaScript independentes.

Os códigos usam objetos e helpers fornecidos pelo n8n, como `$input`, `$json`, `$execution` e `$()`. O comportamento executável continua definido pelo export completo, incluindo conexões, parâmetros e versão dos nodes.

## Inventário

Artefatos posteriores ao export: [Retorno Final v0.2.2](m360/retorno-final-v0.2.2.js) e [Similaridade v0.5.2](m360/similaridade-editorial-v0.5.2-vocab-banco.js) foram aplicados e validados pelo operador. [Normaliza v0.2.1](m360/normaliza-vocabulario-editorial-v0.2.1.js) e [Similaridade interna v0.5.3](m360/similaridade-editorial-v0.5.3-facetas-banco.js) também foram aplicados e tiveram saídas anexadas; [validação e pendências](../docs/operacao/2026-10-29-M360-FACETAS-BANCO.md). O export de referência não foi atualizado sem um novo export operacional.

| Fluxo | Node | Arquivo |
| --- | --- | --- |
| M360 | `Validade Temporal v0.1.0` | `m360/validade-temporal-v0.1.0.js` |
| M360 | `Normaliza Deduplica Editorial v0.3.0` | `m360/normaliza-deduplica-editorial-v0.3.0.js` |
| M360 | `Similaridade Editorial v0.4.0` | `m360/similaridade-editorial-v0.4.0.js` |
| M360 | `Consenso Editorial v0.1.0` | `m360/consenso-editorial-v0.1.0.js` |
| M360 | `Retorno Final` | `m360/retorno-final.js` |
| Extrator M360 | `GERA SLUG` | `m360-extrator/gera-slug.js` |
| PEL | `Normaliza Deduplica Editorial v0.2.2` | `pel/normaliza-deduplica-editorial-v0.2.2.js` |
| PEL | `Similaridade Editorial v0.4.0` | `pel/similaridade-editorial-v0.4.0.js` |
| PEL | `Consenso Editorial v0.1.0` | `pel/consenso-editorial-v0.1.0.js` |
| PEL | `Retorno Final` | `pel/retorno-final.js` |

## Regra de sincronização

Quando um Code node mudar no n8n:

1. exportar e sanitizar o workflow correspondente;
2. atualizar o JSON em `workflows/`;
3. extrair novamente o `jsCode` para o arquivo mapeado nesta pasta;
4. comparar o arquivo extraído com o campo do JSON;
5. atualizar backlog e histórico na mesma entrega.

O Core M360 v0.5.0 usa o adaptador temporal v0.1.0 e o normalizador v0.3.0. O arquivo `m360/normaliza-deduplica-editorial-v0.2.2.js` foi preservado como artefato histórico da baseline S20-01. O gerador em `prototypes/validade-temporal/build-n8n-code.js` mantém a regra pura e o Code node temporal sincronizados.
