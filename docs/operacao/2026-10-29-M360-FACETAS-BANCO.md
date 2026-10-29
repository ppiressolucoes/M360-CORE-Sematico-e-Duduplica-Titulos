# M360 — primeira extensão de facetas no banco

## Códigos para aplicação manual

1. O operador substituiu o JavaScript do `Normaliza Vocabulário Editorial` pelo [código v0.2.1](../../codes/m360/normaliza-vocabulario-editorial-v0.2.1.js). O anexo da execução confirmou um item, 72 regras e os cinco tipos anteriores. Nenhuma conexão precisou mudar.
2. O operador substituiu o JavaScript do node operacional `Similaridade Editorial v0.5.0` pelo [código interno v0.5.3](../../codes/m360/similaridade-editorial-v0.5.3-facetas-banco.js). A saída anexada confirmou versão interna `0.5.3` e fonte `BANCO`. Ainda falta anexar uma saída nova do Retorno Final para confirmar `resultado_origem: similaridade_editorial_v0.5.3`; manter o nome operacional do node, usado pelo Retorno Final v0.2.2.
3. Somente depois dos dois nodes validados, propor e aprovar regras `FACETA_EDITORIAL` de expressão `LITERAL` no escopo `ESPORTE/M360`, versão de vocabulário `0.1.0`. Cada canônico deve usar letras maiúsculas, números e `_`. Não ativar regras desse tipo enquanto a Similaridade ainda estiver na v0.5.2: ela rejeita o tipo e registra contexto indisponível. A SP `LISTAR` atual já lê o tipo sem nova conexão.

O primeiro passo pode ser aplicado isoladamente com as 72 regras atuais. O segundo também preserva as facetas legadas se ainda não houver `FACETA_EDITORIAL` no banco. As novas regras acrescentam facetas contextuais em `OBSERVACAO`; não mudam a decisão lexical, os limites, o Gate Temporal ou o Retorno Final. Não há inserção ou ativação automática de regras. Este artefato prepara extensão modular; a migração das facetas legadas e dos estados factuais ainda não está concluída.

## Validação observada no registro 1347

Os anexos foram conferidos com a execução anterior da v0.5.2 sobre o mesmo candidato e os mesmos 244 comparáveis recebidos. A v0.5.3 preservou `NOVO` (51,5%), melhor match ID 3686, assinatura contextual do candidato e a análise contextual inteira, exceto o número da versão. O vocabulário segue com 72 regras e nenhuma `FACETA_EDITORIAL` ativa; por isso essa execução valida a compatibilidade, ainda não a nova capacidade com regra financeira real. [Resumo sanitizado](../telemetria/m360-registro-1347-facetas-banco-v0.5.3.json).

## Próxima ação no banco

O operador executou o [SQL de proposta da faceta financeira](../../sql/editorial/seeds/M360-vocabulario-v0.1.0-faceta-financas-propor.sql). A SP retornou `PROPOSTAS_REGISTRADAS`, duas propostas recebidas, e o grid mostrou as regras 73 (`postura ultraconservadora`) e 74 (`deficit`), ambas `FACETA_EDITORIAL`, canônico `PLANEJAMENTO_FINANCEIRO`, `situacao: PROPOSTA`, `ativo: 0`. [Evidência resumida](../telemetria/m360-faceta-financas-propostas-73-74.json). Essas expressões são hipóteses contextuais para o registro 1347, não um rótulo humano de duplicação.

Na primeira tentativa de ativação, `duas_propostas_conferidas = 1`, mas o `UPDATE` afetou zero linhas; ambas as regras permaneceram `PROPOSTA/0` e o total ativo em 72, com zero facetas. [Evidência resumida](../telemetria/m360-faceta-financas-ativacao-tentativa-1.json). A condição de atualização dependia de variável de sessão. Como a consulta de conferência e o `UPDATE` podem ter sido executados em contextos distintos, o arquivo foi corrigido para conferir cada regra diretamente no `WHERE`; não é possível afirmar a causa exata só com o retorno apresentado.

A próxima operação, **após confirmar que o workflow publicado usa Normaliza v0.2.1 e Similaridade interna v0.5.3**, é executar a versão corrigida do [SQL de ativação restrita](../../sql/editorial/seeds/M360-vocabulario-v0.1.0-faceta-financas-ativar.sql). Conferir no grid final as linhas 73/74 `APROVADA/1` e 74 regras ativas, sendo 2 facetas. Se o `UPDATE` não afetar duas linhas ou o grid não mostrar esses estados, não prosseguir para o n8n; a [desativação restrita](../../sql/editorial/seeds/M360-vocabulario-v0.1.0-faceta-financas-desativar.sql) retira qualquer ativação parcial do `LISTAR` sem apagar o histórico. Após ativar, executar `Normaliza` e `Similaridade` com o caso 1347 em observação: o candidato deve acionar a regra 73, o melhor comparável 3686 deve receber a faceta pela regra 74, e o resultado lexical deve permanecer `NOVO` com 51,5% na mesma entrada. Validar também no Retorno Final `resultado_origem: similaridade_editorial_v0.5.3`.

Em caso de divergência inesperada, restaurar o JavaScript anterior do node alterado. Nenhum workflow n8n foi modificado por este repositório.

## Verificação local

Os testes da nova etapa verificam equivalência do Normaliza com as 72 regras, rejeição de faceta inválida, replay dos 98 casos preservando decisão lexical e contexto sem novas regras, leitura de duas facetas de exemplo apenas no banco, comportamento sem vocabulário válido e ausência de variável de sessão na ativação corrigida. A suíte completa passou com 114 testes. O exemplo usa dados sintéticos de teste; nenhuma ativação foi executada por este repositório.
