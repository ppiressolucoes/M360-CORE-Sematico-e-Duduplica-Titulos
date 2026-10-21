CREATE PROCEDURE `SP_DEDUPLICA_EDITORIAL_FINALIZA`(
    IN p_registro_id      BIGINT UNSIGNED,
    IN p_status_final     VARCHAR(30),
    IN p_observacao       VARCHAR(1000),
    IN p_execucao_id      VARCHAR(100)
)
proc: BEGIN

    DECLARE v_status_final        VARCHAR(30);
    DECLARE v_status_atual        VARCHAR(30);
    DECLARE v_registro_existe     INT DEFAULT 0;
    DECLARE v_agora               DATETIME;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;


    /* ============================================================
       1. VALIDAÇÕES
       ============================================================ */

    IF
        p_registro_id IS NULL
        OR p_registro_id <= 0
    THEN

        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
                'SP_DEDUPLICA_EDITORIAL_FINALIZA: registro_id inválido.';

    END IF;


    SET v_status_final =
        UPPER(
            TRIM(
                COALESCE(
                    p_status_final,
                    ''
                )
            )
        );


    IF v_status_final NOT IN (
        'PUBLICADO',
        'DUPLICADO',
        'SUSPEITO',
        'ERROR'
    )
    THEN

        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
                'SP_DEDUPLICA_EDITORIAL_FINALIZA: status_final inválido.';

    END IF;


    /* ============================================================
       2. HORÁRIO PADRONIZADO UTC-3
       ============================================================ */

    SET v_agora =
        DATE_SUB(
            UTC_TIMESTAMP(),
            INTERVAL 3 HOUR
        );


    /* ============================================================
       3. BLOQUEIA REGISTRO
       ============================================================ */

    START TRANSACTION;


    SELECT
        COUNT(*),
        MAX(dsc_status)

    INTO
        v_registro_existe,
        v_status_atual

    FROM ADM_deduplica_editorial

    WHERE
        id = p_registro_id

    FOR UPDATE;


    /* ============================================================
       4. REGISTRO NÃO ENCONTRADO
       ============================================================ */

    IF v_registro_existe = 0 THEN

        ROLLBACK;

        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
                'SP_DEDUPLICA_EDITORIAL_FINALIZA: registro não encontrado.';

    END IF;


    /* ============================================================
       5. PROTEÇÃO DE ESTADO / IDEMPOTÊNCIA
       ============================================================ */

    IF v_status_atual <> 'PROCESSING' THEN


        /*
          Caso o registro já esteja exatamente no estado solicitado,
          tratamos como sucesso idempotente.

          Exemplo:
          PUBLICADO → nova chamada PUBLICADO
          não deve gerar erro.
        */

        IF v_status_atual = v_status_final THEN

            COMMIT;


            SELECT
                'ALREADY_FINALIZED'
                    AS resultado,

                p_registro_id
                    AS registro_id,

                v_status_atual
                    AS status_anterior,

                v_status_final
                    AS status_final,

                v_agora
                    AS dth_processado;


            LEAVE proc;

        END IF;


        /*
          Se já estiver finalizado com outro estado,
          não permitimos sobrescrever a decisão.
        */

        ROLLBACK;


        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
                'SP_DEDUPLICA_EDITORIAL_FINALIZA: registro não está em PROCESSING.';

    END IF;


    /* ============================================================
       6. FINALIZAÇÃO
       ============================================================ */

    UPDATE ADM_deduplica_editorial

    SET
        dsc_status =
            v_status_final,

        dth_atualizado =
            v_agora,

        dth_finalizado =
            v_agora,

        dsc_execucao_id =
            COALESCE(
                NULLIF(
                    TRIM(p_execucao_id),
                    ''
                ),
                dsc_execucao_id
            ),

        txt_observacao =
            NULLIF(
                TRIM(p_observacao),
                ''
            )

    WHERE
        id = p_registro_id;


    COMMIT;


    /* ============================================================
       7. RETORNO
       ============================================================ */

    SELECT
        'FINALIZED'
            AS resultado,

        p_registro_id
            AS registro_id,

        'PROCESSING'
            AS status_anterior,

        v_status_final
            AS status_final,

        v_agora
            AS dth_finalizado;

END