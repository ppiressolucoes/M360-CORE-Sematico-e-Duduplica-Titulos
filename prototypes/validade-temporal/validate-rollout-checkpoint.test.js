'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { validarCheckpoint } = require('./validate-rollout-checkpoint');

const raiz = path.resolve(__dirname, '..', '..');
const carregar = arquivo => JSON.parse(fs.readFileSync(path.join(raiz, arquivo), 'utf8'));
const clonar = valor => JSON.parse(JSON.stringify(valor));

const baseline = carregar('docs/baselines/2026-10-21-m360-deduplicacao-semantica.json');
const alvo = carregar('workflows/m360-deduplicacao-semantica.json');
const temporalAlvo = alvo.nodes.find(node => node.name === 'Validade Temporal v0.1.0');
const normalizadorAlvo = alvo.nodes.find(node => node.name === 'Normaliza Deduplica Editorial v0.3.0');

function t1() {
  const workflow = clonar(baseline);
  workflow.nodes.push(clonar(temporalAlvo));
  return workflow;
}

function t2() {
  const workflow = t1();
  workflow.connections['Start Dedup'] = {
    main: [[{
      node: 'Validade Temporal v0.1.0',
      type: 'main',
      index: 0
    }]]
  };
  workflow.connections['Validade Temporal v0.1.0'] = {
    main: [[{
      node: 'SP DEDUPLICA EDITORIAL | M360',
      type: 'main',
      index: 0
    }]]
  };
  return workflow;
}

function t3() {
  const workflow = t2();
  const indice = workflow.nodes.findIndex(
    node => node.name === 'Normaliza Deduplica Editorial v0.2.2'
  );
  workflow.nodes[indice] = clonar(normalizadorAlvo);
  workflow.connections['SP DEDUPLICA EDITORIAL | M360'].main[0][0].node =
    'Normaliza Deduplica Editorial v0.3.0';
  workflow.connections['Normaliza Deduplica Editorial v0.3.0'] =
    workflow.connections['Normaliza Deduplica Editorial v0.2.2'];
  delete workflow.connections['Normaliza Deduplica Editorial v0.2.2'];
  return workflow;
}

test('aceita a baseline congelada como M360-T0', () => {
  assert.doesNotThrow(() => validarCheckpoint(clonar(baseline), 'M360-T0'));
});

test('aceita o node temporal desconectado como M360-T1', () => {
  assert.doesNotThrow(() => validarCheckpoint(t1(), 'M360-T1'));
});

test('aceita apenas a conexão observacional como M360-T2', () => {
  assert.doesNotThrow(() => validarCheckpoint(t2(), 'M360-T2'));
});

test('aceita o normalizador v0.3.0 sem retorno ampliado como M360-T3', () => {
  assert.doesNotThrow(() => validarCheckpoint(t3(), 'M360-T3'));
});

test('aceita o export-alvo do Core v0.5.0 como M360-T4', () => {
  assert.doesNotThrow(() => validarCheckpoint(clonar(alvo), 'M360-T4'));
});

test('rejeita desvio temporal que não segue para a SP', () => {
  const workflow = t2();
  workflow.connections['Validade Temporal v0.1.0'].main[0][0].node = 'Retorno Final';

  assert.throws(
    () => validarCheckpoint(workflow, 'M360-T2'),
    /deve apontar somente para SP DEDUPLICA EDITORIAL/
  );
});

test('rejeita export ativo ou com credenciais', () => {
  const ativo = clonar(alvo);
  ativo.active = true;
  assert.throws(() => validarCheckpoint(ativo, 'M360-T4'), /deve permanecer inativo/);

  const credencial = clonar(alvo);
  credencial.nodes[0].credentials = { mysql: { id: 'segredo' } };
  assert.throws(() => validarCheckpoint(credencial, 'M360-T4'), /não pode conter credenciais/);
});
