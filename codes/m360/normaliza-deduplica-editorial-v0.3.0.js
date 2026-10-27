// ============================================================
// CODE | Normaliza Deduplica Editorial v0.3.0
// Core Editorial | M360
//
// Responsabilidades:
// - Normalizar retorno da SP_DEDUPLICA_EDITORIAL
// - Recuperar candidato enriquecido pela Validade Temporal v0.1.0
// - Separar CONTROL x COMPARABLE
// - Preservar source_host_comparavel para análise cross-source
// - Garantir fonte do candidato via fallback para source_host
// - Preservar auditoria temporal em modo OBSERVACAO
// - Entregar 1 único item padronizado ao fluxo semântico
// ============================================================


// ============================================================
// 1. RECUPERA CANDIDATO ENRIQUECIDO DO SUBFLUXO
// ============================================================

let candidatoOriginal = {};

try {
  candidatoOriginal =
    $('Validade Temporal v0.1.0').first().json ?? {};
} catch (error) {

  // Fallback defensivo para replays isolados do node.
  try {
    candidatoOriginal = $('Start Dedup').first().json ?? {};
  } catch (fallbackError) {
    candidatoOriginal = {};
  }
}


// ============================================================
// 2. VALIDA DADOS MÍNIMOS DO CANDIDATO
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
    'CODE | Normaliza Deduplica Editorial v0.3.0: ' +
    'o subfluxo não recebeu o título do candidato no Start Dedup.'
  );
}


if (!linkOriginal) {
  throw new Error(
    'CODE | Normaliza Deduplica Editorial v0.3.0: ' +
    'o subfluxo não recebeu o link do candidato no Start Dedup.'
  );
}


// ============================================================
// 3. FUNÇÃO PARA COLETAR ROWS DA RESPOSTA MYSQL
//
// O node MySQL pode devolver estruturas como:
//
// [
//   [
//     {...},
//     {...}
//   ],
//   {
//     fieldCount: ...
//   }
// ]
//
// ou wrappers intermediários equivalentes.
// ============================================================

function coletarRows(valor, destino) {

  if (valor == null) {
    return;
  }

  if (Array.isArray(valor)) {

    for (const item of valor) {
      coletarRows(item, destino);
    }

    return;
  }

  if (typeof valor !== 'object') {
    return;
  }

  // Consideramos row funcional apenas quando existe row_type.
  if (valor.row_type) {
    destino.push(valor);
    return;
  }

  // Caso algum wrapper contenha estruturas internas.
  for (const chave of Object.keys(valor)) {

    const interno = valor[chave];

    if (
      Array.isArray(interno) ||
      (
        interno &&
        typeof interno === 'object'
      )
    ) {
      coletarRows(interno, destino);
    }
  }
}


// ============================================================
// 4. RECUPERA TODAS AS LINHAS FUNCIONAIS DA SP
// ============================================================

const inputItems = $input.all();

const rows = [];

for (const item of inputItems) {
  coletarRows(item.json, rows);
}


if (rows.length === 0) {

  throw new Error(
    'CODE | Normaliza Deduplica Editorial v0.3.0: ' +
    'nenhuma linha funcional com row_type foi retornada pela SP.'
  );

}


// ============================================================
// 5. LOCALIZA LINHA DE CONTROLE
// ============================================================

const controle = rows.find(
  row =>
    String(row.row_type ?? '').toUpperCase() === 'CONTROL'
);


if (!controle) {

  throw new Error(
    'CODE | Normaliza Deduplica Editorial v0.3.0: ' +
    'linha CONTROL não encontrada no retorno da SP.'
  );

}


// ============================================================
// 6. LOCALIZA LINHAS COMPARÁVEIS
// ============================================================

const linhasComparaveis = rows.filter(
  row =>
    String(row.row_type ?? '').toUpperCase() === 'COMPARABLE'
);


// ============================================================
// 7. NORMALIZA COMPARÁVEIS
//
// v0.2.1:
// - adiciona source_host proveniente de
//   source_host_comparavel
//
// v0.2.2:
// - mantém contrato cross-source homologado
//
// v0.3.0:
// - preserva validade_temporal e core_versao
// ============================================================

const comparaveis = linhasComparaveis.map(row => ({

  legacy_id:
    row.legacy_id != null
      ? Number(row.legacy_id)
      : null,

  titulo:
    row.titulo_comparavel != null
      ? String(row.titulo_comparavel).trim()
      : null,

  categoria:
    row.categoria_comparavel != null
      ? String(row.categoria_comparavel).trim()
      : null,

  data:
    row.data_comparavel ?? null,

  post_id:
    row.post_id_comparavel != null
      ? String(row.post_id_comparavel).trim()
      : null,

  source_host:
    row.source_host_comparavel != null
      ? String(row.source_host_comparavel)
          .trim()
          .toLowerCase()
      : null

}));


// ============================================================
// 8. NORMALIZA SOURCE_HOST DO CANDIDATO
// ============================================================

const sourceHostControle =
  controle.source_host != null
    ? String(controle.source_host)
        .trim()
        .toLowerCase()
    : null;


// ============================================================
// 9. NORMALIZA FONTE DO CANDIDATO
//
// Prioridade:
// 1. candidatoOriginal.fonte
// 2. candidatoOriginal.source
// 3. controle.source_host
//
// Assim, mesmo quando o input original não trouxer "fonte",
// o contrato do candidato permanece preenchido.
// ============================================================

const fonteCandidato = String(
  candidatoOriginal.fonte ??
  candidatoOriginal.source ??
  sourceHostControle ??
  ''
).trim() || null;


// ============================================================
// 10. NORMALIZA CANDIDATO
// ============================================================

const candidato = {

  position:
    candidatoOriginal.position ?? null,

  titulo:
    tituloOriginal,

  link:
    linkOriginal,

  fonte:
    fonteCandidato,

  autores:
    Array.isArray(candidatoOriginal.autores)
      ? candidatoOriginal.autores
      : [],

  data:
    candidatoOriginal.data ?? null,

  iso_date:
    candidatoOriginal.iso_date ??
    candidatoOriginal.isoDate ??
    null,

  thumbnail:
    candidatoOriginal.thumbnail ?? null,

  thumbnail_small:
    candidatoOriginal.thumbnail_small ??
    candidatoOriginal.thumbnailSmall ??
    null,

  termos_encontrados:
    Array.isArray(candidatoOriginal.termos_encontrados)
      ? candidatoOriginal.termos_encontrados
      : [],

  score_tematico:
    candidatoOriginal.score_tematico ?? null,

  idade_horas:
    candidatoOriginal.idade_horas ?? null,

  validade_temporal:
    candidatoOriginal.validade_temporal &&
    typeof candidatoOriginal.validade_temporal === 'object'
      ? candidatoOriginal.validade_temporal
      : null,

  core_versao:
    candidatoOriginal.core_versao ??
    '0.5.0',

  // Preferimos o post_id normalizado retornado pela SP.
  post_id:
    controle.post_id ??
    candidatoOriginal.post_id ??
    null

};


// ============================================================
// 11. NORMALIZA CAMPOS DE CONTROLE
// ============================================================

const registroId =
  controle.registro_id != null
    ? Number(controle.registro_id)
    : null;


const legacyId =
  controle.legacy_id != null
    ? Number(controle.legacy_id)
    : null;


const duplicateExact =
  Number(controle.duplicate_exact ?? 0);


const janelaDias =
  controle.janela_dias != null
    ? Number(controle.janela_dias)
    : null;


// ============================================================
// 12. SAÍDA ÚNICA PADRONIZADA
// ============================================================

return [
  {
    json: {

      resultado:
        controle.resultado ?? null,

      duplicate_exact:
        duplicateExact,

      registro_id:
        registroId,

      legacy_id:
        legacyId,

      titulo_referencia:
        controle.titulo_referencia ?? null,

      portal:
        controle.portal ?? null,

      source_host:
        sourceHostControle,

      post_id:
        controle.post_id ?? null,

      chave_dedup:
        controle.chave_dedup ?? null,

      status_registro:
        controle.status_registro ?? null,

      janela_dias:
        janelaDias,

      core_versao:
        candidatoOriginal.core_versao ??
        '0.5.0',

      validade_temporal:
        candidato.validade_temporal,

      candidato,

      total_comparaveis:
        comparaveis.length,

      comparaveis

    }
  }
];
