const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const raiz = path.resolve(__dirname, '../..');
const ler = arquivo => fs.readFileSync(path.join(raiz, arquivo), 'utf8');
const normalizaAnterior = ler('codes/m360/normaliza-vocabulario-editorial-v0.2.0.js');
const normalizaNovo = ler('codes/m360/normaliza-vocabulario-editorial-v0.2.1.js');
const similaridadeAnterior = ler('codes/m360/similaridade-editorial-v0.5.2-vocab-banco.js');
const similaridadeNova = ler('codes/m360/similaridade-editorial-v0.5.3-facetas-banco.js');
const seed = JSON.parse(ler('sql/editorial/seeds/M360-vocabulario-v0.1.0-propor.sql')
  .match(/'(\[\s*\{[\s\S]*?\}\s*\])'/)[1]);
const propostasFaceta = JSON.parse(ler(
  'sql/editorial/seeds/M360-vocabulario-v0.1.0-faceta-financas-propor.sql'
).match(/'(\[\s*\{[\s\S]*?\}\s*\])'/)[1]);

function rowsBase() {
  return seed.map((regra, indice) => ({
    ...regra,
    regra_id: indice + 1,
    dsc_dominio: 'ESPORTE',
    dsc_consumidor: 'M360',
    versao_vocabulario: '0.1.0',
    tipo_expressao: 'LITERAL',
    ativo: 1
  }));
}

function normalizar(codigo, rows) {
  return vm.runInNewContext(`(function () {\n${codigo}\n})()`, {
    $input: { all: () => [{ json: [rows, { affectedRows: 0 }] }] }
  })[0].json.vocabulario_editorial;
}

function similaridade(codigo, entrada) {
  return new Function('$input', '$', codigo)(
    { first: () => ({ json: entrada }) },
    () => { throw new Error('Start Dedup indisponivel no teste'); }
  )[0].json.duplicidade_editorial;
}

function faceta(regraId, expressao) {
  const proposta = propostasFaceta.find(item => item.expressao === expressao);
  assert.ok(proposta, `expressao nao encontrada na proposta SQL: ${expressao}`);
  return {
    ...rowsBase()[0],
    ...proposta,
    regra_id: regraId,
    expressao
  };
}

test('Normaliza v0.2.1 preserva a saida das 72 regras atuais', () => {
  assert.deepEqual(
    JSON.parse(JSON.stringify(normalizar(normalizaNovo, rowsBase()))),
    JSON.parse(JSON.stringify(normalizar(normalizaAnterior, rowsBase())))
  );
});

test('tipo FACETA_EDITORIAL e opcional e validado; os demais tipos mantem minimo', () => {
  assert.equal(propostasFaceta.length, 2);
  assert.deepEqual(propostasFaceta.map(item => item.expressao),
    ['postura ultraconservadora', 'deficit']);
  assert.ok(propostasFaceta.every(item => item.tipo === 'FACETA_EDITORIAL' &&
    item.tipo_expressao === 'LITERAL' && item.valor_canonico === 'PLANEJAMENTO_FINANCEIRO'));
  const vocabulario = normalizar(normalizaNovo, [
    ...rowsBase(), faceta(73, 'postura ultraconservadora'), faceta(74, 'deficit')
  ]);
  assert.equal(vocabulario.total_regras, 74);
  assert.equal(vocabulario.quantidades_por_tipo.FACETA_EDITORIAL, 2);
  assert.equal(vocabulario.aplicado_automaticamente, false);
  assert.throws(() => normalizar(normalizaNovo, [
    ...rowsBase(), { ...faceta(73, 'deficit'), valor_canonico: 'financeiro livre' }
  ]), /Regra de vocabulário inválida/);
  const incompleto = rowsBase().filter(regra => regra.tipo !== 'BLOQUEIO_PESSOA');
  assert.throws(() => normalizar(normalizaNovo, [
    ...incompleto, faceta(73, 'deficit')
  ]), /cobertura insuficiente em BLOQUEIO_PESSOA/);
});

test('Similaridade v0.5.3 preserva lexical e contexto nos 98 casos sem novas facetas', () => {
  const vocabulario = normalizar(normalizaNovo, rowsBase());
  const casos = ['14', '16', '20', '27'].flatMap(dia =>
    JSON.parse(ler(`docs/analises/2026-10-${dia}-m360-alertas-casos.json`)).casos);
  assert.equal(casos.length, 98);
  for (const caso of casos) {
    const entrada = { candidato: { ...caso.candidato, link: caso.candidato.url },
      comparaveis: caso.top_matches.map(m => ({ ...m, data: m.data_campo_legado })),
      vocabulario_editorial: vocabulario };
    const anterior = similaridade(similaridadeAnterior, entrada);
    const novo = similaridade(similaridadeNova, entrada);
    for (const campo of ['status', 'evidencia', 'score_composto', 'percentual', 'melhor_match']) {
      assert.deepEqual(novo[campo], anterior[campo], `${caso.caso_id}: ${campo}`);
    }
    assert.deepEqual(novo.candidato.assinatura_contextual,
      anterior.candidato.assinatura_contextual, caso.caso_id);
    assert.equal(novo.analise_contextual.auditoria_vocabulario.fonte_contextual, 'BANCO');
  }
});

test('faceta nova vem do banco para ambos os titulos sem alterar a decisao lexical', () => {
  const base = normalizar(normalizaNovo, rowsBase());
  const comFacetas = normalizar(normalizaNovo, [
    ...rowsBase(), faceta(73, 'postura ultraconservadora'), faceta(74, 'deficit')
  ]);
  const entrada = {
    candidato: { titulo: 'Bap projeta 2027 dificil e anuncia postura ultraconservadora do Flamengo' },
    comparaveis: [{ id: 3686,
      titulo: 'Flamengo projeta deficit de R$ 40 milhoes em 2026, e Bap preve 2027 ainda mais dificil' }]
  };
  const anterior = similaridade(similaridadeNova, { ...entrada, vocabulario_editorial: base });
  const novo = similaridade(similaridadeNova, { ...entrada, vocabulario_editorial: comFacetas });
  assert.equal(novo.versao, '0.5.3');
  assert.equal(novo.status, anterior.status);
  assert.equal(novo.percentual, anterior.percentual);
  assert.deepEqual(novo.candidato.assinatura_contextual.facetas, ['PLANEJAMENTO_FINANCEIRO']);
  assert.deepEqual(novo.melhor_match.assinatura_contextual.facetas, ['PLANEJAMENTO_FINANCEIRO']);
  assert.deepEqual(
    Array.from(novo.analise_contextual.auditoria_vocabulario.ids_regras_acionadas_candidato),
    [1, 73]
  );
  assert.equal(novo.analise_contextual.auditoria_vocabulario.aplicado_na_decisao, false);
  assert.equal(similaridade(similaridadeAnterior,
    { ...entrada, vocabulario_editorial: comFacetas })
    .analise_contextual.auditoria_vocabulario.fonte_contextual, 'INDISPONIVEL');
});

test('sem vocabulario valido a v0.5.3 preserva o lexical e nao recomenda contexto', () => {
  const entrada = {
    candidato: { titulo: 'Flamengo enfrenta o Vasco' },
    comparaveis: [{ id: 1, titulo: 'Flamengo enfrenta o Vasco' }]
  };
  for (const vocabulario of [null, { ...normalizar(normalizaNovo, rowsBase()), versao: 'invalida' }]) {
    const atual = similaridade(similaridadeNova, { ...entrada, vocabulario_editorial: vocabulario });
    const anterior = similaridade(similaridadeAnterior, { ...entrada, vocabulario_editorial: vocabulario });
    assert.equal(atual.status, anterior.status);
    assert.equal(atual.percentual, anterior.percentual);
    assert.equal(atual.analise_contextual.status_sugerido, 'INDETERMINADO');
    assert.equal(atual.analise_contextual.auditoria_vocabulario.fonte_contextual, 'INDISPONIVEL');
  }
});

test('SQL de ativacao valida as duas regras sem depender de variavel de sessao', () => {
  const sql = ler('sql/editorial/seeds/M360-vocabulario-v0.1.0-faceta-financas-ativar.sql');
  assert.doesNotMatch(sql, /@[a-z_]/i);
  assert.match(sql, /`regra_id` = 73 AND `expressao` = 'postura ultraconservadora'/);
  assert.match(sql, /`regra_id` = 74 AND `expressao` = 'deficit'/);
  assert.match(sql, /`situacao` = 'PROPOSTA'/);
  assert.match(sql, /`ativo` = 0/);
  assert.match(sql, /`dsc_execucao_origem` = 'm360-core-029-1347-faceta-financas-v0\.1\.0'/);
});
