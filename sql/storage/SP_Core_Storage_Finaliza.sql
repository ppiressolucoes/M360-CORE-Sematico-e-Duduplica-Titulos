CREATE PROCEDURE `SP_Core_Storage_Finaliza`(
    IN p_storage_id INT,
    IN p_reservation_token CHAR(36),
    IN p_sucesso TINYINT,
    IN p_status VARCHAR(255),
    IN p_bloqueio_minutos INT
)
proc: BEGIN
    DECLARE v_fuso_original VARCHAR(64);
    DECLARE v_storage_id INT DEFAULT NULL;
    DECLARE v_agora DATETIME;
    DECLARE v_bloqueio INT DEFAULT 60;

    DECLARE v_provider VARCHAR(45);
    DECLARE v_alias VARCHAR(100);
    DECLARE v_status VARCHAR(255);
    DECLARE v_acesso DATETIME;
    DECLARE v_bloqueio_ate DATETIME DEFAULT NULL;
    DECLARE v_count INT;

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

    IF p_bloqueio_minutos BETWEEN 0 AND 1440 THEN
        SET v_bloqueio = p_bloqueio_minutos;
    END IF;

    START TRANSACTION;

    BEGIN
        DECLARE CONTINUE HANDLER FOR NOT FOUND
            SET v_storage_id = NULL;

        SELECT
            s.storage_id, s.provider, s.storage_alias,
            s.dth_acesso, s.num_count
        INTO
            v_storage_id, v_provider, v_alias,
            v_acesso, v_count
        FROM Core_Storage_Provider AS s
        WHERE s.storage_id = p_storage_id
          AND s.reservation_token = p_reservation_token
        LIMIT 1
        FOR UPDATE;
    END;

    IF v_storage_id IS NULL THEN
        ROLLBACK;
        SET SESSION time_zone = v_fuso_original;

        SELECT
            0 AS finalizacao_ok,
            'reserva_nao_encontrada_ou_token_invalido' AS motivo,
            p_storage_id AS storage_id;

        LEAVE proc;
    END IF;

    SET v_agora = NOW();

    IF p_sucesso = 1 THEN
        SET v_status =
            COALESCE(NULLIF(TRIM(p_status), ''), 'Sucesso');
        SET v_bloqueio_ate = NULL;
    ELSE
        SET v_status =
            COALESCE(NULLIF(TRIM(p_status), ''), 'Erro');

        IF v_bloqueio = 0 THEN
            SET v_bloqueio_ate = NULL;
        ELSE
            SET v_bloqueio_ate =
                DATE_ADD(v_agora, INTERVAL v_bloqueio MINUTE);
        END IF;
    END IF;

    UPDATE Core_Storage_Provider
    SET
        dsc_status = v_status,
        dth_bloqueio_ate = v_bloqueio_ate,
        reservation_token = NULL,
        dth_reserva_ate = NULL
    WHERE storage_id = v_storage_id
      AND reservation_token = p_reservation_token;

    COMMIT;
    SET SESSION time_zone = v_fuso_original;

    SELECT
        1 AS finalizacao_ok,
        CASE
            WHEN p_sucesso = 1 THEN 'storage_liberado'
            WHEN v_bloqueio = 0 THEN 'storage_liberado_com_erro'
            ELSE 'storage_bloqueado'
        END AS motivo,
        v_storage_id AS storage_id,
        v_provider AS provider,
        v_alias AS storage_alias,
        v_status AS dsc_status,
        v_acesso AS dth_acesso,
        v_bloqueio_ate AS dth_bloqueio_ate,
        NULL AS dth_reserva_ate,
        v_count AS num_count;
END
