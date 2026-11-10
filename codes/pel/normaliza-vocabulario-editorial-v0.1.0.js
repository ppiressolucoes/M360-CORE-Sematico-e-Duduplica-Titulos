// n8n: Run Once for All Items. Uma saida mesmo sem regras.
const rows = [];
const vistos = new WeakSet();
function coletar(valor) {
  if (!valor || typeof valor !== 'object' || vistos.has(valor)) return;
  vistos.add(valor);
  if (Array.isArray(valor)) return valor.forEach(coletar);
  if (Object.prototype.hasOwnProperty.call(valor, 'regra_id')) { rows.push(valor); return; }
  Object.values(valor).forEach(coletar);
}
for (const item of $input.all()) coletar(item.json);
const ids = new Set();
const expressoes = new Set();
let erro = null;
const regras = [];
for (const r of rows) {
  const id = Number(r.regra_id), prioridade = Number(r.prioridade), confianca = Number(r.confianca);
  const expressao = String(r.expressao ?? '').trim();
  const canonico = String(r.valor_canonico ?? '').trim();
  const chave = expressao.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (r.dsc_dominio !== 'ENERGIA_LIMPA' || r.dsc_consumidor !== 'PEL' ||
      r.versao_vocabulario !== '0.1.0' || r.tipo !== 'FACETA_EDITORIAL' ||
      r.tipo_expressao !== 'LITERAL' || Number(r.ativo) !== 1 ||
      !Number.isSafeInteger(id) || id <= 0 || ids.has(id) || expressoes.has(chave) ||
      !expressao || !/^[A-Z][A-Z0-9_]*$/.test(canonico) ||
      !Number.isInteger(prioridade) || prioridade < 0 || prioridade > 100 ||
      !Number.isFinite(confianca) || confianca < 0 || confianca > 1) {
    erro = 'REGRA_INVALIDA_OU_AMBIGUA'; break;
  }
  ids.add(id); expressoes.add(chave);
  regras.push({regra_id: id, expressao, valor_canonico: canonico, prioridade, confianca});
}
if (rows.length > 500) erro = 'LIMITE_DE_REGRAS_EXCEDIDO';
return [{json: {vocabulario_editorial: {
  dominio: 'ENERGIA_LIMPA', consumidor: 'PEL', versao: '0.1.0',
  status: erro || (regras.length ? 'CARREGADO' : 'VAZIO'),
  modo: 'OBSERVACAO', total_regras: erro ? 0 : regras.length,
  regras: erro ? [] : regras
}}}];
