// n8n: Run Once for All Items. Colocar entre Merge e Similaridade PEL v0.4.0.
// Somente auditoria: nao altera candidato, comparaveis ou decisao lexical.
const entrada = $input.first()?.json ?? {};
const vocab = entrada.vocabulario_editorial;
const valido = vocab?.dominio === 'ENERGIA_LIMPA' && vocab?.consumidor === 'PEL' &&
  vocab?.versao === '0.1.0' && vocab?.status === 'CARREGADO' && Array.isArray(vocab.regras);
function normalizar(v) {
  return String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}
function detectar(titulo) {
  const texto = ` ${normalizar(titulo)} `;
  const matches = (valido ? vocab.regras : []).filter(r => {
    const termo = normalizar(r.expressao);
    return termo && texto.includes(` ${termo} `);
  });
  return {facetas: [...new Set(matches.map(r => r.valor_canonico))],
    ids_regras: matches.map(r => r.regra_id)};
}
const candidato = entrada.candidato ?? {};
const comparaveis = Array.isArray(entrada.comparaveis) ? entrada.comparaveis : [];
return [{json: {...entrada, contexto_vocabulario_pel: {
  versao: '0.1.0', modo: 'OBSERVACAO', fonte: valido ? 'BANCO' : 'INDISPONIVEL',
  status: vocab?.status ?? 'AUSENTE', aplicado_na_decisao: false,
  total_regras: valido ? vocab.regras.length : 0,
  candidato: detectar(candidato.titulo),
  comparaveis: comparaveis.map(c => ({id: c.legacy_id ?? c.registro_id ?? c.id ?? null,
    ...detectar(c.titulo)}))
}}}];
