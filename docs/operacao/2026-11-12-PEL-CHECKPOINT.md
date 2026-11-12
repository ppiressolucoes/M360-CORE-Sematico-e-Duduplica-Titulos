# PEL — checkpoint de evolução editorial

Registro das evidências enviadas pelo operador até 12/11/2026. O repositório não substitui o export publicado do n8n nem comprova testes que não foram apresentados.

## Entrada e deduplicação

O operador aplicou o adaptador de entrada PEL v0.1.0 para normalizar `titulo/title` e `link/url`, preservando os campos originais. Os dois formatos foram demonstrados no node. A consulta MySQL v2.5 foi parametrizada usando `$1` a `$7`; o `SELECT` de conferência retornou os sete parâmetros. O `CALL` de um candidato novo retornou registro 1366 `CHECK_SIMILARITY`, com 306 comparáveis. A Similaridade PEL v0.4.0 usou o título correto e retornou `NOVO` (25,95%); a finalização registrou `PUBLICADO` e o operador confirmou a publicação. Não se comprovou o envio de título com vírgula em teste específico.

## Vocabulário e contexto

O operador registrou e aprovou dez facetas `ENERGIA_LIMPA/PEL` v0.1.0. Após corrigir a conexão ao banco, a SP `LISTAR` retornou as dez; o normalizador entregou um item `CARREGADO`. A regra 11, `baterias -> ARMAZENAMENTO_ENERGIA`, foi aprovada e ativada; os registros 1352/1353 carregaram 11 regras e acionaram a regra 11 em 15 comparáveis cada. Ainda não foi apresentada evidência de acionamento da regra 11 no candidato.

No desenho informado, o contexto de vocabulário é uma camada separada, em observação; a Similaridade lexical v0.4.0 continua definindo a rota. O registro 1351 retornou NOVO 41,9%, embora os títulos sobre PL de custeio de baterias indiquem possível mesmo fato. Não há rótulo humano definitivo.

## Análise e persistência em observação

O operador aplicou `Análise Editorial PEL v0.5.1` antes do switch. No registro 1366 ela analisou 306 comparáveis, sugeriu `INDETERMINADO` e manteve o resultado lexical `NOVO` 25,95%. A tabela `ADM_analise_editorial_observacao` foi criada; o registro 1366 e depois os registros 1396, 1397, 1399, 1400 e 1401 apresentaram JSON válido. O registro 1401 sugeriu `RELACIONADO`, mas a decisão lexical foi `SUSPEITO`; a SP confirmou sua finalização SUSPEITO. A entrega de e-mail não foi comprovada pelas saídas fornecidas.

O operador aplicou a migração dos campos opcionais WordPress à tabela existente e descartou a criação da tabela auxiliar separada. `SQL | Persiste Observação` registra a análise antes do switch; o ramo de referência após a finalização de NOVO preenche ID, URL e status WordPress. A chave inclui portal, registro, execução e versão: múltiplas execuções podem gerar várias linhas para o mesmo registro e não provam republicação.

Evidências: análise 12 / registro 1409 / execução 284708 foi vinculada manualmente ao post 93638; análise 17 / execução 284840 vinculou o mesmo post após o desenho atualizado; análise 19 / registro 1417 / execução 284916 vinculou post 93663 `publish`; análise 21 / registro 1420 / execução 285058 vinculou post 93676 `publish`. Para 1420, a saída de preparação e a linha consultada coincidem. O operador informou o fluxo publicado; o export atualizado e um teste completo de falha não foram apresentados.

## Limites e próximas ações

- A v0.5.1 usa heurísticas e não resolve plenamente entidade, objeto, negação ou tempo. Não deve alterar publicação automaticamente. Revisar falsos alarmes e possíveis falsos negativos com rótulos humanos.
- A persistência contém apenas análises que chegaram ao ramo e gravaram; não é catálogo completo de publicações. Ainda não há associação de ID WordPress para todo o histórico.
- Verificar em ambiente isolado erro em preparação e gravação, continuidade e pareamento dos itens, repetição da mesma chave e conflito de IDs WordPress. `success: true` no MySQL não prova qual valor ficou gravado. A ausência de teste de falha não deve ser interpretada como sucesso.
- `SUSPEITO` permanece rota lexical existente. A futura rota `OBSERVAÇÃO` seria para `NOVO` lexical com indício contextual forte; a v0.5.1 ainda não possui critério validado para acioná-la.
- O publicador cria draft antes de publicar, mas a SP do ramo NOVO ainda recebe `PUBLICADO` fixo. Verificar status confirmado antes da finalização e definir ciclo de revisão antes de integrar drafts.
- A captura de decisão humana no WordPress, alerta para observação, aprendizagem automática e política de promoção permanecem pendentes. Não tratar status automático como rótulo humano.
