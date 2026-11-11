// PEL v0.5.1 observacao. Executar APOS Similaridade Editorial v0.4.0.
// Nao altera duplicidade_editorial, roteamento, banco ou WordPress.
const entrada = $input.first()?.json ?? {};
const titulo = String(entrada.candidato?.titulo ?? '').trim();
const comparaveis = Array.isArray(entrada.comparaveis) ? entrada.comparaveis : [];
const contexto = entrada.contexto_vocabulario_pel;
function normalizar(texto) {
  return String(texto ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}
const comuns = new Set(['que','para','com','uma','por','dos','das','uma','sobre','mais','apos','pelo','pela','ano','anos','brasil']);
function tokens(t) { return [...new Set(normalizar(t).split(' ').filter(x => x.length >= 4 && !comuns.has(x)))]; }
function fase(t) {
  const s = ` ${normalizar(t)} `;
  // Negacao ou multiplos sinais nao sao resolvidos por esta heuristica.
  if (/\b(nao|nem|nega|negou)\b/.test(s)) return null;
  const abertura = /\b(abre|abriu|abertura)\b/.test(s);
  const cancelamento = /\b(cancela|cancelou|cancelamento|cancelada|cancelado)\b/.test(s);
  if (abertura && cancelamento) return null;
  if (abertura) return 'ABERTURA';
  if (cancelamento) return 'CANCELAMENTO';
  if (/\b(aprovou|aprova|aprovado|aprovada)\b/.test(s)) return 'APROVACAO';
  if (/\b(discute|discussao|debate|debater)\b/.test(s)) return 'DISCUSSAO';
  return null;
}
const assinatura = tokens(titulo);
const resultados = comparaveis.filter(c => c && typeof c.titulo === 'string' && c.titulo.trim()).map(c => {
  const outros = tokens(c.titulo);
  const compartilhados = assinatura.filter(x => outros.includes(x));
  const iguais = titulo && normalizar(titulo) === normalizar(c.titulo);
  const faseCandidato = fase(titulo), faseComparavel = fase(c.titulo);
  let relacao = 'INDETERMINADO';
  const evidencias = [];
  if (iguais) { evidencias.push('TITULOS_NORMALIZADOS_IGUAIS'); }
  else if (compartilhados.length >= 4 && faseCandidato && faseComparavel && faseCandidato !== faseComparavel) {
    // Diferenca de fase nao prova mesmo objeto, nem ordem temporal.
    relacao = 'RELACIONADO'; evidencias.push('FASES_DISTINTAS_REQUEREM_REVISAO');
  } else if (compartilhados.length >= 4) {
    relacao = 'RELACIONADO'; evidencias.push('TOKENS_COMPARTILHADOS');
  }
  return {comparavel_id: c.legacy_id ?? c.registro_id ?? c.id ?? null, titulo: c.titulo,
    relacao_sugerida: relacao, evidencias, tokens_compartilhados: compartilhados,
    fase_candidato: faseCandidato, fase_comparavel: faseComparavel,
    ausencias: ['ENTIDADES_NAO_RESOLVIDAS','OBJETO_NAO_RESOLVIDO','DATA_EVENTO_NAO_RESOLVIDA'],
    _prioridade: iguais ? 3 : evidencias.includes('FASES_DISTINTAS_REQUEREM_REVISAO') ? 2 : relacao === 'RELACIONADO' ? 1 : 0};
});
resultados.sort((a,b) => b._prioridade - a._prioridade || b.tokens_compartilhados.length - a.tokens_compartilhados.length);
const top = resultados.slice(0, 3).map(({_prioridade, ...resto}) => resto);
return [{json: {...entrada, analise_editorial_pel: {
  versao: '0.5.1', modo: 'OBSERVACAO', aplicado_na_decisao: false,
  status: titulo ? 'ANALISADO' : 'TITULO_AUSENTE', total_comparados: resultados.length,
  vocabulario_status: contexto?.status ?? 'AUSENTE',
  relacao_sugerida: top[0]?.relacao_sugerida ?? 'INDETERMINADO', comparavel: top[0] ?? null,
  top_comparaveis: top,
  limitacoes: ['HEURISTICA_NAO_VALIDA_DUPLICIDADE', 'SEM_RESOLUCAO_DE_ENTIDADES_OU_OBJETO', 'DISTINTO_NAO_AUTOMATIZADO']
}}}];
