CREATE PROCEDURE `SP_Core_Storage_Reserva`(
    IN p_provider VARCHAR(45),
    IN p_ttl_reserva_minutos INT
)
proc: BEGIN
    DECLARE v_fuso_original VARCHAR(64);
    DECLARE v_storage_id INT DEFAULT NULL;
    DECLARE v_token CHAR(36);
    DECLARE v_agora DATETIME;
    DECLARE v_ttl INT DEFAULT 3;
    DECLARE v_reserva_ate DATETIME;

    DECLARE v_provider VARCHAR(45);
    DECLARE v_driver VARCHAR(45);
    DECLARE v_alias VARCHAR(100);
    DECLARE v_email VARCHAR(190);
    DECLARE v_endpoint VARCHAR(255);
    DECLARE v_public_base VARCHAR(255);
    DECLARE v_bucket VARCHAR(190);
    DECLARE v_region VARCHAR(100);
    DECLARE v_credential_ref VARCHAR(100);
    DECLARE v_prioridade INT;
    DECLARE v_ativo TINYINT;
    DECLARE v_status VARCHAR(255);
    DECLARE v_bloqueio_ate DATETIME;
    DECLARE v_count BIGINT;

    DECLARE v_credential_id BIGINT DEFAULT NULL;
    DECLARE v_id_text TEXT;
    DECLARE v_api_key TEXT DEFAULT NULL;
    DECLARE v_api_secret TEXT DEFAULT NULL;
    DECLARE v_credential_found TINYINT DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        IF v_fuso_original IS NOT NULL THEN
            SET SESSION time_zone = v_fuso_original;
        END IF;
        RESIGNAL;
    END;

    SET v_fuso_original = @@session.time_zone;
    SET SESSION time_zone = '-03:00';

    IF p_ttl_reserva_minutos BETWEEN 1 AND 30 THEN
        SET v_ttl = p_ttl_reserva_minutos;
    END IF;

    START TRANSACTION;

    BEGIN
        DECLARE CONTINUE HANDLER FOR NOT FOUND
            SET v_storage_id = NULL;

        SELECT
            s.storage_id, s.provider, s.storage_driver,
            s.storage_alias, s.account_email, s.endpoint_url,
            s.public_base_url, s.bucket_name, s.region_name,
            s.credential_ref, s.prioridade, s.ind_ativo,
            s.dsc_status, s.dth_bloqueio_ate,
            COALESCE(s.num_count, 0)
        INTO
            v_storage_id, v_provider, v_driver,
            v_alias, v_email, v_endpoint,
            v_public_base, v_bucket, v_region,
            v_credential_ref, v_prioridade, v_ativo,
            v_status, v_bloqueio_ate, v_count
        FROM Core_Storage_Provider AS s
        WHERE s.ind_ativo = 1
          AND (
                p_provider IS NULL
                OR TRIM(p_provider) = ''
                OR s.provider = LOWER(TRIM(p_provider))
              )
          AND (
                s.dth_bloqueio_ate IS NULL
                OR s.dth_bloqueio_ate <= NOW()
              )
          AND (
                s.dth_reserva_ate IS NULL
                OR s.dth_reserva_ate <= NOW()
              )
        ORDER BY
            s.prioridade ASC,
            CASE WHEN s.dth_acesso IS NULL THEN 0 ELSE 1 END,
            s.dth_acesso ASC,
            s.num_count ASC,
            s.storage_id ASC
        LIMIT 1
        FOR UPDATE;
    END;

    IF v_storage_id IS NULL THEN
        ROLLBACK;
        SET SESSION time_zone = v_fuso_original;

        SELECT
            0 AS reserva_ok,
            'nenhum_storage_disponivel' AS motivo,
            NULL AS storage_id,
            NULL AS reservation_token;

        LEAVE proc;
    END IF;

    IF LOWER(TRIM(v_provider)) = 'cloudinary' THEN

        IF v_credential_ref IS NULL
           OR v_credential_ref NOT REGEXP '^config_api_ia:[0-9]+$' THEN
            ROLLBACK;
            SET SESSION time_zone = v_fuso_original;

            SELECT
                0 AS reserva_ok,
                'credential_ref_cloudinary_invalida' AS motivo,
                v_storage_id AS storage_id,
                NULL AS reservation_token;

            LEAVE proc;
        END IF;

        SET v_id_text = TRIM(
            LEADING '0' FROM
            SUBSTRING_INDEX(v_credential_ref, ':', -1)
        );

        IF CHAR_LENGTH(v_id_text) = 0
           OR CHAR_LENGTH(v_id_text) > 10 THEN
            ROLLBACK;
            SET SESSION time_zone = v_fuso_original;

            SELECT
                0 AS reserva_ok,
                'credential_ref_cloudinary_invalida' AS motivo,
                v_storage_id AS storage_id,
                NULL AS reservation_token;

            LEAVE proc;
        END IF;

        SET v_credential_id = CAST(v_id_text AS UNSIGNED);

        BEGIN
            DECLARE CONTINUE HANDLER FOR NOT FOUND
                SET v_credential_found = 0;

            SELECT 1, c.dsc_api_key, c.dsc_api_secret
            INTO v_credential_found, v_api_key, v_api_secret
            FROM Config_API_IA AS c
            WHERE c.id = v_credential_id
            LIMIT 1;
        END;

        IF v_credential_found = 0
           OR NULLIF(TRIM(v_api_key), '') IS NULL
           OR NULLIF(TRIM(v_api_secret), '') IS NULL THEN
            ROLLBACK;
            SET SESSION time_zone = v_fuso_original;

            SELECT
                0 AS reserva_ok,
                'credencial_cloudinary_ausente_ou_incompleta' AS motivo,
                v_storage_id AS storage_id,
                NULL AS reservation_token;

            LEAVE proc;
        END IF;
    END IF;

    SET v_agora = NOW();
    SET v_token = UUID();
    SET v_reserva_ate = DATE_ADD(v_agora, INTERVAL v_ttl MINUTE);
    SET v_count = v_count + 1;

    UPDATE Core_Storage_Provider
    SET
        reservation_token = v_token,
        dth_reserva_ate = v_reserva_ate,
        dth_acesso = v_agora,
        num_count = v_count
    WHERE storage_id = v_storage_id;

    COMMIT;
    SET SESSION time_zone = v_fuso_original;

    SELECT
        1 AS reserva_ok,
        'storage_reservado' AS motivo,
        v_storage_id AS storage_id,
        v_provider AS provider,
        v_driver AS storage_driver,
        v_alias AS storage_alias,
        v_email AS account_email,
        v_endpoint AS endpoint_url,
        v_public_base AS public_base_url,
        v_bucket AS bucket_name,
        v_region AS region_name,
        v_credential_ref AS credential_ref,
        v_prioridade AS prioridade,
        v_ativo AS ind_ativo,
        v_status AS dsc_status,
        v_agora AS dth_acesso,
        v_bloqueio_ate AS dth_bloqueio_ate,
        v_token AS reservation_token,
        v_reserva_ate AS dth_reserva_ate,
        v_count AS num_count,
        v_credential_id AS credential_id,
        v_api_key AS dsc_api_key,
        v_api_secret AS dsc_api_secret;
END
