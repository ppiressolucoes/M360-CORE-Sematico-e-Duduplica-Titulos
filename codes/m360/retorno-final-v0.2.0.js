// CODE | Retorno Final v0.2.0
// Recupera a decisão funcional mesmo quando nodes de efeito não preservam resultado.

function obterJsonNode(nome) {
  try {
    return $(nome).first().json ?? null;
  } catch (error) {
    return null;
  }
}

const entradaAtual = $input.first()?.json ?? {};
const normalizado =
  obterJsonNode('Normaliza Deduplica Editorial v0.3.0');
const similaridade =
  obterJsonNode('Similaridade Editorial v0.4.0');
const consenso =
  obterJsonNode('Consenso Editorial v0.1.0');
const temporal =
  obterJsonNode('Validade Temporal v0.1.0');

const resultado =
  entradaAtual.resultado ??
  consenso?.duplicidade_editorial?.status ??
  similaridade?.duplicidade_editorial?.status ??
  normalizado?.resultado ??
  null;

return [
  {
    json: {
      concluido: true,
      resultado,
      workflow: 'SUB | Semântica e Deduplicação | Core Editorial',
      core_versao: '0.5.0',
      validade_temporal:
        temporal?.validade_temporal ??
        normalizado?.validade_temporal ??
        null
    }
  }
];
