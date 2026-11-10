-- Carga inicial para revisao editorial. Nao ativa regras.
-- Executar apenas no banco do PEL depois de conferir o escopo.
-- FACETA_EDITORIAL identifica temas; nao determina duplicidade.
CALL SP_VOCABULARIO_EDITORIAL(
  'PROPOR', 'ENERGIA_LIMPA', 'PEL', '0.1.0',
  'pel-baseline-energia-v0.1.0',
  '[
    {"tipo":"FACETA_EDITORIAL","tipo_expressao":"LITERAL","expressao":"energia solar","valor_canonico":"ENERGIA_SOLAR","prioridade":50,"confianca":0.95},
    {"tipo":"FACETA_EDITORIAL","tipo_expressao":"LITERAL","expressao":"energia fotovoltaica","valor_canonico":"ENERGIA_SOLAR","prioridade":50,"confianca":0.95},
    {"tipo":"FACETA_EDITORIAL","tipo_expressao":"LITERAL","expressao":"energia eólica","valor_canonico":"ENERGIA_EOLICA","prioridade":50,"confianca":0.95},
    {"tipo":"FACETA_EDITORIAL","tipo_expressao":"LITERAL","expressao":"geração distribuída","valor_canonico":"GERACAO_DISTRIBUIDA","prioridade":50,"confianca":0.95},
    {"tipo":"FACETA_EDITORIAL","tipo_expressao":"LITERAL","expressao":"armazenamento de energia","valor_canonico":"ARMAZENAMENTO_ENERGIA","prioridade":50,"confianca":0.95},
    {"tipo":"FACETA_EDITORIAL","tipo_expressao":"LITERAL","expressao":"hidrogênio verde","valor_canonico":"HIDROGENIO_VERDE","prioridade":50,"confianca":0.95},
    {"tipo":"FACETA_EDITORIAL","tipo_expressao":"LITERAL","expressao":"biogás","valor_canonico":"BIOGAS","prioridade":50,"confianca":0.90},
    {"tipo":"FACETA_EDITORIAL","tipo_expressao":"LITERAL","expressao":"biometano","valor_canonico":"BIOMETANO","prioridade":50,"confianca":0.95},
    {"tipo":"FACETA_EDITORIAL","tipo_expressao":"LITERAL","expressao":"eficiência energética","valor_canonico":"EFICIENCIA_ENERGETICA","prioridade":50,"confianca":0.95},
    {"tipo":"FACETA_EDITORIAL","tipo_expressao":"LITERAL","expressao":"transição energética","valor_canonico":"TRANSICAO_ENERGETICA","prioridade":50,"confianca":0.90}
  ]'
);

-- Conferencia: a SP LISTAR so retorna regras APROVADA e ativas.
SELECT regra_id, dsc_dominio, dsc_consumidor, versao_vocabulario,
       tipo, tipo_expressao, expressao, valor_canonico,
       prioridade, confianca, situacao, ativo
FROM ADM_vocabulario_editorial
WHERE dsc_dominio = 'ENERGIA_LIMPA'
  AND dsc_consumidor = 'PEL'
  AND versao_vocabulario = '0.1.0'
  AND dsc_execucao_origem = 'pel-baseline-energia-v0.1.0'
ORDER BY regra_id;
