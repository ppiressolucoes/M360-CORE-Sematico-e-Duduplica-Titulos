'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const codigo = fs.readFileSync(
  path.resolve(__dirname, '..', '..', 'codes', 'm360', 'retorno-final-v0.2.1.js'),
  'utf8'
);

function executar({ entrada = {}, nodes = {} }) {
  return vm.runInNewContext(`(() => {\n${codigo}\n})()`, {
    $input: { first: () => ({ json: entrada }) },
    $: nome => {
      if (!(nome in nodes)) throw new Error(`Node nao executado: ${nome}`);
      return { first: () => ({ json: nodes[nome] }) };
    }
  })[0].json;
}

const temporal = {
  validade_temporal: {
    versao: '0.1.1',
    status: 'VALIDO',
    modo: 'OBSERVACAO',
    aplicado_automaticamente: false
  }
};

test('nao promove CHECK_SIMILARITY sobre a decisao da v0.5.0', () => {
  const saida = executar({
    entrada: { resultado: 'CHECK_SIMILARITY' },
    nodes: {
      'Validade Temporal v0.1.0': temporal,
      'Similaridade Editorial v0.5.0': {
        duplicidade_editorial: { status: 'NOVO' }
      }
    }
  });

  assert.equal(saida.resultado, 'NOVO');
  assert.equal(saida.resultado_origem, 'similaridade_editorial_v0.5.0');
  assert.equal(saida.resultado_bruto, 'CHECK_SIMILARITY');
});

test('preserva resultado terminal do input imediato', () => {
  const saida = executar({
    entrada: { resultado: 'EXACT_DUPLICATE' },
    nodes: {
      'Validade Temporal v0.1.0': temporal,
      'Similaridade Editorial v0.5.0': {
        duplicidade_editorial: { status: 'NOVO' }
      }
    }
  });

  assert.equal(saida.resultado, 'EXACT_DUPLICATE');
  assert.equal(saida.resultado_origem, 'entrada_atual');
});

test('mantem o consenso como precedencia sobre similaridade', () => {
  const saida = executar({
    entrada: { resultado: 'CHECK_SIMILARITY' },
    nodes: {
      'Validade Temporal v0.1.0': temporal,
      'Consenso Editorial v0.1.0': {
        duplicidade_editorial: { status: 'SUSPEITO' }
      },
      'Similaridade Editorial v0.5.0': {
        duplicidade_editorial: { status: 'NOVO' }
      }
    }
  });

  assert.equal(saida.resultado, 'SUSPEITO');
  assert.equal(saida.resultado_origem, 'consenso_editorial');
});

test('aceita a v0.4.0 como fallback durante a migracao', () => {
  const saida = executar({
    entrada: { resultado: 'CHECK_SIMILARITY' },
    nodes: {
      'Validade Temporal v0.1.0': temporal,
      'Similaridade Editorial v0.4.0': {
        duplicidade_editorial: { status: 'DUPLICADO' }
      }
    }
  });

  assert.equal(saida.resultado, 'DUPLICADO');
  assert.equal(saida.resultado_origem, 'similaridade_editorial_v0.4.0');
});

test('recupera resultado terminal do normalizador quando similaridade nao executou', () => {
  const saida = executar({
    nodes: {
      'Validade Temporal v0.1.0': temporal,
      'Normaliza Deduplica Editorial v0.3.0': {
        resultado: 'ALREADY_PROCESSING'
      }
    }
  });

  assert.equal(saida.resultado, 'ALREADY_PROCESSING');
  assert.equal(saida.resultado_origem, 'normalizador');
});

test('preserva estado bruto apenas quando nenhuma decisao terminal existe', () => {
  const saida = executar({
    entrada: { resultado: 'CHECK_SIMILARITY' },
    nodes: { 'Validade Temporal v0.1.0': temporal }
  });

  assert.equal(saida.resultado, 'CHECK_SIMILARITY');
  assert.equal(saida.resultado_origem, 'fallback_resultado_bruto');
});
