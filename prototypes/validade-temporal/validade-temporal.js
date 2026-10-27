'use strict';

const VERSAO = '0.1.0';
const TIMEZONE_PADRAO = 'America/Sao_Paulo';

const MESES = new Map([
  ['janeiro', 1],
  ['fevereiro', 2],
  ['marco', 3],
  ['abril', 4],
  ['maio', 5],
  ['junho', 6],
  ['julho', 7],
  ['agosto', 8],
  ['setembro', 9],
  ['outubro', 10],
  ['novembro', 11],
  ['dezembro', 12]
]);

const DIAS_SEMANA = [
  { nome: 'domingo', indice: 0, regex: /\bdomingo\b/ },
  { nome: 'segunda-feira', indice: 1, regex: /\bsegunda(?: feira)?\b/ },
  { nome: 'terça-feira', indice: 2, regex: /\bterca(?: feira)?\b/ },
  { nome: 'quarta-feira', indice: 3, regex: /\bquarta(?: feira)?\b/ },
  { nome: 'quinta-feira', indice: 4, regex: /\bquinta(?: feira)?\b/ },
  { nome: 'sexta-feira', indice: 5, regex: /\bsexta(?: feira)?\b/ },
  { nome: 'sábado', indice: 6, regex: /\bsabado\b/ }
];

function normalizarTexto(valor) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9/\s-]/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function criarDataCalendario(chave) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(chave ?? '');

  if (!match) {
    return null;
  }

  const data = new Date(Date.UTC(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3])
  ));

  if (
    data.getUTCFullYear() !== Number(match[1]) ||
    data.getUTCMonth() !== Number(match[2]) - 1 ||
    data.getUTCDate() !== Number(match[3])
  ) {
    return null;
  }

  return data;
}

function formatarDataCalendario(data) {
  return [
    String(data.getUTCFullYear()).padStart(4, '0'),
    String(data.getUTCMonth() + 1).padStart(2, '0'),
    String(data.getUTCDate()).padStart(2, '0')
  ].join('-');
}

function adicionarDias(chave, quantidade) {
  const data = criarDataCalendario(chave);

  if (!data) {
    return null;
  }

  data.setUTCDate(data.getUTCDate() + quantidade);
  return formatarDataCalendario(data);
}

function dataNoTimezone(valor, timezone) {
  const data = valor instanceof Date ? valor : new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return null;
  }

  let partes;

  try {
    partes = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(data);
  } catch (error) {
    return null;
  }

  const obter = tipo => partes.find(parte => parte.type === tipo)?.value;
  return `${obter('year')}-${obter('month')}-${obter('day')}`;
}

function interpretarData(valor, timezone) {
  if (valor == null || String(valor).trim() === '') {
    return null;
  }

  const texto = String(valor).trim();
  const isoData = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);

  if (isoData) {
    const chave = `${isoData[1]}-${isoData[2]}-${isoData[3]}`;
    return criarDataCalendario(chave) ? chave : null;
  }

  const brasileira = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(texto);

  if (brasileira) {
    const chave = [
      brasileira[3],
      brasileira[2].padStart(2, '0'),
      brasileira[1].padStart(2, '0')
    ].join('-');

    return criarDataCalendario(chave) ? chave : null;
  }

  return dataNoTimezone(texto, timezone);
}

function obterReferenciaConteudo(entrada, timezone) {
  const fontes = [
    { origem: 'iso_date', valor: entrada.iso_date ?? entrada.isoDate, confianca: 1 },
    { origem: 'data', valor: entrada.data, confianca: 0.8 }
  ];

  for (const fonte of fontes) {
    const data = interpretarData(fonte.valor, timezone);

    if (data) {
      return {
        valor: String(fonte.valor),
        data,
        origem: fonte.origem,
        confianca: fonte.confianca
      };
    }
  }

  return null;
}

function resolverDiaSemana(dataReferencia, indiceAlvo) {
  const referencia = criarDataCalendario(dataReferencia);

  if (!referencia) {
    return null;
  }

  let diferenca = indiceAlvo - referencia.getUTCDay();

  if (diferenca > 3) {
    diferenca -= 7;
  } else if (diferenca < -3) {
    diferenca += 7;
  }

  return adicionarDias(dataReferencia, diferenca);
}

function detectarIntencao(texto) {
  const resultado = /\b(resultado|placar|vence|venceu|derrotado|derrotou|goleado|goleou|empatou|eliminado|eliminada|classificado|classificada|garante vaga|melhores momentos|penaltis|pos jogo|repercussao|apos o jogo|depois do jogo|ousted|eliminated|wins|won|highlights|penalties)\b/;
  const servico = /\b(onde assistir|horarios?|agenda|pre jogo|provaveis? escalacoes?|jogos? de hoje|transmissao|joga|enfrenta|duelo|partida)\b/;

  if (resultado.test(texto)) {
    return 'RESULTADO';
  }

  if (servico.test(texto)) {
    return 'SERVICO_PRE_EVENTO';
  }

  return 'INDETERMINADA';
}

function detectarExpressoes(texto, referencia) {
  const expressoes = [];
  let possuiNaoResolvida = false;

  const relativas = [
    { texto: 'ontem', deslocamento: -1, regex: /\bontem\b/g },
    { texto: 'hoje', deslocamento: 0, regex: /\bhoje\b/g },
    { texto: 'amanhã', deslocamento: 1, regex: /\bamanha\b/g }
  ];

  for (const relativa of relativas) {
    if (!relativa.regex.test(texto)) {
      continue;
    }

    const resolvida = referencia
      ? adicionarDias(referencia.data, relativa.deslocamento)
      : null;

    expressoes.push({
      texto: relativa.texto,
      data_resolvida: resolvida,
      regra: 'RELATIVA_A_DATA_DO_CONTEUDO',
      confianca: resolvida ? referencia.confianca : 0
    });

    possuiNaoResolvida ||= !resolvida;
  }

  for (const dia of DIAS_SEMANA) {
    if (!dia.regex.test(texto)) {
      continue;
    }

    const resolvida = referencia
      ? resolverDiaSemana(referencia.data, dia.indice)
      : null;

    expressoes.push({
      texto: dia.nome,
      data_resolvida: resolvida,
      regra: 'DIA_DA_SEMANA_MAIS_PROXIMO_DA_FONTE',
      confianca: resolvida ? Math.min(referencia.confianca, 0.85) : 0
    });

    possuiNaoResolvida ||= !resolvida;
  }

  const datasExplicitas = texto.matchAll(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/g);

  for (const match of datasExplicitas) {
    let ano = match[3] ? Number(match[3]) : null;

    if (ano != null && ano < 100) {
      ano += 2000;
    }

    if (ano == null && referencia) {
      ano = Number(referencia.data.slice(0, 4));
    }

    const chave = ano == null
      ? null
      : `${String(ano).padStart(4, '0')}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
    const resolvida = chave && criarDataCalendario(chave) ? chave : null;

    expressoes.push({
      texto: match[0],
      data_resolvida: resolvida,
      regra: match[3] ? 'DATA_EXPLICITA' : 'DATA_SEM_ANO_ANCORADA_NA_FONTE',
      confianca: resolvida ? (match[3] ? 1 : referencia?.confianca ?? 0) : 0
    });

    possuiNaoResolvida ||= !resolvida;
  }

  const nomesMeses = [...MESES.keys()].join('|');
  const datasPorExtenso = texto.matchAll(
    new RegExp(`\\b(\\d{1,2}) de (${nomesMeses})(?: de (\\d{4}))?\\b`, 'g')
  );

  for (const match of datasPorExtenso) {
    const ano = match[3]
      ? Number(match[3])
      : referencia
        ? Number(referencia.data.slice(0, 4))
        : null;
    const mes = MESES.get(match[2]);
    const chave = ano == null
      ? null
      : `${String(ano).padStart(4, '0')}-${String(mes).padStart(2, '0')}-${match[1].padStart(2, '0')}`;
    const resolvida = chave && criarDataCalendario(chave) ? chave : null;

    expressoes.push({
      texto: match[0],
      data_resolvida: resolvida,
      regra: match[3] ? 'DATA_POR_EXTENSO_EXPLICITA' : 'DATA_POR_EXTENSO_ANCORADA_NA_FONTE',
      confianca: resolvida ? (match[3] ? 1 : referencia?.confianca ?? 0) : 0
    });

    possuiNaoResolvida ||= !resolvida;
  }

  return { expressoes, possuiNaoResolvida };
}

function obterOffset(dataCalendario, timezone) {
  const instanteAproximado = new Date(`${dataCalendario}T12:00:00Z`);

  try {
    const partes = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'longOffset'
    }).formatToParts(instanteAproximado);
    const nome = partes.find(parte => parte.type === 'timeZoneName')?.value ?? 'GMT';

    if (nome === 'GMT' || nome === 'UTC') {
      return '+00:00';
    }

    const match = /^GMT([+-]\d{2}:\d{2})$/.exec(nome);
    return match?.[1] ?? '';
  } catch (error) {
    return '';
  }
}

function criarEvento(datas, timezone) {
  if (datas.length !== 1) {
    return {
      datas,
      precisao: 'DIA',
      timezone
    };
  }

  const data = datas[0];
  const offset = obterOffset(data, timezone);

  return {
    inicio: `${data}T00:00:00${offset}`,
    fim: `${data}T23:59:59${offset}`,
    precisao: 'DIA',
    timezone
  };
}

function limitarConfianca(valor) {
  return Number(Math.max(0, Math.min(1, valor)).toFixed(2));
}

function avaliarValidadeTemporal(entrada = {}) {
  const timezone = entrada.timezone ?? TIMEZONE_PADRAO;
  const modo = entrada.modo ?? 'OBSERVACAO';
  const instanteAvaliacao = entrada.instante_avaliacao ?? entrada.instanteAvaliacao ?? null;
  const dataAvaliacao = instanteAvaliacao
    ? dataNoTimezone(instanteAvaliacao, timezone)
    : null;
  const referencia = obterReferenciaConteudo(entrada, timezone);
  const texto = normalizarTexto(`${entrada.titulo ?? entrada.title ?? ''} ${entrada.contexto ?? ''}`);
  const intencao = detectarIntencao(texto);
  const deteccao = detectarExpressoes(texto, referencia);
  const datas = [...new Set(
    deteccao.expressoes
      .map(expressao => expressao.data_resolvida)
      .filter(Boolean)
  )].sort();

  let status = 'INDETERMINADO';
  let confianca = 0;
  const motivos = [];

  if (!dataAvaliacao) {
    motivos.push('INSTANTE_AVALIACAO_AUSENTE_OU_INVALIDO');
  } else if (intencao === 'RESULTADO') {
    status = 'VALIDO';
    confianca = 0.9;
    motivos.push('CONTEUDO_POS_EVENTO');
  } else if (deteccao.possuiNaoResolvida) {
    motivos.push('REFERENCIA_TEMPORAL_SEM_ANCORA_CONFIAVEL');
  } else if (datas.length === 0) {
    if (intencao === 'SERVICO_PRE_EVENTO') {
      motivos.push('SERVICO_PRE_EVENTO_SEM_DATA_RESOLVIDA');
    } else {
      status = 'VALIDO';
      confianca = 0.7;
      motivos.push('SEM_RESTRICAO_TEMPORAL_DETECTADA');
    }
  } else if (intencao !== 'SERVICO_PRE_EVENTO') {
    motivos.push('INTENCAO_EDITORIAL_INDETERMINADA');
  } else {
    const passadas = datas.filter(data => data < dataAvaliacao);
    const atuaisOuFuturas = datas.filter(data => data >= dataAvaliacao);

    if (passadas.length > 0 && atuaisOuFuturas.length > 0) {
      motivos.push('JANELA_TEMPORAL_MISTA');
    } else if (passadas.length === datas.length) {
      status = 'EXPIRADO';
      confianca = Math.min(...deteccao.expressoes.map(expressao => expressao.confianca));
      motivos.push('EVENTO_ANTES_DA_AVALIACAO');
    } else {
      status = 'VALIDO';
      confianca = Math.min(...deteccao.expressoes.map(expressao => expressao.confianca));
      motivos.push(datas.includes(dataAvaliacao) ? 'EVENTO_NO_DIA_DA_AVALIACAO' : 'EVENTO_FUTURO');
    }
  }

  if (
    datas.length === 1 &&
    deteccao.expressoes.filter(expressao => expressao.data_resolvida === datas[0]).length > 1
  ) {
    motivos.push('REFERENCIAS_TEMPORAIS_CONCORDANTES');
    confianca = Math.max(confianca, 0.85);
  }

  return {
    validade_temporal: {
      versao: VERSAO,
      modo,
      timezone,
      instante_avaliacao: instanteAvaliacao,
      referencia_conteudo: referencia
        ? {
            valor: referencia.valor,
            origem: referencia.origem,
            data: referencia.data,
            confianca: referencia.confianca
          }
        : null,
      expressoes: deteccao.expressoes,
      evento: datas.length > 0 ? criarEvento(datas, timezone) : null,
      intencao,
      status,
      confianca: limitarConfianca(confianca),
      motivos,
      aplicado_automaticamente: false
    }
  };
}

module.exports = {
  avaliarValidadeTemporal
};
