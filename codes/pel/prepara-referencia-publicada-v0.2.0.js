// PEL v0.2.0: Run Once for All Items, apos SP FINALIZA.
// Contrato: um candidato por chamada; a SP pode emitir rows e metadados.
// Nao chama WordPress nem grava no banco. Uma saida ligada ao node SQL.
const posts = $('Chamar Publicar Editorial').all();
const origens = $('Análise Editorial PEL v0.5.1').all();
if (posts.length !== 1 || origens.length !== 1) {
  throw new Error('Referencia PEL exige uma publicacao e uma analise por execucao.');
}
const post = posts[0].json;
const origem = origens[0].json;
const finalizacoes = [];
function coletar(valor) {
  if (!valor || typeof valor !== 'object') return;
  if (Array.isArray(valor)) return valor.forEach(coletar);
  if (valor.resultado === 'FINALIZED' || valor.resultado === 'ALREADY_FINALIZED') {
    finalizacoes.push(valor); return;
  }
  Object.values(valor).forEach(coletar);
}
for (const item of $input.all()) coletar(item.json);
const id = Number(post?.id);
const registro = Number(origem?.registro_id);
const url = typeof post?.link === 'string' ? post.link.trim() : '';
const versao = origem?.analise_editorial_pel?.versao;
if (!Number.isSafeInteger(id) || id <= 0 || post?.status !== 'publish' ||
    !/^https:\/\/energialimpa\.live\//i.test(url) || url.length > 2048 ||
    !Number.isSafeInteger(registro) || registro <= 0 ||
    typeof versao !== 'string' || !versao.trim() || versao.length > 32 ||
    !origem?.candidato || !origem?.duplicidade_editorial || !origem?.analise_editorial_pel ||
    finalizacoes.length !== 1 || Number(finalizacoes[0].registro_id) !== registro ||
    finalizacoes[0].status_final !== 'PUBLICADO') {
  throw new Error('Referencia PEL invalida: publicacao ou dados da analise nao confirmados.');
}
const execucao = String($execution.id ?? '');
if (!execucao || execucao.length > 100) throw new Error('ID de execucao PEL invalido.');
return [{json: {
  portal: 'PEL', registro_id: registro, execucao_id: execucao,
  versao_analise: versao, wp_post_id: id, wp_url: url, wp_status: 'publish',
  dados_json: JSON.stringify({
    candidato: origem.candidato,
    decisao_lexical: origem.duplicidade_editorial,
    analise: origem.analise_editorial_pel,
    vocabulario: {
      versao: origem.vocabulario_editorial?.versao ?? null,
      total_regras: origem.contexto_vocabulario_pel?.total_regras ?? null,
      status: origem.contexto_vocabulario_pel?.status ?? null
    }
  })
}}];
