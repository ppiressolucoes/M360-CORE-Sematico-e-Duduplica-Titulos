const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const raiz = path.resolve(__dirname, '../..');
const ler = arquivo => fs.readFileSync(path.join(raiz, arquivo), 'utf8');
const antigo = ler('codes/m360/similaridade-editorial-v0.5.1-vocab-primario.js');
const novo = ler('codes/m360/similaridade-editorial-v0.5.2-vocab-banco.js');
const seed = JSON.parse(ler('sql/editorial/seeds/M360-vocabulario-v0.1.0-propor.sql')
  .match(/'(\[\s*\{[\s\S]*?\}\s*\])'/)[1]);
function vocabulario() {
  return { versao: '0.1.0', dominio: 'ESPORTE', consumidor: 'M360',
    modo: 'OBSERVACAO', aplicado_automaticamente: false, total_regras: 72,
    regras: seed.map((regra, i) => ({ ...regra, regra_id: i + 1, tipo_expressao: 'LITERAL' })) };
}
function executar(codigo, entrada) {
  return new Function('$input', '$', codigo)(
    { first: () => ({ json: entrada }) },
    () => ({ first: () => ({ json: {} }) })
  )[0].json.duplicidade_editorial;
}
const lexical = d => ({ status: d.status, evidencia: d.evidencia, score: d.score_composto,
  percentual: d.percentual, gap: d.gap_top2, limites: d.limites, comparados: d.comparados,
  tokens: d.candidato.tokens, matches: d.top_matches.map(m => ({ id: m.id, metricas: m.metricas })) });
const casos = ['14', '16', '20', '27'].flatMap(dia =>
  JSON.parse(ler(`docs/analises/2026-10-${dia}-m360-alertas-casos.json`)).casos);

test('replay offline dos 98 casos preserva decisão, métricas e ranking com banco, sem banco e carga inválida', () => {
  assert.equal(casos.length, 98);
  for (const caso of casos) {
    const entrada = { candidato: { ...caso.candidato, link: caso.candidato.url },
      comparaveis: caso.top_matches.map(m => ({ ...m, data: m.data_campo_legado })) };
    const base = executar(antigo, entrada);
    for (const voc of [vocabulario(), null, { ...vocabulario(), versao: 'invalida' }]) {
      const out = executar(novo, { ...entrada, vocabulario_editorial: voc });
      assert.deepEqual(lexical(out), lexical(base), caso.caso_id);
    }
    const dinamica = { ...entrada, vocabulario_editorial: vocabulario() };
    assert.deepEqual(executar(novo, dinamica).candidato.assinatura_contextual,
      executar(antigo, dinamica).candidato.assinatura_contextual, caso.caso_id);
  }
});

test('sem vocabulário ou com regra nula, contexto fica indisponível sem sugerir relação', () => {
  for (const voc of [null, { ...vocabulario(), regras: [null, ...vocabulario().regras.slice(1)] }]) {
    const out = executar(novo, { candidato: { titulo: 'Pedro Emanuel comenta Flamengo x Vasco' },
      comparaveis: [{ id: 1, titulo: 'Pedro comenta Flamengo x Vasco' }], vocabulario_editorial: voc });
    const a = out.analise_contextual;
    assert.deepEqual(out.candidato.assinatura_contextual.participantes, []);
    assert.deepEqual(out.candidato.assinatura_contextual.pessoas_principais, []);
    assert.equal(out.candidato.assinatura_contextual.competicao, null);
    assert.equal(a.status_sugerido, 'INDETERMINADO');
    assert.equal(a.recomendacao, 'SEM_RECOMENDACAO');
    assert.equal(a.melhor_match.analise_contextual.score_contextual, null);
    assert.equal(a.diverge_do_baseline, null);
    assert.equal(a.auditoria_vocabulario.fonte_contextual, 'INDISPONIVEL');
    assert.equal(a.auditoria_vocabulario.aplicado_no_contexto, false);
  }
});

test('ausência de vocabulário preserva os três resultados funcionais lexicais', () => {
  for (const [titulo, referencia, esperado] of [
    ['Flamengo anuncia reforço para Libertadores', 'Flamengo anuncia reforço para Libertadores', 'DUPLICADO'],
    ['Flamengo Vasco Brasileirão', 'Flamengo Vasco Brasileirão', 'SUSPEITO'],
    ['Flamengo anuncia reforço', 'Conmebol prepara calendário', 'NOVO']
  ]) {
    const entrada = { candidato: { titulo }, comparaveis: [{ id: 1, titulo: referencia }] };
    const out = executar(novo, entrada);
    assert.equal(out.status, esperado);
    assert.deepEqual(lexical(out), lexical(executar(antigo, entrada)));
  }
});

test('bloqueio de homônimo vem do banco e nenhuma comparação estática é alegada', () => {
  const out = executar(novo, { candidato: { titulo: 'Pedro Emanuel comenta Flamengo' },
    comparaveis: [], vocabulario_editorial: vocabulario() });
  assert.deepEqual(out.candidato.assinatura_contextual.pessoas_principais, []);
  const audit = out.analise_contextual.auditoria_vocabulario;
  assert.equal(audit.fonte_contextual, 'BANCO');
  assert.equal(audit.comparacao_estatica_disponivel, false);
  assert.equal(audit.total_comparaveis_divergentes, undefined);
});

test('mudança de canônico no banco aparece no contexto sem nova edição do node', () => {
  const voc = vocabulario();
  for (const regra of voc.regras) {
    if (regra.tipo === 'ALIAS_CLUBE' && regra.valor_canonico === 'FLAMENGO') {
      regra.valor_canonico = 'CLUBE_TESTE';
    }
  }
  const out = executar(novo, { candidato: { titulo: 'Flamengo enfrenta Vasco' },
    comparaveis: [], vocabulario_editorial: voc });
  assert.deepEqual(out.candidato.assinatura_contextual.participantes, ['CLUBE_TESTE', 'VASCO']);
});
