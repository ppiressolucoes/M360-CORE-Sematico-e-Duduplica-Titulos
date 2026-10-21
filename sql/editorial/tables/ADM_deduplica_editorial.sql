-- Estrutura recebida do ambiente Mengão 360 em 21/10/2026.
-- O próximo valor de AUTO_INCREMENT foi removido por ser estado da instância.

CREATE TABLE `ADM_deduplica_editorial` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `dsc_portal` varchar(50) NOT NULL,
  `txt_titulo` varchar(500) NOT NULL,
  `dsc_categoria` varchar(100) DEFAULT NULL,
  `dsc_url_origem` varchar(500) DEFAULT NULL,
  `dsc_source_host` varchar(255) NOT NULL,
  `dsc_post_id` varchar(555) NOT NULL,
  `dsc_chave_dedup` char(64) NOT NULL,
  `dsc_status` varchar(30) NOT NULL DEFAULT 'PROCESSING',
  `dth_reserva` datetime NOT NULL DEFAULT current_timestamp(),
  `dth_atualizado` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `dth_finalizado` datetime DEFAULT NULL,
  `dsc_execucao_id` varchar(100) DEFAULT NULL,
  `txt_observacao` varchar(1000) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_adm_dedup_editorial_chave` (`dsc_chave_dedup`),
  KEY `idx_adm_dedup_portal_status` (`dsc_portal`,`dsc_status`),
  KEY `idx_adm_dedup_source_data` (`dsc_portal`,`dsc_source_host`,`dth_reserva`),
  KEY `idx_adm_dedup_status_data` (`dsc_status`,`dth_reserva`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
