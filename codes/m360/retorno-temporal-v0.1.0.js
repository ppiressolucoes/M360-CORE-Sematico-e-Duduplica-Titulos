// CODE | Retorno Temporal v0.1.0 | M360
// n8n Code: Run Once for All Items.
// Usar somente na rota BLOQUEAR do SWITCH anterior a SP DEDUPLICA.
// Devolve um item para liberar o proximo candidato no fluxo PAI.

const entrada = $input.first()?.json ?? {};
const controle = entrada.controle_temporal ?? null;
const validade = entrada.validade_temporal ?? null;

if (
  controle?.versao !== '0.1.0' ||
  controle?.modo !== 'BLOQUEIO_CONTROLADO' ||
  controle?.rota !== 'BLOQUEAR' ||
  controle?.elegivel_bloqueio !== true ||
  controle?.aplicado_automaticamente !== true ||
  validade?.intencao !== 'SERVICO_PRE_EVENTO' ||
  validade?.status !== 'EXPIRADO'
) {
  throw new Error('Retorno Temporal: entrada nao confirmada como bloqueio temporal.');
}

return [{
  json: {
    concluido: true,
    resultado: 'EXPIRADO_TEMPORAL',
    resultado_origem: 'gate_temporal_v0.1.0',
    resultado_bruto: null,
    workflow: 'SUB | Semântica e Deduplicação | Core Editorial',
    core_versao: entrada.core_versao ?? '0.5.0',
    validade_temporal: validade,
    controle_temporal: controle
  }
}];
