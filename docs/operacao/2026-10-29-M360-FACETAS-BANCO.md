# M360 — primeira extensão de facetas no banco

## Códigos para aplicação manual

1. O operador substituiu o JavaScript do `Normaliza Vocabulário Editorial` pelo [código v0.2.1](../../codes/m360/normaliza-vocabulario-editorial-v0.2.1.js). O anexo da execução confirmou um item, 72 regras e os cinco tipos anteriores. Nenhuma conexão precisou mudar.
2. O operador substituiu o JavaScript do node operacional `Similaridade Editorial v0.5.0` pelo [código interno v0.5.3](../../codes/m360/similaridade-editorial-v0.5.3-facetas-banco.js). A saída anexada confirmou versão interna `0.5.3` e fonte `BANCO`. Ainda falta anexar uma saída nova do Retorno Final para confirmar `resultado_origem: similaridade_editorial_v0.5.3`; manter o nome operacional do node, usado pelo Retorno Final v0.2.2.
3. As regras `FACETA_EDITORIAL` 73/74 foram propostas e ativadas pelo operador no escopo `ESPORTE/M360`, versão de vocabulário `0.1.0`. O workflow publicado precisa usar Similaridade interna v0.5.3: a v0.5.2 rejeita esse tipo e registra contexto indisponível. A SP `LISTAR` atual lê o tipo sem nova conexão.

Os dois nodes foram validados com as 72 regras originais antes da ativação. As novas regras acrescentam facetas contextuais em `OBSERVACAO`; não mudam a decisão lexical, os limites, o Gate Temporal ou o Retorno Final. Não há inserção ou ativação automática de regras. Este artefato prepara extensão modular; a migração das facetas legadas e dos estados factuais ainda não está concluída.

## Validação observada no registro 1347

Os anexos foram conferidos com a execução anterior da v0.5.2 sobre o mesmo candidato e os mesmos 244 comparáveis recebidos. A v0.5.3 preservou `NOVO` (51,5%), melhor match ID 3686, assinatura contextual do candidato e a análise contextual inteira, exceto o número da versão. Naquele instante, o vocabulário tinha 72 regras e nenhuma `FACETA_EDITORIAL` ativa; essa execução valida a compatibilidade anterior à ativação. [Resumo sanitizado](../telemetria/m360-registro-1347-facetas-banco-v0.5.3.json).

## Próxima ação no banco

O operador executou o [SQL de proposta da faceta financeira](../../sql/editorial/seeds/M360-vocabulario-v0.1.0-faceta-financas-propor.sql). A SP retornou `PROPOSTAS_REGISTRADAS`, duas propostas recebidas, e o grid mostrou as regras 73 (`postura ultraconservadora`) e 74 (`deficit`), ambas `FACETA_EDITORIAL`, canônico `PLANEJAMENTO_FINANCEIRO`, `situacao: PROPOSTA`, `ativo: 0`. [Evidência resumida](../telemetria/m360-faceta-financas-propostas-73-74.json). Essas expressões são hipóteses contextuais para o registro 1347, não um rótulo humano de duplicação.

Na primeira tentativa de ativação, `duas_propostas_conferidas = 1`, mas o `UPDATE` afetou zero linhas; ambas as regras permaneceram `PROPOSTA/0` e o total ativo em 72, com zero facetas. [Evidência resumida](../telemetria/m360-faceta-financas-ativacao-tentativa-1.json). A condição de atualização dependia de variável de sessão. Como a consulta de conferência e o `UPDATE` podem ter sido executados em contextos distintos, o arquivo foi corrigido para conferir cada regra diretamente no `WHERE`; não é possível afirmar a causa exata só com o retorno apresentado.

O operador executou a versão corrigida do [SQL de ativação restrita](../../sql/editorial/seeds/M360-vocabulario-v0.1.0-faceta-financas-ativar.sql). O grid mostrou as linhas 73/74 `APROVADA/1` e 74 regras ativas, sendo 2 facetas. [Evidência resumida](../telemetria/m360-faceta-financas-ativacao-73-74.json). A versão publicada do workflow ainda não foi comprovada por export; as saídas dos nodes abaixo mostram as versões em execução. No próximo `CHECK` relevante, conferir no candidato a regra 73 quando houver `postura ultraconservadora`, no comparável a faceta da regra 74 quando houver `deficit`, e a decisão lexical separadamente. Para uma execução oriunda da Similaridade, o Retorno Final deve trazer `resultado_origem: similaridade_editorial_v0.5.3`. Não reprocessar uma notícia já publicada para obter essa evidência. Se o fluxo publicado ainda usar v0.5.2 ou ocorrer divergência inesperada, a [desativação restrita](../../sql/editorial/seeds/M360-vocabulario-v0.1.0-faceta-financas-desativar.sql) retira as duas regras do `LISTAR` sem apagar o histórico.

### Leitura confirmada após ativação: registro 1353

Os três outputs anexados mostraram 74 rows na SP `LISTAR`, um item do Normaliza v0.2.1 com 74 regras (`FACETA_EDITORIAL: 2`) e Similaridade interna v0.5.3 com fonte `BANCO` e 74 regras auditadas. O candidato “Flamengo precisa de 3 vitórias em 6 jogos para igualar pontuação do Brasileirão 2025” não contém as expressões financeiras; sua assinatura `facetas: []` é o comportamento esperado. O resultado lexical foi `NOVO`, 46,17%, e a sugestão contextual observacional `RELACIONADO`; esta sugestão não entrou na decisão. [Resumo sanitizado](../telemetria/m360-registro-1353-facetas-banco.json).

Essa execução comprova o carregamento e a passagem das duas regras pelo fluxo, mas ainda não demonstra a detecção de `PLANEJAMENTO_FINANCEIRO` em um novo candidato ou comparável. Também não veio saída terminal do Retorno Final. Observar o próximo candidato financeiro pertinente, sem reprocessar conteúdo já publicado. A divergência contextual do registro 1353 deve ser analisada antes de qualquer promoção da sugestão para decisão funcional.

Em caso de divergência inesperada, restaurar o JavaScript anterior do node alterado. Nenhum workflow n8n foi modificado por este repositório.

## Verificação local

Os testes da nova etapa verificam equivalência do Normaliza com as 72 regras, rejeição de faceta inválida, replay dos 98 casos preservando decisão lexical e contexto sem novas regras, leitura de duas facetas de exemplo apenas no banco, comportamento sem vocabulário válido e ausência de variável de sessão na ativação corrigida. A suíte completa passou com 114 testes. O exemplo usa dados sintéticos de teste; nenhuma ativação foi executada por este repositório.
