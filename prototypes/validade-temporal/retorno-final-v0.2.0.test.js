'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const codigo = fs.readFileSync(
  path.resolve(__dirname, '..', '..', 'codes', 'm360', 'retorno-final-v0.2.0.js'),
  'utf8'
);

function executar({ entrada = {}, nodes = {} }) {
  return vm.runInNewContext(`(() => {\n${codigo}\n})()`, {
    $input: { first: () => ({ json: entrada }) },
    $: nome => {
      if (!(nome in nodes)) {
        throw new Error(`Node não executado: ${nome}`);
      }

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

test('preserva resultado presente no input imediato', () => {
  const saida = executar({
    entrada: { resultado: 'EXACT_DUPLICATE' },
    nodes: { 'Validade Temporal v0.1.0': temporal }
  });

  assert.equal(saida.resultado, 'EXACT_DUPLICATE');
  assert.equal(saida.validade_temporal.versao, '0.1.1');
});

test('recupera NOVO da decisão de similaridade após nodes de efeito', () => {
  const saida = executar({
    nodes: {
      'Validade Temporal v0.1.0': temporal,
      'Normaliza Deduplica Editorial v0.3.0': { resultado: 'CHECK_SIMILARITY' },
      'Similaridade Editorial v0.4.0': {
        duplicidade_editorial: { status: 'NOVO' }
      }
    }
  });

  assert.equal(saida.resultado, 'NOVO');
});

test('recupera SUSPEITO do payload preservado pelo consenso', () => {
  const saida = executar({
    nodes: {
      'Validade Temporal v0.1.0': temporal,
      'Normaliza Deduplica Editorial v0.3.0': { resultado: 'CHECK_SIMILARITY' },
      'Similaridade Editorial v0.4.0': {
        duplicidade_editorial: { status: 'SUSPEITO' }
      },
      'Consenso Editorial v0.1.0': {
        duplicidade_editorial: { status: 'SUSPEITO' }
      }
    }
  });

  assert.equal(saida.resultado, 'SUSPEITO');
});

test('usa o resultado do normalizador quando similaridade não executou', () => {
  const saida = executar({
    nodes: {
      'Validade Temporal v0.1.0': temporal,
      'Normaliza Deduplica Editorial v0.3.0': {
        resultado: 'ALREADY_PROCESSING'
      }
    }
  });

  assert.equal(saida.resultado, 'ALREADY_PROCESSING');
});

test('mantém resultado explícito como prioridade sobre fallbacks', () => {
  const saida = executar({
    entrada: { resultado: 'EXACT_DUPLICATE' },
    nodes: {
      'Validade Temporal v0.1.0': temporal,
      'Similaridade Editorial v0.4.0': {
        duplicidade_editorial: { status: 'NOVO' }
      }
    }
  });

  assert.equal(saida.resultado, 'EXACT_DUPLICATE');
});
