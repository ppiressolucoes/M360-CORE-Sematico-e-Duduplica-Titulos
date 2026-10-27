'use strict';

const fs = require('node:fs');
const path = require('node:path');

const raiz = path.resolve(__dirname, '..', '..');
const workflowPath = path.join(raiz, 'workflows', 'm360-deduplicacao-semantica.json');
const temporalPath = path.join(raiz, 'codes', 'm360', 'validade-temporal-v0.1.0.js');
const normalizadorPath = path.join(raiz, 'codes', 'm360', 'normaliza-deduplica-editorial-v0.3.0.js');
const retornoPath = path.join(raiz, 'codes', 'm360', 'retorno-final.js');

const temporalNome = 'Validade Temporal v0.1.0';
const normalizadorAnterior = 'Normaliza Deduplica Editorial v0.2.2';
const normalizadorAtual = 'Normaliza Deduplica Editorial v0.3.0';
const spNome = 'SP DEDUPLICA EDITORIAL | M360';

const ler = arquivo => fs.readFileSync(arquivo, 'utf8').trimEnd();
const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

let temporal = workflow.nodes.find(node => node.name === temporalNome);

if (!temporal) {
  temporal = {
    parameters: { jsCode: '' },
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [-400, 48],
    id: '50e8e9db-1c60-4b6b-93f4-6de4fdc4be5f',
    name: temporalNome
  };
  workflow.nodes.push(temporal);
}

temporal.parameters.jsCode = ler(temporalPath);

const start = workflow.nodes.find(node => node.name === 'Start Dedup');
start.position = [-640, 48];

const sticky = workflow.nodes.find(node => node.name === 'Sticky Note1');
sticky.position = [-720, -48];
sticky.parameters.width = 1744;
sticky.parameters.content = [
  '## GESTÃO EDITORIAL DE TÍTULOS | Core v0.5.0',
  'Validade Temporal v0.1.0 em OBSERVAÇÃO (sem bloqueio automático)'
].join('\n');

const normalizador = workflow.nodes.find(
  node => node.name === normalizadorAtual || node.name === normalizadorAnterior
);
normalizador.name = normalizadorAtual;
normalizador.parameters.jsCode = ler(normalizadorPath);

const retorno = workflow.nodes.find(node => node.name === 'Retorno Final');
retorno.parameters.jsCode = ler(retornoPath);

workflow.connections['Start Dedup'] = {
  main: [[{ node: temporalNome, type: 'main', index: 0 }]]
};
workflow.connections[temporalNome] = {
  main: [[{ node: spNome, type: 'main', index: 0 }]]
};
workflow.connections[spNome].main[0][0].node = normalizadorAtual;

if (workflow.connections[normalizadorAnterior]) {
  workflow.connections[normalizadorAtual] = workflow.connections[normalizadorAnterior];
  delete workflow.connections[normalizadorAnterior];
}

workflow.active = false;
fs.writeFileSync(workflowPath, `${JSON.stringify(workflow, null, 2)}\n`);
console.log(path.relative(raiz, workflowPath));
