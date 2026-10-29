-- CORE-029 / registro 1347. Ativa somente as propostas 73 e 74 revisadas.
-- Antes: confirmar que o workflow publicado usa Normaliza v0.2.1 e
-- Similaridade interna v0.5.3; a v0.5.2 rejeita FACETA_EDITORIAL ativa.
-- O UPDATE valida os dados diretamente, sem variavel de sessao.
-- A reexecucao apos ativacao nao altera linhas.
-- Esta etapa afeta apenas o contexto em OBSERVACAO; a decisao lexical nao muda.

UPDATE `ADM_vocabulario_editorial`
SET `situacao` = 'APROVADA',
    `ativo` = 1,
    `dth_atualizado_utc` = UTC_TIMESTAMP()
WHERE `regra_id` IN (73, 74)
  AND `dsc_dominio` = 'ESPORTE'
  AND `dsc_consumidor` = 'M360'
  AND `versao_vocabulario` = '0.1.0'
  AND `tipo` = 'FACETA_EDITORIAL'
  AND `tipo_expressao` = 'LITERAL'
  AND `valor_canonico` = 'PLANEJAMENTO_FINANCEIRO'
  AND `prioridade` = 50
  AND `situacao` = 'PROPOSTA'
  AND `ativo` = 0
  AND `dsc_execucao_origem` = 'm360-core-029-1347-faceta-financas-v0.1.0'
  AND (
    (`regra_id` = 73 AND `expressao` = 'postura ultraconservadora'
      AND `confianca` = 0.8500)
    OR (`regra_id` = 74 AND `expressao` = 'deficit'
      AND `confianca` = 0.7500)
  );

SELECT `regra_id`, `tipo`, `expressao`, `valor_canonico`,
       `situacao`, `ativo`
FROM `ADM_vocabulario_editorial`
WHERE `regra_id` IN (73, 74)
  AND `dsc_dominio` = 'ESPORTE'
  AND `dsc_consumidor` = 'M360'
  AND `versao_vocabulario` = '0.1.0'
ORDER BY `regra_id`;

SELECT COUNT(*) AS `regras_ativas`,
       SUM(`tipo` = 'FACETA_EDITORIAL') AS `facetas_ativas`
FROM `ADM_vocabulario_editorial`
WHERE `dsc_dominio` = 'ESPORTE'
  AND `dsc_consumidor` = 'M360'
  AND `versao_vocabulario` = '0.1.0'
  AND `situacao` = 'APROVADA'
  AND `ativo` = 1;
