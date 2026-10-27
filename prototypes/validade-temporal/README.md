# Protótipo de validade temporal

Especificação executável da iniciativa `CORE-028`. O código é puro, não usa dependências externas e não possui integração com n8n, MySQL, WordPress ou qualquer outro serviço.

## Executar

Na raiz do repositório:

```bash
node --test prototypes/validade-temporal/validade-temporal.test.js
node prototypes/validade-temporal/replay-datasets.js
```

O replay usa `data_analise` apenas como instante simulado de avaliação. Ele não inventa uma data original para os candidatos e evidencia separadamente a ausência dessa âncora.

## Escopo

O protótipo:

- recebe título, contexto, `iso_date`/`data`, instante de avaliação e timezone;
- resolve `hoje`, `amanhã`, `ontem`, dias da semana, datas `dd/mm[/aaaa]` e datas por extenso em português;
- separa conteúdo de serviço pré-evento de resultado pós-evento;
- reconhece sinais de resultado em português e inglês, como vitória, eliminação, vaga, pênaltis e melhores momentos;
- retorna `VALIDO`, `EXPIRADO` ou `INDETERMINADO` com evidências auditáveis;
- exige instante de avaliação explícito para que o replay seja determinístico;
- mantém `aplicado_automaticamente: false`.

Ele ainda não:

- altera o workflow exportado;
- roteia ou bloqueia itens reais;
- valida o contrato do fluxo pai;
- consulta calendários ou horários externos;
- resolve eventos que atravessam a meia-noite;
- define a política final para agendas com datas mistas.

Antes de adaptação para um Code node n8n, a semântica real dos campos `data` e `iso_date` precisa ser confirmada com snapshots sanitizados.
