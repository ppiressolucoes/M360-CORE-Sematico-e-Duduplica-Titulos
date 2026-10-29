-- Execute somente depois de revisar a proposta v0.1.0 do M360 e confirmar
-- equivalencia com as listas literais da Similaridade Editorial v0.5.0.
-- Esta ativacao altera apenas o vocabulario; nao altera o roteamento n8n.
-- Execute o arquivo inteiro na mesma sessao MariaDB. A checagem de contagem
-- impede ativacao parcial caso alguma regra ja tenha outra origem.

SET @m360_vocab_baseline_completo = (
  SELECT COUNT(*) = 72
     AND SUM(`tipo` = 'ALIAS_CLUBE') = 30
     AND SUM(`tipo` = 'ALIAS_PESSOA') = 20
     AND SUM(`tipo` = 'BLOQUEIO_PESSOA') = 1
     AND SUM(`tipo` = 'ALIAS_ORGANIZACAO') = 6
     AND SUM(`tipo` = 'ALIAS_COMPETICAO') = 15
  FROM `ADM_vocabulario_editorial`
  WHERE `dsc_dominio` = 'ESPORTE'
    AND `dsc_consumidor` = 'M360'
    AND `versao_vocabulario` = '0.1.0'
    AND `dsc_execucao_origem` = 'baseline-static-similaridade-v0.5.0'
);

SELECT @m360_vocab_baseline_completo AS `baseline_completo`;

UPDATE `ADM_vocabulario_editorial`
SET `situacao` = 'APROVADA',
    `ativo` = 1,
    `dth_atualizado_utc` = UTC_TIMESTAMP()
WHERE `dsc_dominio` = 'ESPORTE'
  AND `dsc_consumidor` = 'M360'
  AND `versao_vocabulario` = '0.1.0'
  AND `dsc_execucao_origem` = 'baseline-static-similaridade-v0.5.0'
  AND `situacao` = 'PROPOSTA'
  AND `ativo` = 0
  AND @m360_vocab_baseline_completo = 1;

SELECT `tipo`, COUNT(*) AS `quantidade_ativa`
FROM `ADM_vocabulario_editorial`
WHERE `dsc_dominio` = 'ESPORTE'
  AND `dsc_consumidor` = 'M360'
  AND `versao_vocabulario` = '0.1.0'
  AND `situacao` = 'APROVADA'
  AND `ativo` = 1
GROUP BY `tipo`
ORDER BY `tipo`;

CALL `SP_VOCABULARIO_EDITORIAL`('LISTAR', 'ESPORTE', 'M360', '0.1.0', NULL, NULL);
