// ============================================================
// CODE | Consenso Editorial v0.1.0
// Modo: Run Once for All Items
//
// Objetivo:
// - Gerar insumos analíticos para alertas de SUSPEITO
// - NÃO alterar a decisão funcional do Core
// - NÃO alterar roteamento
// - Avaliar convergência entre TOP matches
// - Identificar consenso multifonte
//
// Fonte oficial:
// $('Similaridade Editorial v0.4.0').first().json
//
// Fase atual:
// HOMOLOGAÇÃO ANALÍTICA
// ============================================================


// ============================================================
// 1. RECUPERA RESULTADO DA SIMILARIDADE
// ============================================================

let origem = {};

try {

  origem =
    $('Similaridade Editorial v0.4.0')
      .first()
      .json ?? {};

} catch (error) {

  throw new Error(
    'Consenso Editorial v0.1.0: ' +
    'não foi possível recuperar a saída de ' +
    'Similaridade Editorial v0.4.0.'
  );
}


// ============================================================
// 2. CONTRATOS
// ============================================================

const duplicidade =
  origem.duplicidade_editorial &&
  typeof origem.duplicidade_editorial === 'object'
    ? origem.duplicidade_editorial
    : {};

const topMatches =
  Array.isArray(duplicidade.top_matches)
    ? duplicidade.top_matches
    : [];


// ============================================================
// 3. CONFIGURAÇÃO ANALÍTICA
//
// IMPORTANTE:
// Esta configuração NÃO decide o fluxo.
// Apenas gera hipótese/sugestão para auditoria.
// ============================================================

const CONFIG = {

  versao:
    '0.1.0',

  modo:
    'HOMOLOGACAO_ANALITICA',

  // Regra de consenso forte
  consensoForte: {

    scoreTop1Min:
      0.70,

    scoreTop2Min:
      0.70,

    tokensTop1Min:
      5,

    coberturaTop1Min:
      0.80,

    exigirFontesDistintas:
      true

  },

  // Regra de consenso moderado
  consensoModerado: {

    scoreTop1Min:
      0.62,

    scoreTop2Min:
      0.55,

    tokensTop1Min:
      4,

    coberturaTop1Min:
      0.65

  }

};


// ============================================================
// 4. HELPERS
// ============================================================

function numero(valor, fallback = 0) {

  const n =
    Number(valor);

  return Number.isFinite(n)
    ? n
    : fallback;
}


function percentual(valor) {

  return Number(
    (
      numero(valor) * 100
    ).toFixed(2)
  );
}


function getScore(match) {

  return numero(
    match?.metricas?.score_composto
  );
}


function getPercentual(match) {

  const p =
    match?.metricas?.percentual;

  if (
    p !== null &&
    p !== undefined &&
    Number.isFinite(Number(p))
  ) {

    return Number(p);
  }

  return percentual(
    getScore(match)
  );
}


function getTokensComuns(match) {

  return numero(
    match?.metricas?.tokens_comuns
  );
}


function getCobertura(match) {

  return numero(
    match
      ?.metricas
      ?.cobertura_titulo_menor
  );
}


function getOrigem(match) {

  return String(
    match?.origem ??
    ''
  )
    .trim()
    .toLowerCase() || null;
}


// ============================================================
// 5. TOP 1 / TOP 2 / TOP 3
// ============================================================

const top1 =
  topMatches[0] ?? null;

const top2 =
  topMatches[1] ?? null;

const top3 =
  topMatches[2] ?? null;


// ============================================================
// 6. MÉTRICAS DERIVADAS
// ============================================================

const scoreTop1 =
  getScore(top1);

const scoreTop2 =
  getScore(top2);

const scoreTop3 =
  getScore(top3);


const percentualTop1 =
  getPercentual(top1);

const percentualTop2 =
  getPercentual(top2);

const percentualTop3 =
  getPercentual(top3);


const tokensTop1 =
  getTokensComuns(top1);

const tokensTop2 =
  getTokensComuns(top2);

const tokensTop3 =
  getTokensComuns(top3);


const coberturaTop1 =
  getCobertura(top1);

const coberturaTop2 =
  getCobertura(top2);

const coberturaTop3 =
  getCobertura(top3);


const origemTop1 =
  getOrigem(top1);

const origemTop2 =
  getOrigem(top2);

const origemTop3 =
  getOrigem(top3);


// ============================================================
// 7. DIVERSIDADE DE FONTES
// ============================================================

const fontesTop3 =
  [
    origemTop1,
    origemTop2,
    origemTop3
  ]
    .filter(Boolean);


const fontesDistintas =
  [
    ...new Set(
      fontesTop3
    )
  ];


const totalFontesDistintas =
  fontesDistintas.length;


const top1Top2FontesDistintas =
  Boolean(
    origemTop1 &&
    origemTop2 &&
    origemTop1 !== origemTop2
  );


// ============================================================
// 8. GAP TOP1 x TOP2
// ============================================================

const gapTop1Top2 =
  Math.max(
    0,
    scoreTop1 - scoreTop2
  );


const percentualGapTop1Top2 =
  Number(
    (
      gapTop1Top2 * 100
    ).toFixed(2)
  );


// ============================================================
// 9. REGRA DE CONSENSO FORTE
// ============================================================

const regraForte =
  (
    scoreTop1 >=
      CONFIG.consensoForte.scoreTop1Min
  )
  &&
  (
    scoreTop2 >=
      CONFIG.consensoForte.scoreTop2Min
  )
  &&
  (
    tokensTop1 >=
      CONFIG.consensoForte.tokensTop1Min
  )
  &&
  (
    coberturaTop1 >=
      CONFIG.consensoForte.coberturaTop1Min
  )
  &&
  (
    !CONFIG.consensoForte.exigirFontesDistintas
    ||
    top1Top2FontesDistintas
  );


// ============================================================
// 10. REGRA DE CONSENSO MODERADO
// ============================================================

const regraModerada =
  (
    scoreTop1 >=
      CONFIG.consensoModerado.scoreTop1Min
  )
  &&
  (
    scoreTop2 >=
      CONFIG.consensoModerado.scoreTop2Min
  )
  &&
  (
    tokensTop1 >=
      CONFIG.consensoModerado.tokensTop1Min
  )
  &&
  (
    coberturaTop1 >=
      CONFIG.consensoModerado.coberturaTop1Min
  );


// ============================================================
// 11. CLASSIFICAÇÃO ANALÍTICA
//
// IMPORTANTE:
// Isso NÃO substitui:
// duplicidade_editorial.status
// ============================================================

let nivelConsenso =
  'BAIXO';

let statusSugerido =
  'SUSPEITO';

let motivo =
  'SEM_CONSENSO_FORTE';


if (regraForte) {

  nivelConsenso =
    'FORTE';

  statusSugerido =
    'DUPLICADO';

  motivo =
    'CONSENSO_MULTIFONTE_FORTE';

} else if (regraModerada) {

  nivelConsenso =
    'MODERADO';

  statusSugerido =
    'SUSPEITO';

  motivo =
    'CONSENSO_SEMANTICO_MODERADO';

}


// ============================================================
// 12. SINAIS ANALÍTICOS
// ============================================================

const sinais = {

  dois_matches_acima_70:
    (
      scoreTop1 >= 0.70 &&
      scoreTop2 >= 0.70
    ),

  cinco_tokens_top1:
    tokensTop1 >= 5,

  cobertura_top1_acima_80:
    coberturaTop1 >= 0.80,

  fontes_top1_top2_distintas:
    top1Top2FontesDistintas,

  tres_fontes_distintas_top3:
    totalFontesDistintas >= 3,

  gap_top1_top2_baixo:
    gapTop1Top2 <= 0.05,

  top3_ainda_relevante:
    scoreTop3 >= 0.55

};


// ============================================================
// 13. RESUMO TEXTUAL
// ============================================================

let resumo =
  'Similaridade relevante, mas sem consenso multifonte forte.';


if (
  nivelConsenso === 'FORTE'
) {

  resumo =
    'Há forte convergência semântica entre múltiplas fontes. ' +
    'O caso é forte candidato a duplicidade editorial real.';

} else if (
  nivelConsenso === 'MODERADO'
) {

  resumo =
    'Há convergência semântica moderada entre os melhores matches. ' +
    'Recomenda-se revisão editorial.';

}


// ============================================================
// 14. SAÍDA
//
// Mantemos TODO o JSON da Similaridade.
// Apenas adicionamos consenso_editorial.
// ============================================================

return [
  {
    json: {

      ...origem,

      consenso_editorial: {

        versao:
          CONFIG.versao,

        modo:
          CONFIG.modo,

        aplicado_automaticamente:
          false,

        altera_status_core:
          false,

        status_original:
          duplicidade.status ?? null,

        status_sugerido:
          statusSugerido,

        nivel:
          nivelConsenso,

        motivo,

        resumo,


        // ------------------------------------------------------
        // TOP 1
        // ------------------------------------------------------

        top1: {

          id:
            top1?.id ?? null,

          titulo:
            top1?.titulo ?? null,

          origem:
            origemTop1,

          score:
            scoreTop1,

          percentual:
            percentualTop1,

          tokens_comuns:
            tokensTop1,

          cobertura:
            coberturaTop1,

          cobertura_percentual:
            percentual(
              coberturaTop1
            )

        },


        // ------------------------------------------------------
        // TOP 2
        // ------------------------------------------------------

        top2: {

          id:
            top2?.id ?? null,

          titulo:
            top2?.titulo ?? null,

          origem:
            origemTop2,

          score:
            scoreTop2,

          percentual:
            percentualTop2,

          tokens_comuns:
            tokensTop2,

          cobertura:
            coberturaTop2,

          cobertura_percentual:
            percentual(
              coberturaTop2
            )

        },


        // ------------------------------------------------------
        // TOP 3
        // ------------------------------------------------------

        top3: {

          id:
            top3?.id ?? null,

          titulo:
            top3?.titulo ?? null,

          origem:
            origemTop3,

          score:
            scoreTop3,

          percentual:
            percentualTop3,

          tokens_comuns:
            tokensTop3,

          cobertura:
            coberturaTop3,

          cobertura_percentual:
            percentual(
              coberturaTop3
            )

        },


        // ------------------------------------------------------
        // CONSENSO
        // ------------------------------------------------------

        consenso: {

          multifonte:
            totalFontesDistintas >= 2,

          fontes_top1_top2_distintas:
            top1Top2FontesDistintas,

          total_fontes_distintas_top3:
            totalFontesDistintas,

          fontes_distintas_top3:
            fontesDistintas,

          gap_top1_top2:
            Number(
              gapTop1Top2.toFixed(4)
            ),

          percentual_gap_top1_top2:
            percentualGapTop1Top2

        },


        // ------------------------------------------------------
        // SINAIS
        // ------------------------------------------------------

        sinais,


        // ------------------------------------------------------
        // REGRAS AUDITADAS
        // ------------------------------------------------------

        regras: {

          consenso_forte: {

            atingido:
              regraForte,

            score_top1_min:
              CONFIG.consensoForte.scoreTop1Min,

            score_top2_min:
              CONFIG.consensoForte.scoreTop2Min,

            tokens_top1_min:
              CONFIG.consensoForte.tokensTop1Min,

            cobertura_top1_min:
              CONFIG.consensoForte.coberturaTop1Min,

            exigir_fontes_distintas:
              CONFIG.consensoForte.exigirFontesDistintas

          },

          consenso_moderado: {

            atingido:
              regraModerada,

            score_top1_min:
              CONFIG.consensoModerado.scoreTop1Min,

            score_top2_min:
              CONFIG.consensoModerado.scoreTop2Min,

            tokens_top1_min:
              CONFIG.consensoModerado.tokensTop1Min,

            cobertura_top1_min:
              CONFIG.consensoModerado.coberturaTop1Min

          }

        }

      }

    }
  }
];