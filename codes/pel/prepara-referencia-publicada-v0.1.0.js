// PEL: Execute uma vez por item, apos retorno do publicador.
// Nao chama WordPress nem grava no banco. Uma saida ligada ao node SQL.
const post = $input.item.json;
const origem = $('Análise Editorial PEL v0.5.1').item.json;
const id = Number(post?.id);
const registro = Number(origem?.registro_id);
const url = typeof post?.link === 'string' ? post.link.trim() : '';
const versao = origem?.analise_editorial_pel?.versao;
if (!Number.isSafeInteger(id) || id <= 0 || post?.status !== 'publish' ||
    !/^https:\/\/energialimpa\.live\//i.test(url) || url.length > 2048 ||
    !Number.isSafeInteger(registro) || registro <= 0 ||
    typeof versao !== 'string' || !versao.trim() || versao.length > 32 ||
    !origem?.candidato || !origem?.duplicidade_editorial || !origem?.analise_editorial_pel) {
  throw new Error('Referencia PEL invalida: publicacao ou dados da analise nao confirmados.');
}
const execucao = String($execution.id ?? '');
if (!execucao || execucao.length > 100) throw new Error('ID de execucao PEL invalido.');
return {json: {
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
}};
