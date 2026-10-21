// ============================================================
// CODE | Similaridade Editorial v0.4.0
// Modo: Run Once for All Items
// Core Editorial | PEL
//
// Objetivo:
// - Comparar o candidato atual contra o histórico recente
//   CROSS-SOURCE recebido da SP_DEDUPLICA_EDITORIAL
// - Consumir contrato do Normaliza Deduplica Editorial v0.2.2
// - Utilizar Start Dedup como fonte oficial do candidato
// - Remover termos editoriais de baixa discriminação
// - Calcular Jaccard + Dice + Cobertura do título menor
// - Classificar NOVO / SUSPEITO / DUPLICADO
// - Preservar a origem REAL de cada comparável
// - Entregar TOP 3 para auditoria
//
// IMPORTANTE:
// - NÃO depende de nodes do workflow pai
// - NÃO referencia Loop
// - Similaridade é CROSS-SOURCE
// ============================================================


// ============================================================
// 1. ENTRADA NORMALIZADA
// ============================================================

const entrada =
  $input.first()?.json ?? {};


// ============================================================
// 2. CANDIDATO ORIGINAL DO SUBFLUXO
// ============================================================

let candidatoStart = {};

try {

  candidatoStart =
    $('Start Dedup').first().json ?? {};

} catch (error) {

  candidatoStart = {};
}


// ============================================================
// 3. CANDIDATO RECEBIDO DO NORMALIZA
// ============================================================

const candidatoEntrada =
  (
    entrada.candidato &&
    typeof entrada.candidato === 'object'
  )
    ? entrada.candidato
    : {};


// ============================================================
// 4. VALIDA VALOR
// ============================================================

function temValor(valor) {

  if (
    valor === null ||
    valor === undefined
  ) {
    return false;
  }

  if (
    typeof valor === 'string' &&
    valor.trim() === ''
  ) {
    return false;
  }

  return true;
}


// ============================================================
// 5. MESCLA CANDIDATO
//
// Prioridade:
// 1. Start Dedup
// 2. dados válidos normalizados pelo node anterior
//
// O Normaliza v0.2.2 já enriquece:
// candidato.fonte
// candidato.post_id
// ============================================================

const candidatoEntradaValido =
  Object.fromEntries(
    Object.entries(
      candidatoEntrada
    )
      .filter(
        ([_, valor]) =>
          temValor(valor)
      )
  );


const candidato = {
  ...candidatoStart,
  ...candidatoEntradaValido
};


// ============================================================
// 6. BASE DE COMPARAÇÃO
// ============================================================

const comparaveis =
  Array.isArray(
    entrada.comparaveis
  )
    ? entrada.comparaveis
    : [];


// ============================================================
// 7. CONFIGURAÇÃO
// ============================================================

const CONFIG = {

  versao:
    '0.4.0',

  modo:
    'PRODUCAO',

  limites: {

    duplicado:
      0.78,

    suspeito:
      0.58,

    minTokensDuplicado:
      4,

    minTokensSuspeito:
      3

  },

  topMatches:
    3

};


// ============================================================
// 8. TÍTULO DO CANDIDATO
// ============================================================

const tituloCandidato =
  String(
    candidato.titulo ??
    candidato.title ??
    ''
  ).trim();


if (!tituloCandidato) {

  throw new Error(
    'Similaridade Editorial v0.4.0: ' +
    'título do candidato não encontrado.'
  );
}


// ============================================================
// 9. STOPWORDS GERAIS
// ============================================================

const STOPWORDS = new Set([

  // Artigos
  'a',
  'as',
  'o',
  'os',
  'um',
  'uma',
  'uns',
  'umas',

  // Preposições / contrações
  'de',
  'da',
  'das',
  'do',
  'dos',

  'em',
  'na',
  'nas',
  'no',
  'nos',

  'por',
  'para',
  'pra',
  'pro',
  'pros',

  'pela',
  'pelas',
  'pelo',
  'pelos',

  'com',
  'sem',
  'sob',
  'sobre',
  'entre',
  'ate',
  'desde',
  'apos',

  // Conjunções
  'e',
  'ou',
  'mas',
  'que',
  'se',
  'como',
  'porque',
  'quando',
  'enquanto',

  // Pronomes
  'ele',
  'ela',
  'eles',
  'elas',

  'isso',
  'isto',

  'esse',
  'essa',
  'esses',
  'essas',

  'este',
  'esta',
  'estes',
  'estas',

  // Verbos auxiliares / genéricos
  'ser',
  'estar',
  'ter',

  'foi',
  'sao',
  'sera',
  'sendo',

  'tem',
  'teve',
  'vai',
  'pode',

  // Termos jornalísticos genéricos
  'veja',
  'saiba',
  'confira',
  'entenda',

  'hoje',
  'agora',

  'novo',
  'nova',
  'novos',
  'novas'

]);


// ============================================================
// 10. TERMOS EDITORIAIS FRACOS
//
// São palavras que aparecem repetidamente em títulos
// jornalísticos e podem inflar artificialmente similaridade.
//
// Elas NÃO entram no score semântico.
//
// Permanecem disponíveis em auditoria.
// ============================================================

const TERMOS_EDITORIAIS_FRACOS = new Set([

  'onde',
  'assistir',
  'vivo',

  'horario',
  'horarios',

  'transmissao',
  'transmissoes',

  'escalacao',
  'escalacoes',

  'provavel',
  'provaveis',

  'jogo',
  'jogos',

  'partida',
  'partidas',

  'confronto',
  'confrontos',

  'rodada',

  'canal',
  'canais',

  'tv',

  'online'

]);


// ============================================================
// 11. NORMALIZAÇÃO DE TEXTO
// ============================================================

function normalizarTexto(valor) {

  return String(
    valor ?? ''
  )

    .normalize('NFD')

    .replace(
      /[\u0300-\u036f]/g,
      ''
    )

    .toLowerCase()

    .replace(
      /[“”"'´`’‘]/g,
      ' '
    )

    .replace(
      /[^a-z0-9\s-]/g,
      ' '
    )

    .replace(
      /-/g,
      ' '
    )

    .replace(
      /\s+/g,
      ' '
    )

    .trim();
}


// ============================================================
// 12. TOKENIZAÇÃO BRUTA
// ============================================================

function tokenizarBruto(texto) {

  const normalizado =
    normalizarTexto(texto);

  if (!normalizado) {
    return [];
  }

  return normalizado

    .split(' ')

    .map(
      token =>
        token.trim()
    )

    .filter(Boolean);
}


// ============================================================
// 13. TOKENIZAÇÃO SEMÂNTICA
// ============================================================

function tokenizarSemantico(texto) {

  const tokens =
    tokenizarBruto(texto);


  const filtrados =
    tokens.filter(
      token => {

        if (token.length < 3) {
          return false;
        }

        if (
          STOPWORDS.has(token)
        ) {
          return false;
        }

        if (
          TERMOS_EDITORIAIS_FRACOS.has(token)
        ) {
          return false;
        }

        return true;
      }
    );


  return [
    ...new Set(
      filtrados
    )
  ];
}


// ============================================================
// 14. AUDITORIA DE TERMOS EDITORIAIS FRACOS
// ============================================================

function obterTokensEditoriaisFracos(texto) {

  const tokens =
    tokenizarBruto(texto);


  return [
    ...new Set(
      tokens.filter(
        token =>
          TERMOS_EDITORIAIS_FRACOS.has(
            token
          )
      )
    )
  ];
}


// ============================================================
// 15. INTERSEÇÃO
// ============================================================

function intersecao(
  arrayA,
  arrayB
) {

  const setB =
    new Set(arrayB);


  return [
    ...new Set(
      arrayA.filter(
        token =>
          setB.has(token)
      )
    )
  ];
}


// ============================================================
// 16. JACCARD
// ============================================================

function calcularJaccard(
  tokensA,
  tokensB
) {

  const setA =
    new Set(tokensA);

  const setB =
    new Set(tokensB);


  const uniao =
    new Set([
      ...setA,
      ...setB
    ]);


  if (uniao.size === 0) {
    return 0;
  }


  let comuns = 0;


  for (const token of setA) {

    if (
      setB.has(token)
    ) {
      comuns++;
    }
  }


  return (
    comuns /
    uniao.size
  );
}


// ============================================================
// 17. DICE
// ============================================================

function calcularDice(
  tokensA,
  tokensB
) {

  if (
    tokensA.length === 0 ||
    tokensB.length === 0
  ) {
    return 0;
  }


  const comuns =
    intersecao(
      tokensA,
      tokensB
    ).length;


  return (
    (2 * comuns) /
    (
      tokensA.length +
      tokensB.length
    )
  );
}


// ============================================================
// 18. COBERTURA DO TÍTULO MENOR
// ============================================================

function calcularCoberturaMenor(
  tokensA,
  tokensB
) {

  if (
    tokensA.length === 0 ||
    tokensB.length === 0
  ) {
    return 0;
  }


  const comuns =
    intersecao(
      tokensA,
      tokensB
    ).length;


  const menorQuantidade =
    Math.min(
      tokensA.length,
      tokensB.length
    );


  if (
    menorQuantidade === 0
  ) {
    return 0;
  }


  return (
    comuns /
    menorQuantidade
  );
}


// ============================================================
// 19. ARREDONDAMENTO
// ============================================================

function round4(valor) {

  return Number(
    Number(
      valor ?? 0
    ).toFixed(4)
  );
}


function percentual(valor) {

  return Number(
    (
      Number(
        valor ?? 0
      ) * 100
    ).toFixed(2)
  );
}


// ============================================================
// 20. TOKENS DO CANDIDATO
// ============================================================

const tokensCandidato =
  tokenizarSemantico(
    tituloCandidato
  );


const tokensFracosCandidato =
  obterTokensEditoriaisFracos(
    tituloCandidato
  );


// ============================================================
// 21. VALIDA TOKENS DO CANDIDATO
// ============================================================

if (
  tokensCandidato.length === 0
) {

  return [
    {
      json: {

        ...entrada,

        candidato,

        duplicidade_editorial: {

          modo:
            CONFIG.modo,

          versao:
            CONFIG.versao,

          status:
            'ERRO',

          evidencia:
            'CANDIDATO_SEM_TOKENS',

          motivo:
            'Título do candidato não gerou tokens semânticos válidos.',

          score_composto:
            0,

          percentual:
            0,

          gap_top2:
            0,

          percentual_gap_top2:
            0,

          limites: {

            duplicado:
              CONFIG.limites.duplicado,

            suspeito:
              CONFIG.limites.suspeito,

            min_tokens_duplicado:
              CONFIG.limites.minTokensDuplicado,

            min_tokens_suspeito:
              CONFIG.limites.minTokensSuspeito
          },

          candidato: {

            titulo:
              tituloCandidato,

            tokens:
              [],

            quantidade_tokens:
              0,

            tokens_editoriais_fracos_ignorados:
              tokensFracosCandidato
          },

          comparados:
            0,

          melhor_match:
            null,

          top_matches:
            []
        }
      }
    }
  ];
}


// ============================================================
// 22. COMPARAÇÃO
// ============================================================

const resultados = [];


for (
  const registro
  of comparaveis
) {

  if (
    !registro ||
    typeof registro !== 'object'
  ) {
    continue;
  }


  const tituloBanco =
    String(
      registro.titulo ??
      ''
    ).trim();


  if (!tituloBanco) {
    continue;
  }


  const tokensBanco =
    tokenizarSemantico(
      tituloBanco
    );


  if (
    tokensBanco.length === 0
  ) {
    continue;
  }


  const tokensComuns =
    intersecao(
      tokensCandidato,
      tokensBanco
    );


  const jaccard =
    calcularJaccard(
      tokensCandidato,
      tokensBanco
    );


  const dice =
    calcularDice(
      tokensCandidato,
      tokensBanco
    );


  const coberturaMenor =
    calcularCoberturaMenor(
      tokensCandidato,
      tokensBanco
    );


  // ----------------------------------------------------------
  // SCORE COMPOSTO
  //
  // 30% Jaccard
  // 30% Dice
  // 40% cobertura do título menor
  // ----------------------------------------------------------

  const scoreComposto =
      (0.30 * jaccard)
    + (0.30 * dice)
    + (0.40 * coberturaMenor);


  resultados.push({

    id:
      registro.legacy_id ??
      registro.id ??
      null,

    titulo:
      tituloBanco,

    categoria:
      registro.categoria ??
      null,

    data:
      registro.data ??
      null,

    // --------------------------------------------------------
    // v0.4.0:
    // origem REAL do registro comparado.
    //
    // NÃO usar entrada.source_host.
    // --------------------------------------------------------

    origem:
      registro.source_host ??
      null,

    post_id:
      registro.post_id ??
      null,

    metricas: {

      jaccard:
        round4(
          jaccard
        ),

      dice:
        round4(
          dice
        ),

      cobertura_titulo_menor:
        round4(
          coberturaMenor
        ),

      tokens_comuns:
        tokensComuns.length,

      lista_tokens_comuns:
        tokensComuns,

      tokens_candidato:
        tokensCandidato.length,

      tokens_banco:
        tokensBanco.length,

      score_composto:
        round4(
          scoreComposto
        ),

      percentual:
        percentual(
          scoreComposto
        )
    },

    auditoria: {

      tokens_semanticos_banco:
        tokensBanco,

      tokens_editoriais_fracos_banco:
        obterTokensEditoriaisFracos(
          tituloBanco
        )
    }
  });
}


// ============================================================
// 23. ORDENAÇÃO
// ============================================================

resultados.sort(
  (a, b) => {

    const scoreA =
      Number(
        a.metricas
          ?.score_composto ??
        0
      );

    const scoreB =
      Number(
        b.metricas
          ?.score_composto ??
        0
      );


    return (
      scoreB -
      scoreA
    );
  }
);


// ============================================================
// 24. TOP MATCHES
// ============================================================

const topMatches =
  resultados.slice(
    0,
    CONFIG.topMatches
  );


const melhorMatch =
  topMatches[0] ??
  null;


const segundoMatch =
  topMatches[1] ??
  null;


// ============================================================
// 25. MÉTRICAS PRINCIPAIS
// ============================================================

const scoreMelhor =
  Number(
    melhorMatch
      ?.metricas
      ?.score_composto ??
    0
  );


const tokensComunsMelhor =
  Number(
    melhorMatch
      ?.metricas
      ?.tokens_comuns ??
    0
  );


const scoreSegundo =
  Number(
    segundoMatch
      ?.metricas
      ?.score_composto ??
    0
  );


const gapTop2 =
  Math.max(
    0,
    scoreMelhor -
    scoreSegundo
  );


// ============================================================
// 26. CLASSIFICAÇÃO
// ============================================================

let status =
  'NOVO';


let evidencia =
  'SEM_MATCH_RELEVANTE';


if (
  scoreMelhor >=
    CONFIG.limites.duplicado
  &&
  tokensComunsMelhor >=
    CONFIG.limites.minTokensDuplicado
) {

  status =
    'DUPLICADO';

  evidencia =
    'MATCH_FORTE';

}

else if (
  scoreMelhor >=
    CONFIG.limites.suspeito
  &&
  tokensComunsMelhor >=
    CONFIG.limites.minTokensSuspeito
) {

  status =
    'SUSPEITO';

  evidencia =
    'MATCH_SUSPEITO';

}

else if (
  scoreMelhor > 0
) {

  status =
    'NOVO';

  evidencia =
    'MATCH_FRACO';

}


if (
  resultados.length === 0
) {

  status =
    'NOVO';

  evidencia =
    'SEM_MATCH_RELEVANTE';

}


// ============================================================
// 27. CANDIDATO PARA SAÍDA
// ============================================================

const candidatoSaida = {

  position:
    candidato.position ??
    null,

  titulo:
    tituloCandidato,

  link:
    String(
      candidato.link ??
      candidato.url ??
      ''
    ).trim() || null,

  fonte:
    candidato.fonte ??
    candidato.source ??
    entrada.source_host ??
    null,

  autores:
    Array.isArray(
      candidato.autores
    )
      ? candidato.autores
      : [],

  data:
    candidato.data ??
    null,

  iso_date:
    candidato.iso_date ??
    candidato.isoDate ??
    null,

  thumbnail:
    candidato.thumbnail ??
    null,

  thumbnail_small:
    candidato.thumbnail_small ??
    candidato.thumbnailSmall ??
    null,

  termos_encontrados:
    Array.isArray(
      candidato.termos_encontrados
    )
      ? candidato.termos_encontrados
      : [],

  score_tematico:
    candidato.score_tematico ??
    null,

  idade_horas:
    candidato.idade_horas ??
    null,

  post_id:
    entrada.post_id ??
    candidato.post_id ??
    null
};


// ============================================================
// 28. SAÍDA
// ============================================================

return [
  {
    json: {

      ...entrada,

      // --------------------------------------------------------
      // Candidato preservado
      // --------------------------------------------------------

      candidato:
        candidatoSaida,


      // --------------------------------------------------------
      // Resultado da análise semântica
      // --------------------------------------------------------

      duplicidade_editorial: {

        modo:
          CONFIG.modo,

        versao:
          CONFIG.versao,

        status,

        evidencia,

        score_composto:
          round4(
            scoreMelhor
          ),

        percentual:
          percentual(
            scoreMelhor
          ),

        gap_top2:
          round4(
            gapTop2
          ),

        percentual_gap_top2:
          percentual(
            gapTop2
          ),

        limites: {

          duplicado:
            CONFIG.limites.duplicado,

          suspeito:
            CONFIG.limites.suspeito,

          min_tokens_duplicado:
            CONFIG.limites.minTokensDuplicado,

          min_tokens_suspeito:
            CONFIG.limites.minTokensSuspeito
        },


        candidato: {

          titulo:
            tituloCandidato,

          tokens:
            tokensCandidato,

          quantidade_tokens:
            tokensCandidato.length,

          tokens_editoriais_fracos_ignorados:
            tokensFracosCandidato
        },


        comparados:
          resultados.length,


        melhor_match:
          melhorMatch,


        top_matches:
          topMatches
      }
    }
  }
];