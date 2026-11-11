# PEL — avaliação exploratória da análise em observação v0.5.0

Avaliados localmente pares de títulos fornecidos pelo operador, um comparável por vez, com um status lexical sintético usado apenas para verificar preservação. Não é replay do workflow, não executa SP ou WordPress e não mede precisão: os pares não têm rótulos humanos confirmados. O código de observação não altera decisões.

| Caso | Par | Sugestão observada | Interpretação |
| --- | --- | --- | --- |
| 1351 | Associações pressionam governo por PL sobre custeio de baterias / associações acionam governo por PL sobre rateio de custos de baterias | RELACIONADO | Pode ser mesmo fato; sem identidade de objeto e ação, não o confirma. |
| 1146 | CNPE aprova plano nacional de transição energética / CNPE discute o plano | ATUALIZACAO | Fases distintas detectadas; direção e identidade precisam de confirmação. |
| 849 | Petrobras abre chamada de propostas para contratação de biometano / abre chamada para aquisição de biometano | RELACIONADO | Possível mesmo fato; falta avaliação editorial. |
| 1000 | Aeris pede recuperação extrajudicial para R$ 1,52 bilhão / para R$ 1,5 bi | RELACIONADO | Possível arredondamento; números não foram interpretados. |
| Sintético | Petrobras abre chamada para aquisição de biometano / Petrobras cancela chamada para aquisição de biometano | RELACIONADO | Limitação: ações opostas não foram distinguidas. Não usar essa sugestão para decisão automática. |

Em todos os cinco exemplos, o objeto lexical de entrada foi preservado. Isso não valida o encadeamento no n8n nem as decisões do workflow. O caso 1146 foi simplificado para os elementos dos títulos usados no teste; não constitui replay integral do alerta.

Pendências: avaliar as 13 evidências completas e amostras de NOVO/DUPLICADO com rótulos humanos; tratar identidade de entidade e objeto, ação/negação, datas, unidades e comparáveis sem título; medir falsos alarmes e falhas por versão. Títulos idênticos podem ser edições recorrentes diferentes: igualdade textual não comprova mesmo fato. Não publicar o node nem usar sugestões em roteamento antes da avaliação e decisão operacional.
