-- Executar manualmente no banco PEL apos revisao. Nao altera tabelas legadas.
-- O id do WordPress pertence ao site PEL; nao confundir com dsc_post_id da origem.
CREATE TABLE IF NOT EXISTS ADM_referencia_publicacao_editorial (
  referencia_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  dsc_portal VARCHAR(50) NOT NULL,
  registro_id BIGINT UNSIGNED NOT NULL,
  titulo_origem VARCHAR(500) DEFAULT NULL,
  url_origem VARCHAR(500) DEFAULT NULL,
  resumo_origem TEXT DEFAULT NULL,
  data_publicacao_origem VARCHAR(100) DEFAULT NULL,
  wp_post_id BIGINT UNSIGNED DEFAULT NULL,
  wp_url VARCHAR(2048) DEFAULT NULL,
  wp_status VARCHAR(30) DEFAULT NULL,
  titulo_publicado VARCHAR(500) DEFAULT NULL,
  dsc_execucao_id VARCHAR(100) DEFAULT NULL,
  criado_utc DATETIME NOT NULL,
  atualizado_utc DATETIME NOT NULL,
  PRIMARY KEY (referencia_id),
  UNIQUE KEY uq_portal_registro (dsc_portal, registro_id),
  KEY ix_wp_post (dsc_portal, wp_post_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- IF NOT EXISTS nao atualiza tabelas existentes. Conferir antes de usar.
SHOW CREATE TABLE ADM_referencia_publicacao_editorial;
