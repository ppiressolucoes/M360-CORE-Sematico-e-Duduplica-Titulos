-- Preparacao para revisao assistida do PEL. Aplicacao manual no banco PEL.
-- Nenhuma FK: a estrutura e o ciclo de vida das tabelas existentes permanecem independentes.
CREATE TABLE IF NOT EXISTS ADM_revisao_semantica (
  revisao_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  registro_id BIGINT UNSIGNED NOT NULL,
  portal VARCHAR(50) NOT NULL,
  execucao_id VARCHAR(100) NOT NULL,
  candidato_titulo VARCHAR(500) NOT NULL,
  candidato_url VARCHAR(500) NOT NULL,
  comparavel_id VARCHAR(100) NOT NULL,
  comparavel_titulo VARCHAR(500) NOT NULL,
  comparavel_origem VARCHAR(255) DEFAULT NULL,
  score_lexical DECIMAL(7,4) DEFAULT NULL,
  versao_similaridade VARCHAR(32) NOT NULL,
  versao_sinal VARCHAR(32) NOT NULL,
  versao_vocabulario VARCHAR(32) DEFAULT NULL,
  evidencias_json LONGTEXT NOT NULL,
  revisao_status VARCHAR(30) NOT NULL DEFAULT 'PENDENTE',
  decisao_humana VARCHAR(30) DEFAULT NULL,
  motivo_humano VARCHAR(1000) DEFAULT NULL,
  responsavel VARCHAR(100) DEFAULT NULL,
  wp_post_id BIGINT UNSIGNED DEFAULT NULL,
  wp_status VARCHAR(20) DEFAULT NULL,
  criado_utc DATETIME NOT NULL,
  atualizado_utc DATETIME NOT NULL,
  decidido_utc DATETIME DEFAULT NULL,
  PRIMARY KEY (revisao_id),
  UNIQUE KEY uq_revisao_par (portal, registro_id, comparavel_id, versao_sinal),
  KEY ix_revisao_pendente (portal, revisao_status, criado_utc)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Verificar estrutura existente: IF NOT EXISTS nao migra tabela previa.
SHOW CREATE TABLE ADM_revisao_semantica;
