// PEL v0.1.0 — recomendação observacional após análise lexical/contextual.
// Nunca altera status, roteamento, finalização, publicação ou alertas.
// n8n Code node: Run Once for All Items.

const entrada = $input.first()?.json ?? {};
const lexical = entrada.duplicidade_editorial ?? {};
const analise = entrada.analise_editorial_pel ?? {};
const contexto = entrada.contexto_vocabulario_pel ?? {};
const candidato = entrada.candidato ?? {};
const comparaveis = Array.isArray(entrada.comparaveis) ? entrada.comparaveis : [];

function normalizar(valor) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function numero(valor, fallback = 0) {
  if (valor === null || valor === undefined || valor === '') return fallback;
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : fallback;
}

function facetas(valor) {
  return Array.isArray(valor) ? [...new Set(valor.filter(v => typeof v === 'string' && v.trim()).map(v => v.trim()))] : [];
}

const candidatoFacetas = facetas(contexto.candidato?.facetas);
const contextoPorId = new Map();
for (const registro of Array.isArray(contexto.comparaveis) ? contexto.comparaveis : []) {
  if (registro?.id !== null && registro?.id !== undefined) {
    contextoPorId.set(String(registro.id), registro);
  }
}

const candidatosContextuais = Array.isArray(analise.top_comparaveis)
  ? analise.top_comparaveis
  : [];
const matchesLexicais = Array.isArray(lexical.top_matches) ? lexical.top_matches : [];
const fonteMatches = candidatosContextuais.length ? candidatosContextuais : matchesLexicais;
const evidencias = [];

for (const item of fonteMatches.slice(0, 3)) {
  const id = item?.comparavel_id ?? item?.legacy_id ?? item?.id ?? null;
  const contextoPar = id === null ? null : contextoPorId.get(String(id));
  const titulo = String(item?.titulo ?? '').trim();
  const matchLexical = matchesLexicais.find(match =>
    (id !== null && String(match?.id ?? match?.legacy_id ?? '') === String(id)) ||
    (titulo && normalizar(match?.titulo) === normalizar(titulo))
  ) ?? null;
  const facetasPar = facetas(contextoPar?.facetas);
  const compartilhadas = candidatoFacetas.filter(faceta => facetasPar.includes(faceta));
  const distintas = candidatoFacetas.filter(faceta => !facetasPar.includes(faceta));
  const relacao = String(item?.relacao_sugerida ?? '').toUpperCase();
  const faseCandidato = item?.fase_candidato ?? null;
  const faseComparavel = item?.fase_comparavel ?? null;
  const faseDivergente = Boolean(faseCandidato && faseComparavel && faseCandidato !== faseComparavel);
  const titulosIguais = Boolean(titulo && normalizar(candidato.titulo) === normalizar(titulo));

  evidencias.push({
    comparavel_id: id,
    relacao_contextual: relacao || 'AUSENTE',
    score_lexical: numero(matchLexical?.metricas?.score_composto, null),
    tokens_comuns: numero(matchLexical?.metricas?.tokens_comuns, null),
    titulo_normalizado_igual: titulosIguais,
    facetas_candidato: candidatoFacetas,
    facetas_comparavel: facetasPar,
    facetas_compartilhadas: compartilhadas,
    facetas_distintas: distintas,
    fase_candidato: faseCandidato,
    fase_comparavel: faseComparavel,
    fase_divergente: faseDivergente
  });
}

const lexicalStatus = String(lexical.status ?? 'AUSENTE').toUpperCase();
const vocabCarregado = contexto.status === 'CARREGADO' && contexto.fonte === 'BANCO';
const evidenciasDuplicado = evidencias.find(item =>
  item.titulo_normalizado_igual && item.facetas_compartilhadas.length > 0
);
const evidenciasRelacionado = evidencias.find(item =>
  item.relacao_contextual === 'RELACIONADO' && item.facetas_distintas.length > 0
);
const evidenciasFase = evidencias.find(item =>
  item.relacao_contextual === 'RELACIONADO' && item.fase_divergente
);
const comparavelDeterminante = evidenciasDuplicado ?? evidenciasRelacionado ?? evidenciasFase ?? evidencias[0] ?? null;

let sugestao = 'INDETERMINADO';
let confianca = 'BAIXA';
let motivo = 'EVIDENCIA_INSUFICIENTE_PARA_CLASSIFICAR';

if (
  vocabCarregado &&
  lexicalStatus === 'DUPLICADO' &&
  comparavelDeterminante?.titulo_normalizado_igual &&
  comparavelDeterminante.facetas_compartilhadas.length > 0
) {
  sugestao = 'DUPLICADO';
  confianca = 'MODERADA';
  motivo = 'TITULO_EQUIVALENTE_E_FACETA_COMPARTILHADA';
} else if (
  vocabCarregado &&
  comparavelDeterminante?.relacao_contextual === 'RELACIONADO' &&
  comparavelDeterminante.facetas_distintas.length > 0
) {
  sugestao = 'RELACIONADO';
  confianca = 'MODERADA';
  motivo = 'RELACAO_CONTEXTUAL_COM_FACETAS_DISTINTAS';
} else if (
  comparavelDeterminante?.relacao_contextual === 'RELACIONADO' &&
  comparavelDeterminante.fase_divergente
) {
  sugestao = 'RELACIONADO';
  confianca = 'BAIXA';
  motivo = 'FASES_FACTUAIS_DIVERGENTES_REQUEREM_REVISAO';
} else if (lexicalStatus === 'DUPLICADO') {
  motivo = vocabCarregado
    ? 'DUPLICIDADE_LEXICAL_SEM_COMPATIBILIDADE_CONTEXTUAL_CONFIRMADA'
    : 'DUPLICIDADE_LEXICAL_COM_VOCABULARIO_INDISPONIVEL';
} else if (lexicalStatus === 'ERRO' || lexicalStatus === 'AUSENTE') {
  motivo = 'DECISAO_LEXICAL_INDISPONIVEL';
}

const decisao = {
  versao: '0.1.0',
  modo: 'OBSERVACAO_PRODUCAO',
  aplicado_automaticamente: false,
  altera_status_core: false,
  altera_roteamento: false,
  publica_ou_finaliza: false,
  status_lexical_original: lexicalStatus,
  status_contextual_original: String(analise.relacao_sugerida ?? 'AUSENTE').toUpperCase(),
  status_sugerido: sugestao,
  confianca,
  motivo,
  vocabulario: {
    status: contexto.status ?? 'AUSENTE',
    fonte: contexto.fonte ?? 'INDISPONIVEL',
    versao: entrada.vocabulario_editorial?.versao ?? null,
    facetas_candidato: candidatoFacetas
  },
  cobertura: {
    total_comparaveis_recebidos: comparaveis.length,
    total_comparaveis_avaliados: evidencias.length,
    comparaveis_na_analise_contextual: numero(analise.total_comparados, 0),
    historico_completo_comprovado: false
  },
  comparavel_determinante: comparavelDeterminante,
  evidencias,
  limitacoes: [
    'ENTIDADES_E_OBJETO_NAO_RESOLVIDOS',
    'COMPLETUDE_DO_HISTORICO_NAO_COMPROVADA',
    'SEM_ROTULOS_HUMANOS_PARA_CALIBRAR_CONFIANCA',
    'ATUALIZACAO_E_NOVO_NAO_AUTOMATIZADOS_NESTA_VERSAO'
  ],
  revisao_humana_necessaria: true
};

return [{ json: { ...entrada, decisao_autonoma_pel: decisao } }];
