// ============================================================
// Similaridade Editorial v0.4.0
// Core Editorial | M360
//
// Responsabilidades:
// - Comparar candidato contra histórico editorial recente
// - Operar CROSS-SOURCE
// - Evitar falso positivo por frases-modelo de agenda esportiva
// - Classificar:
//      NOVO
//      SUSPEITO
//      DUPLICADO
//
// Evolução v0.4.0:
// - Corrige origem do comparável:
//      comparavel.source_host
// - Reduz peso de termos estruturais/editoriais:
//      onde, assistir, vivo, horário, escalação etc.
// - Mantém thresholds da v0.3.2
// ============================================================


// ============================================================
// 1. ENTRADA
// ============================================================

const entrada = $input.first()?.json ?? {};


// ============================================================
// 2. RECUPERA CANDIDATO
//
// Preferência:
// 1. entrada.candidato
// 2. Start Dedup
//
// Nunca utilizar referência ao Loop do fluxo pai.
// ============================================================

let candidatoStart = {};

try {
  candidatoStart = $('Start Dedup').first().json ?? {};
} catch (error) {
  candidatoStart = {};
}


const candidatoEntrada =
  entrada.candidato &&
  typeof entrada.candidato === 'object'
    ? entrada.candidato
    : {};


const candidato = {
  ...candidatoStart,
  ...candidatoEntrada
};


// ============================================================
// 3. VALIDA CANDIDATO
// ============================================================

const tituloCandidato = String(
  candidato.titulo ??
  candidato.title ??
  ''
).trim();


if (!tituloCandidato) {
  throw new Error(
    'Similaridade Editorial v0.4.0: título do candidato não encontrado.'
  );
}


// ============================================================
// 4. COMPARÁVEIS
// ============================================================

const comparaveis =
  Array.isArray(entrada.comparaveis)
    ? entrada.comparaveis
    : [];


// ============================================================
// 5. CONFIGURAÇÃO
// ============================================================

const CONFIG = {

  versao: '0.4.0',

  modo: 'HOMOLOGACAO',

  limites: {

    duplicado: 0.78,

    suspeito: 0.58,

    minTokensDuplicado: 4,

    minTokensSuspeito: 3

  },

  topMatches: 3

};


// ============================================================
// 6. STOPWORDS GERAIS
//
// Termos sem força discriminante suficiente para comparação
// editorial.
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

  // Pronomes / demonstrativos
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

  // Auxiliares muito genéricos
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

  // Termos noticiosos excessivamente genéricos
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
// 7. TERMOS EDITORIAIS DE BAIXA DISCRIMINAÇÃO
//
// v0.4.0
//
// Esses termos aparecem de forma repetitiva principalmente em:
// - pré-jogo
// - serviço de transmissão
// - escalação
// - agenda esportiva
//
// Eles NÃO devem aumentar significativamente a similaridade
// entre partidas completamente diferentes.
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
// 8. NORMALIZA TEXTO
// ============================================================

function normalizarTexto(valor) {

  return String(valor ?? '')

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
// 9. TOKENIZAÇÃO BRUTA
// ============================================================

function tokenizarBruto(texto) {

  const normalizado =
    normalizarTexto(texto);

  if (!normalizado) {
    return [];
  }

  return normalizado
    .split(' ')
    .map(token => token.trim())
    .filter(Boolean);

}


// ============================================================
// 10. TOKENIZAÇÃO SEMÂNTICA
//
// Remove:
// - tokens muito curtos
// - stopwords gerais
// - termos editoriais fracos
//
// Remove também duplicações.
// ============================================================

function tokenizarSemantico(texto) {

  const tokens =
    tokenizarBruto(texto);

  const filtrados =
    tokens.filter(token => {

      if (token.length < 3) {
        return false;
      }

      if (STOPWORDS.has(token)) {
        return false;
      }

      if (TERMOS_EDITORIAIS_FRACOS.has(token)) {
        return false;
      }

      return true;

    });

  return [
    ...new Set(filtrados)
  ];

}


// ============================================================
// 11. TOKENS EDITORIAIS FRACOS PARA AUDITORIA
// ============================================================

function obterTokensEditoriaisFracos(texto) {

  const tokens =
    tokenizarBruto(texto);

  return [
    ...new Set(
      tokens.filter(
        token =>
          TERMOS_EDITORIAIS_FRACOS.has(token)
      )
    )
  ];

}


// ============================================================
// 12. INTERSEÇÃO
// ============================================================

function intersecao(arrayA, arrayB) {

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
// 13. JACCARD
// ============================================================

function calcularJaccard(tokensA, tokensB) {

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

    if (setB.has(token)) {
      comuns++;
    }

  }

  return comuns / uniao.size;

}


// ============================================================
// 14. DICE
// ============================================================

function calcularDice(tokensA, tokensB) {

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
// 15. COBERTURA DO TÍTULO MENOR
//
// Mede quanto do menor conjunto semântico aparece no outro.
// ============================================================

function calcularCoberturaMenor(tokensA, tokensB) {

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

  if (menorQuantidade === 0) {
    return 0;
  }

  return comuns / menorQuantidade;

}


// ============================================================
// 16. ARREDONDAMENTO
// ============================================================

function round4(valor) {

  return Number(
    Number(valor ?? 0)
      .toFixed(4)
  );

}


function percentual(valor) {

  return Number(
    (
      Number(valor ?? 0) *
      100
    ).toFixed(2)
  );

}


// ============================================================
// 17. TOKENS DO CANDIDATO
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
// 18. PROCESSA TODOS OS COMPARÁVEIS
// ============================================================

const resultados = [];


for (const registro of comparaveis) {

  const tituloBanco =
    String(
      registro?.titulo ??
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
    tokensCandidato.length === 0 ||
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


  // ==========================================================
  // Mesmo cálculo-base homologado na v0.3.2:
  //
  // 30% Jaccard
  // 30% Dice
  // 40% cobertura do título menor
  // ==========================================================

  const scoreComposto =
    (
      0.30 * jaccard
    ) +
    (
      0.30 * dice
    ) +
    (
      0.40 * coberturaMenor
    );


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


    // ========================================================
    // CORREÇÃO v0.4.0
    //
    // Origem agora pertence ao COMPARÁVEL,
    // não ao candidato.
    // ========================================================

    origem:
      registro.source_host ??
      null,

    post_id:
      registro.post_id ??
      null,

    metricas: {

      jaccard:
        round4(jaccard),

      dice:
        round4(dice),

      cobertura_titulo_menor:
        round4(coberturaMenor),

      tokens_comuns:
        tokensComuns.length,

      lista_tokens_comuns:
        tokensComuns,

      tokens_candidato:
        tokensCandidato.length,

      tokens_banco:
        tokensBanco.length,

      score_composto:
        round4(scoreComposto),

      percentual:
        percentual(scoreComposto)

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
// 19. ORDENA POR MAIOR SCORE
// ============================================================

resultados.sort(
  (a, b) => {

    const scoreA =
      Number(
        a.metricas?.score_composto ??
        0
      );

    const scoreB =
      Number(
        b.metricas?.score_composto ??
        0
      );

    return scoreB - scoreA;

  }
);


// ============================================================
// 20. TOP MATCHES
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
// 21. SCORE PRINCIPAL
// ============================================================

const scoreMelhor =
  Number(
    melhorMatch?.metricas?.score_composto ??
    0
  );


const tokensComunsMelhor =
  Number(
    melhorMatch?.metricas?.tokens_comuns ??
    0
  );


const scoreSegundo =
  Number(
    segundoMatch?.metricas?.score_composto ??
    0
  );


const gapTop2 =
  Math.max(
    0,
    scoreMelhor - scoreSegundo
  );


// ============================================================
// 22. CLASSIFICAÇÃO
//
// IMPORTANTE:
// thresholds NÃO foram alterados na v0.4.0.
// ============================================================

let status =
  'NOVO';


let evidencia =
  'SEM_MATCH_RELEVANTE';


if (
  scoreMelhor >= CONFIG.limites.duplicado &&
  tokensComunsMelhor >= CONFIG.limites.minTokensDuplicado
) {

  status =
    'DUPLICADO';

  evidencia =
    'MATCH_FORTE';

}
else if (
  scoreMelhor >= CONFIG.limites.suspeito &&
  tokensComunsMelhor >= CONFIG.limites.minTokensSuspeito
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


// ============================================================
// 23. NENHUM COMPARÁVEL PROCESSÁVEL
// ============================================================

if (resultados.length === 0) {

  status =
    'NOVO';

  evidencia =
    'SEM_MATCH_RELEVANTE';

}


// ============================================================
// 24. OUTPUT
//
// Mantém todo o payload recebido e acrescenta
// duplicidade_editorial.
// ============================================================

return [
  {
    json: {

      ...entrada,

      duplicidade_editorial: {

        modo:
          CONFIG.modo,

        versao:
          CONFIG.versao,

        status,

        evidencia,

        score_composto:
          round4(scoreMelhor),

        percentual:
          percentual(scoreMelhor),

        gap_top2:
          round4(gapTop2),

        percentual_gap_top2:
          percentual(gapTop2),

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


          // ================================================
          // Auditoria v0.4.0
          // ================================================

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