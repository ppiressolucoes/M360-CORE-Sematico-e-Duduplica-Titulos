const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const raiz = path.resolve(__dirname, '../..');
const codigoAnterior = fs.readFileSync(
  path.join(raiz, 'codes/m360/normaliza-vocabulario-editorial-v0.1.0.js'), 'utf8'
);
const codigo = fs.readFileSync(
  path.join(raiz, 'codes/m360/normaliza-vocabulario-editorial-v0.2.0.js'), 'utf8'
);
const similaridade = fs.readFileSync(
  path.join(raiz, 'codes/m360/similaridade-editorial-v0.5.0-vocab-observacao.js'), 'utf8'
);
const seed = fs.readFileSync(
  path.join(raiz, 'sql/editorial/seeds/M360-vocabulario-v0.1.0-propor.sql'), 'utf8'
);
const match = seed.match(/'(\[\s*\{[\s\S]*?\}\s*\])'/);
assert.ok(match, 'carga inicial JSON encontrada');
const propostas = JSON.parse(match[1]);

function rowsDoSeed() {
  return propostas.map((regra, indice) => ({
    regra_id: indice + 1,
    dsc_dominio: 'ESPORTE',
    dsc_consumidor: 'M360',
    versao_vocabulario: '0.1.0',
    tipo_expressao: 'LITERAL',
    ativo: 1,
    ...regra,
    confianca: Number(regra.confianca).toFixed(4)
  }));
}

function executar(codigoNode, items) {
  return vm.runInNewContext(
    `(function () {\n${codigoNode}\n})()`,
    { $input: { all: () => items } }
  );
}

function novoAlias() {
  return {
    ...rowsDoSeed()[0],
    regra_id: 73,
    tipo: 'ALIAS_CLUBE',
    expressao: 'union la calera',
    valor_canonico: 'UNION_LA_CALERA',
    prioridade: 50,
    confianca: '0.8500'
  };
}

test('baseline de 72 regras mantém exatamente o contrato da v0.1.0', () => {
  const items = [{ json: [rowsDoSeed(), { affectedRows: 0 }] }];
  const anterior = executar(codigoAnterior, items);
  const atual = executar(codigo, items);
  assert.deepEqual(JSON.parse(JSON.stringify(atual)), JSON.parse(JSON.stringify(anterior)));
});

test('aceita uma 73ª regra literal válida, sem consultar o banco por comparável', () => {
  const rows = [...rowsDoSeed(), novoAlias()];
  const saida = executar(codigo, rows.map(json => ({ json })));
  const vocabulario = saida[0].json.vocabulario_editorial;

  assert.equal(saida.length, 1);
  assert.equal(vocabulario.total_regras, 73);
  assert.equal(vocabulario.quantidades_por_tipo.ALIAS_CLUBE, 31);
  assert.equal(vocabulario.modo, 'OBSERVACAO');
  assert.equal(vocabulario.aplicado_automaticamente, false);
});

test('rejeita carga parcial abaixo da cobertura mínima', () => {
  const rows = rowsDoSeed().slice(0, 71);
  assert.throws(() => executar(codigo, [{ json: rows }]), /esperado entre 72 e 500/);
});

test('rejeita perda de cobertura de um tipo mesmo com 72 regras', () => {
  const rows = rowsDoSeed();
  const indice = rows.findIndex(row => row.tipo === 'ALIAS_PESSOA');
  rows.splice(indice, 1);
  rows.push(novoAlias());
  assert.throws(() => executar(codigo, [{ json: rows }]), /cobertura insuficiente em ALIAS_PESSOA/);
});

test('rejeita escopo, versão ou tipo de expressão inesperados', () => {
  for (const [campo, valor] of [
    ['dsc_dominio', 'ENERGIA_LIMPA'],
    ['versao_vocabulario', '0.1.1'],
    ['tipo_expressao', 'REGEX_JS']
  ]) {
    const rows = rowsDoSeed();
    rows[0][campo] = valor;
    assert.throws(() => executar(codigo, [{ json: rows }]), /Regra de vocabulário inválida/);
  }
});

test('rejeita alias ambíguo do mesmo tipo e IDs repetidos', () => {
  const rows = rowsDoSeed();
  const ambiguo = { ...novoAlias(), expressao: 'flamengo' };
  assert.throws(
    () => executar(codigo, [{ json: [...rows, ambiguo] }]),
    /repetida ou ambígua/
  );
  rows.push({ ...novoAlias(), regra_id: rows[0].regra_id });
  assert.throws(() => executar(codigo, [{ json: rows }]), /repetida ou ambígua/);
});

test('Similaridade preparada audita 73 regras sem aplicação automática', () => {
  const vocabulario = executar(codigo, [
    { json: [...rowsDoSeed(), novoAlias()] }
  ])[0].json.vocabulario_editorial;
  const entrada = {
    resultado: 'CHECK_SIMILARITY',
    candidato: {
      titulo: 'Flamengo enfrenta o Santos pelo Brasileirão',
      link: 'https://exemplo.com/flamengo-santos'
    },
    comparaveis: [],
    vocabulario_editorial: vocabulario
  };
  const node = new Function('$input', '$', similaridade);
  const saida = node(
    { first: () => ({ json: entrada }) },
    () => { throw new Error('Start Dedup indisponível no teste'); }
  )[0].json;

  assert.equal(saida.duplicidade_editorial.analise_contextual.auditoria_vocabulario.status,
    'CARREGADO_EM_OBSERVACAO');
  assert.equal(saida.duplicidade_editorial.analise_contextual.auditoria_vocabulario.total_regras, 73);
  assert.equal(saida.duplicidade_editorial.analise_contextual.aplicado_automaticamente, false);
  assert.equal(saida.vocabulario_editorial.regras, undefined);
});
