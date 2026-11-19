# PEL — implementação da recomendação observacional v0.1.0

Data: 18/11/2026.

## Artefatos

- Código extraído: [`decisao-autonoma-editorial-v0.1.0.js`](../../codes/pel/decisao-autonoma-editorial-v0.1.0.js).
- Workflow PEL preparado: [`pel-deduplicacao-semantica.json`](../../workflows/pel-deduplicacao-semantica.json).
- Alinhamento de escopo: [decisão autônoma PEL](2026-11-18-PEL-DECISAO-AUTONOMA-ALINHAMENTO.md).

O workflow usa como base o export PEL de 18/11/2026 fornecido pelo operador. Para o artefato versionado, o workflow foi marcado inativo, os dados de `pinData` removidos e as referências de credenciais removidas. Credenciais devem ser religadas no ambiente de destino.

## Posição e isolamento

O node `Decisão Autônoma Editorial PEL v0.1.0` recebe a saída de `Análise Editorial PEL v0.5.1` e encaminha a recomendação a `SQL | Persiste Observação` e `SWITCH | Similaridade Editorial`. O switch continua avaliando somente `duplicidade_editorial.status`, sem ler a recomendação nova.

A recomendação persistida inclui o status lexical e contextual observados, regra/facetas disponíveis, evidências dos até três comparáveis contextuais, nível de confiança, motivo e limitações. Não armazena o conteúdo completo de todos os comparáveis no novo campo.

## Regras conservadoras

- Sugere `DUPLICADO` somente quando o status lexical já é `DUPLICADO`, o vocabulário está carregado do banco, há título normalizado equivalente e existe faceta compartilhada.
- Sugere `RELACIONADO` quando há sinal relacional contextual e facetas diferentes; uma fase factual divergente sem facetas confirmadas gera sugestão de baixa confiança.
- Nos demais casos, mantém `INDETERMINADO`. A v0.1.0 não sugere `NOVO` nem `ATUALIZAÇÃO`, pois a completude do histórico, a identidade do objeto e a progressão temporal ainda não foram comprovadas.
- Toda saída declara `aplicado_automaticamente: false`, `altera_status_core: false`, `altera_roteamento: false`, `publica_ou_finaliza: false` e revisão humana necessária.

## Estado de implantação

O workflow no repositório está inativo e sanitizado. Em 19/11, o operador informou que aplicou manualmente o node à instância n8n; a próxima passagem de candidato aguarda validação de execução e persistência. Ainda não foi apresentado export posterior à aplicação nem evidência da nova saída em execução. O relato está registrado no [checkpoint de aplicação](2026-11-19-PEL-DECISAO-AUTONOMA-APLICACAO.md).

Antes da promoção de qualquer recomendação, permanecem necessários os gates do `CORE-030`: validação de falhas e conflitos de persistência, vínculo com histórico, amostra de decisões humanas e validação do status WordPress. O tráfego observado não deve ser usado como rótulo humano implícito.

## Efeito desta entrega

Esta entrega adiciona um ramo analítico e aumenta o conteúdo do JSON de observação. Não altera a condição do switch, as SPs de finalização, o ramo de publicação, WordPress nem alertas.
