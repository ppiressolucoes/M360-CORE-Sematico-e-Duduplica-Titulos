-- CORE-029 / registro 1347. Propoe duas expressoes literais da mesma faceta.
-- A SP grava situacao PROPOSTA e ativo = 0; LISTAR nao passa a devolve-las.
-- Reexecutavel: dsc_regra_hash impede duplicacao no escopo/versao.
-- Nao executar UPDATE de ativacao nesta etapa.

CALL `SP_VOCABULARIO_EDITORIAL`(
  'PROPOR', 'ESPORTE', 'M360', '0.1.0',
  'm360-core-029-1347-faceta-financas-v0.1.0',
  '[
    {"tipo":"FACETA_EDITORIAL","tipo_expressao":"LITERAL","expressao":"postura ultraconservadora","valor_canonico":"PLANEJAMENTO_FINANCEIRO","prioridade":50,"confianca":0.85,"evidencia":"Registro 1347: titulo candidato sobre postura financeira do Flamengo em 2027"},
    {"tipo":"FACETA_EDITORIAL","tipo_expressao":"LITERAL","expressao":"deficit","valor_canonico":"PLANEJAMENTO_FINANCEIRO","prioridade":50,"confianca":0.75,"evidencia":"Registro 1347: titulo comparavel 3686 sobre deficit e projecao financeira"}
  ]'
);

SELECT `regra_id`, `tipo`, `expressao`, `valor_canonico`,
       `situacao`, `ativo`, `dsc_execucao_origem`
FROM `ADM_vocabulario_editorial`
WHERE `dsc_dominio` = 'ESPORTE'
  AND `dsc_consumidor` = 'M360'
  AND `versao_vocabulario` = '0.1.0'
  AND `dsc_execucao_origem` = 'm360-core-029-1347-faceta-financas-v0.1.0'
ORDER BY `regra_id`;
