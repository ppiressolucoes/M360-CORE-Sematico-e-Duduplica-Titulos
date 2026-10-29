const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const raiz = path.resolve(__dirname, '../..');
const codigoV04 = fs.readFileSync(
  path.join(raiz, 'codes/m360/similaridade-editorial-v0.4.0.js'),
  'utf8'
);
const codigoV05 = fs.readFileSync(
  path.join(raiz, 'codes/m360/similaridade-editorial-v0.5.0.js'),
  'utf8'
);

function executar(codigo, entrada, start = {}) {
  const codeNode = new Function('$input', '$', codigo);
  const retorno = codeNode(
    { first: () => ({ json: entrada }) },
    nome => {
      if (nome !== 'Start Dedup') throw new Error(`Node inesperado: ${nome}`);
      return { first: () => ({ json: start }) };
    }
  );
  return retorno[0].json;
}

function criarEntrada() {
  return {
    resultado: 'CHECK_SIMILARITY',
    candidato: {
      titulo: 'Saiba onde assistir ao jogo do Flamengo x Vasco, pelo Brasileirão',
      link: 'https://colunadofla.com/2026/10/saiba-onde-assistir-ao-jogo-do-flamengo-x-vasco-pelo-brasileirao-3'
    },
    comparaveis: [
      {
        legacy_id: 3357,
        titulo: 'Brasileirão: Vasco planeja tirar jogo contra o Flamengo do Maracanã',
        categoria: 'extracaoFutebol',
        data: '2026-10-21 17:33:13',
        source_host: 'colunadofla.com',
        post_id: '/2026/10/brasileirao-vasco-planeja-tirar-jogo-contra-o-flamengo-do-maracana'
      },
      {
        legacy_id: 3501,
        titulo: 'Pedro Emanuel enxerga Vasco no mesmo nível que o Flamengo antes de clássico no Brasileirão',
        categoria: 'extracaoFutebol',
        data: '2026-10-25 17:48:31',
        source_host: 'colunadofla.com',
        post_id: '/2026/10/pedro-enxerga-vasco-no-mesmo-nivel-que-o-flamengo-antes-de-classico-no-brasileirao'
      },
      {
        legacy_id: 3623,
        titulo: 'Vasco x Flamengo Palpite – Onde assistir e escalações (29/10)',
        categoria: 'extracaoFutebol',
        data: '2026-10-27 23:04:06',
        source_host: 'trivela.com.br',
        post_id: '/onde-assistir/palpite-escalacoes-vasco-x-flamengo-29-10-2026/'
      }
    ]
  };
}

test('preserva a decisao lexical homologada da v0.4.0', () => {
  const entrada = criarEntrada();
  const v04 = executar(codigoV04, entrada).duplicidade_editorial;
  const v05 = executar(codigoV05, entrada).duplicidade_editorial;

  assert.equal(v05.status, v04.status);
  assert.equal(v05.evidencia, v04.evidencia);
  assert.equal(v05.score_composto, v04.score_composto);
  assert.equal(v05.percentual, v04.percentual);
  assert.equal(v05.gap_top2, v04.gap_top2);
  assert.deepEqual(v05.limites, v04.limites);
  assert.deepEqual(
    v05.top_matches.map(item => item.id),
    v04.top_matches.map(item => item.id)
  );
  assert.equal(v05.baseline.preservado, true);
});

test('reposiciona o comparavel de mesma faceta sem alterar o top lexical', () => {
  const saida = executar(codigoV05, criarEntrada()).duplicidade_editorial;

  assert.equal(saida.status, 'SUSPEITO');
  assert.equal(saida.melhor_match.id, 3357);
  assert.equal(saida.analise_contextual.melhor_match.id, 3623);
  assert.equal(
    saida.analise_contextual.melhor_match.analise_contextual.relacao,
    'COMPATIVEL_FORTE'
  );
  assert.equal(saida.analise_contextual.recomendacao, 'SUSPEITO_ALTO');
  assert.equal(saida.analise_contextual.aplicado_automaticamente, false);

  const matchLocal = saida.analise_contextual.top_matches.find(
    item => item.id === 3357
  );
  assert.equal(
    matchLocal.analise_contextual.relacao,
    'MESMO_EVENTO_OUTRA_FACETA'
  );
});

test('trata adversarios explicitamente diferentes como conflito critico', () => {
  const entrada = {
    candidato: {
      titulo: 'Vasco x Flamengo Palpite – Onde assistir e escalações (29/10)',
      iso_date: '2026-10-28T01:43:29Z'
    },
    comparaveis: [
      {
        legacy_id: 1,
        titulo: 'Flamengo x Estudiantes: palpite e onde assistir (29/10)',
        data: '2026-10-27 20:00:00'
      }
    ]
  };

  const analise = executar(codigoV05, entrada)
    .duplicidade_editorial
    .analise_contextual
    .melhor_match
    .analise_contextual;

  assert.equal(analise.relacao, 'INCOMPATIVEL');
  assert.equal(analise.recomendacao, 'DESCARTAR_EQUIVALENCIA');
  assert.deepEqual(analise.conflitos, ['PARTICIPANTES_DIVERGENTES']);
});

test('reconhece apelido de clube ao detectar adversario divergente', () => {
  const entrada = {
    candidato: {
      titulo: 'Saiba onde assistir Flamengo x Vasco pelo Brasileirão'
    },
    comparaveis: [
      {
        legacy_id: 2,
        titulo: 'Jogo do Galo e Flamengo: onde assistir ao vivo pelo Brasileirão hoje'
      }
    ]
  };

  const match = executar(codigoV05, entrada)
    .duplicidade_editorial
    .analise_contextual
    .melhor_match;

  assert.deepEqual(
    match.assinatura_contextual.participantes,
    ['ATLETICO_MG', 'FLAMENGO']
  );
  assert.equal(match.analise_contextual.relacao, 'INCOMPATIVEL');
  assert.ok(match.analise_contextual.conflitos.includes('PARTICIPANTES_DIVERGENTES'));
});

test('funciona com contrato minimo de titulo e link', () => {
  const entrada = {
    candidato: {
      titulo: 'Saiba onde assistir Flamengo x Vasco',
      link: 'https://exemplo.com/saiba-onde-assistir-flamengo-x-vasco'
    },
    comparaveis: [
      {
        legacy_id: 10,
        titulo: 'Flamengo x Vasco: transmissão ao vivo',
        post_id: '/flamengo-x-vasco-transmissao-ao-vivo'
      }
    ]
  };

  const contextual = executar(codigoV05, entrada)
    .duplicidade_editorial
    .analise_contextual;

  assert.equal(contextual.melhor_match.id, 10);
  assert.equal(contextual.recomendacao, 'SUSPEITO_ALTO');
  assert.deepEqual(
    contextual.melhor_match.assinatura_contextual.participantes.sort(),
    ['FLAMENGO', 'VASCO']
  );
});

test('atributo ausente permanece desconhecido e nao vira conflito', () => {
  const entrada = {
    candidato: {
      titulo: 'Jogo do Flamengo: quinta (29/10), horário e onde assistir',
      iso_date: '2026-10-27T17:03:52Z'
    },
    comparaveis: [
      {
        legacy_id: 11,
        titulo: 'Vasco x Flamengo: onde assistir (29/10)',
        data: '2026-10-27 23:00:00'
      }
    ]
  };

  const analise = executar(codigoV05, entrada)
    .duplicidade_editorial
    .analise_contextual
    .melhor_match
    .analise_contextual;

  assert.equal(analise.conflitos.length, 0);
  assert.equal(analise.relacao, 'COMPATIVEL_PARCIAL');
  assert.ok(analise.atributos_confirmados.includes('data_evento'));
  assert.ok(analise.atributos_confirmados.includes('faceta_editorial'));
});

test('nao suspeita apenas por equipe parcial e faceta sem data compartilhada', () => {
  const entrada = {
    candidato: {
      titulo: 'Jogo do Flamengo: quinta (29/10), horário e onde assistir',
      iso_date: '2026-10-27T17:03:52Z'
    },
    comparaveis: [
      {
        legacy_id: 12,
        titulo: 'Flamengo x Atlético-MG hoje: horário e onde assistir',
        data: '2026-10-26 20:00:00'
      }
    ]
  };

  const contextual = executar(codigoV05, entrada)
    .duplicidade_editorial
    .analise_contextual;

  assert.equal(contextual.recomendacao, 'RELACIONADO');
  assert.equal(contextual.status_sugerido, 'RELACIONADO');
  assert.equal(contextual.aplicado_automaticamente, false);
});

test('qualifica comparacao de desempenho pelas pessoas, objeto e periodo', () => {
  const entrada = {
    candidato: {
      titulo: 'Comentarista vê ano de Gabigol melhor que o de Pedro; compare os números de 2026'
    },
    comparaveis: [
      {
        legacy_id: 20,
        titulo: 'Gabriel Barbosa supera Pedro nos números da temporada de 2026'
      }
    ]
  };

  const contextual = executar(codigoV05, entrada)
    .duplicidade_editorial
    .analise_contextual;
  const match = contextual.melhor_match;

  assert.deepEqual(
    match.assinatura_contextual.pessoas_principais.sort(),
    ['GABIGOL', 'PEDRO']
  );
  assert.equal(match.assinatura_contextual.objeto_factual, 'DESEMPENHO_ESPORTIVO');
  assert.deepEqual(match.assinatura_contextual.periodos_referencia, ['2026']);
  assert.equal(match.analise_contextual.relacao, 'COMPATIVEL_FORTE');
  assert.equal(match.analise_contextual.recomendacao, 'SUSPEITO_ALTO');
  assert.deepEqual(match.analise_contextual.pessoas_compartilhadas.sort(), ['GABIGOL', 'PEDRO']);
  assert.deepEqual(match.analise_contextual.periodos_compartilhados, ['2026']);
});

test('periodos diferentes bloqueiam comparacoes recorrentes das mesmas pessoas', () => {
  const entrada = {
    candidato: {
      titulo: 'Gabigol tem números melhores que Pedro em 2026'
    },
    comparaveis: [
      {
        legacy_id: 21,
        titulo: 'Gabigol tem números melhores que Pedro em 2025'
      }
    ]
  };

  const analise = executar(codigoV05, entrada)
    .duplicidade_editorial
    .analise_contextual
    .melhor_match
    .analise_contextual;

  assert.equal(analise.relacao, 'INCOMPATIVEL');
  assert.ok(analise.conflitos.includes('PERIODO_DIVERGENTE'));
});

test('nao confunde Pedro Emanuel com o jogador Pedro', () => {
  const entrada = {
    candidato: {
      titulo: 'Pedro Emanuel enxerga Vasco no mesmo nível que o Flamengo'
    },
    comparaveis: [
      {
        legacy_id: 22,
        titulo: 'Pedro compara sua temporada com Gabigol em 2026'
      }
    ]
  };

  const assinaturaCandidato = executar(codigoV05, entrada)
    .duplicidade_editorial
    .candidato
    .assinatura_contextual;

  assert.deepEqual(assinaturaCandidato.pessoas_principais, []);
});

test('nao eleva estatistica do mesmo ano sem identidade compartilhada', () => {
  const entrada = {
    candidato: {
      titulo: 'Gabigol tem números melhores que Pedro em 2026'
    },
    comparaveis: [
      {
        legacy_id: 23,
        titulo: 'Flamengo tem números superiores ao Atlético-MG em 2026'
      }
    ]
  };

  const match = executar(codigoV05, entrada)
    .duplicidade_editorial
    .analise_contextual
    .melhor_match;

  assert.equal(match.analise_contextual.recomendacao, 'SEM_RECOMENDACAO');
  assert.equal(
    match.analise_contextual.score_contextual,
    match.metricas.score_composto
  );
});

test('mantem fatos regulatorios distintos do caso Rojo como relacionados', () => {
  const entrada = {
    candidato: {
      titulo: 'Estudiantes já negociava contratação de Rojo antes de possível brecha para inscrevê-lo na Libertadores'
    },
    comparaveis: [
      {
        legacy_id: 30,
        titulo: 'A reação do Estudiantes com recurso sobre o caso Rojo na Libertadores'
      }
    ]
  };

  const saida = executar(codigoV05, entrada).duplicidade_editorial;
  const assinatura = saida.candidato.assinatura_contextual;
  const match = saida.analise_contextual.melhor_match;

  assert.deepEqual(assinatura.pessoas_principais, ['MARCOS_ROJO']);
  assert.deepEqual(assinatura.facetas, ['CONTRATACAO', 'INSCRICAO_COMPETICAO']);
  assert.equal(assinatura.objeto_factual, 'SITUACAO_REGULATORIA_ATLETA');
  assert.deepEqual(
    assinatura.estados_factuais,
    ['NEGOCIACAO_PASSADA', 'POSSIBILIDADE']
  );
  assert.equal(match.analise_contextual.relacao, 'MESMO_EVENTO_OUTRA_FACETA');
  assert.equal(match.analise_contextual.recomendacao, 'RELACIONADO');
  assert.ok(match.analise_contextual.diferencas_contextuais.includes('ESTADO_FACTUAL_DISTINTO'));
});

test('eleva para suspeito quando pessoa, objeto e faceta regulatoria coincidem', () => {
  const entrada = {
    candidato: {
      titulo: 'Estudiantes já negociava contratação de Rojo para inscrevê-lo na Libertadores'
    },
    comparaveis: [
      {
        legacy_id: 31,
        titulo: 'Antes da inscrição, Estudiantes negociava a contratação de Marcos Rojo na Libertadores'
      }
    ]
  };

  const contextual = executar(codigoV05, entrada)
    .duplicidade_editorial
    .analise_contextual;

  assert.equal(contextual.melhor_match.analise_contextual.relacao, 'COMPATIVEL_FORTE');
  assert.equal(contextual.recomendacao, 'SUSPEITO_ALTO');
  assert.equal(contextual.status_sugerido, 'SUSPEITO');
});

test('prioriza relacao contextual mais explicativa antes do score lexical', () => {
  const entrada = {
    candidato: {
      titulo: 'Estudiantes negociava contratação de Rojo para inscrição na Libertadores'
    },
    comparaveis: [
      {
        legacy_id: 40,
        titulo: 'Libertadores: Estudiantes fala sobre caso Rojo e Flamengo'
      },
      {
        legacy_id: 41,
        titulo: 'Flamengo recorre da escalação de Rojo do Estudiantes na Libertadores'
      }
    ]
  };

  const contextual = executar(codigoV05, entrada)
    .duplicidade_editorial
    .analise_contextual;

  assert.equal(contextual.melhor_match.id, 41);
  assert.equal(
    contextual.melhor_match.analise_contextual.relacao,
    'MESMO_EVENTO_OUTRA_FACETA'
  );
});

test('reconhece renovacao em andamento de Leo Pereira', () => {
  const entrada = {
    candidato: {
      titulo: 'Léo Pereira avança para renovação de contrato com o Flamengo'
    },
    comparaveis: [
      {
        legacy_id: 50,
        titulo: 'Léo Pereira rebate tese após queda do Flamengo'
      }
    ]
  };

  const saida = executar(codigoV05, entrada).duplicidade_editorial;
  const assinatura = saida.candidato.assinatura_contextual;

  assert.deepEqual(assinatura.pessoas_principais, ['LEO_PEREIRA']);
  assert.deepEqual(assinatura.facetas, ['RENOVACAO_CONTRATUAL']);
  assert.equal(assinatura.objeto_factual, 'SITUACAO_CONTRATUAL');
  assert.deepEqual(assinatura.estados_factuais, ['NEGOCIACAO_EM_ANDAMENTO']);
  assert.equal(saida.analise_contextual.recomendacao, 'RELACIONADO');
});

test('suspeita de duas formulacoes da mesma negociacao contratual', () => {
  const entrada = {
    candidato: {
      titulo: 'Léo Pereira avança para renovação de contrato com o Flamengo'
    },
    comparaveis: [
      {
        legacy_id: 51,
        titulo: 'Flamengo avança nas conversas para renovação de Léo Pereira'
      }
    ]
  };

  const contextual = executar(codigoV05, entrada)
    .duplicidade_editorial
    .analise_contextual;

  assert.equal(contextual.recomendacao, 'SUSPEITO_ALTO');
  assert.equal(contextual.status_sugerido, 'SUSPEITO');
});

test('trata renovacao confirmada como atualizacao da negociacao', () => {
  const entrada = {
    candidato: {
      titulo: 'Léo Pereira avança para renovação de contrato com o Flamengo'
    },
    comparaveis: [
      {
        legacy_id: 52,
        titulo: 'Léo Pereira renova contrato com o Flamengo'
      }
    ]
  };

  const contextual = executar(codigoV05, entrada)
    .duplicidade_editorial
    .analise_contextual;

  assert.equal(
    contextual.melhor_match.analise_contextual.relacao,
    'MESMO_EVENTO_OUTRA_FASE'
  );
  assert.equal(contextual.recomendacao, 'ATUALIZACAO');
  assert.equal(contextual.status_sugerido, 'ATUALIZACAO');
});

test('bloqueia contratos de pessoas principais diferentes', () => {
  const entrada = {
    candidato: {
      titulo: 'Léo Pereira avança para renovação de contrato com o Flamengo'
    },
    comparaveis: [
      {
        legacy_id: 53,
        titulo: 'Danilo acerta renovação com Flamengo; assinatura deve ocorrer hoje'
      }
    ]
  };

  const analise = executar(codigoV05, entrada)
    .duplicidade_editorial
    .analise_contextual
    .melhor_match
    .analise_contextual;

  assert.equal(analise.relacao, 'INCOMPATIVEL');
  assert.ok(analise.conflitos.includes('PESSOAS_DIVERGENTES'));
});

test('reconhece planejamento de venda de ingressos da final', () => {
  const entrada = {
    candidato: {
      titulo: 'E o Flamengo? Conmebol já planeja venda para final da Libertadores'
    },
    comparaveis: [
      {
        legacy_id: 60,
        titulo: 'Conmebol prepara venda de ingressos para a final da Libertadores'
      }
    ]
  };

  const saida = executar(codigoV05, entrada).duplicidade_editorial;
  const assinatura = saida.candidato.assinatura_contextual;

  assert.deepEqual(assinatura.organizacoes, ['CONMEBOL']);
  assert.deepEqual(assinatura.fases_competicao, ['FINAL']);
  assert.deepEqual(assinatura.facetas, ['VENDA_INGRESSOS']);
  assert.equal(assinatura.objeto_factual, 'COMERCIALIZACAO_INGRESSOS');
  assert.deepEqual(assinatura.estados_factuais, ['PLANEJAMENTO']);
  assert.equal(saida.analise_contextual.recomendacao, 'SUSPEITO_ALTO');
});

test('nao confunde venda da final com pauta juridico disciplinar', () => {
  const entrada = {
    candidato: {
      titulo: 'Conmebol planeja venda de ingressos para a final da Libertadores'
    },
    comparaveis: [
      {
        legacy_id: 61,
        titulo: 'Flamengo vai à Justiça e Conmebol estuda punir clube antes da final da Libertadores'
      }
    ]
  };

  const analise = executar(codigoV05, entrada)
    .duplicidade_editorial
    .analise_contextual
    .melhor_match
    .analise_contextual;

  assert.equal(analise.relacao, 'INCOMPATIVEL');
  assert.ok(analise.conflitos.includes('OBJETO_DIVERGENTE'));
});

test('fases diferentes da mesma competicao bloqueiam equivalencia', () => {
  const entrada = {
    candidato: {
      titulo: 'Conmebol planeja venda de ingressos para a final da Libertadores'
    },
    comparaveis: [
      {
        legacy_id: 62,
        titulo: 'Conmebol planeja venda de ingressos para a semifinal da Libertadores'
      }
    ]
  };

  const analise = executar(codigoV05, entrada)
    .duplicidade_editorial
    .analise_contextual
    .melhor_match
    .analise_contextual;

  assert.equal(analise.relacao, 'INCOMPATIVEL');
  assert.ok(analise.conflitos.includes('FASE_COMPETICAO_DIVERGENTE'));
});

test('unifica discussao de ingressos e planejamento de venda da final', () => {
  const entrada = {
    candidato: {
      titulo: 'E o Flamengo? Conmebol já planeja venda para final da Libertadores'
    },
    comparaveis: [
      {
        legacy_id: 63,
        titulo: 'Conmebol já discute ingressos com Palmeiras e Estudiantes para a final da Libertadores'
      }
    ]
  };

  const contextual = executar(codigoV05, entrada)
    .duplicidade_editorial
    .analise_contextual;
  const match = contextual.melhor_match;

  assert.deepEqual(match.assinatura_contextual.facetas, ['VENDA_INGRESSOS']);
  assert.equal(match.assinatura_contextual.objeto_factual, 'COMERCIALIZACAO_INGRESSOS');
  assert.deepEqual(match.assinatura_contextual.estados_factuais, ['PLANEJAMENTO']);
  assert.equal(match.analise_contextual.relacao, 'COMPATIVEL_FORTE');
  assert.equal(contextual.recomendacao, 'SUSPEITO_ALTO');
  assert.equal(contextual.status_sugerido, 'SUSPEITO');
});
