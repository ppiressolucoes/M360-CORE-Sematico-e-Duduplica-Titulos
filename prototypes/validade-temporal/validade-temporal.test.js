'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { avaliarValidadeTemporal } = require('./validade-temporal');

const TIMEZONE = 'America/Sao_Paulo';

function avaliar(entrada) {
  return avaliarValidadeTemporal({
    timezone: TIMEZONE,
    modo: 'OBSERVACAO',
    ...entrada
  }).validade_temporal;
}

test('VT-01: expira pauta de quinta-feira avaliada na sexta-feira', () => {
  const resultado = avaliar({
    titulo: 'Confira horários e onde assistir aos jogos de hoje com Flamengo e Europa League',
    contexto: 'Futebol agita quinta-feira com Libertadores, Europa League e clássicos femininos.',
    iso_date: '2026-10-22T08:00:00-03:00',
    instante_avaliacao: '2026-10-23T09:00:00-03:00'
  });

  assert.equal(resultado.status, 'EXPIRADO');
  assert.equal(resultado.intencao, 'SERVICO_PRE_EVENTO');
  assert.deepEqual(
    [...new Set(resultado.expressoes.map(item => item.data_resolvida))],
    ['2026-10-22']
  );
  assert.ok(resultado.motivos.includes('REFERENCIAS_TEMPORAIS_CONCORDANTES'));
  assert.equal(resultado.aplicado_automaticamente, false);
});

test('VT-02: mantém válida pauta avaliada no próprio dia', () => {
  const resultado = avaliar({
    titulo: 'Confira onde assistir aos jogos de hoje',
    iso_date: '2026-10-22T08:00:00-03:00',
    instante_avaliacao: '2026-10-22T10:00:00-03:00'
  });

  assert.equal(resultado.status, 'VALIDO');
  assert.ok(resultado.motivos.includes('EVENTO_NO_DIA_DA_AVALIACAO'));
});

test('VT-03: não bloqueia retrospectiva apenas porque o evento passou', () => {
  const resultado = avaliar({
    titulo: 'Confira o resultado dos jogos de hoje',
    iso_date: '2026-10-22T22:00:00-03:00',
    instante_avaliacao: '2026-10-23T09:00:00-03:00'
  });

  assert.equal(resultado.status, 'VALIDO');
  assert.equal(resultado.intencao, 'RESULTADO');
  assert.ok(resultado.motivos.includes('CONTEUDO_POS_EVENTO'));
});

test('VT-04: resolve domingo futuro a partir de uma fonte de sábado', () => {
  const resultado = avaliar({
    titulo: 'Onde assistir aos jogos de domingo',
    iso_date: '2026-10-24T08:00:00-03:00',
    instante_avaliacao: '2026-10-24T12:00:00-03:00'
  });

  assert.equal(resultado.status, 'VALIDO');
  assert.equal(resultado.expressoes[0].data_resolvida, '2026-10-25');
  assert.ok(resultado.motivos.includes('EVENTO_FUTURO'));
});

test('VT-05: mantém em revisão expressão relativa sem data original', () => {
  const resultado = avaliar({
    titulo: 'Onde assistir aos jogos de hoje',
    instante_avaliacao: '2026-10-24T12:00:00-03:00'
  });

  assert.equal(resultado.status, 'INDETERMINADO');
  assert.ok(resultado.motivos.includes('REFERENCIA_TEMPORAL_SEM_ANCORA_CONFIAVEL'));
});

test('VT-06: mantém agenda mista em revisão', () => {
  const resultado = avaliar({
    titulo: 'Agenda de quinta-feira e domingo: onde assistir aos jogos',
    iso_date: '2026-10-22T08:00:00-03:00',
    instante_avaliacao: '2026-10-23T09:00:00-03:00'
  });

  assert.equal(resultado.status, 'INDETERMINADO');
  assert.deepEqual(resultado.evento.datas, ['2026-10-22', '2026-10-25']);
  assert.ok(resultado.motivos.includes('JANELA_TEMPORAL_MISTA'));
});

test('passa conteúdo sem sinal temporal sem inventar data de evento', () => {
  const resultado = avaliar({
    titulo: 'Flamengo anuncia novo diretor para o departamento de futebol',
    instante_avaliacao: '2026-10-24T12:00:00-03:00'
  });

  assert.equal(resultado.status, 'VALIDO');
  assert.equal(resultado.evento, null);
  assert.ok(resultado.motivos.includes('SEM_RESTRICAO_TEMPORAL_DETECTADA'));
});

test('exige instante de avaliação explícito para resultado determinístico', () => {
  const resultado = avaliar({
    titulo: 'Onde assistir aos jogos de hoje',
    iso_date: '2026-10-24T08:00:00-03:00'
  });

  assert.equal(resultado.status, 'INDETERMINADO');
  assert.ok(resultado.motivos.includes('INSTANTE_AVALIACAO_AUSENTE_OU_INVALIDO'));
});

test('resolve data por extenso usando o ano da fonte', () => {
  const resultado = avaliar({
    titulo: 'Jogos de hoje, terça-feira, 13 de outubro: onde assistir e horários',
    iso_date: '2026-10-13T08:00:00-03:00',
    instante_avaliacao: '2026-10-14T09:00:00-03:00'
  });

  assert.equal(resultado.status, 'EXPIRADO');
  assert.deepEqual(
    [...new Set(resultado.expressoes.map(item => item.data_resolvida))],
    ['2026-10-13']
  );
  assert.ok(resultado.motivos.includes('REFERENCIAS_TEMPORAIS_CONCORDANTES'));
});

test('resolve data numérica futura mesmo quando o ano está explícito no título', () => {
  const resultado = avaliar({
    titulo: 'Onde assistir Flamengo x Palmeiras em 25/10/2026',
    instante_avaliacao: '2026-10-24T12:00:00-03:00'
  });

  assert.equal(resultado.status, 'VALIDO');
  assert.equal(resultado.expressoes[0].data_resolvida, '2026-10-25');
  assert.ok(resultado.motivos.includes('EVENTO_FUTURO'));
});

test('usa data como fallback auditável quando iso_date não existe', () => {
  const resultado = avaliar({
    titulo: 'Confira onde assistir aos jogos de hoje',
    data: '23/10/2026',
    instante_avaliacao: '2026-10-24T12:00:00-03:00'
  });

  assert.equal(resultado.status, 'EXPIRADO');
  assert.equal(resultado.referencia_conteudo.origem, 'data');
  assert.equal(resultado.referencia_conteudo.confianca, 0.8);
});
