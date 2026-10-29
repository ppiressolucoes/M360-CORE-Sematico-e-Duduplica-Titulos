-- SP de apoio v0.1.0. Uma chamada LISTAR por execucao e, se necessario,
-- uma chamada PROPOR com um array JSON. Dominio/consumidor isolam vocabularios
-- (ex.: ESPORTE/M360, ENERGIA_LIMPA/PORTAL_ENERGIA, BOA_TRILHA/PORTAL_TRILHA).
-- Sem consulta ao historico de titulos.
-- Formato da proposta: [{"tipo":"ALIAS_PESSOA","expressao":"leo pereira",
--   "valor_canonico":"LEO_PEREIRA","prioridade":50,"confianca":0.8,
--   "tipo_expressao":"LITERAL","evidencia":"titulo ou justificativa"}]
-- PROPOR nunca aprova nem ativa uma regra. REGEX_JS fica reservado para
-- migracao posterior com validacao especifica contra regex insegura.
-- Exemplos (uma chamada por execucao, nunca por comparavel):
-- CALL SP_VOCABULARIO_EDITORIAL('LISTAR','ESPORTE','M360','0.1.0',NULL,NULL);
-- CALL SP_VOCABULARIO_EDITORIAL('PROPOR','ESPORTE','M360','0.1.1',
--   'execucao-123','[{"tipo":"ALIAS_PESSOA","expressao":"leo pereira",
--   "valor_canonico":"LEO_PEREIRA","prioridade":50,"confianca":0.8}]');
-- Reenvio de um lote e seguro: a chave unica ignora propostas ja registradas.
-- O lote nao e atomico; apos falha, basta reenviar o mesmo array.
-- Execute este arquivo inteiro em cliente MariaDB/MySQL que reconheca
-- DELIMITER. DELIMITER e comando do cliente, nao da propria SP.

DELIMITER $$

CREATE PROCEDURE `SP_VOCABULARIO_EDITORIAL`(
    IN p_acao VARCHAR(10),
    IN p_dominio VARCHAR(50),
    IN p_consumidor VARCHAR(50),
    IN p_versao_vocabulario VARCHAR(32),
    IN p_execucao_id VARCHAR(100),
    IN p_regras_json LONGTEXT
)
proc: BEGIN
    DECLARE v_acao VARCHAR(10);
    DECLARE v_dominio VARCHAR(50);
    DECLARE v_consumidor VARCHAR(50);
    DECLARE v_versao VARCHAR(32);
    DECLARE v_total INT DEFAULT 0;
    DECLARE v_indice INT DEFAULT 0;
    DECLARE v_path VARCHAR(40);
    DECLARE v_tipo TEXT;
    DECLARE v_tipo_expressao TEXT;
    DECLARE v_expressao TEXT;
    DECLARE v_valor_canonico TEXT;
    DECLARE v_evidencia TEXT;
    DECLARE v_prioridade_json TEXT;
    DECLARE v_confianca_json TEXT;
    DECLARE v_prioridade INT;
    DECLARE v_confianca DECIMAL(5,4);
    DECLARE v_hash CHAR(64);

    SET v_acao = UPPER(TRIM(COALESCE(p_acao, '')));
    SET v_dominio = UPPER(TRIM(COALESCE(p_dominio, '')));
    SET v_consumidor = UPPER(TRIM(COALESCE(p_consumidor, '')));
    SET v_versao = TRIM(COALESCE(p_versao_vocabulario, ''));

    IF v_acao NOT IN ('LISTAR', 'PROPOR')
       OR v_dominio NOT REGEXP '^[A-Z][A-Z0-9_]{1,49}$'
       OR v_consumidor NOT REGEXP '^[A-Z][A-Z0-9_]{1,49}$'
       OR v_versao NOT REGEXP '^[0-9]+[.][0-9]+[.][0-9]+$'
    THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'SP_VOCABULARIO_EDITORIAL: acao, escopo ou versao invalida';
    END IF;

    IF v_acao = 'LISTAR' THEN
        SELECT
            `regra_id`, `dsc_dominio`, `dsc_consumidor`,
            `versao_vocabulario`, `tipo`, `tipo_expressao`,
            `expressao`, `valor_canonico`, `prioridade`, `confianca`, `ativo`
        FROM `ADM_vocabulario_editorial`
        WHERE `dsc_dominio` = v_dominio
          AND `dsc_consumidor` = v_consumidor
          AND `versao_vocabulario` = v_versao
          AND `situacao` = 'APROVADA'
          AND `ativo` = 1
        ORDER BY `prioridade` DESC, `regra_id` ASC;
    ELSE
        IF p_execucao_id IS NULL OR TRIM(p_execucao_id) = ''
           OR p_regras_json IS NULL OR OCTET_LENGTH(p_regras_json) > 65535
           OR JSON_VALID(p_regras_json) = 0
        THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'SP_VOCABULARIO_EDITORIAL: lote ou execucao invalida';
        END IF;

        IF JSON_TYPE(p_regras_json) <> 'ARRAY' THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'SP_VOCABULARIO_EDITORIAL: esperado array JSON';
        END IF;

        SET v_total = JSON_LENGTH(p_regras_json);
        IF v_total > 100 THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'SP_VOCABULARIO_EDITORIAL: lote acima de 100 propostas';
        END IF;

        WHILE v_indice < v_total DO
            SET v_path = CONCAT('$[', v_indice, ']');
            IF JSON_TYPE(JSON_EXTRACT(p_regras_json, v_path)) <> 'OBJECT' THEN
                SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'SP_VOCABULARIO_EDITORIAL: proposta nao e objeto';
            END IF;

            SET v_tipo = UPPER(TRIM(JSON_UNQUOTE(JSON_EXTRACT(
                p_regras_json, CONCAT(v_path, '.tipo')))));
            SET v_tipo_expressao = UPPER(TRIM(COALESCE(JSON_UNQUOTE(JSON_EXTRACT(
                p_regras_json, CONCAT(v_path, '.tipo_expressao'))), 'LITERAL')));
            SET v_expressao = LOWER(TRIM(JSON_UNQUOTE(JSON_EXTRACT(
                p_regras_json, CONCAT(v_path, '.expressao')))));
            SET v_valor_canonico = UPPER(TRIM(JSON_UNQUOTE(JSON_EXTRACT(
                p_regras_json, CONCAT(v_path, '.valor_canonico')))));
            SET v_evidencia = JSON_UNQUOTE(JSON_EXTRACT(
                p_regras_json, CONCAT(v_path, '.evidencia')));
            SET v_prioridade_json = JSON_UNQUOTE(JSON_EXTRACT(
                p_regras_json, CONCAT(v_path, '.prioridade')));
            SET v_confianca_json = JSON_UNQUOTE(JSON_EXTRACT(
                p_regras_json, CONCAT(v_path, '.confianca')));

            IF COALESCE(JSON_TYPE(JSON_EXTRACT(
                p_regras_json, CONCAT(v_path, '.tipo'))), 'MISSING') <> 'STRING'
               OR COALESCE(JSON_TYPE(JSON_EXTRACT(
                p_regras_json, CONCAT(v_path, '.expressao'))), 'MISSING') <> 'STRING'
               OR COALESCE(JSON_TYPE(JSON_EXTRACT(
                p_regras_json, CONCAT(v_path, '.valor_canonico'))), 'MISSING') <> 'STRING'
               OR COALESCE(JSON_TYPE(JSON_EXTRACT(
                p_regras_json, CONCAT(v_path, '.prioridade'))), 'MISSING')
                  NOT IN ('INTEGER', 'DOUBLE', 'DECIMAL')
               OR COALESCE(JSON_TYPE(JSON_EXTRACT(
                p_regras_json, CONCAT(v_path, '.confianca'))), 'MISSING')
                  NOT IN ('INTEGER', 'DOUBLE', 'DECIMAL')
               OR v_tipo IS NULL OR v_tipo NOT REGEXP '^[A-Z][A-Z0-9_]{1,39}$'
               OR v_tipo_expressao <> 'LITERAL'
               OR v_expressao IS NULL OR CHAR_LENGTH(v_expressao) NOT BETWEEN 2 AND 250
               OR v_valor_canonico IS NULL OR CHAR_LENGTH(v_valor_canonico) NOT BETWEEN 2 AND 120
               OR (v_evidencia IS NOT NULL AND CHAR_LENGTH(v_evidencia) > 1000)
               OR v_prioridade_json IS NULL OR v_prioridade_json NOT REGEXP '^[0-9]{1,3}$'
               OR v_confianca_json IS NULL
               OR v_confianca_json NOT REGEXP '^(0([.][0-9]{1,4})?|1([.]0{1,4})?)$'
            THEN
                SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'SP_VOCABULARIO_EDITORIAL: proposta invalida';
            END IF;

            SET v_prioridade = CAST(v_prioridade_json AS UNSIGNED);
            SET v_confianca = CAST(v_confianca_json AS DECIMAL(5,4));
            IF v_prioridade > 100 THEN
                SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'SP_VOCABULARIO_EDITORIAL: prioridade acima de 100';
            END IF;

            SET v_hash = SHA2(CONCAT(
                CHAR_LENGTH(v_tipo), ':', v_tipo,
                CHAR_LENGTH(v_tipo_expressao), ':', v_tipo_expressao,
                CHAR_LENGTH(v_expressao), ':', v_expressao,
                CHAR_LENGTH(v_valor_canonico), ':', v_valor_canonico
            ), 256);

            INSERT INTO `ADM_vocabulario_editorial` (
                `dsc_dominio`, `dsc_consumidor`, `versao_vocabulario`,
                `tipo`, `tipo_expressao`,
                `expressao`, `valor_canonico`, `prioridade`, `confianca`,
                `situacao`, `ativo`, `dsc_regra_hash`,
                `dsc_execucao_origem`, `txt_evidencia_inicial`,
                `dth_criado_utc`, `dth_atualizado_utc`
            ) VALUES (
                v_dominio, v_consumidor, v_versao, v_tipo, v_tipo_expressao,
                v_expressao, v_valor_canonico, v_prioridade, v_confianca,
                'PROPOSTA', 0, v_hash,
                TRIM(p_execucao_id), v_evidencia,
                UTC_TIMESTAMP(), UTC_TIMESTAMP()
            ) ON DUPLICATE KEY UPDATE `regra_id` = `regra_id`;

            SET v_indice = v_indice + 1;
        END WHILE;

        SELECT 'PROPOSTAS_REGISTRADAS' AS `resultado`,
               v_dominio AS `dominio`, v_consumidor AS `consumidor`,
               v_versao AS `versao_vocabulario`,
               v_total AS `propostas_recebidas`;
    END IF;
END$$

DELIMITER ;
