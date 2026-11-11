# PEL — análise de ações em observação v0.5.1

Camada experimental separada, a ser avaliada após Similaridade lexical v0.4.0. Não altera decisão, roteamento, banco ou WordPress. Não publicada no n8n.

Verificação local com um comparável por entrada e decisão lexical sintética: CNPE aprova/discute produziu `RELACIONADO`, com fases APROVACAO/DISCUSSAO e motivo `FASES_DISTINTAS_REQUEREM_REVISAO`; Petrobras abre/cancela produziu o mesmo aviso com ABERTURA/CANCELAMENTO; o par 1351 produziu `RELACIONADO` por quatro tokens, sem fase resolvida. Nos três, o objeto lexical permaneceu intacto. Não se trata de replay integral, nem de validação humana ou medição de precisão.

Ações e fases são heurísticas de título. Negação ou abertura e cancelamento no mesmo título tornam a fase indeterminada. Igualdade textual não implica mais MESMO_FATO; pode representar edições recorrentes. A versão ainda não reconhece substantivos como `aprovação`, não identifica entidade ou objeto, não verifica a direção temporal e não detecta todas as negações. Sugestões não são decisões: nenhuma automação deve depender delas sem avaliação rotulada e validação com o workflow real.
