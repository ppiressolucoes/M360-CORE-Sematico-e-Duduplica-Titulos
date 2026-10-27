'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const raiz = path.resolve(__dirname, '..', '..');
const workflow = JSON.parse(fs.readFileSync(
  path.join(raiz, 'workflows', 'm360-deduplicacao-semantica.json'),
  'utf8'
));

function codigo(nome) {
  return workflow.nodes.find(node => node.name === nome)?.parameters?.jsCode;
}

function executar(jsCode, contexto) {
  return vm.runInNewContext(`(() => {\n${jsCode}\n})()`, contexto);
}

test('Core v0.5.0 integra validade temporal antes da deduplicação sem desvio de rota', () => {
  assert.equal(workflow.active, false);
  assert.equal(workflow.nodes.length, 16);
  assert.equal('pinData' in workflow, false);
  assert.equal(JSON.stringify(workflow).includes('credentials'), false);

  assert.equal(
    workflow.connections['Start Dedup'].main[0][0].node,
    'Validade Temporal v0.1.0'
  );
  assert.deepEqual(
    workflow.connections['Validade Temporal v0.1.0'].main[0],
    [{ node: 'SP DEDUPLICA EDITORIAL | M360', type: 'main', index: 0 }]
  );
  assert.equal(
    workflow.connections['SP DEDUPLICA EDITORIAL | M360'].main[0][0].node,
    'Normaliza Deduplica Editorial v0.3.0'
  );
});

test('export mantém os Code nodes sincronizados com os artefatos revisáveis', () => {
  const sincronizacoes = [
    ['Validade Temporal v0.1.0', 'codes/m360/validade-temporal-v0.1.0.js'],
    ['Normaliza Deduplica Editorial v0.3.0', 'codes/m360/normaliza-deduplica-editorial-v0.3.0.js'],
    ['Retorno Final', 'codes/m360/retorno-final.js']
  ];

  for (const [nome, arquivo] of sincronizacoes) {
    assert.equal(
      codigo(nome),
      fs.readFileSync(path.join(raiz, arquivo), 'utf8').trimEnd(),
      `${nome} divergiu de ${arquivo}`
    );
  }
});

test('EXPIRADO é diagnosticado em observação e o item segue íntegro', () => {
  const entrada = {
    titulo: 'Confira horários e onde assistir aos jogos de hoje com Flamengo',
    link: 'https://example.test/pauta',
    iso_date: '2026-10-22T08:00:00-03:00',
    marcador: 'preservado'
  };
  const saida = executar(codigo('Validade Temporal v0.1.0'), {
    $input: { first: () => ({ json: entrada }) },
    $now: { toISO: () => '2026-10-23T09:00:00-03:00' },
    Intl,
    Date
  });

  assert.equal(saida.length, 1);
  assert.equal(saida[0].json.marcador, 'preservado');
  assert.equal(saida[0].json.core_versao, '0.5.0');
  assert.equal(saida[0].json.validade_temporal.status, 'EXPIRADO');
  assert.equal(saida[0].json.validade_temporal.modo, 'OBSERVACAO');
  assert.equal(saida[0].json.validade_temporal.aplicado_automaticamente, false);
});

test('INDETERMINADO também segue para deduplicação sem bloqueio', () => {
  const saida = executar(codigo('Validade Temporal v0.1.0'), {
    $input: {
      first: () => ({
        json: {
          titulo: 'Onde assistir aos jogos de hoje',
          link: 'https://example.test/sem-data'
        }
      })
    },
    $now: { toISO: () => '2026-10-24T12:00:00-03:00' },
    Intl,
    Date
  });

  assert.equal(saida[0].json.validade_temporal.status, 'INDETERMINADO');
  assert.equal(
    workflow.connections['Validade Temporal v0.1.0'].main[0][0].node,
    'SP DEDUPLICA EDITORIAL | M360'
  );
});

test('normalizador v0.3.0 preserva auditoria temporal no contrato', () => {
  const enriquecido = {
    titulo: 'Flamengo joga hoje',
    link: 'https://example.test/candidato',
    core_versao: '0.5.0',
    validade_temporal: {
      versao: '0.1.0',
      modo: 'OBSERVACAO',
      status: 'VALIDO',
      aplicado_automaticamente: false
    }
  };
  const rows = [{
    row_type: 'CONTROL',
    resultado: 'CHECK_SIMILARITY',
    registro_id: 10,
    legacy_id: 20,
    duplicate_exact: 0,
    source_host: 'example.test',
    janela_dias: 7,
    post_id: 'abc'
  }];
  const saida = executar(codigo('Normaliza Deduplica Editorial v0.3.0'), {
    $: nome => ({
      first: () => ({
        json: nome === 'Validade Temporal v0.1.0' ? enriquecido : {}
      })
    }),
    $input: { all: () => rows.map(json => ({ json })) }
  });

  assert.equal(saida[0].json.core_versao, '0.5.0');
  assert.equal(saida[0].json.validade_temporal.status, 'VALIDO');
  assert.equal(saida[0].json.candidato.validade_temporal.status, 'VALIDO');
  assert.equal(saida[0].json.candidato.core_versao, '0.5.0');
});

test('retorno final expõe a versão e o diagnóstico sem alterar o resultado', () => {
  const temporal = { status: 'EXPIRADO', modo: 'OBSERVACAO' };
  const saida = executar(codigo('Retorno Final'), {
    $: () => ({ first: () => ({ json: { validade_temporal: temporal } }) }),
    $input: { first: () => ({ json: { resultado: 'SUSPEITO' } }) }
  });

  assert.equal(saida[0].json.resultado, 'SUSPEITO');
  assert.equal(saida[0].json.core_versao, '0.5.0');
  assert.equal(saida[0].json.validade_temporal.status, 'EXPIRADO');
});
