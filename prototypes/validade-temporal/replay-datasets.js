'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { avaliarValidadeTemporal } = require('./validade-temporal');

const ARQUIVOS_PADRAO = [
  'docs/analises/2026-10-14-m360-alertas-casos.json',
  'docs/analises/2026-10-16-m360-alertas-casos.json',
  'docs/analises/2026-10-20-m360-alertas-casos.json',
  'docs/analises/2026-10-27-m360-alertas-casos.json'
];

const arquivos = process.argv.slice(2).length > 0
  ? process.argv.slice(2)
  : ARQUIVOS_PADRAO;

const contadores = {
  candidatos: 0,
  candidatos_com_data_fonte: 0,
  candidatos_com_expressao_temporal: 0,
  status: {},
  intencoes: {},
  motivos: {}
};
const casosTemporais = [];
const entradas = [];

function incrementar(objeto, chave) {
  objeto[chave] = (objeto[chave] ?? 0) + 1;
}

for (const arquivo of arquivos) {
  const absoluto = path.resolve(arquivo);
  const dataset = JSON.parse(fs.readFileSync(absoluto, 'utf8'));
  const dataAnalise = String(dataset.data_analise ?? '');
  const instanteAvaliacao = /^\d{4}-\d{2}-\d{2}$/.test(dataAnalise)
    ? `${dataAnalise}T12:00:00-03:00`
    : null;

  entradas.push({
    arquivo,
    data_analise_usada_como_instante_de_avaliacao: dataAnalise || null,
    candidatos: Array.isArray(dataset.casos) ? dataset.casos.length : 0
  });

  for (const caso of dataset.casos ?? []) {
    const candidato = caso.candidato ?? {};
    const possuiDataFonte = Boolean(
      candidato.iso_date ?? candidato.isoDate ?? candidato.data
    );
    const resultado = avaliarValidadeTemporal({
      titulo: candidato.titulo,
      contexto: candidato.contexto,
      iso_date: candidato.iso_date ?? candidato.isoDate,
      data: candidato.data,
      instante_avaliacao: instanteAvaliacao,
      timezone: 'America/Sao_Paulo',
      modo: 'OBSERVACAO'
    }).validade_temporal;

    contadores.candidatos += 1;
    contadores.candidatos_com_data_fonte += possuiDataFonte ? 1 : 0;
    contadores.candidatos_com_expressao_temporal += resultado.expressoes.length > 0 ? 1 : 0;
    incrementar(contadores.status, resultado.status);
    incrementar(contadores.intencoes, resultado.intencao);

    for (const motivo of resultado.motivos) {
      incrementar(contadores.motivos, motivo);
    }

    if (resultado.expressoes.length > 0) {
      casosTemporais.push({
        caso_id: caso.caso_id,
        titulo: candidato.titulo,
        status_observado: resultado.status,
        intencao: resultado.intencao,
        expressoes: resultado.expressoes,
        motivos: resultado.motivos
      });
    }
  }
}

const relatorio = {
  schema_version: '1.0',
  prototipo: 'validade-temporal-v0.1.0',
  timezone: 'America/Sao_Paulo',
  politica: 'Datas de análise simulam apenas o instante de avaliação; nenhuma data de fonte é inferida.',
  entradas,
  resumo: contadores,
  casos_com_expressao_temporal: casosTemporais
};

process.stdout.write(`${JSON.stringify(relatorio, null, 2)}\n`);
