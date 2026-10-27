let validadeTemporal = null;

try {
  validadeTemporal =
    $('Validade Temporal v0.1.0').first().json.validade_temporal ?? null;
} catch (error) {
  validadeTemporal = null;
}

return [
  {
    json: {
      concluido: true,
      resultado: $input.first().json.resultado,
      workflow: 'SUB | Semântica e Deduplicação | Core Editorial',
      core_versao: '0.5.0',
      validade_temporal: validadeTemporal
    }
  }
];
