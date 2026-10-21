CREATE PROCEDURE `SP_DEDUPLICA_EDITORIAL`(
    IN p_portal          VARCHAR(50),
    IN p_titulo          VARCHAR(500),
    IN p_categoria       VARCHAR(100),
    IN p_url_origem      VARCHAR(500),
    IN p_post_id         VARCHAR(555),
    IN p_janela_dias     INT,
    IN p_execucao_id     VARCHAR(100)
)
proc: BEGIN

    /* ============================================================
       CORE EDITORIAL | DEDUPLICAÇÃO
       Portal: M360
       Versão: 0.2.2

       Evolução:
       - Dedup exata source-specific
       - Similaridade CROSS-SOURCE
       - Exclui:
         * InstaFeeds
         * InstaStories
         * traduz%
         * mengao360.com
         * e-mails internos @mengao360.com
       ============================================================ */

    DECLARE v_portal              VARCHAR(50);
    DECLARE v_titulo              VARCHAR(500);
    DECLARE v_categoria           VARCHAR(100);
    DECLARE v_url_origem          VARCHAR(500);

    DECLARE v_source_host         VARCHAR(255);
    DECLARE v_post_id             VARCHAR(555);

    DECLARE v_chave_dedup         CHAR(64);

    DECLARE v_janela_dias         INT DEFAULT 7;
    DECLARE v_lease_minutos       INT DEFAULT 30;

    DECLARE v_agora               DATETIME;
    DECLARE v_data_limite         DATETIME;

    DECLARE v_id                  BIGINT UNSIGNED DEFAULT NULL;
    DECLARE v_status              VARCHAR(30) DEFAULT NULL;
    DECLARE v_dth_reserva         DATETIME DEFAULT NULL;
    DECLARE v_execucao_anterior   VARCHAR(100) DEFAULT NULL;

    DECLARE v_insert_realizado    INT DEFAULT 0;

    DECLARE v_legacy_id           BIGINT DEFAULT NULL;
    DECLARE v_legacy_titulo       VARCHAR(500) DEFAULT NULL;


    /* ============================================================
       HANDLER
       ============================================================ */

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;


    /* ============================================================
       1. PORTAL
       ============================================================ */

    SET v_portal =
        UPPER(
            TRIM(
                COALESCE(
                    p_portal,
                    ''
                )
            )
        );

    IF v_portal = '' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
                'SP_DEDUPLICA_EDITORIAL: portal não informado.';
    END IF;

    IF v_portal <> 'M360' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
                'SP_DEDUPLICA_EDITORIAL M360: portal inválido.';
    END IF;


    /* ============================================================
       2. TÍTULO
       ============================================================ */

    SET v_titulo =
        TRIM(
            COALESCE(
                p_titulo,
                ''
            )
        );

    IF v_titulo = '' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
                'SP_DEDUPLICA_EDITORIAL: título não informado.';
    END IF;


    /* ============================================================
       3. CATEGORIA
       ============================================================ */

    SET v_categoria =
        NULLIF(
            TRIM(p_categoria),
            ''
        );


    /* ============================================================
       4. URL
       ============================================================ */

    SET v_url_origem =
        TRIM(
            COALESCE(
                p_url_origem,
                ''
            )
        );

    IF v_url_origem = '' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
                'SP_DEDUPLICA_EDITORIAL: URL/fonte não informada.';
    END IF;


    /* ============================================================
       5. POST_ID
       ============================================================ */

    SET v_post_id =
        TRIM(
            COALESCE(
                p_post_id,
                ''
            )
        );

    IF v_post_id = '' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
                'SP_DEDUPLICA_EDITORIAL: post_id/slug não informado.';
    END IF;


    /* ============================================================
       6. JANELA EDITORIAL
       ============================================================ */

    SET v_janela_dias =
        COALESCE(
            p_janela_dias,
            7
        );

    IF v_janela_dias <= 0 THEN
        SET v_janela_dias = 7;
    END IF;

    IF v_janela_dias > 30 THEN
        SET v_janela_dias = 30;
    END IF;


    /* ============================================================
       7. HORÁRIO UTC-3
       ============================================================ */

    SET v_agora =
        DATE_SUB(
            UTC_TIMESTAMP(),
            INTERVAL 3 HOUR
        );

    SET v_data_limite =
        TIMESTAMPADD(
            DAY,
            -v_janela_dias,
            v_agora
        );


    /* ============================================================
       8. NORMALIZA HOST DO CANDIDATO
       ============================================================ */

    SET v_source_host =
        LOWER(
            TRIM(v_url_origem)
        );

    SET v_source_host =
        REPLACE(
            v_source_host,
            'https://',
            ''
        );

    SET v_source_host =
        REPLACE(
            v_source_host,
            'http://',
            ''
        );

    SET v_source_host =
        SUBSTRING_INDEX(
            v_source_host,
            '/',
            1
        );

    SET v_source_host =
        SUBSTRING_INDEX(
            v_source_host,
            ':',
            1
        );

    IF LEFT(v_source_host, 4) = 'www.' THEN
        SET v_source_host =
            SUBSTRING(
                v_source_host,
                5
            );
    END IF;

    SET v_source_host =
        TRIM(
            BOTH '.'
            FROM TRIM(v_source_host)
        );

    IF v_source_host = '' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
                'SP_DEDUPLICA_EDITORIAL: host inválido.';
    END IF;


    /* ============================================================
       9. NORMALIZA POST_ID
       ============================================================ */

    SET v_post_id =
        LOWER(
            TRIM(v_post_id)
        );

    SET v_post_id =
        SUBSTRING_INDEX(
            v_post_id,
            '?',
            1
        );

    SET v_post_id =
        SUBSTRING_INDEX(
            v_post_id,
            '#',
            1
        );

    SET v_post_id =
        TRIM(
            BOTH '/'
            FROM v_post_id
        );

    SET v_post_id =
        CONCAT(
            '/',
            v_post_id,
            '/'
        );


    /* ============================================================
       10. CHAVE TÉCNICA
       ============================================================ */

    SET v_chave_dedup =
        SHA2(
            CONCAT(
                LOWER(v_portal),
                '|',
                LOWER(v_source_host),
                '|',
                LOWER(v_post_id)
            ),
            256
        );


    /* ============================================================
       11. EXACT DUPLICATE NO LOG LEGADO
       ============================================================ */

    SET v_legacy_id = NULL;
    SET v_legacy_titulo = NULL;

    SELECT
        t.id,
        t.txt_titulo
    INTO
        v_legacy_id,
        v_legacy_titulo
    FROM titulos_deduplica t

    WHERE

        LOWER(
            TRIM(
                BOTH '.'
                FROM
                CASE
                    WHEN LEFT(
                        SUBSTRING_INDEX(
                            SUBSTRING_INDEX(
                                REPLACE(
                                    REPLACE(
                                        LOWER(TRIM(t.dsc_URL_origem)),
                                        'https://',
                                        ''
                                    ),
                                    'http://',
                                    ''
                                ),
                                '/',
                                1
                            ),
                            ':',
                            1
                        ),
                        4
                    ) = 'www.'
                    THEN SUBSTRING(
                        SUBSTRING_INDEX(
                            SUBSTRING_INDEX(
                                REPLACE(
                                    REPLACE(
                                        LOWER(TRIM(t.dsc_URL_origem)),
                                        'https://',
                                        ''
                                    ),
                                    'http://',
                                    ''
                                ),
                                '/',
                                1
                            ),
                            ':',
                            1
                        ),
                        5
                    )
                    ELSE
                        SUBSTRING_INDEX(
                            SUBSTRING_INDEX(
                                REPLACE(
                                    REPLACE(
                                        LOWER(TRIM(t.dsc_URL_origem)),
                                        'https://',
                                        ''
                                    ),
                                    'http://',
                                    ''
                                ),
                                '/',
                                1
                            ),
                            ':',
                            1
                        )
                END
            )
        )
        =
        LOWER(v_source_host)

        AND

        LOWER(
            TRIM(
                BOTH '/'
                FROM
                SUBSTRING_INDEX(
                    SUBSTRING_INDEX(
                        TRIM(t.ind_postid),
                        '?',
                        1
                    ),
                    '#',
                    1
                )
            )
        )
        =
        LOWER(
            TRIM(
                BOTH '/'
                FROM v_post_id
            )
        )

    ORDER BY
        t.id DESC

    LIMIT 1;


    /* ============================================================
       12. EXACT DUPLICATE
       ============================================================ */

    IF v_legacy_id IS NOT NULL THEN

        SELECT
            'CONTROL'         AS row_type,
            'EXACT_DUPLICATE' AS resultado,
            1                 AS duplicate_exact,

            NULL              AS registro_id,

            v_legacy_id       AS legacy_id,
            v_legacy_titulo   AS titulo_referencia,

            v_portal          AS portal,
            v_source_host     AS source_host,
            v_post_id         AS post_id,
            v_chave_dedup     AS chave_dedup,

            NULL              AS status_registro,
            v_janela_dias     AS janela_dias,

            NULL              AS titulo_comparavel,
            NULL              AS categoria_comparavel,
            NULL              AS data_comparavel,
            NULL              AS post_id_comparavel,
            NULL              AS source_host_comparavel;

        LEAVE proc;

    END IF;


    /* ============================================================
       13. RESERVA ATÔMICA
       ============================================================ */

    START TRANSACTION;

    INSERT IGNORE INTO ADM_deduplica_editorial (
        dsc_portal,
        txt_titulo,
        dsc_categoria,
        dsc_url_origem,
        dsc_source_host,
        dsc_post_id,
        dsc_chave_dedup,
        dsc_status,
        dth_reserva,
        dth_atualizado,
        dsc_execucao_id
    )
    VALUES (
        v_portal,
        v_titulo,
        v_categoria,
        v_url_origem,
        v_source_host,
        v_post_id,
        v_chave_dedup,
        'PROCESSING',
        v_agora,
        v_agora,
        NULLIF(
            TRIM(p_execucao_id),
            ''
        )
    );

    SET v_insert_realizado =
        ROW_COUNT();


    /* ============================================================
       14. NOVA RESERVA
       ============================================================ */

    IF v_insert_realizado = 1 THEN

        SET v_id =
            LAST_INSERT_ID();

        COMMIT;


        SELECT
            'CONTROL'          AS row_type,
            'CHECK_SIMILARITY' AS resultado,
            0                  AS duplicate_exact,

            v_id               AS registro_id,

            NULL               AS legacy_id,
            NULL               AS titulo_referencia,

            v_portal           AS portal,
            v_source_host      AS source_host,
            v_post_id          AS post_id,
            v_chave_dedup      AS chave_dedup,

            'PROCESSING'       AS status_registro,
            v_janela_dias      AS janela_dias,

            NULL               AS titulo_comparavel,
            NULL               AS categoria_comparavel,
            NULL               AS data_comparavel,
            NULL               AS post_id_comparavel,
            NULL               AS source_host_comparavel


        UNION ALL


        SELECT
            'COMPARABLE'       AS row_type,
            NULL               AS resultado,
            0                  AS duplicate_exact,

            v_id               AS registro_id,

            c.legacy_id        AS legacy_id,
            NULL               AS titulo_referencia,

            v_portal           AS portal,
            v_source_host      AS source_host,
            v_post_id          AS post_id,
            v_chave_dedup      AS chave_dedup,

            'PROCESSING'       AS status_registro,
            v_janela_dias      AS janela_dias,

            c.titulo           AS titulo_comparavel,
            c.categoria        AS categoria_comparavel,
            c.data_publicacao  AS data_comparavel,
            c.post_id          AS post_id_comparavel,
            c.source_host      AS source_host_comparavel


        FROM (

            SELECT

                t.id AS legacy_id,

                t.txt_titulo AS titulo,

                t.txt_categoria AS categoria,

                t.dth_executado AS data_publicacao,

                t.ind_postid AS post_id,

                LOWER(
                    TRIM(
                        BOTH '.'
                        FROM
                        CASE

                            WHEN LEFT(
                                SUBSTRING_INDEX(
                                    SUBSTRING_INDEX(
                                        REPLACE(
                                            REPLACE(
                                                LOWER(TRIM(t.dsc_URL_origem)),
                                                'https://',
                                                ''
                                            ),
                                            'http://',
                                            ''
                                        ),
                                        '/',
                                        1
                                    ),
                                    ':',
                                    1
                                ),
                                4
                            ) = 'www.'

                            THEN SUBSTRING(
                                SUBSTRING_INDEX(
                                    SUBSTRING_INDEX(
                                        REPLACE(
                                            REPLACE(
                                                LOWER(TRIM(t.dsc_URL_origem)),
                                                'https://',
                                                ''
                                            ),
                                            'http://',
                                            ''
                                        ),
                                        '/',
                                        1
                                    ),
                                    ':',
                                    1
                                ),
                                5
                            )

                            ELSE
                                SUBSTRING_INDEX(
                                    SUBSTRING_INDEX(
                                        REPLACE(
                                            REPLACE(
                                                LOWER(TRIM(t.dsc_URL_origem)),
                                                'https://',
                                                ''
                                            ),
                                            'http://',
                                            ''
                                        ),
                                        '/',
                                        1
                                    ),
                                    ':',
                                    1
                                )

                        END
                    )
                ) AS source_host


            FROM titulos_deduplica t


            WHERE

                t.dth_executado >=
                    v_data_limite

                AND t.txt_titulo IS NOT NULL

                AND TRIM(t.txt_titulo) <> ''

                AND t.dsc_URL_origem IS NOT NULL

                AND TRIM(t.dsc_URL_origem) <> ''


                /* ================================================
                   FILTROS EDITORIAIS v0.2.2
                   ================================================ */

                AND LOWER(TRIM(t.txt_categoria)) NOT IN (
                    'instafeeds',
                    'instastories'
                )

                AND LOWER(TRIM(t.txt_categoria)) NOT LIKE
                    'traduz%'

                AND LOWER(TRIM(t.dsc_URL_origem)) NOT LIKE
                    '%@mengao360.com'

        ) c


        /* ========================================================
           REMOVE CONTEÚDO DERIVADO DO PRÓPRIO PORTAL
           ======================================================== */

        WHERE

            LOWER(c.source_host) <> 'mengao360.com'


            /* ====================================================
               EXCLUI SOMENTE A PRÓPRIA IDENTIDADE TÉCNICA
               ==================================================== */

            AND NOT (

                LOWER(c.source_host)
                    =
                LOWER(v_source_host)

                AND

                LOWER(
                    TRIM(
                        BOTH '/'
                        FROM
                        SUBSTRING_INDEX(
                            SUBSTRING_INDEX(
                                TRIM(c.post_id),
                                '?',
                                1
                            ),
                            '#',
                            1
                        )
                    )
                )
                =
                LOWER(
                    TRIM(
                        BOTH '/'
                        FROM v_post_id
                    )
                )

            )


        ORDER BY
            row_type DESC,
            data_comparavel DESC;


        LEAVE proc;

    END IF;


    /* ============================================================
       15. IDENTIDADE EXISTENTE NA ADM
       ============================================================ */

    SELECT
        id,
        dsc_status,
        dth_reserva,
        dsc_execucao_id

    INTO
        v_id,
        v_status,
        v_dth_reserva,
        v_execucao_anterior

    FROM ADM_deduplica_editorial

    WHERE
        dsc_chave_dedup =
            v_chave_dedup

    LIMIT 1
    FOR UPDATE;


    /* ============================================================
       16. PROCESSING COM LEASE ATIVO
       ============================================================ */

    IF
        v_status = 'PROCESSING'

        AND

        v_dth_reserva >=
            DATE_SUB(
                v_agora,
                INTERVAL
                    v_lease_minutos
                MINUTE
            )

    THEN

        COMMIT;

        SELECT
            'CONTROL'            AS row_type,
            'ALREADY_PROCESSING' AS resultado,
            0                    AS duplicate_exact,

            v_id                 AS registro_id,

            NULL                 AS legacy_id,
            NULL                 AS titulo_referencia,

            v_portal             AS portal,
            v_source_host        AS source_host,
            v_post_id            AS post_id,
            v_chave_dedup        AS chave_dedup,

            v_status             AS status_registro,
            v_janela_dias        AS janela_dias,

            NULL                 AS titulo_comparavel,
            NULL                 AS categoria_comparavel,
            NULL                 AS data_comparavel,
            NULL                 AS post_id_comparavel,
            NULL                 AS source_host_comparavel;

        LEAVE proc;

    END IF;


    /* ============================================================
       17. JÁ FINALIZADO
       ============================================================ */

    IF v_status IN (
        'PUBLICADO',
        'DUPLICADO',
        'SUSPEITO'
    )
    THEN

        COMMIT;

        SELECT
            'CONTROL'         AS row_type,
            'EXACT_DUPLICATE' AS resultado,
            1                 AS duplicate_exact,

            v_id              AS registro_id,

            NULL              AS legacy_id,
            NULL              AS titulo_referencia,

            v_portal          AS portal,
            v_source_host     AS source_host,
            v_post_id         AS post_id,
            v_chave_dedup     AS chave_dedup,

            v_status          AS status_registro,
            v_janela_dias     AS janela_dias,

            NULL              AS titulo_comparavel,
            NULL              AS categoria_comparavel,
            NULL              AS data_comparavel,
            NULL              AS post_id_comparavel,
            NULL              AS source_host_comparavel;

        LEAVE proc;

    END IF;


    /* ============================================================
       18. RETOMADA
       ============================================================ */

    IF
        (
            v_status = 'PROCESSING'

            AND

            v_dth_reserva <
                DATE_SUB(
                    v_agora,
                    INTERVAL
                        v_lease_minutos
                    MINUTE
                )
        )

        OR

        v_status = 'ERROR'

    THEN


        UPDATE ADM_deduplica_editorial

        SET
            txt_titulo =
                v_titulo,

            dsc_categoria =
                v_categoria,

            dsc_url_origem =
                v_url_origem,

            dsc_source_host =
                v_source_host,

            dsc_post_id =
                v_post_id,

            dsc_status =
                'PROCESSING',

            dth_reserva =
                v_agora,

            dth_atualizado =
                v_agora,

            dth_finalizado =
                NULL,

            dsc_execucao_id =
                NULLIF(
                    TRIM(p_execucao_id),
                    ''
                ),

            txt_observacao =
                CONCAT(
                    'Reserva retomada em ',
                    DATE_FORMAT(
                        v_agora,
                        '%Y-%m-%d %H:%i:%s'
                    )
                )

        WHERE
            id = v_id;


        COMMIT;


        SELECT
            'CONTROL'          AS row_type,
            'CHECK_SIMILARITY' AS resultado,
            0                  AS duplicate_exact,

            v_id               AS registro_id,

            NULL               AS legacy_id,
            NULL               AS titulo_referencia,

            v_portal           AS portal,
            v_source_host      AS source_host,
            v_post_id          AS post_id,
            v_chave_dedup      AS chave_dedup,

            'PROCESSING'       AS status_registro,
            v_janela_dias      AS janela_dias,

            NULL               AS titulo_comparavel,
            NULL               AS categoria_comparavel,
            NULL               AS data_comparavel,
            NULL               AS post_id_comparavel,
            NULL               AS source_host_comparavel


        UNION ALL


        SELECT
            'COMPARABLE'       AS row_type,
            NULL               AS resultado,
            0                  AS duplicate_exact,

            v_id               AS registro_id,

            c.legacy_id        AS legacy_id,
            NULL               AS titulo_referencia,

            v_portal           AS portal,
            v_source_host      AS source_host,
            v_post_id          AS post_id,
            v_chave_dedup      AS chave_dedup,

            'PROCESSING'       AS status_registro,
            v_janela_dias      AS janela_dias,

            c.titulo           AS titulo_comparavel,
            c.categoria        AS categoria_comparavel,
            c.data_publicacao  AS data_comparavel,
            c.post_id          AS post_id_comparavel,
            c.source_host      AS source_host_comparavel


        FROM (

            SELECT

                t.id AS legacy_id,

                t.txt_titulo AS titulo,

                t.txt_categoria AS categoria,

                t.dth_executado AS data_publicacao,

                t.ind_postid AS post_id,

                LOWER(
                    TRIM(
                        BOTH '.'
                        FROM
                        CASE

                            WHEN LEFT(
                                SUBSTRING_INDEX(
                                    SUBSTRING_INDEX(
                                        REPLACE(
                                            REPLACE(
                                                LOWER(TRIM(t.dsc_URL_origem)),
                                                'https://',
                                                ''
                                            ),
                                            'http://',
                                            ''
                                        ),
                                        '/',
                                        1
                                    ),
                                    ':',
                                    1
                                ),
                                4
                            ) = 'www.'

                            THEN SUBSTRING(
                                SUBSTRING_INDEX(
                                    SUBSTRING_INDEX(
                                        REPLACE(
                                            REPLACE(
                                                LOWER(TRIM(t.dsc_URL_origem)),
                                                'https://',
                                                ''
                                            ),
                                            'http://',
                                            ''
                                        ),
                                        '/',
                                        1
                                    ),
                                    ':',
                                    1
                                ),
                                5
                            )

                            ELSE
                                SUBSTRING_INDEX(
                                    SUBSTRING_INDEX(
                                        REPLACE(
                                            REPLACE(
                                                LOWER(TRIM(t.dsc_URL_origem)),
                                                'https://',
                                                ''
                                            ),
                                            'http://',
                                            ''
                                        ),
                                        '/',
                                        1
                                    ),
                                    ':',
                                    1
                                )

                        END
                    )
                ) AS source_host


            FROM titulos_deduplica t


            WHERE

                t.dth_executado >=
                    v_data_limite

                AND t.txt_titulo IS NOT NULL

                AND TRIM(t.txt_titulo) <> ''

                AND t.dsc_URL_origem IS NOT NULL

                AND TRIM(t.dsc_URL_origem) <> ''


                /* ================================================
                   FILTROS EDITORIAIS v0.2.2
                   ================================================ */

                AND LOWER(TRIM(t.txt_categoria)) NOT IN (
                    'instafeeds',
                    'instastories'
                )

                AND LOWER(TRIM(t.txt_categoria)) NOT LIKE
                    'traduz%'

                AND LOWER(TRIM(t.dsc_URL_origem)) NOT LIKE
                    '%@mengao360.com'

        ) c


        WHERE

            LOWER(c.source_host) <> 'mengao360.com'


            AND NOT (

                LOWER(c.source_host)
                    =
                LOWER(v_source_host)

                AND

                LOWER(
                    TRIM(
                        BOTH '/'
                        FROM
                        SUBSTRING_INDEX(
                            SUBSTRING_INDEX(
                                TRIM(c.post_id),
                                '?',
                                1
                            ),
                            '#',
                            1
                        )
                    )
                )
                =
                LOWER(
                    TRIM(
                        BOTH '/'
                        FROM v_post_id
                    )
                )

            )


        ORDER BY
            row_type DESC,
            data_comparavel DESC;


        LEAVE proc;

    END IF;


    /* ============================================================
       19. FALLBACK
       ============================================================ */

    COMMIT;

    SELECT
        'CONTROL' AS row_type,
        'ERROR'   AS resultado,

        0         AS duplicate_exact,

        v_id      AS registro_id,

        NULL      AS legacy_id,
        NULL      AS titulo_referencia,

        v_portal      AS portal,
        v_source_host AS source_host,
        v_post_id     AS post_id,
        v_chave_dedup AS chave_dedup,

        v_status      AS status_registro,
        v_janela_dias AS janela_dias,

        NULL AS titulo_comparavel,
        NULL AS categoria_comparavel,
        NULL AS data_comparavel,
        NULL AS post_id_comparavel,
        NULL AS source_host_comparavel;


END