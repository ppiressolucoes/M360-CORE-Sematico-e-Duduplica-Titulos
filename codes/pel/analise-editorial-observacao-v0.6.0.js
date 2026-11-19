// PEL v0.6.0 | n8n Code | Run Once for All Items.
// Substituir o codigo da v0.5.1 no node existente, preservando seu nome.
// Camada adicional somente observacional; os campos v0.5.1 permanecem compativeis.
const entrada = $input.first()?.json ?? {};
const titulo = String(entrada.candidato?.titulo ?? '').trim();
const comparaveis = Array.isArray(entrada.comparaveis) ? entrada.comparaveis : [];
const contexto = entrada.contexto_vocabulario_pel ?? {};

function normalizar(texto) {
  return String(texto ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}
const comuns = new Set(['que','para','com','uma','por','dos','das','uma','sobre','mais','apos','pelo','pela','ano','anos','brasil']);
function tokens(t) { return [...new Set(normalizar(t).split(' ').filter(x => x.length >= 4 && !comuns.has(x)))]; }
function fase(t) {
  const s = ` ${normalizar(t)} `;
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
// Extracao literal e limitada: nunca inferir identidade ou data a partir da publicacao.
function contextoTitulo(t) {
  const s = normalizar(t);
  const entidades = [];
  for (const [nome, re] of [
    ['ABEEOLICA', /\babeeolica\b/], ['SENADO', /\bsenado\b/],
    ['STF', /\bstf\b/], ['ANEEL', /\baneel\b/], ['BYD', /\bbyd\b/],
    ['OCYAN', /\bocyan\b/], ['SUBSEA7', /\bsubsea\s*7\b/],
    ['BARU_OFFSHORE', /\bbaru offshore\b/], ['BRAVA_ENERGIA', /\bbrava energia\b/]
  ]) if (re.test(s)) entidades.push(nome);
  const objetos = [];
  for (const [nome, re] of [
    ['POSTES', /\bpostes?\b/], ['BATERIAS', /\bbaterias?\b/],
    ['VAGA_EMPREGO', /\b(vaga|vagas|emprego)\b/]
  ]) if (re.test(s)) objetos.push(nome);
  const faseDetectada = fase(t);
  return { entidades_mencionadas: entidades, objetos_mencionados: objetos,
    fase_factual: faseDetectada, data_evento: null,
    ressalva: 'MENCOES_LITERALMENTE_DETECTADAS_NAO_RESOLVEM_PAPEL_OU_IDENTIDADE' };
}
function compararListas(a, b) {
  return { compartilhados: a.filter(x => b.includes(x)),
    estado: !a.length || !b.length ? 'DESCONHECIDO' : a.some(x => b.includes(x)) ? 'COMPARTILHADO' : 'DISTINTO_NAO_CONFIRMADO' };
}
const assinatura = tokens(titulo);
const contextoCandidato = contextoTitulo(titulo);
const mapaFacetas = new Map();
for (const c of Array.isArray(contexto.comparaveis) ? contexto.comparaveis : []) {
  if (c?.id !== null && c?.id !== undefined) mapaFacetas.set(String(c.id), c);
}
const resultados = comparaveis.filter(c => c && typeof c.titulo === 'string' && c.titulo.trim()).map(c => {
  const compartilhados = assinatura.filter(x => tokens(c.titulo).includes(x));
  const iguais = Boolean(titulo && normalizar(titulo) === normalizar(c.titulo));
  const faseCandidato = fase(titulo), faseComparavel = fase(c.titulo);
  let relacao = 'INDETERMINADO';
  const evidencias = [];
  if (iguais) evidencias.push('TITULOS_NORMALIZADOS_IGUAIS');
  else if (compartilhados.length >= 4 && faseCandidato && faseComparavel && faseCandidato !== faseComparavel) {
    relacao = 'RELACIONADO'; evidencias.push('FASES_DISTINTAS_REQUEREM_REVISAO');
  } else if (compartilhados.length >= 4) {
    relacao = 'RELACIONADO'; evidencias.push('TOKENS_COMPARTILHADOS');
  }
  const id = c.legacy_id ?? c.registro_id ?? c.id ?? null;
  const outro = contextoTitulo(c.titulo);
  const entidades = compararListas(contextoCandidato.entidades_mencionadas, outro.entidades_mencionadas);
  const objetos = compararListas(contextoCandidato.objetos_mencionados, outro.objetos_mencionados);
  const facetasCandidato = Array.isArray(contexto.candidato?.facetas) ? contexto.candidato.facetas : [];
  const facetasOutro = id == null ? [] : (mapaFacetas.get(String(id))?.facetas ?? []);
  const motivos = [];
  if (entidades.compartilhados.length) motivos.push('ENTIDADE_MENCIONADA_EM_AMBOS');
  if (objetos.compartilhados.length) motivos.push('OBJETO_TEMATICO_MENCIONADO_EM_AMBOS');
  if (faseCandidato && faseComparavel) motivos.push(faseCandidato === faseComparavel ? 'FASE_HEURISTICA_IGUAL' : 'FASE_HEURISTICA_DIFERENTE');
  if (iguais) motivos.push('TITULOS_NORMALIZADOS_IGUAIS');
  return { comparavel_id: id, titulo: c.titulo, relacao_sugerida: relacao, evidencias,
    tokens_compartilhados: compartilhados, fase_candidato: faseCandidato, fase_comparavel: faseComparavel,
    ausencias: ['ENTIDADES_NAO_RESOLVIDAS','OBJETO_NAO_RESOLVIDO','DATA_EVENTO_NAO_RESOLVIDA'],
    contexto_par_v060: { candidato: contextoCandidato, comparavel: outro, entidades, objetos,
      fase: !faseCandidato || !faseComparavel ? 'DESCONHECIDA' : faseCandidato === faseComparavel ? 'IGUAL' : 'DIFERENTE',
      data_evento: 'DESCONHECIDA', facetas: compararListas(facetasCandidato, Array.isArray(facetasOutro) ? facetasOutro : []),
      motivos, identidade_evento: 'NAO_CONFIRMADA', revisao_humana_necessaria: true },
    _prioridade: iguais ? 3 : evidencias.includes('FASES_DISTINTAS_REQUEREM_REVISAO') ? 2 : relacao === 'RELACIONADO' ? 1 : 0 };
});
// Preserva a ordenacao v0.5.1 para nao modificar a entrada do decisor v0.1.0.
resultados.sort((a,b) => b._prioridade - a._prioridade || b.tokens_compartilhados.length - a.tokens_compartilhados.length);
const top = resultados.slice(0, 3).map(({_prioridade, ...resto}) => resto);
// Painel adicional: pares com entidade e objeto compartilhados, independente do TOP 3 legado.
const paresRevisao = resultados.filter(x => x.contexto_par_v060.entidades.compartilhados.length && x.contexto_par_v060.objetos.compartilhados.length)
  .sort((a,b) => b.tokens_compartilhados.length - a.tokens_compartilhados.length)
  .slice(0, 10).map(({_prioridade, ...resto}) => resto);
return [{json: {...entrada, analise_editorial_pel: {
  versao: '0.6.0', modo: 'OBSERVACAO', aplicado_na_decisao: false,
  status: titulo ? 'ANALISADO' : 'TITULO_AUSENTE', total_comparados: resultados.length,
  vocabulario_status: contexto.status ?? 'AUSENTE',
  relacao_sugerida: top[0]?.relacao_sugerida ?? 'INDETERMINADO', comparavel: top[0] ?? null,
  top_comparaveis: top, contexto_candidato_v060: contextoCandidato,
  pares_prioritarios_revisao_v060: paresRevisao,
  limitacoes: ['HEURISTICA_NAO_VALIDA_DUPLICIDADE','SEM_RESOLUCAO_DE_ENTIDADES_OU_OBJETO',
    'DISTINTO_NAO_AUTOMATIZADO','DICIONARIO_LITERAL_LIMITADO','DATA_EVENTO_NAO_EXTRAIDA']
}}}];
