// CODE | Gate Temporal v0.1.0 | M360
// n8n Code: Run Once for All Items.
// Posicao prevista: Validade Temporal v0.1.2 -> Gate -> SWITCH -> SP DEDUPLICA.
// A flag permanece desligada ate o fluxo pai reconhecer EXPIRADO_TEMPORAL.

const CONFIG = {
  bloqueioAtivo: false,
  timezone: 'America/Sao_Paulo',
  versaoTemporal: '0.1.2',
  confiancaMinima: 0.9,
  confiancaAncoraMinima: 0.95
};

const entrada = $input.first()?.json ?? {};
const validade = entrada.validade_temporal ?? null;

function instanteComTimezone(valor) {
  const texto = String(valor ?? '');
  if (!/(?:Z|[+-]\d{2}:\d{2})$/.test(texto)) return null;
  const instante = Date.parse(texto);
  return Number.isFinite(instante) ? instante : null;
}

const avaliacao = instanteComTimezone(validade?.instante_avaliacao);
const fimEvento = instanteComTimezone(validade?.evento?.fim);
const origemAncora = validade?.referencia_conteudo?.origem;
const ancoraConfiavel =
  (origemAncora === 'iso_date' || origemAncora === 'data_publicacao') &&
  Number(validade?.referencia_conteudo?.confianca) >= CONFIG.confiancaAncoraMinima;
const expressaoConfiavel = Array.isArray(validade?.expressoes) &&
  validade.expressoes.some(expressao =>
    typeof expressao?.data_resolvida === 'string' &&
    /^20\d{2}-\d{2}-\d{2}$/.test(expressao.data_resolvida) &&
    Number(expressao.confianca) >= CONFIG.confiancaMinima
  );

const elegivel =
  validade?.versao === CONFIG.versaoTemporal &&
  validade?.modo === 'OBSERVACAO' &&
  validade?.timezone === CONFIG.timezone &&
  validade?.evento?.timezone === CONFIG.timezone &&
  validade?.intencao === 'SERVICO_PRE_EVENTO' &&
  validade?.status === 'EXPIRADO' &&
  Number(validade?.confianca) >= CONFIG.confiancaMinima &&
  validade?.aplicado_automaticamente === false &&
  ancoraConfiavel && expressaoConfiavel &&
  avaliacao !== null && fimEvento !== null &&
  fimEvento < avaliacao;

const bloquear = CONFIG.bloqueioAtivo && elegivel;

return [{
  json: {
    ...entrada,
    controle_temporal: {
      versao: '0.1.0',
      modo: CONFIG.bloqueioAtivo ? 'BLOQUEIO_CONTROLADO' : 'OBSERVACAO',
      rota: bloquear ? 'BLOQUEAR' : 'SEGUIR',
      elegivel_bloqueio: elegivel,
      aplicado_automaticamente: bloquear,
      confianca_minima: CONFIG.confiancaMinima,
      motivos: elegivel
        ? ['SERVICO_EXPIRADO_ALTA_CONFIANCA']
        : ['CRITERIOS_DE_BLOQUEIO_NAO_ATENDIDOS']
    }
  }
}];
