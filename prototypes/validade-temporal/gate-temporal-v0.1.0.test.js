const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const codigo = fs.readFileSync(
  path.resolve(__dirname, '../../codes/m360/gate-temporal-v0.1.0.js'), 'utf8'
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
      referencia_conteudo: {
        origem: 'iso_date',
        data: '2026-10-28',
        confianca: 1
      },
      expressoes: [{
        texto: 'hoje',
        data_resolvida: '2026-10-28',
        confianca: 1
      }],
      evento: {
        inicio: '2026-10-28T00:00:00-03:00',
        fim: '2026-10-28T23:59:59-03:00',
        timezone: 'America/Sao_Paulo'
      },
      intencao: 'SERVICO_PRE_EVENTO',
      status: 'EXPIRADO',
      confianca: 1,
      aplicado_automaticamente: false
    }
  };
}

function executar(entrada, ativar = false) {
  const fonte = ativar
    ? codigo.replace('bloqueioAtivo: false', 'bloqueioAtivo: true')
    : codigo;
  const node = new Function('$input', fonte);
  return node({ first: () => ({ json: entrada }) })[0].json;
}

test('observa serviço expirado confiável sem bloquear com flag desligada', () => {
  const entrada = entradaExpirada();
  const saida = executar(entrada);

  assert.equal(saida.titulo, entrada.titulo);
  assert.equal(saida.link, entrada.link);
  assert.deepEqual(saida.validade_temporal, entrada.validade_temporal);
  assert.equal(saida.controle_temporal.modo, 'OBSERVACAO');
  assert.equal(saida.controle_temporal.elegivel_bloqueio, true);
  assert.equal(saida.controle_temporal.rota, 'SEGUIR');
  assert.equal(saida.controle_temporal.aplicado_automaticamente, false);
});

test('com flag ligada, bloqueia antes da SP o caso real de 29/10', () => {
  const saida = executar(entradaExpirada(), true);

  assert.equal(saida.controle_temporal.rota, 'BLOQUEAR');
  assert.equal(saida.controle_temporal.aplicado_automaticamente, true);
  assert.equal(saida.controle_temporal.elegivel_bloqueio, true);
});

test('não bloqueia notícia de resultado mesmo com evento passado', () => {
  const entrada = entradaExpirada();
  entrada.validade_temporal.intencao = 'RESULTADO';
  const saida = executar(entrada, true);

  assert.equal(saida.controle_temporal.rota, 'SEGUIR');
  assert.equal(saida.controle_temporal.elegivel_bloqueio, false);
});

test('não bloqueia estado indeterminado nem referência pouco confiável', () => {
  const indeterminado = entradaExpirada();
  indeterminado.validade_temporal.status = 'INDETERMINADO';
  assert.equal(executar(indeterminado, true).controle_temporal.rota, 'SEGUIR');

  const semAncora = entradaExpirada();
  semAncora.validade_temporal.referencia_conteudo = null;
  assert.equal(executar(semAncora, true).controle_temporal.rota, 'SEGUIR');

  const baixaConfianca = entradaExpirada();
  baixaConfianca.validade_temporal.expressoes[0].confianca = 0.85;
  assert.equal(executar(baixaConfianca, true).controle_temporal.rota, 'SEGUIR');
});

test('não bloqueia evento ainda vigente ou timestamp sem timezone', () => {
  const vigente = entradaExpirada();
  vigente.validade_temporal.instante_avaliacao = '2026-10-28T21:00:00-03:00';
  assert.equal(executar(vigente, true).controle_temporal.rota, 'SEGUIR');

  const semTimezone = entradaExpirada();
  semTimezone.validade_temporal.evento.fim = '2026-10-28T23:59:59';
  assert.equal(executar(semTimezone, true).controle_temporal.rota, 'SEGUIR');
});
