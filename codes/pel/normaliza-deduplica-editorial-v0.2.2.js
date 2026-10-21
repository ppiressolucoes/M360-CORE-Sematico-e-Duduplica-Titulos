// ============================================================
// CODE | Normaliza Deduplica Editorial v0.2.2
// Modo: Run Once for All Items
// Core Editorial | PEL
//
// Objetivo:
// - Normalizar o retorno da SP_DEDUPLICA_EDITORIAL
// - Separar CONTROL e COMPARABLE
// - Preservar o candidato ORIGINAL recebido pelo subfluxo
// - Preservar source_host_comparavel para análise cross-source
// - Preencher candidato.fonte usando source_host como fallback
// - Tornar o subfluxo independente do workflow pai
//
// IMPORTANTE:
// - NÃO referencia Loop
// - NÃO referencia nodes do workflow pai
// - A fonte oficial do candidato continua sendo o node "Start Dedup"
// - Quando Start Dedup não informar fonte, utiliza o host
//   normalizado retornado pela SP
// ============================================================


// ============================================================
// 1. CANDIDATO ORIGINAL RECEBIDO PELO SUBFLUXO
// ============================================================

let candidatoOriginal = {};

try {

  candidatoOriginal =
    $('Start Dedup').first().json ?? {};

} catch (error) {

  candidatoOriginal = {};
}


// ============================================================
// 2. VALIDAÇÃO DO CONTRATO DE ENTRADA
// ============================================================

const tituloOriginal = String(
  candidatoOriginal.titulo ??
  candidatoOriginal.title ??
  ''
).trim();


const linkOriginal = String(
  candidatoOriginal.link ??
  candidatoOriginal.url ??
  ''
).trim();


if (!tituloOriginal) {

  throw new Error(
    'Normaliza Deduplica Editorial v0.2.2: ' +
    'o subfluxo não recebeu o título do candidato em Start Dedup.'
  );
}


if (!linkOriginal) {

  throw new Error(
    'Normaliza Deduplica Editorial v0.2.2: ' +
    'o subfluxo não recebeu o link do candidato em Start Dedup.'
  );
}


// ============================================================
// 3. FUNÇÃO RECURSIVA PARA EXTRAIR ROWS FUNCIONAIS
//
// O node MySQL pode retornar diferentes estruturas:
//
// [
//   [
//     { CONTROL },
//     { COMPARABLE },
//     { COMPARABLE }
//   ],
//   {
//     fieldCount,
//     affectedRows,
//     ...
//   }
// ]
//
// Também podem existir wrappers intermediários.
//
// Consideramos row funcional somente quando existe row_type.
// ============================================================

function coletarRows(valor, destino) {

  if (valor == null) {
    return;
  }


  // ----------------------------------------------------------
// ARRAY
// ----------------------------------------------------------

  if (Array.isArray(valor)) {

    for (const item of valor) {
      coletarRows(item, destino);
    }

    return;
  }


  // ----------------------------------------------------------
// TIPOS PRIMITIVOS
// ----------------------------------------------------------

  if (typeof valor !== 'object') {
    return;
  }


  // ----------------------------------------------------------
// ROW FUNCIONAL
// ----------------------------------------------------------

  if (valor.row_type) {

    destino.push(valor);

    return;
  }


  // ----------------------------------------------------------
// OBJETOS / WRAPPERS INTERMEDIÁRIOS
// ----------------------------------------------------------

  for (const chave of Object.keys(valor)) {

    const interno = valor[chave];

    if (
      Array.isArray(interno) ||
      (
        interno &&
        typeof interno === 'object'
      )
    ) {

      coletarRows(
        interno,
        destino
      );
    }
  }
}


// ============================================================
// 4. RECUPERA TODAS AS LINHAS FUNCIONAIS DA SP
// ============================================================

const inputItems =
  $input.all();


const rows = [];


for (const item of inputItems) {

  coletarRows(
    item.json,
    rows
  );
}


// ============================================================
// 5. VALIDA RESULT SET
// ============================================================

if (rows.length === 0) {

  throw new Error(
    'Normaliza Deduplica Editorial v0.2.2: ' +
    'nenhum result set funcional com row_type foi retornado ' +
    'pela SP_DEDUPLICA_EDITORIAL.'
  );
}


// ============================================================
// 6. LOCALIZA LINHA CONTROL
// ============================================================

const controle =
  rows.find(
    row =>
      String(
        row.row_type ??
        ''
      ).toUpperCase()
      === 'CONTROL'
  );


if (!controle) {

  throw new Error(
    'Normaliza Deduplica Editorial v0.2.2: ' +
    'linha CONTROL não encontrada.'
  );
}


// ============================================================
// 7. LOCALIZA LINHAS COMPARABLE
// ============================================================

const linhasComparaveis =
  rows.filter(
    row =>
      String(
        row.row_type ??
        ''
      ).toUpperCase()
      === 'COMPARABLE'
  );


// ============================================================
// 8. NORMALIZA COMPARÁVEIS
//
// Evolução v0.2.2:
// - mantém contrato anterior
// - adiciona source_host proveniente de
//   source_host_comparavel
// - prepara base para Similaridade Editorial cross-source
// ============================================================

const comparaveis =
  linhasComparaveis

    .map(row => ({

      legacy_id:
        row.legacy_id != null
          ? Number(row.legacy_id)
          : null,

      titulo:
        row.titulo_comparavel != null
          ? String(
              row.titulo_comparavel
            ).trim()
          : null,

      categoria:
        row.categoria_comparavel != null
          ? String(
              row.categoria_comparavel
            ).trim()
          : null,

      data:
        row.data_comparavel ??
        null,

      post_id:
        row.post_id_comparavel != null
          ? String(
              row.post_id_comparavel
            ).trim()
          : null,

      source_host:
        row.source_host_comparavel != null
          ? String(
              row.source_host_comparavel
            )
              .trim()
              .toLowerCase()
          : null

    }))

    .filter(
      row =>
        row.titulo &&
        String(
          row.titulo
        ).trim() !== ''
    );


// ============================================================
// 9. NORMALIZA SOURCE_HOST DO CANDIDATO
// ============================================================

const sourceHostControle =
  controle.source_host != null
    ? String(
        controle.source_host
      )
        .trim()
        .toLowerCase()
    : null;


// ============================================================
// 10. NORMALIZA FONTE DO CANDIDATO
//
// Prioridade:
//
// 1. candidatoOriginal.fonte
// 2. candidatoOriginal.source
// 3. source_host retornado pela SP
//
// Dessa forma, candidato.fonte não fica vazio quando a
// origem puder ser determinada pela URL do candidato.
// ============================================================

const fonteCandidato =
  String(
    candidatoOriginal.fonte ??
    candidatoOriginal.source ??
    sourceHostControle ??
    ''
  ).trim() || null;


// ============================================================
// 11. CANDIDATO NORMALIZADO
// ============================================================

const candidato = {

  position:
    candidatoOriginal.position ??
    null,

  titulo:
    tituloOriginal,

  link:
    linkOriginal,

  fonte:
    fonteCandidato,

  autores:
    Array.isArray(
      candidatoOriginal.autores
    )
      ? candidatoOriginal.autores
      : [],

  data:
    candidatoOriginal.data ??
    null,

  iso_date:
    candidatoOriginal.iso_date ??
    candidatoOriginal.isoDate ??
    null,

  thumbnail:
    candidatoOriginal.thumbnail ??
    null,

  thumbnail_small:
    candidatoOriginal.thumbnail_small ??
    candidatoOriginal.thumbnailSmall ??
    null,

  termos_encontrados:
    Array.isArray(
      candidatoOriginal.termos_encontrados
    )
      ? candidatoOriginal.termos_encontrados
      : [],

  score_tematico:
    candidatoOriginal.score_tematico ??
    null,

  idade_horas:
    candidatoOriginal.idade_horas ??
    null,

  // ----------------------------------------------------------
  // Usa o POST_ID normalizado retornado pela SP
  // como referência oficial.
  // ----------------------------------------------------------

  post_id:
    controle.post_id ??
    candidatoOriginal.post_id ??
    null
};


// ============================================================
// 12. NORMALIZA CAMPOS NUMÉRICOS / OPERACIONAIS
// ============================================================

const registroId =
  controle.registro_id != null
    ? Number(
        controle.registro_id
      )
    : null;


const legacyId =
  controle.legacy_id != null
    ? Number(
        controle.legacy_id
      )
    : null;


const duplicateExact =
  Number(
    controle.duplicate_exact ??
    0
  );


const janelaDias =
  controle.janela_dias != null
    ? Number(
        controle.janela_dias
      )
    : 7;


// ============================================================
// 13. SAÍDA NORMALIZADA
// ============================================================

return [
  {
    json: {

      // --------------------------------------------------------
      // Resultado funcional da SP
      // --------------------------------------------------------

      resultado:
        controle.resultado ??
        null,

      duplicate_exact:
        duplicateExact,


      // --------------------------------------------------------
      // Controle operacional
      // --------------------------------------------------------

      registro_id:
        registroId,

      legacy_id:
        legacyId,

      titulo_referencia:
        controle.titulo_referencia ??
        null,

      portal:
        controle.portal ??
        null,

      source_host:
        sourceHostControle,

      post_id:
        controle.post_id ??
        null,

      chave_dedup:
        controle.chave_dedup ??
        null,

      status_registro:
        controle.status_registro ??
        null,

      janela_dias:
        janelaDias,


      // --------------------------------------------------------
      // Candidato original preservado e enriquecido
      // --------------------------------------------------------

      candidato,


      // --------------------------------------------------------
      // Base semântica cross-source
      // --------------------------------------------------------

      total_comparaveis:
        comparaveis.length,

      comparaveis
    }
  }
];