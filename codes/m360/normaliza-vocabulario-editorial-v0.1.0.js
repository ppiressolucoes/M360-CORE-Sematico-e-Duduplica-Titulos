// ============================================================
// Normaliza Vocabulário Editorial v0.1.0 | M360
// Mode: Run Once for All Items
//
// Entrada: resultado da SP_VOCABULARIO_EDITORIAL('LISTAR', ...).
// Aceita rows individuais ou [rows, metadados] do node MySQL.
// Saída: exatamente um item. Não altera decisão nem rota produtiva.
// Conectar apenas ao ramo de observação nesta etapa.
// ============================================================

const CONFIG = {
  dominio: 'ESPORTE',
  consumidor: 'M360',
  versao: '0.1.0',
  totalEsperado: 72
};

function coletarRows(valor, destino, visitados) {
  if (!valor || typeof valor !== 'object' || visitados.has(valor)) return;
  visitados.add(valor);

  if (Array.isArray(valor)) {
    for (const parte of valor) coletarRows(parte, destino, visitados);
    return;
  }

  if (Object.prototype.hasOwnProperty.call(valor, 'regra_id')) {
    destino.push(valor);
    return;
  }

  for (const parte of Object.values(valor)) {
    if (parte && typeof parte === 'object') {
      coletarRows(parte, destino, visitados);
    }
  }
}

const rows = [];
const visitados = new WeakSet();
for (const item of $input.all()) {
  coletarRows(item.json, rows, visitados);
}

if (rows.length !== CONFIG.totalEsperado) {
  throw new Error(
    `Vocabulário ${CONFIG.dominio}/${CONFIG.consumidor} ` +
    `${CONFIG.versao}: esperadas ${CONFIG.totalEsperado} regras, ` +
    `recebidas ${rows.length}. Não conectar ao fluxo produtivo.`
  );
}

const ids = new Set();
const identidades = new Set();
const regras = rows.map(row => {
  const regraId = Number(row.regra_id);
  const prioridade = Number(row.prioridade);
  const confianca = Number(row.confianca);
  const tipo = String(row.tipo ?? '');
  const expressao = String(row.expressao ?? '').trim();
  const valorCanonico = String(row.valor_canonico ?? '').trim();

  if (
    row.dsc_dominio !== CONFIG.dominio ||
    row.dsc_consumidor !== CONFIG.consumidor ||
    row.versao_vocabulario !== CONFIG.versao ||
    row.tipo_expressao !== 'LITERAL' ||
    Number(row.ativo) !== 1 ||
    !/^[A-Z][A-Z0-9_]{1,39}$/.test(tipo) ||
    !Number.isSafeInteger(regraId) || regraId <= 0 ||
    !Number.isInteger(prioridade) || prioridade < 0 || prioridade > 100 ||
    !Number.isFinite(confianca) || confianca < 0 || confianca > 1 ||
    !expressao || !valorCanonico
  ) {
    throw new Error(`Regra de vocabulário inválida: ${row.regra_id ?? 'sem_id'}`);
  }

  const identidade = JSON.stringify([tipo, expressao, valorCanonico]);
  if (ids.has(regraId) || identidades.has(identidade)) {
    throw new Error(`Regra de vocabulário repetida: ${regraId}`);
  }
  ids.add(regraId);
  identidades.add(identidade);

  return {
    regra_id: regraId,
    tipo,
    tipo_expressao: 'LITERAL',
    expressao,
    valor_canonico: valorCanonico,
    prioridade,
    confianca
  };
});

regras.sort((a, b) => b.prioridade - a.prioridade || a.regra_id - b.regra_id);

const quantidadesPorTipo = {};
for (const regra of regras) {
  quantidadesPorTipo[regra.tipo] = (quantidadesPorTipo[regra.tipo] ?? 0) + 1;
}

return [{
  json: {
    vocabulario_editorial: {
      versao: CONFIG.versao,
      dominio: CONFIG.dominio,
      consumidor: CONFIG.consumidor,
      fonte: 'SP_VOCABULARIO_EDITORIAL/LISTAR',
      modo: 'OBSERVACAO',
      aplicado_automaticamente: false,
      total_regras: regras.length,
      quantidades_por_tipo: quantidadesPorTipo,
      regras
    }
  }
}];
