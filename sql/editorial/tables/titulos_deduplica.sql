-- Estrutura recebida do ambiente Mengão 360 em 21/10/2026.
-- O próximo valor de AUTO_INCREMENT foi removido por ser estado da instância.

CREATE TABLE `titulos_deduplica` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `txt_titulo` varchar(500) NOT NULL,
  `txt_categoria` varchar(45) NOT NULL,
  `dth_executado` datetime NOT NULL DEFAULT current_timestamp(),
  `dsc_URL_origem` varchar(255) NOT NULL,
  `ind_postid` varchar(555) NOT NULL,
  UNIQUE KEY `idx_titulo` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
