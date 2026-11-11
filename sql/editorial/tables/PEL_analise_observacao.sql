-- Preparacao manual no banco PEL; nao substitui ADM_revisao_semantica.
CREATE TABLE IF NOT EXISTS ADM_analise_editorial_observacao (
  analise_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  dsc_portal VARCHAR(50) NOT NULL,
  registro_id BIGINT UNSIGNED NOT NULL,
  dsc_execucao_id VARCHAR(100) NOT NULL,
  versao_analise VARCHAR(32) NOT NULL,
  dados_json LONGTEXT NOT NULL,
  criado_utc DATETIME NOT NULL,
  PRIMARY KEY (analise_id),
  UNIQUE KEY uq_execucao_analise (dsc_portal, registro_id, dsc_execucao_id, versao_analise),
  KEY ix_registro (dsc_portal, registro_id, criado_utc)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- IF NOT EXISTS nao altera uma tabela preexistente: conferir o resultado.
SHOW CREATE TABLE ADM_analise_editorial_observacao;
