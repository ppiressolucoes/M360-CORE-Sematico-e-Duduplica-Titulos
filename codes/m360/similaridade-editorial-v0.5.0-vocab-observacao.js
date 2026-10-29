// ============================================================
// Similaridade Editorial v0.5.0
// Core Editorial | M360
//
// Compatibilidade operacional:
// - preserva integralmente a decisao lexical da v0.4.0;
// - mantem status, thresholds, score e melhor_match produtivos;
// - acrescenta analise contextual somente em OBSERVACAO;
// - nunca aplica automaticamente a recomendacao contextual.
// - compara o vocabulario v0.1.0 do banco ao dicionario estatico em sombra;
// - aceita expansao validada pelo Normaliza v0.2.0, sem mudar a decisao;
// - remove as 72 regras do payload antes dos nodes seguintes.
//
// Contrato minimo: titulo + link.
// Atributos ausentes permanecem DESCONHECIDOS e nao viram conflito.
// ============================================================

const entrada = $input.first()?.json ?? {};
const vocabularioEntrada = entrada.vocabulario_editorial ?? null;
const entradaSaida = { ...entrada };
if (vocabularioEntrada && typeof vocabularioEntrada === 'object') {
  const { regras, ...resumo } = vocabularioEntrada;
  entradaSaida.vocabulario_editorial = {
    ...resumo,
    regras_omitidas_na_saida: Array.isArray(regras)
  };
}

let candidatoStart = {};
try {
  candidatoStart = $('Start Dedup').first().json ?? {};
} catch (error) {
  candidatoStart = {};
}

const candidatoEntrada =
  entrada.candidato && typeof entrada.candidato === 'object'
    ? entrada.candidato
    : {};

const candidato = {
  ...candidatoStart,
  ...candidatoEntrada
};

const tituloCandidato = String(
  candidato.titulo ?? candidato.title ?? ''
).trim();

if (!tituloCandidato) {
  throw new Error(
    'Similaridade Editorial v0.5.0: titulo do candidato nao encontrado.'
  );
}

const comparaveis = Array.isArray(entrada.comparaveis)
  ? entrada.comparaveis
  : [];

const CONFIG = {
  versao: '0.5.0',
  baselineVersao: '0.4.0',
  modo: 'HOMOLOGACAO',
  modoContextual: 'OBSERVACAO',
  limites: {
    duplicado: 0.78,
    suspeito: 0.58,
    minTokensDuplicado: 4,
    minTokensSuspeito: 3
  },
  topMatches: 3,
  pesosContextuais: {
    participantesExatos: 0.12,
    participantesParciais: 0.04,
    pessoasExatas: 0.14,
    pessoasParciais: 0.05,
    organizacaoCompativel: 0.04,
    competicaoCompativel: 0.06,
    faseCompeticaoIgual: 0.05,
    dataIgual: 0.12,
    periodoIgual: 0.10,
    objetoCompativel: 0.06,
    estadoFactualCompativel: 0.05,
    facetaCompartilhada: 0.18,
    facetaDistinta: -0.20,
    conflitoCriticoMultiplicador: 0.25
  }
};

const STOPWORDS = new Set([
  'a', 'as', 'o', 'os', 'um', 'uma', 'uns', 'umas',
  'de', 'da', 'das', 'do', 'dos', 'em', 'na', 'nas', 'no', 'nos',
  'por', 'para', 'pra', 'pro', 'pros', 'pela', 'pelas', 'pelo', 'pelos',
  'com', 'sem', 'sob', 'sobre', 'entre', 'ate', 'desde', 'apos',
  'e', 'ou', 'mas', 'que', 'se', 'como', 'porque', 'quando', 'enquanto',
  'ele', 'ela', 'eles', 'elas', 'isso', 'isto', 'esse', 'essa', 'esses',
  'essas', 'este', 'esta', 'estes', 'estas',
  'ser', 'estar', 'ter', 'foi', 'sao', 'sera', 'sendo', 'tem', 'teve',
  'vai', 'pode',
  'veja', 'saiba', 'confira', 'entenda', 'hoje', 'agora', 'novo', 'nova',
  'novos', 'novas'
]);

const TERMOS_EDITORIAIS_FRACOS = new Set([
  'onde', 'assistir', 'vivo', 'horario', 'horarios', 'transmissao',
  'transmissoes', 'escalacao', 'escalacoes', 'provavel', 'provaveis',
  'jogo', 'jogos', 'partida', 'partidas', 'confronto', 'confrontos',
  'rodada', 'canal', 'canais', 'tv', 'online'
]);

const CLUBES = [
  ['FLAMENGO', ['flamengo', 'mengao']],
  ['VASCO', ['vasco da gama', 'vasco']],
  ['PALMEIRAS', ['palmeiras']],
  ['CORINTHIANS', ['corinthians']],
  ['SAO_PAULO', ['sao paulo']],
  ['SANTOS', ['santos']],
  ['FLUMINENSE', ['fluminense']],
  ['BOTAFOGO', ['botafogo']],
  ['GREMIO', ['gremio']],
  ['INTERNACIONAL', ['internacional', 'inter de porto alegre']],
  ['CRUZEIRO', ['cruzeiro']],
  ['ATLETICO_MG', ['atletico mg', 'atletico mineiro', 'galo']],
  ['ATHLETICO_PR', ['athletico pr', 'athletico paranaense']],
  ['BAHIA', ['bahia']],
  ['VITORIA', ['vitoria']],
  ['FORTALEZA', ['fortaleza']],
  ['CEARA', ['ceara']],
  ['SPORT', ['sport recife', 'sport']],
  ['CHAPECOENSE', ['chapecoense']],
  ['ESTUDIANTES', ['estudiantes']],
  ['RACING', ['racing']],
  ['RIVER_PLATE', ['river plate']],
  ['BOCA_JUNIORS', ['boca juniors']]
];

// Cadastro inicial e extensivel de pessoas com alta recorrencia no M360.
// Bloqueios evitam promover homonimos conhecidos, como Pedro Emanuel.
const PESSOAS = [
  { nome: 'GABIGOL', aliases: ['gabriel barbosa', 'gabigol'], bloqueios: [] },
  { nome: 'PEDRO', aliases: ['pedro'], bloqueios: ['pedro emanuel'] },
  { nome: 'ARRASCAETA', aliases: ['arrascaeta'], bloqueios: [] },
  { nome: 'BRUNO_HENRIQUE', aliases: ['bruno henrique'], bloqueios: [] },
  { nome: 'FILIPE_LUIS', aliases: ['filipe luis'], bloqueios: [] },
  { nome: 'SAMUEL_LINO', aliases: ['samuel lino'], bloqueios: [] },
  { nome: 'DANILO', aliases: ['danilo'], bloqueios: [] },
  { nome: 'JORGINHO', aliases: ['jorginho'], bloqueios: [] },
  { nome: 'CARRASCAL', aliases: ['carrascal'], bloqueios: [] },
  { nome: 'DE_LA_CRUZ', aliases: ['de la cruz'], bloqueios: [] },
  { nome: 'EVERTON_CEBOLINHA', aliases: ['everton cebolinha', 'cebolinha'], bloqueios: [] },
  { nome: 'GONZALO_PLATA', aliases: ['gonzalo plata'], bloqueios: [] },
  { nome: 'ROSSI', aliases: ['agustin rossi', 'rossi'], bloqueios: [] },
  { nome: 'MARCOS_ROJO', aliases: ['marcos rojo', 'rojo'], bloqueios: [] },
  { nome: 'LEONARDO_JARDIM', aliases: ['leonardo jardim'], bloqueios: [] },
  { nome: 'LEO_PEREIRA', aliases: ['leo pereira'], bloqueios: [] }
];

const ORGANIZACOES = [
  ['CONMEBOL', ['conmebol']],
  ['CBF', ['cbf', 'confederacao brasileira de futebol']],
  ['FIFA', ['fifa']],
  ['FERJ', ['ferj', 'federacao de futebol do estado do rio de janeiro']]
];

const COMPETICOES = [
  ['BRASILEIRAO_SERIE_A', ['brasileirao serie a', 'brasileiro serie a', 'serie a']],
  ['BRASILEIRAO_SERIE_B', ['brasileirao serie b', 'brasileiro serie b', 'serie b']],
  ['BRASILEIRAO', ['brasileirao', 'campeonato brasileiro']],
  ['LIBERTADORES', ['libertadores']],
  ['COPA_DO_BRASIL_SUB_20', ['copa do brasil sub 20']],
  ['COPA_DO_BRASIL', ['copa do brasil']],
  ['SUL_AMERICANA', ['sul americana']],
  ['CARIOCA', ['campeonato carioca', 'carioca']],
  ['MUNDIAL_DE_CLUBES', ['mundial de clubes']]
];

function prepararVocabulario(valor) {
  if (!valor) return { status: 'NAO_CARREGADO', dicionarios: null, regras: [] };
  const regras = valor.regras;
  const minimosPorTipo = {
    ALIAS_CLUBE: 30,
    ALIAS_COMPETICAO: 15,
    ALIAS_ORGANIZACAO: 6,
    ALIAS_PESSOA: 20,
    BLOQUEIO_PESSOA: 1
  };
  if (
    valor.versao !== '0.1.0' ||
    valor.dominio !== 'ESPORTE' ||
    valor.consumidor !== 'M360' ||
    valor.modo !== 'OBSERVACAO' ||
    valor.aplicado_automaticamente !== false ||
    !Array.isArray(regras) ||
    regras.length < 72 || regras.length > 500 ||
    Number(valor.total_regras) !== regras.length ||
    regras.some(regra =>
      regra.tipo_expressao !== 'LITERAL' ||
      !Object.prototype.hasOwnProperty.call(minimosPorTipo, regra.tipo) ||
      !Number.isSafeInteger(Number(regra.regra_id)) || Number(regra.regra_id) <= 0 ||
      !Number.isInteger(Number(regra.prioridade)) ||
      Number(regra.prioridade) < 0 || Number(regra.prioridade) > 100 ||
      !Number.isFinite(Number(regra.confianca)) ||
      Number(regra.confianca) < 0 || Number(regra.confianca) > 1 ||
      !String(regra.expressao ?? '').trim() ||
      !String(regra.valor_canonico ?? '').trim()
    )
  ) return { status: 'INVALIDO_FALLBACK_ESTATICO', dicionarios: null, regras: [] };

  const ids = new Set();
  const expressoesPorTipo = new Set();
  const contagens = {};
  for (const regra of regras) {
    const id = Number(regra.regra_id);
    const identidade = JSON.stringify([
      regra.tipo,
      String(regra.expressao).trim().toLocaleLowerCase('pt-BR')
    ]);
    if (ids.has(id) || expressoesPorTipo.has(identidade)) {
      return { status: 'INVALIDO_FALLBACK_ESTATICO', dicionarios: null, regras: [] };
    }
    ids.add(id);
    expressoesPorTipo.add(identidade);
    contagens[regra.tipo] = (contagens[regra.tipo] ?? 0) + 1;
  }
  if (Object.entries(minimosPorTipo).some(([tipo, minimo]) =>
    (contagens[tipo] ?? 0) < minimo
  )) return { status: 'INVALIDO_FALLBACK_ESTATICO', dicionarios: null, regras: [] };

  const porId = [...regras].sort((a, b) => Number(a.regra_id) - Number(b.regra_id));
  const agrupar = tipo => {
    const grupos = new Map();
    for (const regra of porId.filter(item => item.tipo === tipo)) {
      const nome = String(regra.valor_canonico);
      if (!grupos.has(nome)) grupos.set(nome, []);
      grupos.get(nome).push(String(regra.expressao));
    }
    return [...grupos].map(([nome, aliases]) => [nome, aliases]);
  };

  const clubes = agrupar('ALIAS_CLUBE');
  const organizacoes = agrupar('ALIAS_ORGANIZACAO');
  const pessoas = agrupar('ALIAS_PESSOA').map(([nome, aliases]) => ({
    nome,
    aliases,
    bloqueios: porId
      .filter(regra => regra.tipo === 'BLOQUEIO_PESSOA' && regra.valor_canonico === nome)
      .map(regra => String(regra.expressao))
  }));

  const competicoesOrdenadas = [...regras]
    .filter(regra => regra.tipo === 'ALIAS_COMPETICAO')
    .sort((a, b) =>
      Number(b.prioridade) - Number(a.prioridade) ||
      Number(a.regra_id) - Number(b.regra_id)
    );
  const competicoes = new Map();
  for (const regra of competicoesOrdenadas) {
    const nome = String(regra.valor_canonico);
    if (!competicoes.has(nome)) competicoes.set(nome, []);
    competicoes.get(nome).push(String(regra.expressao));
  }

  return {
    status: 'CARREGADO_EM_OBSERVACAO',
    regras,
    dicionarios: {
      clubes,
      pessoas,
      organizacoes,
      competicoes: [...competicoes].map(([nome, aliases]) => [nome, aliases])
    }
  };
}

const vocabularioObservado = prepararVocabulario(vocabularioEntrada);

function normalizarTexto(valor) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[“”"'´`’‘]/g, ' ')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizarBruto(texto) {
  const normalizado = normalizarTexto(texto);
  return normalizado
    ? normalizado.split(' ').map(token => token.trim()).filter(Boolean)
    : [];
}

function tokenizarSemantico(texto) {
  return [...new Set(
    tokenizarBruto(texto).filter(token =>
      token.length >= 3 &&
      !STOPWORDS.has(token) &&
      !TERMOS_EDITORIAIS_FRACOS.has(token)
    )
  )];
}

function obterTokensEditoriaisFracos(texto) {
  return [...new Set(
    tokenizarBruto(texto).filter(token => TERMOS_EDITORIAIS_FRACOS.has(token))
  )];
}

function intersecao(arrayA, arrayB) {
  const setB = new Set(arrayB);
  return [...new Set(arrayA.filter(token => setB.has(token)))];
}

function calcularJaccard(tokensA, tokensB) {
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  const uniao = new Set([...setA, ...setB]);
  if (uniao.size === 0) return 0;
  let comuns = 0;
  for (const token of setA) {
    if (setB.has(token)) comuns++;
  }
  return comuns / uniao.size;
}

function calcularDice(tokensA, tokensB) {
  if (tokensA.length === 0 || tokensB.length === 0) return 0;
  return (2 * intersecao(tokensA, tokensB).length) /
    (tokensA.length + tokensB.length);
}

function calcularCoberturaMenor(tokensA, tokensB) {
  if (tokensA.length === 0 || tokensB.length === 0) return 0;
  const menorQuantidade = Math.min(tokensA.length, tokensB.length);
  return menorQuantidade === 0
    ? 0
    : intersecao(tokensA, tokensB).length / menorQuantidade;
}

function round4(valor) {
  return Number(Number(valor ?? 0).toFixed(4));
}

function percentual(valor) {
  return Number((Number(valor ?? 0) * 100).toFixed(2));
}

function limitar01(valor) {
  return Math.max(0, Math.min(1, Number(valor ?? 0)));
}

function escaparRegex(valor) {
  return String(valor).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function contemExpressao(textoNormalizado, expressao) {
  const regex = new RegExp(`(^|\\s)${escaparRegex(expressao)}($|\\s)`);
  return regex.test(textoNormalizado);
}

function obterTextoContextual(item, titulo) {
  const link = String(
    item?.link ?? item?.url ?? item?.post_id ?? ''
  );
  let linkDecodificado = link;
  try {
    linkDecodificado = decodeURIComponent(link);
  } catch (error) {
    linkDecodificado = link;
  }
  return normalizarTexto(`${titulo} ${linkDecodificado}`);
}

function extrairFacetas(texto) {
  const facetas = [];
  const adicionar = faceta => {
    if (!facetas.includes(faceta)) facetas.push(faceta);
  };

  if (
    /\bonde assistir\b|\bao vivo\b|\btransmiss(?:ao|oes)\b|\bhorarios?\b|\bcanais?\b|\btv\b/.test(texto)
  ) adicionar('SERVICO_TRANSMISSAO');

  if (/\bpalpite\b|\bprognostico\b|\baposta\b/.test(texto)) {
    adicionar('PALPITE');
  }

  if (/\bescalac(?:ao|oes)\b|\btime provavel\b|\bprovaveis escalacoes\b/.test(texto)) {
    adicionar('ESCALACAO');
  }

  if (
    /\bingressos?\b|\bvenda ao publico\b|\bprecos?\b/.test(texto)
  ) adicionar('VENDA_INGRESSOS');

  if (
    /\bmaracana\b|\bengenhao\b|\bnilton santos\b|\bestadio\b|\bmando\b|\blocal do jogo\b|\btirar jogo\b/.test(texto)
  ) adicionar('LOCAL_EVENTO');

  if (/\bpreparacao\b|\btreino\b|\bprogramacao\b/.test(texto)) {
    adicionar('PREPARACAO');
  }

  if (/\bplacar\b|\bresultado\b|\bvenceu\b|\bderrota\b|\bgole(?:ia|ou|ada)\b/.test(texto)) {
    adicionar('RESULTADO');
  }

  if (/\brepercussao\b|\breacao\b|\breage\b|\bcomentou\b|\bdisse\b|\bmanda recado\b/.test(texto)) {
    adicionar('REPERCUSSAO');
  }

  if (/\brebaixamento\b|\bclassificacao\b|\btabela\b/.test(texto)) {
    adicionar('TABELA_CLASSIFICACAO');
  }

  if (
    /\bcompar(?:a|ar|acao|e|ou)\b|\bmelhores? que\b|\bpiores? que\b|\bsupera\b|\bsuperior (?:a|ao)\b|\binferior (?:a|ao)\b/.test(texto)
  ) adicionar('COMPARACAO_DESEMPENHO');

  if (
    /\bnumeros?\b|\bestatisticas?\b|\bdesempenho\b|\baproveitamento\b|\bgols?\b|\bassistencias?\b/.test(texto)
  ) adicionar('ESTATISTICAS_DESEMPENHO');

  if (
    /\bapresentador\b|\bcomentarista\b|\banalista\b|\bavaliou\b|\bopiniao\b/.test(texto)
  ) adicionar('OPINIAO_DECLARACAO');

  if (
    /\bcontratacao\b|\bcontratar\b|\bnegociacao\b|\bnegociava\b/.test(texto)
  ) adicionar('CONTRATACAO');

  if (
    /\binscricao\b|\binscrever\b|\binscreve\b|\binscreve lo\b/.test(texto)
  ) adicionar('INSCRICAO_COMPETICAO');

  if (/\brecurso\b|\brecorre\b|\brecorreu\b|\bcontestacao\b/.test(texto)) {
    adicionar('RECURSO_REGULATORIO');
  }

  if (/\brenovacao\b|\brenovar contrato\b|\brenova contrato\b/.test(texto)) {
    adicionar('RENOVACAO_CONTRATUAL');
  }

  if (
    /\bvenda de ingressos\b|\bingressos? para (?:a )?final\b|\bvenda para (?:a )?final\b/.test(texto)
  ) adicionar('VENDA_INGRESSOS');

  if (/\bjustica\b|\bpunir\b|\bpunicao\b|\bacao judicial\b/.test(texto)) {
    adicionar('JURIDICO_DISCIPLINAR');
  }

  if (/\bse manifesta\b|\bmanifestacao\b|\bnota oficial\b|\bredes sociais\b/.test(texto)) {
    adicionar('COMUNICADO_INSTITUCIONAL');
  }

  return facetas;
}

function extrairCompeticao(texto, competicoes = COMPETICOES) {
  for (const [competicao, aliases] of competicoes) {
    if (aliases.some(alias => contemExpressao(texto, alias))) {
      return competicao;
    }
  }
  return null;
}

function extrairOrganizacoes(texto, dicionario = ORGANIZACOES) {
  const organizacoes = [];
  for (const [organizacao, aliases] of dicionario) {
    if (aliases.some(alias => contemExpressao(texto, alias))) {
      organizacoes.push(organizacao);
    }
  }
  return organizacoes;
}

function extrairFasesCompeticao(texto) {
  const fases = [];
  const adicionar = fase => {
    if (!fases.includes(fase)) fases.push(fase);
  };

  if (/\bfinal\b/.test(texto)) adicionar('FINAL');
  if (/\bsemifinal\b|\bsemi final\b|\bsemi\b/.test(texto)) adicionar('SEMIFINAL');
  if (/\bquartas? de final\b/.test(texto)) adicionar('QUARTAS_DE_FINAL');
  if (/\boitavas? de final\b/.test(texto)) adicionar('OITAVAS_DE_FINAL');

  return fases;
}

function localizarPessoas(texto, dicionario = PESSOAS) {
  const pessoas = [];

  for (const pessoa of dicionario) {
    if (pessoa.bloqueios.some(bloqueio => contemExpressao(texto, bloqueio))) {
      continue;
    }

    let primeiraPosicao = -1;
    for (const alias of pessoa.aliases) {
      const regex = new RegExp(`(^|\\s)${escaparRegex(alias)}($|\\s)`);
      const match = regex.exec(texto);
      if (match) {
        const posicao = match.index + (match[1] ? match[1].length : 0);
        if (primeiraPosicao < 0 || posicao < primeiraPosicao) {
          primeiraPosicao = posicao;
        }
      }
    }

    if (primeiraPosicao >= 0) {
      pessoas.push({ nome: pessoa.nome, posicao: primeiraPosicao });
    }
  }

  return pessoas.sort((a, b) => a.posicao - b.posicao);
}

function extrairPessoasPrincipais(texto, dicionario = PESSOAS) {
  const pessoas = localizarPessoas(texto, dicionario).map(item => item.nome);
  return {
    pessoas,
    confianca: pessoas.length >= 2 ? 0.9 : pessoas.length === 1 ? 0.7 : 0
  };
}

function extrairPeriodosReferencia(texto) {
  return [...new Set(texto.match(/\b20\d{2}\b/g) ?? [])];
}

function extrairObjetoFactual(texto, facetas) {
  if (facetas.includes('VENDA_INGRESSOS')) {
    return 'COMERCIALIZACAO_INGRESSOS';
  }

  if (facetas.includes('JURIDICO_DISCIPLINAR')) {
    return 'SITUACAO_JURIDICO_DESPORTIVA';
  }

  if (facetas.includes('COMUNICADO_INSTITUCIONAL')) {
    return 'POSICIONAMENTO_INSTITUCIONAL';
  }

  if (
    facetas.includes('COMPARACAO_DESEMPENHO') ||
    facetas.includes('ESTATISTICAS_DESEMPENHO')
  ) return 'DESEMPENHO_ESPORTIVO';

  if (/\brenovacao\b|\bcontrato\b|\bacordo\b/.test(texto)) {
    return 'SITUACAO_CONTRATUAL';
  }

  if (/\blesao\b|\bdesfalque\b|\brecuperacao\b/.test(texto)) {
    return 'DISPONIBILIDADE_FISICA';
  }

  if (
    facetas.includes('CONTRATACAO') ||
    facetas.includes('INSCRICAO_COMPETICAO') ||
    facetas.includes('RECURSO_REGULATORIO')
  ) return 'SITUACAO_REGULATORIA_ATLETA';

  return null;
}

function extrairEstadosFactuais(texto) {
  const estados = [];
  const adicionar = estado => {
    if (!estados.includes(estado)) estados.push(estado);
  };

  if (/\bnegociava\b|\bja negociava\b/.test(texto)) {
    adicionar('NEGOCIACAO_PASSADA');
  }
  if (/\bpossivel\b|\bpoderia\b|\bpode\b|\btenta\b/.test(texto)) {
    adicionar('POSSIBILIDADE');
  }
  if (/\brecurso\b|\brecorre\b|\brecorreu\b/.test(texto)) {
    adicionar('RECURSO_APRESENTADO');
  }
  if (/\breacao\b|\brepercussao\b|\bprovoca\b|\bmanda recado\b/.test(texto)) {
    adicionar('REPERCUSSAO');
  }
  if (
    /\bavanca\b.*\brenovacao\b|\bnegocia\b.*\brenovacao\b|\bconversas?\b.*\brenovacao\b/.test(texto)
  ) adicionar('NEGOCIACAO_EM_ANDAMENTO');
  if (
    /\bacerta\b.*\brenovacao\b|\brenovou\b|\brenova contrato\b|\bfecha acordo\b/.test(texto)
  ) adicionar('ACORDO_CONFIRMADO');
  if (/\bassinou\b|\bassina contrato\b/.test(texto)) {
    adicionar('CONTRATO_ASSINADO');
  }
  if (/\bdeve assinar\b|\bassinatura deve ocorrer\b|\bassinatura pendente\b/.test(texto)) {
    adicionar('ASSINATURA_PENDENTE');
  }
  if (/\bplaneja\b|\bplanejamento\b|\bdiscute ingressos\b|\bprepara venda\b/.test(texto)) {
    adicionar('PLANEJAMENTO');
  }
  if (/\bestuda\b|\bem estudo\b/.test(texto)) {
    adicionar('EM_ESTUDO');
  }
  if (/\bse manifesta\b|\bmanifestacao\b|\bnota oficial\b/.test(texto)) {
    adicionar('MANIFESTACAO_PUBLICA');
  }

  return estados;
}

function localizarEntidades(texto, dicionario = CLUBES) {
  const entidades = [];
  for (const [nome, aliases] of dicionario) {
    let primeiraPosicao = -1;
    for (const alias of aliases) {
      const regex = new RegExp(`(^|\\s)${escaparRegex(alias)}($|\\s)`);
      const match = regex.exec(texto);
      if (match) {
        const posicao = match.index + (match[1] ? match[1].length : 0);
        if (primeiraPosicao < 0 || posicao < primeiraPosicao) {
          primeiraPosicao = posicao;
        }
      }
    }
    if (primeiraPosicao >= 0) entidades.push({ nome, posicao: primeiraPosicao });
  }
  return entidades.sort((a, b) => a.posicao - b.posicao);
}

function extrairParticipantes(texto, dicionario = CLUBES) {
  const entidades = localizarEntidades(texto, dicionario);
  if (entidades.length <= 2) {
    return {
      participantes: entidades.map(item => item.nome),
      entidades_mencionadas: entidades.map(item => item.nome),
      confianca: entidades.length === 2 ? 0.9 : entidades.length === 1 ? 0.55 : 0
    };
  }

  const conectores = [];
  const regexConector = /\s(?:x|contra)\s/g;
  let match;
  while ((match = regexConector.exec(texto)) !== null) {
    conectores.push(match.index);
  }

  for (const posicaoConector of conectores) {
    const anteriores = entidades.filter(item => item.posicao < posicaoConector);
    const posteriores = entidades.filter(item => item.posicao > posicaoConector);
    const anterior = anteriores[anteriores.length - 1];
    const posterior = posteriores[0];
    if (anterior && posterior && anterior.nome !== posterior.nome) {
      return {
        participantes: [anterior.nome, posterior.nome],
        entidades_mencionadas: entidades.map(item => item.nome),
        confianca: 0.9
      };
    }
  }

  return {
    participantes: [],
    entidades_mencionadas: entidades.map(item => item.nome),
    confianca: 0.25
  };
}

function dataIsoValida(ano, mes, dia) {
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  if (
    data.getUTCFullYear() !== ano ||
    data.getUTCMonth() !== mes - 1 ||
    data.getUTCDate() !== dia
  ) return null;
  return `${String(ano).padStart(4, '0')}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

function extrairAnoAncora(item) {
  const valores = [
    item?.validade_temporal?.referencia_conteudo?.data,
    item?.iso_date,
    item?.data_publicacao,
    item?.data
  ];
  for (const valor of valores) {
    const match = String(valor ?? '').match(/\b(20\d{2})\b/);
    if (match) return Number(match[1]);
  }
  return null;
}

function extrairDataEvento(item, titulo) {
  const inicio = item?.validade_temporal?.evento?.inicio;
  const matchInicio = String(inicio ?? '').match(/^(20\d{2}-\d{2}-\d{2})/);
  if (matchInicio) {
    return { data: matchInicio[1], origem: 'validade_temporal', confianca: 1 };
  }

  const anoAncora = extrairAnoAncora(item);
  const link = String(item?.link ?? item?.url ?? item?.post_id ?? '');
  let linkDecodificado = link;
  try {
    linkDecodificado = decodeURIComponent(link);
  } catch (error) {
    linkDecodificado = link;
  }
  const fontes = [
    { valor: String(titulo ?? ''), origem: 'titulo' },
    { valor: linkDecodificado, origem: 'link' }
  ];

  for (const fonte of fontes) {
    const regex = /\b([0-3]?\d)[\/-]([01]?\d)(?:[\/-](20\d{2}))?\b/g;
    let match;
    while ((match = regex.exec(fonte.valor)) !== null) {
      const dia = Number(match[1]);
      const mes = Number(match[2]);
      const ano = match[3] ? Number(match[3]) : anoAncora;
      if (!ano) continue;
      const data = dataIsoValida(ano, mes, dia);
      if (data) {
        return {
          data,
          origem: fonte.origem,
          confianca: match[3] ? 1 : 0.9
        };
      }
    }
  }

  return { data: null, origem: null, confianca: 0 };
}

function criarAssinatura(item, titulo, dicionarios = null) {
  const texto = obterTextoContextual(item, titulo);
  const textoTitulo = normalizarTexto(titulo);
  const participantes = extrairParticipantes(texto, dicionarios?.clubes ?? CLUBES);
  const pessoas = extrairPessoasPrincipais(texto, dicionarios?.pessoas ?? PESSOAS);
  const facetas = extrairFacetas(texto);
  const dataEvento = extrairDataEvento(item, titulo);
  return {
    participantes: participantes.participantes,
    entidades_mencionadas: participantes.entidades_mencionadas,
    confianca_participantes: participantes.confianca,
    pessoas_principais: pessoas.pessoas,
    confianca_pessoas: pessoas.confianca,
    organizacoes: extrairOrganizacoes(texto, dicionarios?.organizacoes ?? ORGANIZACOES),
    competicao: extrairCompeticao(texto, dicionarios?.competicoes ?? COMPETICOES),
    fases_competicao: extrairFasesCompeticao(texto),
    facetas,
    objeto_factual: extrairObjetoFactual(texto, facetas),
    estados_factuais: extrairEstadosFactuais(texto),
    periodos_referencia: extrairPeriodosReferencia(textoTitulo),
    data_evento: dataEvento.data,
    origem_data_evento: dataEvento.origem,
    confianca_data_evento: dataEvento.confianca
  };
}

function competicoesCompativeis(a, b) {
  if (!a || !b) return { conhecida: false, compativel: null };
  if (a === b) return { conhecida: true, compativel: true };
  const familiaA = a.startsWith('BRASILEIRAO');
  const familiaB = b.startsWith('BRASILEIRAO');
  if (familiaA && familiaB && (a === 'BRASILEIRAO' || b === 'BRASILEIRAO')) {
    return { conhecida: true, compativel: true };
  }
  return { conhecida: true, compativel: false };
}

function compararAssinaturas(assinaturaA, assinaturaB, scoreLexical) {
  const confirmados = [];
  const ausentes = [];
  const conflitos = [];
  const diferencasContextuais = [];
  let ajuste = 0;

  const participantesA = assinaturaA.participantes;
  const participantesB = assinaturaB.participantes;
  const comunsParticipantes = intersecao(participantesA, participantesB);
  const ambosComPar = participantesA.length >= 2 && participantesB.length >= 2;
  const participantesExatos =
    ambosComPar &&
    participantesA.length === participantesB.length &&
    comunsParticipantes.length === participantesA.length;

  if (participantesExatos) {
    confirmados.push('participantes');
    ajuste += CONFIG.pesosContextuais.participantesExatos;
  } else if (ambosComPar && comunsParticipantes.length > 0) {
    conflitos.push('PARTICIPANTES_DIVERGENTES');
  } else if (comunsParticipantes.length > 0) {
    confirmados.push('participantes_parciais');
    ajuste += CONFIG.pesosContextuais.participantesParciais;
  } else if (participantesA.length === 0 || participantesB.length === 0) {
    ausentes.push('participantes');
  }

  const pessoasA = assinaturaA.pessoas_principais ?? [];
  const pessoasB = assinaturaB.pessoas_principais ?? [];
  const comunsPessoas = intersecao(pessoasA, pessoasB);
  const ambosComPessoas = pessoasA.length > 0 && pessoasB.length > 0;
  const pessoasExatas =
    ambosComPessoas &&
    pessoasA.length === pessoasB.length &&
    comunsPessoas.length === pessoasA.length;

  if (pessoasExatas) {
    confirmados.push('pessoas_principais');
    ajuste += CONFIG.pesosContextuais.pessoasExatas;
  } else if (ambosComPessoas && comunsPessoas.length === 0) {
    conflitos.push('PESSOAS_DIVERGENTES');
  } else if (pessoasA.length >= 2 && pessoasB.length >= 2) {
    conflitos.push('PESSOAS_DIVERGENTES');
  } else if (comunsPessoas.length > 0) {
    confirmados.push('pessoas_parciais');
    ajuste += CONFIG.pesosContextuais.pessoasParciais;
  } else if (!ambosComPessoas) {
    ausentes.push('pessoas_principais');
  }

  const organizacoesA = assinaturaA.organizacoes ?? [];
  const organizacoesB = assinaturaB.organizacoes ?? [];
  const organizacoesComuns = intersecao(organizacoesA, organizacoesB);
  if (organizacoesA.length === 0 || organizacoesB.length === 0) {
    ausentes.push('organizacoes');
  } else if (organizacoesComuns.length > 0) {
    confirmados.push('organizacao');
    ajuste += CONFIG.pesosContextuais.organizacaoCompativel;
  } else {
    diferencasContextuais.push('ORGANIZACAO_DISTINTA');
  }

  const competicao = competicoesCompativeis(
    assinaturaA.competicao,
    assinaturaB.competicao
  );
  if (!competicao.conhecida) {
    ausentes.push('competicao');
  } else if (competicao.compativel) {
    confirmados.push('competicao');
    ajuste += CONFIG.pesosContextuais.competicaoCompativel;
  } else {
    conflitos.push('COMPETICAO_DIVERGENTE');
  }

  const fasesA = assinaturaA.fases_competicao ?? [];
  const fasesB = assinaturaB.fases_competicao ?? [];
  const fasesComuns = intersecao(fasesA, fasesB);
  if (fasesA.length === 0 || fasesB.length === 0) {
    ausentes.push('fase_competicao');
  } else if (fasesComuns.length > 0) {
    confirmados.push('fase_competicao');
    ajuste += CONFIG.pesosContextuais.faseCompeticaoIgual;
  } else {
    conflitos.push('FASE_COMPETICAO_DIVERGENTE');
  }

  if (!assinaturaA.data_evento || !assinaturaB.data_evento) {
    ausentes.push('data_evento');
  } else if (assinaturaA.data_evento === assinaturaB.data_evento) {
    confirmados.push('data_evento');
    ajuste += CONFIG.pesosContextuais.dataIgual;
  } else {
    conflitos.push('DATA_EVENTO_DIVERGENTE');
  }

  const periodosA = assinaturaA.periodos_referencia ?? [];
  const periodosB = assinaturaB.periodos_referencia ?? [];
  const periodosComuns = intersecao(periodosA, periodosB);
  if (periodosA.length === 0 || periodosB.length === 0) {
    ausentes.push('periodo_referencia');
  } else if (periodosComuns.length > 0) {
    confirmados.push('periodo_referencia');
    ajuste += CONFIG.pesosContextuais.periodoIgual;
  } else {
    conflitos.push('PERIODO_DIVERGENTE');
  }

  if (!assinaturaA.objeto_factual || !assinaturaB.objeto_factual) {
    ausentes.push('objeto_factual');
  } else if (assinaturaA.objeto_factual === assinaturaB.objeto_factual) {
    confirmados.push('objeto_factual');
    ajuste += CONFIG.pesosContextuais.objetoCompativel;
  } else {
    conflitos.push('OBJETO_DIVERGENTE');
  }

  const estadosA = assinaturaA.estados_factuais ?? [];
  const estadosB = assinaturaB.estados_factuais ?? [];
  const estadosComuns = intersecao(estadosA, estadosB);
  if (estadosA.length === 0 || estadosB.length === 0) {
    ausentes.push('estado_factual');
  } else if (estadosComuns.length > 0) {
    confirmados.push('estado_factual');
    ajuste += CONFIG.pesosContextuais.estadoFactualCompativel;
  } else {
    diferencasContextuais.push('ESTADO_FACTUAL_DISTINTO');
  }

  const facetasComuns = intersecao(assinaturaA.facetas, assinaturaB.facetas);
  const ambasComFaceta = assinaturaA.facetas.length > 0 && assinaturaB.facetas.length > 0;
  if (facetasComuns.length > 0) {
    confirmados.push('faceta_editorial');
    ajuste += CONFIG.pesosContextuais.facetaCompartilhada;
  } else if (ambasComFaceta) {
    ajuste += CONFIG.pesosContextuais.facetaDistinta;
  } else {
    ausentes.push('faceta_editorial');
  }

  const conflitoCritico = conflitos.length > 0;
  const identidadeInstitucionalCompartilhada =
    organizacoesComuns.length > 0 &&
    competicao.conhecida &&
    competicao.compativel &&
    fasesComuns.length > 0;
  const possuiIdentidadeCompartilhada =
    comunsParticipantes.length > 0 ||
    comunsPessoas.length > 0 ||
    identidadeInstitucionalCompartilhada;
  let scoreContextual = limitar01(Number(scoreLexical) + ajuste);
  if (conflitoCritico) {
    scoreContextual = limitar01(
      Number(scoreLexical) * CONFIG.pesosContextuais.conflitoCriticoMultiplicador
    );
  } else if (!possuiIdentidadeCompartilhada) {
    // Periodo, objeto ou faceta genericos nao elevam sozinhos um par
    // sem clube ou pessoa principal compartilhada.
    scoreContextual = limitar01(Number(scoreLexical));
  }

  let relacao = 'CONTEXTO_INSUFICIENTE';
  let recomendacao = 'SEM_RECOMENDACAO';
  const identidadePrincipalExata =
    participantesExatos || pessoasExatas || identidadeInstitucionalCompartilhada;
  const identidadesComuns =
    comunsParticipantes.length +
    comunsPessoas.length +
    (identidadeInstitucionalCompartilhada ? 1 : 0);
  const referenciaTemporalConfirmada =
    confirmados.includes('data_evento') ||
    confirmados.includes('periodo_referencia');
  const estadoFactualDistinto =
    estadosA.length > 0 &&
    estadosB.length > 0 &&
    estadosComuns.length === 0;

  if (conflitoCritico) {
    relacao = 'INCOMPATIVEL';
    recomendacao = 'DESCARTAR_EQUIVALENCIA';
  } else if (
    identidadePrincipalExata &&
    facetasComuns.length > 0 &&
    estadoFactualDistinto
  ) {
    relacao = 'MESMO_EVENTO_OUTRA_FASE';
    recomendacao = 'ATUALIZACAO';
  } else if (identidadePrincipalExata && facetasComuns.length > 0) {
    relacao = 'COMPATIVEL_FORTE';
    recomendacao = 'SUSPEITO_ALTO';
  } else if (identidadePrincipalExata && ambasComFaceta && facetasComuns.length === 0) {
    relacao = 'MESMO_EVENTO_OUTRA_FACETA';
    recomendacao = 'RELACIONADO';
  } else if (
    referenciaTemporalConfirmada &&
    facetasComuns.length > 0 &&
    identidadesComuns > 0
  ) {
    relacao = 'COMPATIVEL_PARCIAL';
    recomendacao = 'SUSPEITO';
  } else if (confirmados.length > 0 && possuiIdentidadeCompartilhada) {
    relacao = 'COMPATIVEL_PARCIAL';
    recomendacao = 'RELACIONADO';
  }

  return {
    relacao,
    recomendacao,
    score_contextual: round4(scoreContextual),
    percentual_contextual: percentual(scoreContextual),
    ajuste_contextual: round4(scoreContextual - Number(scoreLexical)),
    atributos_confirmados: confirmados,
    atributos_ausentes: [...new Set(ausentes)],
    conflitos,
    diferencas_contextuais: diferencasContextuais,
    facetas_compartilhadas: facetasComuns,
    pessoas_compartilhadas: comunsPessoas,
    organizacoes_compartilhadas: organizacoesComuns,
    fases_competicao_compartilhadas: fasesComuns,
    periodos_compartilhados: periodosComuns,
    estados_factuais_compartilhados: estadosComuns
  };
}

const CAMPOS_VOCABULARIO = [
  'participantes',
  'entidades_mencionadas',
  'confianca_participantes',
  'pessoas_principais',
  'confianca_pessoas',
  'organizacoes',
  'competicao'
];

function divergenciasVocabulario(estatica, dinamica) {
  return CAMPOS_VOCABULARIO.filter(campo =>
    JSON.stringify(estatica[campo]) !== JSON.stringify(dinamica[campo])
  );
}

const tokensCandidato = tokenizarSemantico(tituloCandidato);
const tokensFracosCandidato = obterTokensEditoriaisFracos(tituloCandidato);
const assinaturaCandidato = criarAssinatura(candidato, tituloCandidato);
const dicionariosObservados = vocabularioObservado.dicionarios;
const assinaturaCandidatoObservada = dicionariosObservados
  ? criarAssinatura(candidato, tituloCandidato, dicionariosObservados)
  : null;
const divergenciasCandidato = assinaturaCandidatoObservada
  ? divergenciasVocabulario(assinaturaCandidato, assinaturaCandidatoObservada)
  : [];
const textoCandidatoObservado = obterTextoContextual(candidato, tituloCandidato);
const idsRegrasCandidato = dicionariosObservados
  ? vocabularioObservado.regras
      .filter(regra => contemExpressao(textoCandidatoObservado, regra.expressao))
      .map(regra => Number(regra.regra_id))
      .sort((a, b) => a - b)
  : [];
let totalComparaveisDivergentes = 0;
const exemplosComparaveisDivergentes = [];
const resultados = [];

for (const registro of comparaveis) {
  const tituloBanco = String(registro?.titulo ?? '').trim();
  if (!tituloBanco) continue;

  const tokensBanco = tokenizarSemantico(tituloBanco);
  if (tokensCandidato.length === 0 || tokensBanco.length === 0) continue;

  const tokensComuns = intersecao(tokensCandidato, tokensBanco);
  const jaccard = calcularJaccard(tokensCandidato, tokensBanco);
  const dice = calcularDice(tokensCandidato, tokensBanco);
  const coberturaMenor = calcularCoberturaMenor(tokensCandidato, tokensBanco);
  const scoreComposto =
    (0.30 * jaccard) +
    (0.30 * dice) +
    (0.40 * coberturaMenor);

  const assinaturaBanco = criarAssinatura(registro, tituloBanco);
  if (dicionariosObservados) {
    const observada = criarAssinatura(registro, tituloBanco, dicionariosObservados);
    const camposDivergentes = divergenciasVocabulario(assinaturaBanco, observada);
    if (camposDivergentes.length > 0) {
      totalComparaveisDivergentes++;
      if (exemplosComparaveisDivergentes.length < 5) {
        exemplosComparaveisDivergentes.push({
          id: registro.legacy_id ?? registro.id ?? null,
          campos: camposDivergentes
        });
      }
    }
  }
  const analiseContextual = compararAssinaturas(
    assinaturaCandidato,
    assinaturaBanco,
    scoreComposto
  );

  resultados.push({
    id: registro.legacy_id ?? registro.id ?? null,
    titulo: tituloBanco,
    categoria: registro.categoria ?? null,
    data: registro.data ?? null,
    origem: registro.source_host ?? null,
    post_id: registro.post_id ?? null,
    metricas: {
      jaccard: round4(jaccard),
      dice: round4(dice),
      cobertura_titulo_menor: round4(coberturaMenor),
      tokens_comuns: tokensComuns.length,
      lista_tokens_comuns: tokensComuns,
      tokens_candidato: tokensCandidato.length,
      tokens_banco: tokensBanco.length,
      score_composto: round4(scoreComposto),
      percentual: percentual(scoreComposto)
    },
    auditoria: {
      tokens_semanticos_banco: tokensBanco,
      tokens_editoriais_fracos_banco: obterTokensEditoriaisFracos(tituloBanco)
    },
    assinatura_contextual: assinaturaBanco,
    analise_contextual: analiseContextual
  });
}

// A ordenacao produtiva continua exclusivamente lexical, como na v0.4.0.
resultados.sort((a, b) =>
  Number(b.metricas?.score_composto ?? 0) -
  Number(a.metricas?.score_composto ?? 0)
);

const topMatches = resultados.slice(0, CONFIG.topMatches);
const melhorMatch = topMatches[0] ?? null;
const segundoMatch = topMatches[1] ?? null;
const scoreMelhor = Number(melhorMatch?.metricas?.score_composto ?? 0);
const tokensComunsMelhor = Number(melhorMatch?.metricas?.tokens_comuns ?? 0);
const scoreSegundo = Number(segundoMatch?.metricas?.score_composto ?? 0);
const gapTop2 = Math.max(0, scoreMelhor - scoreSegundo);

let status = 'NOVO';
let evidencia = 'SEM_MATCH_RELEVANTE';

if (
  scoreMelhor >= CONFIG.limites.duplicado &&
  tokensComunsMelhor >= CONFIG.limites.minTokensDuplicado
) {
  status = 'DUPLICADO';
  evidencia = 'MATCH_FORTE';
} else if (
  scoreMelhor >= CONFIG.limites.suspeito &&
  tokensComunsMelhor >= CONFIG.limites.minTokensSuspeito
) {
  status = 'SUSPEITO';
  evidencia = 'MATCH_SUSPEITO';
} else if (scoreMelhor > 0) {
  status = 'NOVO';
  evidencia = 'MATCH_FRACO';
}

if (resultados.length === 0) {
  status = 'NOVO';
  evidencia = 'SEM_MATCH_RELEVANTE';
}

const rankingContextual = [...resultados]
  .sort((a, b) => {
    const prioridades = {
      COMPATIVEL_FORTE: 4,
      MESMO_EVENTO_OUTRA_FASE: 3,
      MESMO_EVENTO_OUTRA_FACETA: 3,
      COMPATIVEL_PARCIAL: 2,
      CONTEXTO_INSUFICIENTE: 1,
      INCOMPATIVEL: 0
    };
    const prioridadeA = prioridades[a.analise_contextual?.relacao] ?? 0;
    const prioridadeB = prioridades[b.analise_contextual?.relacao] ?? 0;
    if (prioridadeA !== prioridadeB) return prioridadeB - prioridadeA;
    return (
      Number(b.analise_contextual?.score_contextual ?? 0) -
      Number(a.analise_contextual?.score_contextual ?? 0)
    );
  })
  .slice(0, CONFIG.topMatches);

const melhorContextual = rankingContextual[0] ?? null;
const recomendacaoContextual =
  melhorContextual?.analise_contextual?.recomendacao ?? 'SEM_RECOMENDACAO';

const statusContextualSugerido =
  recomendacaoContextual === 'SUSPEITO_ALTO' ||
  recomendacaoContextual === 'SUSPEITO'
    ? 'SUSPEITO'
    : recomendacaoContextual === 'ATUALIZACAO'
      ? 'ATUALIZACAO'
    : recomendacaoContextual === 'RELACIONADO'
      ? 'RELACIONADO'
      : 'NOVO';

const auditoriaVocabulario = vocabularioEntrada ? {
  versao: String(vocabularioEntrada.versao ?? ''),
  modo: 'OBSERVACAO',
  aplicado_automaticamente: false,
  status: vocabularioObservado.status,
  total_regras: Number(vocabularioEntrada.total_regras ?? 0),
  ids_regras_acionadas_candidato: idsRegrasCandidato,
  campos_divergentes_candidato: divergenciasCandidato,
  total_comparaveis_auditados: dicionariosObservados ? resultados.length : 0,
  total_comparaveis_divergentes: totalComparaveisDivergentes,
  exemplos_comparaveis_divergentes: exemplosComparaveisDivergentes
} : null;

return [
  {
    json: {
      ...entradaSaida,
      duplicidade_editorial: {
        modo: CONFIG.modo,
        versao: CONFIG.versao,
        status,
        evidencia,
        score_composto: round4(scoreMelhor),
        percentual: percentual(scoreMelhor),
        gap_top2: round4(gapTop2),
        percentual_gap_top2: percentual(gapTop2),
        limites: {
          duplicado: CONFIG.limites.duplicado,
          suspeito: CONFIG.limites.suspeito,
          min_tokens_duplicado: CONFIG.limites.minTokensDuplicado,
          min_tokens_suspeito: CONFIG.limites.minTokensSuspeito
        },
        candidato: {
          titulo: tituloCandidato,
          tokens: tokensCandidato,
          quantidade_tokens: tokensCandidato.length,
          tokens_editoriais_fracos_ignorados: tokensFracosCandidato,
          assinatura_contextual: assinaturaCandidato
        },
        comparados: resultados.length,
        melhor_match: melhorMatch,
        top_matches: topMatches,
        baseline: {
          versao: CONFIG.baselineVersao,
          status,
          evidencia,
          preservado: true
        },
        analise_contextual: {
          versao: CONFIG.versao,
          modo: CONFIG.modoContextual,
          aplicado_automaticamente: false,
          status_sugerido: statusContextualSugerido,
          recomendacao: recomendacaoContextual,
          diverge_do_baseline: statusContextualSugerido !== status,
          melhor_match: melhorContextual,
          top_matches: rankingContextual,
          pesos: CONFIG.pesosContextuais,
          ...(auditoriaVocabulario ? { auditoria_vocabulario: auditoriaVocabulario } : {})
        }
      }
    }
  }
];
