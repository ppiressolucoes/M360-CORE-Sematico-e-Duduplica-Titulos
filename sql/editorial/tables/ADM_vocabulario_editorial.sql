-- Proposta v0.1.0 para vocabulario contextual multi-dominio.
-- Nao altera ADM_deduplica_editorial nem titulos_deduplica.
-- Cada par dominio/consumidor possui versoes independentes; uma versao
-- ativa e um snapshot completo de regras aprovadas.
-- Propostas entram com situacao PROPOSTA e ativo = 0.

CREATE TABLE `ADM_vocabulario_editorial` (
  `regra_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `dsc_dominio` VARCHAR(50) NOT NULL,
  `dsc_consumidor` VARCHAR(50) NOT NULL,
  `versao_vocabulario` VARCHAR(32) NOT NULL,
  `tipo` VARCHAR(40) NOT NULL,
  `tipo_expressao` VARCHAR(16) NOT NULL DEFAULT 'LITERAL',
  `expressao` VARCHAR(250) NOT NULL,
  `valor_canonico` VARCHAR(120) NOT NULL,
  `prioridade` SMALLINT UNSIGNED NOT NULL DEFAULT 50,
  `confianca` DECIMAL(5,4) NOT NULL DEFAULT 0.5000,
  `situacao` VARCHAR(16) NOT NULL DEFAULT 'PROPOSTA',
  `ativo` TINYINT(1) NOT NULL DEFAULT 0,
  `dsc_regra_hash` CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `dsc_execucao_origem` VARCHAR(100) DEFAULT NULL,
  `txt_evidencia_inicial` VARCHAR(1000) DEFAULT NULL,
  `dth_criado_utc` DATETIME NOT NULL,
  `dth_atualizado_utc` DATETIME NOT NULL,
  PRIMARY KEY (`regra_id`),
  UNIQUE KEY `uq_vocab_escopo_versao_hash` (`dsc_dominio`, `dsc_consumidor`, `versao_vocabulario`, `dsc_regra_hash`),
  KEY `idx_vocab_leitura` (`dsc_dominio`, `dsc_consumidor`, `versao_vocabulario`, `ativo`, `situacao`, `prioridade`, `regra_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
