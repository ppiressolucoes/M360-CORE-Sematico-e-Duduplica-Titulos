// ============================================================
// Normaliza Vocabulário Editorial v0.2.0 | M360
// Mode: Run Once for All Items
//
// Entrada: SP_VOCABULARIO_EDITORIAL('LISTAR', ...), em rows individuais
// ou no envelope [rows, metadados] do MySQL.
// Saída: exatamente um item, com o mesmo contrato da v0.1.0.
// Permite regras adicionais, mas exige a cobertura mínima da baseline.
// A Similaridade ainda usa os aliases estáticos na decisão produtiva.
// ============================================================

const CONFIG = {
  dominio: 'ESPORTE',
  consumidor: 'M360',
  versao: '0.1.0',
  maximoRegras: 500,
  minimosPorTipo: {
    ALIAS_CLUBE: 30,
    ALIAS_COMPETICAO: 15,
    ALIAS_ORGANIZACAO: 6,
    ALIAS_PESSOA: 20,
    BLOQUEIO_PESSOA: 1
  }
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

const minimoTotal = Object.values(CONFIG.minimosPorTipo)
  .reduce((soma, quantidade) => soma + quantidade, 0);
if (rows.length < minimoTotal || rows.length > CONFIG.maximoRegras) {
  throw new Error(
    `Vocabulário ${CONFIG.dominio}/${CONFIG.consumidor} ${CONFIG.versao}: ` +
    `recebidas ${rows.length} regras; esperado entre ${minimoTotal} e ${CONFIG.maximoRegras}.`
  );
}

const ids = new Set();
const expressoesPorTipo = new Set();
const quantidadesPorTipo = {};
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
    !Object.prototype.hasOwnProperty.call(CONFIG.minimosPorTipo, tipo) ||
    !Number.isSafeInteger(regraId) || regraId <= 0 ||
    !Number.isInteger(prioridade) || prioridade < 0 || prioridade > 100 ||
    !Number.isFinite(confianca) || confianca < 0 || confianca > 1 ||
    !expressao || !valorCanonico
  ) {
    throw new Error(`Regra de vocabulário inválida: ${row.regra_id ?? 'sem_id'}`);
  }

  // Uma expressão literal não pode apontar para dois canônicos do mesmo tipo.
  const identidade = JSON.stringify([tipo, expressao.toLocaleLowerCase('pt-BR')]);
  if (ids.has(regraId) || expressoesPorTipo.has(identidade)) {
    throw new Error(`Regra de vocabulário repetida ou ambígua: ${regraId}`);
  }
  ids.add(regraId);
  expressoesPorTipo.add(identidade);
  quantidadesPorTipo[tipo] = (quantidadesPorTipo[tipo] ?? 0) + 1;

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

for (const [tipo, minimo] of Object.entries(CONFIG.minimosPorTipo)) {
  if ((quantidadesPorTipo[tipo] ?? 0) < minimo) {
    throw new Error(
      `Vocabulário ${CONFIG.dominio}/${CONFIG.consumidor}: ` +
      `cobertura insuficiente em ${tipo}.`
    );
  }
}

regras.sort((a, b) => b.prioridade - a.prioridade || a.regra_id - b.regra_id);

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
