-- Rollback restrito das regras 73 e 74: mantem aprovacao, retira do LISTAR.
-- Seguro tambem se somente uma das duas estiver ativa.

UPDATE `ADM_vocabulario_editorial`
SET `ativo` = 0,
    `dth_atualizado_utc` = UTC_TIMESTAMP()
WHERE `regra_id` IN (73, 74)
  AND `dsc_dominio` = 'ESPORTE'
  AND `dsc_consumidor` = 'M360'
  AND `versao_vocabulario` = '0.1.0'
  AND `tipo` = 'FACETA_EDITORIAL'
  AND `valor_canonico` = 'PLANEJAMENTO_FINANCEIRO'
  AND `situacao` = 'APROVADA'
  AND `ativo` = 1
  AND `dsc_execucao_origem` = 'm360-core-029-1347-faceta-financas-v0.1.0';

SELECT `regra_id`, `expressao`, `situacao`, `ativo`
FROM `ADM_vocabulario_editorial`
WHERE `regra_id` IN (73, 74)
  AND `dsc_dominio` = 'ESPORTE'
  AND `dsc_consumidor` = 'M360'
ORDER BY `regra_id`;
