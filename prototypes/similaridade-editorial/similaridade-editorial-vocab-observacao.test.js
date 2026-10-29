const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const raiz = path.resolve(__dirname, '../..');
const codigoBase = fs.readFileSync(
  path.join(raiz, 'codes/m360/similaridade-editorial-v0.5.0.js'), 'utf8'
);
const codigoObservacao = fs.readFileSync(
  path.join(raiz, 'codes/m360/similaridade-editorial-v0.5.0-vocab-observacao.js'), 'utf8'
);
const sqlSeed = fs.readFileSync(
  path.join(raiz, 'sql/editorial/seeds/M360-vocabulario-v0.1.0-propor.sql'), 'utf8'
);
const match = sqlSeed.match(/'(\[\s*\{[\s\S]*?\}\s*\])'/);
assert.ok(match);
const regrasSeed = JSON.parse(match[1]);

function entradaBase() {
  return {
    resultado: 'CHECK_SIMILARITY',
    registro_id: 1276,
    candidato: {
      titulo: 'Palmeiras x Santos: Flamengo acompanha resultado do Brasileirão',
      link: 'https://exemplo.com/palmeiras-x-santos-flamengo-brasileirao'
    },
    comparaveis: [
      { legacy_id: 1, titulo: 'Palmeiras x Santos: escalações do Brasileirão' },
      { legacy_id: 2, titulo: 'Pedro Emanuel comenta jogo do Flamengo' },
      { legacy_id: 3, titulo: 'Conmebol prepara venda de ingressos da final da Libertadores' }
    ]
  };
}

function entradaComVocabulario() {
  return {
    ...entradaBase(),
    vocabulario_editorial: {
      versao: '0.1.0',
      dominio: 'ESPORTE',
      consumidor: 'M360',
      modo: 'OBSERVACAO',
      aplicado_automaticamente: false,
      total_regras: 72,
      regras: regrasSeed.map((regra, indice) => ({
        ...regra,
        regra_id: indice + 1,
        tipo_expressao: 'LITERAL'
      }))
    }
  };
}

function executar(codigo, entrada) {
  const node = new Function('$input', '$', codigo);
  return node(
    { first: () => ({ json: entrada }) },
    nome => {
      if (nome !== 'Start Dedup') throw new Error(nome);
      return { first: () => ({ json: {} }) };
    }
  )[0].json;
}

test('sem vocabulário mantém saída funcional idêntica à v0.5.0', () => {
  const entrada = entradaBase();
  assert.deepEqual(executar(codigoObservacao, entrada), executar(codigoBase, entrada));
});

test('com vocabulário compara em sombra, preserva decisão e omite regras', () => {
  const entrada = entradaComVocabulario();
  const base = executar(codigoBase, entrada);
  const saida = executar(codigoObservacao, entrada);
  const audit = saida.duplicidade_editorial.analise_contextual.auditoria_vocabulario;

  assert.equal(saida.duplicidade_editorial.status, base.duplicidade_editorial.status);
  assert.equal(saida.duplicidade_editorial.percentual, base.duplicidade_editorial.percentual);
  assert.equal(saida.duplicidade_editorial.melhor_match.id, base.duplicidade_editorial.melhor_match.id);
  assert.equal(
    saida.duplicidade_editorial.analise_contextual.recomendacao,
    base.duplicidade_editorial.analise_contextual.recomendacao
  );
  assert.equal(audit.status, 'CARREGADO_EM_OBSERVACAO');
  assert.equal(audit.aplicado_automaticamente, false);
  assert.deepEqual(audit.campos_divergentes_candidato, []);
  assert.equal(audit.total_comparaveis_auditados, 3);
  assert.equal(audit.total_comparaveis_divergentes, 0);
  assert.ok(audit.ids_regras_acionadas_candidato.length > 0);
  assert.equal(saida.vocabulario_editorial.regras, undefined);
  assert.equal(saida.vocabulario_editorial.regras_omitidas_na_saida, true);
  assert.equal(saida.comparaveis.length, 3);
});

test('vocabulário inválido recua para dicionário estático sem propagá-lo', () => {
  const entrada = entradaComVocabulario();
  entrada.vocabulario_editorial.versao = '0.1.1';
  const base = executar(codigoBase, entrada);
  const saida = executar(codigoObservacao, entrada);

  assert.equal(saida.duplicidade_editorial.status, base.duplicidade_editorial.status);
  assert.equal(
    saida.duplicidade_editorial.analise_contextual.auditoria_vocabulario.status,
    'INVALIDO_FALLBACK_ESTATICO'
  );
  assert.equal(saida.vocabulario_editorial.regras, undefined);
});

test('alias adicional gera divergência auditável sem mudar NOVO lexical', () => {
  const entrada = entradaComVocabulario();
  entrada.candidato = {
    titulo: 'Union La Calera enfrenta o Flamengo em amistoso',
    link: 'https://exemplo.com/union-la-calera-flamengo'
  };
  entrada.comparaveis = [];
  entrada.vocabulario_editorial.regras.push({
    regra_id: 73,
    tipo: 'ALIAS_CLUBE',
    tipo_expressao: 'LITERAL',
    expressao: 'union la calera',
    valor_canonico: 'UNION_LA_CALERA',
    prioridade: 50,
    confianca: 0.85
  });
  entrada.vocabulario_editorial.total_regras = 73;

  const base = executar(codigoBase, entrada);
  const saida = executar(codigoObservacao, entrada);
  const audit = saida.duplicidade_editorial.analise_contextual.auditoria_vocabulario;

  assert.equal(saida.duplicidade_editorial.status, base.duplicidade_editorial.status);
  assert.equal(saida.duplicidade_editorial.percentual, base.duplicidade_editorial.percentual);
  assert.equal(audit.status, 'CARREGADO_EM_OBSERVACAO');
  assert.equal(audit.total_regras, 73);
  assert.ok(audit.ids_regras_acionadas_candidato.includes(73));
  assert.ok(audit.campos_divergentes_candidato.includes('entidades_mencionadas'));
  assert.equal(audit.aplicado_automaticamente, false);
  assert.equal(saida.vocabulario_editorial.regras, undefined);
});
