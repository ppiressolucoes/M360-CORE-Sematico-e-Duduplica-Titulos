// CODE | Retorno Final v0.2.1
// Recupera a decisao funcional sem promover estados internos de roteamento.

function obterJsonNode(nome) {
  try {
    return $(nome).first().json ?? null;
  } catch (error) {
    return null;
  }
}

const RESULTADOS_TERMINAIS = new Set([
  'EXACT_DUPLICATE',
  'ALREADY_PROCESSING',
  'NOVO',
  'SUSPEITO',
  'DUPLICADO',
  'ERROR'
]);

function resultadoTerminal(valor) {
  const normalizado = String(valor ?? '').trim().toUpperCase();
  return RESULTADOS_TERMINAIS.has(normalizado) ? normalizado : null;
}

const entradaAtual = $input.first()?.json ?? {};
const normalizado =
  obterJsonNode('Normaliza Deduplica Editorial v0.3.0');
const similaridadeV05 =
  obterJsonNode('Similaridade Editorial v0.5.0');
const similaridadeV04 =
  obterJsonNode('Similaridade Editorial v0.4.0');
const consenso =
  obterJsonNode('Consenso Editorial v0.1.0');
const temporal =
  obterJsonNode('Validade Temporal v0.1.0');

const candidatosResultado = [
  {
    origem: 'entrada_atual',
    valor: resultadoTerminal(entradaAtual.resultado)
  },
  {
    origem: 'consenso_editorial',
    valor: resultadoTerminal(consenso?.duplicidade_editorial?.status)
  },
  {
    origem: 'similaridade_editorial_v0.5.0',
    valor: resultadoTerminal(similaridadeV05?.duplicidade_editorial?.status)
  },
  {
    origem: 'similaridade_editorial_v0.4.0',
    valor: resultadoTerminal(similaridadeV04?.duplicidade_editorial?.status)
  },
  {
    origem: 'normalizador',
    valor: resultadoTerminal(normalizado?.resultado)
  }
];

const decisao = candidatosResultado.find(item => item.valor) ?? null;
const resultadoBruto =
  entradaAtual.resultado ?? normalizado?.resultado ?? null;
const resultado = decisao?.valor ?? resultadoBruto;

return [
  {
    json: {
      concluido: true,
      resultado,
      resultado_origem:
        decisao?.origem ?? 'fallback_resultado_bruto',
      resultado_bruto: resultadoBruto,
      workflow: 'SUB | Semântica e Deduplicação | Core Editorial',
      core_versao: '0.5.0',
      validade_temporal:
        temporal?.validade_temporal ??
        normalizado?.validade_temporal ??
        null
    }
  }
];
