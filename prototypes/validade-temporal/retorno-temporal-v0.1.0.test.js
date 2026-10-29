const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const raiz = path.resolve(__dirname, '../..');
const codigoGate = fs.readFileSync(
  path.join(raiz, 'codes/m360/gate-temporal-v0.1.0.js'), 'utf8'
);
const codigoRetorno = fs.readFileSync(
  path.join(raiz, 'codes/m360/retorno-temporal-v0.1.0.js'), 'utf8'
);

function entradaExpirada() {
  return {
    titulo: 'Jogo do Inter hoje: horário, onde assistir ao vivo e escalações pelo Brasileirão',
    link: 'https://exemplo.com/jogo-do-inter-hoje',
    core_versao: '0.5.0',
    validade_temporal: {
      versao: '0.1.2',
      modo: 'OBSERVACAO',
      timezone: 'America/Sao_Paulo',
      instante_avaliacao: '2026-10-29T02:04:35.060-03:00',
      referencia_conteudo: { origem: 'iso_date', data: '2026-10-28', confianca: 1 },
      expressoes: [{ texto: 'hoje', data_resolvida: '2026-10-28', confianca: 1 }],
      evento: { fim: '2026-10-28T23:59:59-03:00', timezone: 'America/Sao_Paulo' },
      intencao: 'SERVICO_PRE_EVENTO',
      status: 'EXPIRADO',
      confianca: 1,
      aplicado_automaticamente: false
    }
  };
}

function executar(codigo, entrada) {
  return new Function('$input', codigo)({ first: () => ({ json: entrada }) });
}

test('rota bloqueada retorna exatamente um item e nao cria resultado de SP', () => {
  const gateAtivo = codigoGate.replace('bloqueioAtivo: false', 'bloqueioAtivo: true');
  const saidaGate = executar(gateAtivo, entradaExpirada())[0].json;
  const saida = executar(codigoRetorno, saidaGate);

  assert.equal(saidaGate.controle_temporal.rota, 'BLOQUEAR');
  assert.equal(saida.length, 1);
  assert.equal(saida[0].json.concluido, true);
  assert.equal(saida[0].json.resultado, 'EXPIRADO_TEMPORAL');
  assert.equal(saida[0].json.resultado_origem, 'gate_temporal_v0.1.0');
  assert.equal(saida[0].json.resultado_bruto, null);
  assert.equal(saida[0].json.core_versao, '0.5.0');
  assert.equal(saida[0].json.validade_temporal.status, 'EXPIRADO');
  assert.equal(saida[0].json.validade_temporal.aplicado_automaticamente, false);
  assert.equal(saida[0].json.controle_temporal.aplicado_automaticamente, true);
});

test('nao emite falso retorno terminal para rota SEGUIR', () => {
  const saidaGate = executar(codigoGate, entradaExpirada())[0].json;
  assert.equal(saidaGate.controle_temporal.rota, 'SEGUIR');
  assert.throws(
    () => executar(codigoRetorno, saidaGate),
    /entrada nao confirmada como bloqueio temporal/
  );
});

test('exige diagnostico temporal expirado mesmo se rota vier marcada como bloqueada', () => {
  const gateAtivo = codigoGate.replace('bloqueioAtivo: false', 'bloqueioAtivo: true');
  const saidaGate = executar(gateAtivo, entradaExpirada())[0].json;
  saidaGate.validade_temporal = { ...saidaGate.validade_temporal, status: 'VALIDO' };
  assert.throws(
    () => executar(codigoRetorno, saidaGate),
    /entrada nao confirmada como bloqueio temporal/
  );
});
