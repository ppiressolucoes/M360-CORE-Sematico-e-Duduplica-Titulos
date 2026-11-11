-- Executar manualmente no banco PEL apos conferir SHOW CREATE TABLE.
-- MariaDB: ADD COLUMN IF NOT EXISTS permite repetir sem apagar dados.
-- Colunas adicionais permanecem NULL ate haver resposta confirmada do WordPress.
ALTER TABLE ADM_analise_editorial_observacao
  ADD COLUMN IF NOT EXISTS wp_post_id BIGINT UNSIGNED DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS wp_url VARCHAR(2048) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS wp_status VARCHAR(30) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS wp_confirmado_utc DATETIME DEFAULT NULL;

-- IF NOT EXISTS nao valida o tipo de coluna preexistente; comparar com esta migracao.
SHOW CREATE TABLE ADM_analise_editorial_observacao;
