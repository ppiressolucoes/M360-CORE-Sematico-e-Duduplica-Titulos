'use strict';

const fs = require('node:fs');

const WORKFLOW = 'SUB | Deduplicação e Semântica - M360 [ Core Editorial ]';
const START = 'Start Dedup';
const TEMPORAL = 'Validade Temporal v0.1.0';
const SP = 'SP DEDUPLICA EDITORIAL | M360';
const NORMALIZADOR_ANTERIOR = 'Normaliza Deduplica Editorial v0.2.2';
const NORMALIZADOR_ATUAL = 'Normaliza Deduplica Editorial v0.3.0';
const RETORNO = 'Retorno Final';

function falhar(mensagem) {
  throw new Error(mensagem);
}

function node(workflow, nome) {
  return workflow.nodes.find(item => item.name === nome) ?? null;
}

function destinos(workflow, origem) {
  return (workflow.connections[origem]?.main ?? [])
    .flat()
    .map(conexao => conexao.node);
}

function origens(workflow, destino) {
  return Object.keys(workflow.connections)
    .filter(origem => destinos(workflow, origem).includes(destino));
}

function exigirArestaUnica(workflow, origem, destino) {
  const encontrados = destinos(workflow, origem);

  if (encontrados.length !== 1 || encontrados[0] !== destino) {
    falhar(`${origem} deve apontar somente para ${destino}.`);
  }
}

function validarBase(workflow) {
  if (workflow.name !== WORKFLOW) {
    falhar(`Workflow fora do escopo M360: ${workflow.name ?? 'sem nome'}.`);
  }

  if (workflow.active !== false) {
    falhar('O export de checkpoint deve permanecer inativo.');
  }

  if ('pinData' in workflow) {
    falhar('O export não pode conter pinData.');
  }

  if (JSON.stringify(workflow).includes('credentials')) {
    falhar('O export não pode conter credenciais.');
  }

  for (const nome of [START, SP, RETORNO]) {
    if (!node(workflow, nome)) {
      falhar(`Node obrigatório ausente: ${nome}.`);
    }
  }
}

function validarCheckpoint(workflow, checkpoint) {
  validarBase(workflow);
  const temporal = node(workflow, TEMPORAL);
  const normalizadorAnterior = node(workflow, NORMALIZADOR_ANTERIOR);
  const normalizadorAtual = node(workflow, NORMALIZADOR_ATUAL);
  const retorno = node(workflow, RETORNO);

  if (checkpoint === 'M360-T0') {
    if (temporal) falhar(`${TEMPORAL} não deve existir em M360-T0.`);
    if (!normalizadorAnterior) falhar(`${NORMALIZADOR_ANTERIOR} deve existir em M360-T0.`);
    exigirArestaUnica(workflow, START, SP);
    exigirArestaUnica(workflow, SP, NORMALIZADOR_ANTERIOR);
    return;
  }

  if (!temporal) {
    falhar(`${TEMPORAL} deve existir a partir de M360-T1.`);
  }

  const codigoTemporal = temporal.parameters?.jsCode ?? '';
  if (!codigoTemporal.includes("modo: 'OBSERVACAO'") || !codigoTemporal.includes("core_versao: '0.5.0'")) {
    falhar('O node temporal não contém o contrato observacional do Core v0.5.0.');
  }

  if (checkpoint === 'M360-T1') {
    if (!normalizadorAnterior) falhar(`${NORMALIZADOR_ANTERIOR} deve permanecer em M360-T1.`);
    exigirArestaUnica(workflow, START, SP);
    exigirArestaUnica(workflow, SP, NORMALIZADOR_ANTERIOR);

    if (destinos(workflow, TEMPORAL).length > 0 || origens(workflow, TEMPORAL).length > 0) {
      falhar(`${TEMPORAL} deve estar desconectado em M360-T1.`);
    }
    return;
  }

  exigirArestaUnica(workflow, START, TEMPORAL);
  exigirArestaUnica(workflow, TEMPORAL, SP);

  if (checkpoint === 'M360-T2') {
    if (!normalizadorAnterior) falhar(`${NORMALIZADOR_ANTERIOR} deve permanecer em M360-T2.`);
    exigirArestaUnica(workflow, SP, NORMALIZADOR_ANTERIOR);
    return;
  }

  if (!normalizadorAtual) {
    falhar(`${NORMALIZADOR_ATUAL} deve existir a partir de M360-T3.`);
  }
  exigirArestaUnica(workflow, SP, NORMALIZADOR_ATUAL);

  const codigoNormalizador = normalizadorAtual.parameters?.jsCode ?? '';
  if (!codigoNormalizador.includes('validade_temporal') || !codigoNormalizador.includes("'0.5.0'")) {
    falhar('O normalizador v0.3.0 não preserva a auditoria temporal esperada.');
  }

  if (checkpoint === 'M360-T3') {
    if ((retorno.parameters?.jsCode ?? '').includes('validade_temporal')) {
      falhar('Retorno Final não deve ser alterado antes de M360-T4.');
    }
    return;
  }

  if (checkpoint === 'M360-T4') {
    const codigoRetorno = retorno.parameters?.jsCode ?? '';
    if (!codigoRetorno.includes('validade_temporal') || !codigoRetorno.includes("core_versao: '0.5.0'")) {
      falhar('Retorno Final não expõe o contrato temporal do Core v0.5.0.');
    }
    return;
  }

  falhar(`Checkpoint desconhecido: ${checkpoint}.`);
}

if (require.main === module) {
  const [checkpoint, arquivo] = process.argv.slice(2);

  if (!checkpoint || !arquivo) {
    console.error('Uso: node validate-rollout-checkpoint.js M360-T0|M360-T1|M360-T2|M360-T3|M360-T4 export.json');
    process.exit(2);
  }

  try {
    const workflow = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
    validarCheckpoint(workflow, checkpoint);
    console.log(`${checkpoint}: OK — ${workflow.name}`);
  } catch (error) {
    console.error(`${checkpoint}: FALHA — ${error.message}`);
    process.exit(1);
  }
}

module.exports = { validarCheckpoint };
