-- Baseline literal da Similaridade Editorial v0.5.0, dominio ESPORTE/M360.
-- 72 regras: 30 clubes, 20 pessoas, 1 bloqueio, 6 organizacoes, 15 competicoes.
-- Reproduz somente as listas literais do code node; nao migra regex de
-- facetas, estados, fases, stopwords ou pesos lexicais.
-- Confianca 0.8 e metadado inicial nao calibrado; o bloqueio conhecido usa 1.0.
-- Prioridades de competicao preservam a precedencia atual (serie A/B antes
-- de Brasileirao generico; Copa Sub-20 antes de Copa do Brasil generica).
-- Seguro para reexecucao: a SP ignora regras ja presentes no escopo/versao.
-- Execute esta proposta antes do arquivo de ativacao, em cliente MariaDB.

CALL `SP_VOCABULARIO_EDITORIAL`(
  'PROPOR', 'ESPORTE', 'M360', '0.1.0',
  'baseline-static-similaridade-v0.5.0',
  '[
  {"tipo":"ALIAS_CLUBE","expressao":"flamengo","valor_canonico":"FLAMENGO","prioridade":50,"confianca":0.8},
  {"tipo":"ALIAS_CLUBE","expressao":"mengao","valor_canonico":"FLAMENGO","prioridade":50,"confianca":0.8},
  {"tipo":"ALIAS_CLUBE","expressao":"vasco da gama","valor_canonico":"VASCO","prioridade":50,"confianca":0.8},
  {"tipo":"ALIAS_CLUBE","expressao":"vasco","valor_canonico":"VASCO","prioridade":50,"confianca":0.8},
  {"tipo":"ALIAS_CLUBE","expressao":"palmeiras","valor_canonico":"PALMEIRAS","prioridade":50,"confianca":0.8},
  {"tipo":"ALIAS_CLUBE","expressao":"corinthians","valor_canonico":"CORINTHIANS","prioridade":50,"confianca":0.8},
  {"tipo":"ALIAS_CLUBE","expressao":"sao paulo","valor_canonico":"SAO_PAULO","prioridade":50,"confianca":0.8},
  {"tipo":"ALIAS_CLUBE","expressao":"santos","valor_canonico":"SANTOS","prioridade":50,"confianca":0.8},
  {"tipo":"ALIAS_CLUBE","expressao":"fluminense","valor_canonico":"FLUMINENSE","prioridade":50,"confianca":0.8},
  {"tipo":"ALIAS_CLUBE","expressao":"botafogo","valor_canonico":"BOTAFOGO","prioridade":50,"confianca":0.8},
  {"tipo":"ALIAS_CLUBE","expressao":"gremio","valor_canonico":"GREMIO","prioridade":50,"confianca":0.8},
  {"tipo":"ALIAS_CLUBE","expressao":"internacional","valor_canonico":"INTERNACIONAL","prioridade":50,"confianca":0.8},
  {"tipo":"ALIAS_CLUBE","expressao":"inter de porto alegre","valor_canonico":"INTERNACIONAL","prioridade":50,"confianca":0.8},
  {"tipo":"ALIAS_CLUBE","expressao":"cruzeiro","valor_canonico":"CRUZEIRO","prioridade":50,"confianca":0.8},
  {"tipo":"ALIAS_CLUBE","expressao":"atletico mg","valor_canonico":"ATLETICO_MG","prioridade":50,"confianca":0.8},
  {"tipo":"ALIAS_CLUBE","expressao":"atletico mineiro","valor_canonico":"ATLETICO_MG","prioridade":50,"confianca":0.8},
  {"tipo":"ALIAS_CLUBE","expressao":"galo","valor_canonico":"ATLETICO_MG","prioridade":50,"confianca":0.8},
  {"tipo":"ALIAS_CLUBE","expressao":"athletico pr","valor_canonico":"ATHLETICO_PR","prioridade":50,"confianca":0.8},
  {"tipo":"ALIAS_CLUBE","expressao":"athletico paranaense","valor_canonico":"ATHLETICO_PR","prioridade":50,"confianca":0.8},
  {"tipo":"ALIAS_CLUBE","expressao":"bahia","valor_canonico":"BAHIA","prioridade":50,"confianca":0.8},
  {"tipo":"ALIAS_CLUBE","expressao":"vitoria","valor_canonico":"VITORIA","prioridade":50,"confianca":0.8},
  {"tipo":"ALIAS_CLUBE","expressao":"fortaleza","valor_canonico":"FORTALEZA","prioridade":50,"confianca":0.8},
  {"tipo":"ALIAS_CLUBE","expressao":"ceara","valor_canonico":"CEARA","prioridade":50,"confianca":0.8},
  {"tipo":"ALIAS_CLUBE","expressao":"sport recife","valor_canonico":"SPORT","prioridade":50,"confianca":0.8},
  {"tipo":"ALIAS_CLUBE","expressao":"sport","valor_canonico":"SPORT","prioridade":50,"confianca":0.8},
  {"tipo":"ALIAS_CLUBE","expressao":"chapecoense","valor_canonico":"CHAPECOENSE","prioridade":50,"confianca":0.8},
  {"tipo":"ALIAS_CLUBE","expressao":"estudiantes","valor_canonico":"ESTUDIANTES","prioridade":50,"confianca":0.8},
  {"tipo":"ALIAS_CLUBE","expressao":"racing","valor_canonico":"RACING","prioridade":50,"confianca":0.8},
  {"tipo":"ALIAS_CLUBE","expressao":"river plate","valor_canonico":"RIVER_PLATE","prioridade":50,"confianca":0.8},
  {"tipo":"ALIAS_CLUBE","expressao":"boca juniors","valor_canonico":"BOCA_JUNIORS","prioridade":50,"confianca":0.8},
  {"tipo":"ALIAS_PESSOA","expressao":"gabriel barbosa","valor_canonico":"GABIGOL","prioridade":50,"confianca":0.8},
  {"tipo":"ALIAS_PESSOA","expressao":"gabigol","valor_canonico":"GABIGOL","prioridade":50,"confianca":0.8},
  {"tipo":"ALIAS_PESSOA","expressao":"pedro","valor_canonico":"PEDRO","prioridade":50,"confianca":0.8},
  {"tipo":"BLOQUEIO_PESSOA","expressao":"pedro emanuel","valor_canonico":"PEDRO","prioridade":100,"confianca":1},
  {"tipo":"ALIAS_PESSOA","expressao":"arrascaeta","valor_canonico":"ARRASCAETA","prioridade":50,"confianca":0.8},
  {"tipo":"ALIAS_PESSOA","expressao":"bruno henrique","valor_canonico":"BRUNO_HENRIQUE","prioridade":50,"confianca":0.8},
  {"tipo":"ALIAS_PESSOA","expressao":"filipe luis","valor_canonico":"FILIPE_LUIS","prioridade":50,"confianca":0.8},
  {"tipo":"ALIAS_PESSOA","expressao":"samuel lino","valor_canonico":"SAMUEL_LINO","prioridade":50,"confianca":0.8},
  {"tipo":"ALIAS_PESSOA","expressao":"danilo","valor_canonico":"DANILO","prioridade":50,"confianca":0.8},
  {"tipo":"ALIAS_PESSOA","expressao":"jorginho","valor_canonico":"JORGINHO","prioridade":50,"confianca":0.8},
  {"tipo":"ALIAS_PESSOA","expressao":"carrascal","valor_canonico":"CARRASCAL","prioridade":50,"confianca":0.8},
  {"tipo":"ALIAS_PESSOA","expressao":"de la cruz","valor_canonico":"DE_LA_CRUZ","prioridade":50,"confianca":0.8},
  {"tipo":"ALIAS_PESSOA","expressao":"everton cebolinha","valor_canonico":"EVERTON_CEBOLINHA","prioridade":50,"confianca":0.8},
  {"tipo":"ALIAS_PESSOA","expressao":"cebolinha","valor_canonico":"EVERTON_CEBOLINHA","prioridade":50,"confianca":0.8},
  {"tipo":"ALIAS_PESSOA","expressao":"gonzalo plata","valor_canonico":"GONZALO_PLATA","prioridade":50,"confianca":0.8},
  {"tipo":"ALIAS_PESSOA","expressao":"agustin rossi","valor_canonico":"ROSSI","prioridade":50,"confianca":0.8},
  {"tipo":"ALIAS_PESSOA","expressao":"rossi","valor_canonico":"ROSSI","prioridade":50,"confianca":0.8},
  {"tipo":"ALIAS_PESSOA","expressao":"marcos rojo","valor_canonico":"MARCOS_ROJO","prioridade":50,"confianca":0.8},
  {"tipo":"ALIAS_PESSOA","expressao":"rojo","valor_canonico":"MARCOS_ROJO","prioridade":50,"confianca":0.8},
  {"tipo":"ALIAS_PESSOA","expressao":"leonardo jardim","valor_canonico":"LEONARDO_JARDIM","prioridade":50,"confianca":0.8},
  {"tipo":"ALIAS_PESSOA","expressao":"leo pereira","valor_canonico":"LEO_PEREIRA","prioridade":50,"confianca":0.8},
  {"tipo":"ALIAS_ORGANIZACAO","expressao":"conmebol","valor_canonico":"CONMEBOL","prioridade":50,"confianca":0.8},
  {"tipo":"ALIAS_ORGANIZACAO","expressao":"cbf","valor_canonico":"CBF","prioridade":50,"confianca":0.8},
  {"tipo":"ALIAS_ORGANIZACAO","expressao":"confederacao brasileira de futebol","valor_canonico":"CBF","prioridade":50,"confianca":0.8},
  {"tipo":"ALIAS_ORGANIZACAO","expressao":"fifa","valor_canonico":"FIFA","prioridade":50,"confianca":0.8},
  {"tipo":"ALIAS_ORGANIZACAO","expressao":"ferj","valor_canonico":"FERJ","prioridade":50,"confianca":0.8},
  {"tipo":"ALIAS_ORGANIZACAO","expressao":"federacao de futebol do estado do rio de janeiro","valor_canonico":"FERJ","prioridade":50,"confianca":0.8},
  {"tipo":"ALIAS_COMPETICAO","expressao":"brasileirao serie a","valor_canonico":"BRASILEIRAO_SERIE_A","prioridade":100,"confianca":0.8},
  {"tipo":"ALIAS_COMPETICAO","expressao":"brasileiro serie a","valor_canonico":"BRASILEIRAO_SERIE_A","prioridade":100,"confianca":0.8},
  {"tipo":"ALIAS_COMPETICAO","expressao":"serie a","valor_canonico":"BRASILEIRAO_SERIE_A","prioridade":100,"confianca":0.8},
  {"tipo":"ALIAS_COMPETICAO","expressao":"brasileirao serie b","valor_canonico":"BRASILEIRAO_SERIE_B","prioridade":99,"confianca":0.8},
  {"tipo":"ALIAS_COMPETICAO","expressao":"brasileiro serie b","valor_canonico":"BRASILEIRAO_SERIE_B","prioridade":99,"confianca":0.8},
  {"tipo":"ALIAS_COMPETICAO","expressao":"serie b","valor_canonico":"BRASILEIRAO_SERIE_B","prioridade":99,"confianca":0.8},
  {"tipo":"ALIAS_COMPETICAO","expressao":"brasileirao","valor_canonico":"BRASILEIRAO","prioridade":98,"confianca":0.8},
  {"tipo":"ALIAS_COMPETICAO","expressao":"campeonato brasileiro","valor_canonico":"BRASILEIRAO","prioridade":98,"confianca":0.8},
  {"tipo":"ALIAS_COMPETICAO","expressao":"libertadores","valor_canonico":"LIBERTADORES","prioridade":97,"confianca":0.8},
  {"tipo":"ALIAS_COMPETICAO","expressao":"copa do brasil sub 20","valor_canonico":"COPA_DO_BRASIL_SUB_20","prioridade":96,"confianca":0.8},
  {"tipo":"ALIAS_COMPETICAO","expressao":"copa do brasil","valor_canonico":"COPA_DO_BRASIL","prioridade":95,"confianca":0.8},
  {"tipo":"ALIAS_COMPETICAO","expressao":"sul americana","valor_canonico":"SUL_AMERICANA","prioridade":94,"confianca":0.8},
  {"tipo":"ALIAS_COMPETICAO","expressao":"campeonato carioca","valor_canonico":"CARIOCA","prioridade":93,"confianca":0.8},
  {"tipo":"ALIAS_COMPETICAO","expressao":"carioca","valor_canonico":"CARIOCA","prioridade":93,"confianca":0.8},
  {"tipo":"ALIAS_COMPETICAO","expressao":"mundial de clubes","valor_canonico":"MUNDIAL_DE_CLUBES","prioridade":92,"confianca":0.8}
  ]'
);

SELECT `tipo`, `situacao`, `ativo`, COUNT(*) AS `quantidade`
FROM `ADM_vocabulario_editorial`
WHERE `dsc_dominio` = 'ESPORTE'
  AND `dsc_consumidor` = 'M360'
  AND `versao_vocabulario` = '0.1.0'
  AND `dsc_execucao_origem` = 'baseline-static-similaridade-v0.5.0'
GROUP BY `tipo`, `situacao`, `ativo`
ORDER BY `tipo`;
