const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const raiz = path.resolve(__dirname, '../..');
const codigoAnterior = fs.readFileSync(
  path.join(raiz, 'codes/m360/similaridade-editorial-v0.5.0-vocab-observacao.js'), 'utf8'
);
const codigoNovo = fs.readFileSync(
  path.join(raiz, 'codes/m360/similaridade-editorial-v0.5.1-vocab-primario.js'), 'utf8'
);
const seed = fs.readFileSync(
  path.join(raiz, 'sql/editorial/seeds/M360-vocabulario-v0.1.0-propor.sql'), 'utf8'
);
const match = seed.match(/'(\[\s*\{[\s\S]*?\}\s*\])'/);
assert.ok(match);
const regrasSeed = JSON.parse(match[1]);

function entrada() {
  return {
    resultado: 'CHECK_SIMILARITY',
    registro_id: 1331,
    candidato: {
      titulo: 'Brasileirão: jogo do Flamengo x Vasco vai passar na Globo hoje?',
      link: 'https://colunadofla.com/2026/10/brasileirao-jogo-do-flamengo-x-vasco-vai-passar-na-globo-hoje'
    },
    comparaveis: [
      { legacy_id: 3668, titulo: 'Jogo ao vivo, escalações e desfalques: saiba tudo sobre Vasco x Flamengo, pelo Brasileirão' },
      { legacy_id: 3623, titulo: 'Vasco x Flamengo Palpite – Onde assistir e escalações (29/10)' },
      { legacy_id: 3597, titulo: 'Jogo do Galo e Flamengo: onde assistir ao vivo pelo Brasileirão hoje' }
    ],
    vocabulario_editorial: {
      versao: '0.1.0',
      dominio: 'ESPORTE',
      consumidor: 'M360',
      modo: 'OBSERVACAO',
      aplicado_automaticamente: false,
      total_regras: regrasSeed.length,
      regras: regrasSeed.map((regra, indice) => ({
        ...regra,
        regra_id: indice + 1,
        tipo_expressao: 'LITERAL'
      }))
    }
  };
}

function executar(codigo, valor) {
  const node = new Function('$input', '$', codigo);
  return node(
    { first: () => ({ json: valor }) },
    nome => {
      if (nome !== 'Start Dedup') throw new Error(nome);
      return { first: () => ({ json: {} }) };
    }
  )[0].json;
}

function verificarDecisaoLexical(antigo, novo) {
  for (const campo of ['status', 'evidencia', 'score_composto', 'percentual', 'gap_top2']) {
    assert.deepEqual(novo.duplicidade_editorial[campo], antigo.duplicidade_editorial[campo]);
  }
  assert.equal(novo.duplicidade_editorial.melhor_match?.id, antigo.duplicidade_editorial.melhor_match?.id);
}

test('baseline de 72 regras passa a ser fonte contextual sem alterar NOVO nem assinaturas', () => {
  const valor = entrada();
  const antigo = executar(codigoAnterior, valor);
  const novo = executar(codigoNovo, valor);
  const audit = novo.duplicidade_editorial.analise_contextual.auditoria_vocabulario;

  verificarDecisaoLexical(antigo, novo);
  assert.equal(novo.duplicidade_editorial.versao, '0.5.1');
  assert.deepEqual(
    novo.duplicidade_editorial.candidato.assinatura_contextual,
    antigo.duplicidade_editorial.candidato.assinatura_contextual
  );
  assert.deepEqual(
    novo.duplicidade_editorial.analise_contextual.recomendacao,
    antigo.duplicidade_editorial.analise_contextual.recomendacao
  );
  assert.equal(audit.status, 'CARREGADO_COMO_FONTE_CONTEXTUAL');
  assert.equal(audit.fonte_contextual, 'BANCO');
  assert.equal(audit.aplicado_no_contexto, true);
  assert.equal(audit.aplicado_na_decisao, false);
  assert.equal(audit.total_comparaveis_divergentes, 0);
  assert.equal(novo.vocabulario_editorial.regras, undefined);
});

test('73ª regra altera só contexto observado e mantém decisão lexical', () => {
  const valor = entrada();
  valor.candidato.titulo = 'Union La Calera enfrenta o Flamengo em amistoso';
  valor.candidato.link = 'https://exemplo.com/union-la-calera-flamengo';
  valor.comparaveis = [{ legacy_id: 10, titulo: 'Union La Calera x Flamengo: amistoso' }];
  valor.vocabulario_editorial.regras.push({
    regra_id: 73,
    tipo: 'ALIAS_CLUBE',
    tipo_expressao: 'LITERAL',
    expressao: 'union la calera',
    valor_canonico: 'UNION_LA_CALERA',
    prioridade: 50,
    confianca: 0.85
  });
  valor.vocabulario_editorial.total_regras = 73;

  const antigo = executar(codigoAnterior, valor);
  const novo = executar(codigoNovo, valor);
  const audit = novo.duplicidade_editorial.analise_contextual.auditoria_vocabulario;

  verificarDecisaoLexical(antigo, novo);
  assert.deepEqual(novo.duplicidade_editorial.candidato.assinatura_contextual.participantes,
    ['UNION_LA_CALERA', 'FLAMENGO']);
  assert.equal(antigo.duplicidade_editorial.candidato.assinatura_contextual.participantes.includes('UNION_LA_CALERA'), false);
  assert.ok(audit.campos_divergentes_candidato.includes('participantes'));
  assert.equal(audit.total_comparaveis_divergentes, 1);
  assert.ok(audit.ids_regras_acionadas_candidato.includes(73));
  assert.equal(audit.aplicado_na_decisao, false);
});

test('alias adicional acentuado casa com título normalizado', () => {
  const valor = entrada();
  valor.candidato = {
    titulo: 'São José enfrenta Flamengo em amistoso',
    link: 'https://exemplo.com/sao-jose-flamengo'
  };
  valor.comparaveis = [];
  valor.vocabulario_editorial.regras.push({
    regra_id: 73,
    tipo: 'ALIAS_CLUBE',
    tipo_expressao: 'LITERAL',
    expressao: 'São José',
    valor_canonico: 'SAO_JOSE',
    prioridade: 50,
    confianca: 0.85
  });
  valor.vocabulario_editorial.total_regras = 73;

  const novo = executar(codigoNovo, valor);
  const audit = novo.duplicidade_editorial.analise_contextual.auditoria_vocabulario;
  assert.deepEqual(novo.duplicidade_editorial.candidato.assinatura_contextual.participantes,
    ['SAO_JOSE', 'FLAMENGO']);
  assert.ok(audit.ids_regras_acionadas_candidato.includes(73));
  assert.equal(audit.fonte_contextual, 'BANCO');
});

test('aliases iguais após normalização não entram como fonte do banco', () => {
  const valor = entrada();
  valor.vocabulario_editorial.regras.push({
    regra_id: 73,
    tipo: 'ALIAS_CLUBE',
    tipo_expressao: 'LITERAL',
    expressao: 'Mêngão',
    valor_canonico: 'OUTRO_CLUBE',
    prioridade: 50,
    confianca: 0.85
  });
  valor.vocabulario_editorial.total_regras = 73;

  const novo = executar(codigoNovo, valor);
  const audit = novo.duplicidade_editorial.analise_contextual.auditoria_vocabulario;
  assert.equal(audit.fonte_contextual, 'ESTATICO_FALLBACK');
  assert.equal(audit.status, 'INVALIDO_FALLBACK_ESTATICO');
});

test('vocabulário inválido recua para estático e deixa trilha de auditoria', () => {
  const valor = entrada();
  valor.vocabulario_editorial.versao = '0.1.1';
  const antigo = executar(codigoAnterior, valor);
  const novo = executar(codigoNovo, valor);
  const audit = novo.duplicidade_editorial.analise_contextual.auditoria_vocabulario;

  verificarDecisaoLexical(antigo, novo);
  assert.deepEqual(novo.duplicidade_editorial.candidato.assinatura_contextual,
    antigo.duplicidade_editorial.candidato.assinatura_contextual);
  assert.equal(audit.fonte_contextual, 'ESTATICO_FALLBACK');
  assert.equal(audit.status, 'INVALIDO_FALLBACK_ESTATICO');
  assert.equal(audit.aplicado_no_contexto, false);
});

test('sem vocabulário recua para estático e mantém contrato de saída', () => {
  const valor = entrada();
  delete valor.vocabulario_editorial;
  const antigo = executar(codigoAnterior, valor);
  const novo = executar(codigoNovo, valor);

  verificarDecisaoLexical(antigo, novo);
  assert.deepEqual(novo.duplicidade_editorial.candidato.assinatura_contextual,
    antigo.duplicidade_editorial.candidato.assinatura_contextual);
  const audit = novo.duplicidade_editorial.analise_contextual.auditoria_vocabulario;
  assert.equal(audit.status, 'NAO_CARREGADO');
  assert.equal(audit.fonte_contextual, 'ESTATICO_FALLBACK');
  assert.equal(audit.aplicado_no_contexto, false);
});
