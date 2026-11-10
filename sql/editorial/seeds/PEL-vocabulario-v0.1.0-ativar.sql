-- Ativacao restrita as propostas conferidas pelo operador. Pode ativar parcialmente;
-- confira o resultado antes de conectar o fluxo. Nao depende de variavel de sessao.
UPDATE ADM_vocabulario_editorial
SET situacao = 'APROVADA', ativo = 1, dth_atualizado_utc = UTC_TIMESTAMP()
WHERE dsc_dominio = 'ENERGIA_LIMPA' AND dsc_consumidor = 'PEL'
  AND versao_vocabulario = '0.1.0' AND tipo = 'FACETA_EDITORIAL'
  AND tipo_expressao = 'LITERAL' AND situacao = 'PROPOSTA' AND ativo = 0
  AND dsc_execucao_origem = 'pel-baseline-energia-v0.1.0'
  AND ( (regra_id = 1 AND expressao = 'energia solar' AND valor_canonico = 'ENERGIA_SOLAR')
     OR (regra_id = 2 AND expressao = 'energia fotovoltaica' AND valor_canonico = 'ENERGIA_SOLAR')
     OR (regra_id = 3 AND expressao = 'energia eólica' AND valor_canonico = 'ENERGIA_EOLICA')
     OR (regra_id = 4 AND expressao = 'geração distribuída' AND valor_canonico = 'GERACAO_DISTRIBUIDA')
     OR (regra_id = 5 AND expressao = 'armazenamento de energia' AND valor_canonico = 'ARMAZENAMENTO_ENERGIA')
     OR (regra_id = 6 AND expressao = 'hidrogênio verde' AND valor_canonico = 'HIDROGENIO_VERDE')
     OR (regra_id = 7 AND expressao = 'biogás' AND valor_canonico = 'BIOGAS')
     OR (regra_id = 8 AND expressao = 'biometano' AND valor_canonico = 'BIOMETANO')
     OR (regra_id = 9 AND expressao = 'eficiência energética' AND valor_canonico = 'EFICIENCIA_ENERGETICA')
     OR (regra_id = 10 AND expressao = 'transição energética' AND valor_canonico = 'TRANSICAO_ENERGETICA') );

SELECT regra_id, expressao, valor_canonico, situacao, ativo
FROM ADM_vocabulario_editorial
WHERE dsc_dominio = 'ENERGIA_LIMPA' AND dsc_consumidor = 'PEL'
  AND versao_vocabulario = '0.1.0' AND regra_id BETWEEN 1 AND 10
ORDER BY regra_id;
