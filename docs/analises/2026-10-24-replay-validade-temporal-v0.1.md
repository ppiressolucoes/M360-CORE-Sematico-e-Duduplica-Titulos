# Replay observacional da validade temporal v0.1

Data: 24/10/2026.

Iniciativa: `CORE-028`.

## Objetivo

Executar a especificação temporal v0.1 sobre os 51 candidatos já catalogados, sem alterar workflows e sem inferir datas ausentes, para medir cobertura inicial e confirmar os dados necessários antes de qualquer bloqueio funcional.

## Método

O replay usa o [protótipo de validade temporal](../../prototypes/validade-temporal/README.md) e os três datasets de alertas M360. Para cada arquivo, `data_analise` foi usada somente como instante simulado de avaliação.

Nenhuma `data_analise`, data contida na URL, data de comparável ou data do nome do arquivo foi promovida a data original do candidato. Essa restrição evita fabricar a âncora de expressões como `hoje`.

Comando reproduzível:

```bash
node prototypes/validade-temporal/replay-datasets.js
```

## Resultado

| Medida | Quantidade |
| --- | ---: |
| Candidatos avaliados | 51 |
| Candidatos com `data`, `iso_date` ou `isoDate` | 0 |
| Candidatos com expressão temporal detectada | 10 |
| Intenção `SERVICO_PRE_EVENTO` | 17 |
| Intenção `RESULTADO` | 1 |
| Intenção `INDETERMINADA` | 33 |
| Saída `INDETERMINADO` | 21 |
| Saída `VALIDO` no escopo temporal | 30 |
| Saída `EXPIRADO` comprovável | 0 |

Das 21 saídas `INDETERMINADO`:

- 10 contêm expressão temporal sem uma data original confiável;
- 11 têm intenção pré-evento, mas não fornecem data resolvível no título disponível.

Os dez casos com expressão temporal são `M360-A01`, `M360-A02`, `M360-A12`, `M360-B03`, `M360-B09`, `M360-B13`, `M360-B14`, `M360-B16`, `M360-C05` e `M360-C10`.

## Interpretação

O replay confirma que a base atual é útil para detectar sinais, mas insuficiente para decidir vencimento. Em particular, `hoje` não pode ser ancorado na data de análise, pois isso reinterpretaria o conteúdo em vez de recuperar sua referência original.

As 30 saídas `VALIDO` não representam aprovação editorial nem autorização de publicação. Vinte e nove apenas não apresentaram restrição temporal reconhecida pelo protótipo, e uma foi identificada como conteúdo de resultado pós-evento.

A taxa observada de 21/51 itens que exigiriam tratamento conservador não pode ser generalizada para o tráfego real: os datasets contêm somente alertas do ramo `SUSPEITO` e não formam uma amostra produtiva representativa.

## Evidência automatizada

Os casos VT-01 a VT-06 e cinco controles adicionais passaram com o runner nativo do Node.js:

- pauta vencida de quinta-feira avaliada na sexta-feira;
- pauta ainda válida no próprio dia;
- resultado pós-evento sem falso bloqueio;
- domingo futuro resolvido a partir de sábado;
- expressão relativa sem data original;
- agenda com datas passadas e futuras;
- conteúdo sem sinal temporal;
- ausência do instante explícito de avaliação;
- data por extenso ancorada no ano da fonte;
- data numérica futura com ano explícito;
- uso auditável de `data` quando `iso_date` não existe.

Resultado: 11 testes executados, 11 aprovados e 0 falhas.

## Consequência para a implantação

O protótipo pode continuar em desenvolvimento e observação, mas o bloqueio funcional não deve ser promovido com a base atual. A próxima evidência necessária é um conjunto sanitizado de snapshots do `Start Dedup` que preserve:

- `titulo` e, quando disponível, contexto;
- valor e semântica de `iso_date`, `data` e `idade_horas`;
- instante de coleta;
- timezone efetivo da fonte;
- ramo produtivo e decisão editorial posterior.

Também permanecem necessários o contrato do fluxo pai para `EVENTO_EXPIRADO` e `TEMPORAL_INDETERMINADO`, o destino de revisão e a política para agendas mistas ou eventos sem horário.

Nenhum workflow foi importado, ativado ou executado e nenhum efeito externo foi produzido.

## Atualização de 27/10/2026

O quarto lote ampliou o replay para 98 candidatos. O acumulado contém 18 títulos com expressão temporal, 33 intenções pré-evento, 9 resultados reconhecidos e 38 saídas `INDETERMINADO`. Nenhum dos 98 candidatos preserva data original em `data`, `iso_date` ou `isoDate`.

Os novos alertas acrescentaram regressões para vitória, vaga, eliminação, pênaltis, melhores momentos e títulos de resultado em inglês. O protótipo possui agora 14 testes aprovados. A conclusão de segurança permanece: sem a data original da fonte, a observação pode detectar sinais, mas não promover bloqueio por vencimento.
