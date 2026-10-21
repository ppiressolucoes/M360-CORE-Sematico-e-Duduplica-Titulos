# Code nodes dos fluxos n8n

Esta pasta contém cópias legíveis dos campos `parameters.jsCode` dos exports em `workflows/`. A extração organiza o tratamento de dados por fluxo e por node; não transforma os arquivos em aplicações JavaScript independentes.

Os códigos usam objetos e helpers fornecidos pelo n8n, como `$input`, `$json`, `$execution` e `$()`. O comportamento executável continua definido pelo export completo, incluindo conexões, parâmetros e versão dos nodes.

## Inventário

| Fluxo | Node | Arquivo |
| --- | --- | --- |
| M360 | `Normaliza Deduplica Editorial v0.2.2` | `m360/normaliza-deduplica-editorial-v0.2.2.js` |
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

Os arquivos atuais foram extraídos sem alteração lógica dos exports versionados. Oito Code nodes vieram dos fluxos de deduplicação M360/PEL em 20/10/2026; o `GERA SLUG` veio do Extrator M360 v0.3 em 21/10/2026.
