const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const raiz = path.resolve(__dirname, '../..');
const codigo = fs.readFileSync(
  path.join(raiz, 'codes/m360/normaliza-vocabulario-editorial-v0.1.0.js'),
  'utf8'
);
const seed = fs.readFileSync(
  path.join(raiz, 'sql/editorial/seeds/M360-vocabulario-v0.1.0-propor.sql'),
  'utf8'
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

function executar(items) {
  const contexto = {
    $input: { all: () => items }
  };
  return vm.runInNewContext(`(function () {\n${codigo}\n})()`, contexto);
}

test('agrega as 72 rows e ignora metadados do CALL MySQL', () => {
  const rows = rowsDoSeed();
  const saida = executar([{
    json: [rows, { affectedRows: 0, fieldCount: 0 }]
  }]);
  assert.equal(saida.length, 1);
  const vocabulario = saida[0].json.vocabulario_editorial;
  assert.equal(vocabulario.total_regras, 72);
  assert.equal(vocabulario.versao, '0.1.0');
  assert.equal(vocabulario.modo, 'OBSERVACAO');
  assert.equal(vocabulario.aplicado_automaticamente, false);
  assert.equal(vocabulario.regras[0].tipo, 'BLOQUEIO_PESSOA');
  assert.equal(vocabulario.regras[0].confianca, 1);
  assert.equal(vocabulario.quantidades_por_tipo.ALIAS_CLUBE, 30);
  assert.equal(vocabulario.quantidades_por_tipo.ALIAS_COMPETICAO, 15);
  assert.equal(vocabulario.quantidades_por_tipo.ALIAS_ORGANIZACAO, 6);
  assert.equal(vocabulario.quantidades_por_tipo.ALIAS_PESSOA, 20);
  assert.equal(vocabulario.quantidades_por_tipo.BLOQUEIO_PESSOA, 1);
});

test('aceita rows individuais emitidas pelo node MySQL', () => {
  const saida = executar(rowsDoSeed().map(json => ({ json })));
  assert.equal(saida[0].json.vocabulario_editorial.total_regras, 72);
});

test('falha fechado com carga parcial, sem criar item para o fluxo', () => {
  const rows = rowsDoSeed().slice(0, 71);
  assert.throws(() => executar([{ json: [rows, { affectedRows: 0 }] }]), /esperadas 72 regras/);
});

test('rejeita versao ou escopo inesperado', () => {
  const rows = rowsDoSeed();
  rows[0].versao_vocabulario = '0.1.1';
  assert.throws(() => executar([{ json: rows }]), /Regra de vocabulário inválida/);
});

test('rejeita regra duplicada', () => {
  const rows = rowsDoSeed();
  rows[1].regra_id = rows[0].regra_id;
  assert.throws(() => executar([{ json: rows }]), /Regra de vocabulário repetida/);
});
