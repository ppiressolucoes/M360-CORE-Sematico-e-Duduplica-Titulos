# Padrão de artefatos das sprints

Vigência: 20/10/2026.

Cada sprint do Core Semântico e Deduplicação de Títulos deve deixar no repositório os artefatos que explicam o estado funcional e analítico trabalhado.

## Estrutura

```text
workflows/
  m360-deduplicacao-semantica.json
  pel-deduplicacao-semantica.json
codes/
  m360/
  pel/
sql/
  editorial/
  storage/
docs/
  arquitetura/
  analises/
  planejamento/
  telemetria/
```

## Workflow JSON

O export deve preservar nodes, parâmetros, conexões e versões necessárias para auditoria. Antes de publicar:

- definir `active: false`;
- remover referências de credenciais;
- remover `pinData`;
- validar o JSON;
- confirmar nomes e contratos dos subfluxos chamados.

O nome do arquivo permanece estável por fluxo. Mudanças de comportamento são registradas no histórico e no backlog.

## Codes de tratamento

Cada Code node deve possuir um arquivo `.js` em `codes/<fluxo>/`, usando no nome a função e a versão do node. O conteúdo é extraído do `parameters.jsCode` do export correspondente.

A cópia separada facilita revisão e comparação, mas o JSON completo continua necessário para reconstruir o fluxo. Uma atualização de Code node deve modificar o export e o arquivo extraído na mesma entrega.

## SQL

Cada SP deve possuir um arquivo próprio, agrupado por domínio:

- `sql/editorial/` para deduplicação e decisão editorial;
- `sql/storage/` para reserva e finalização de storage.

O arquivo deve omitir `DEFINER` e dados de conexão. Quando a implementação ainda não estiver disponível, o inventário registra a dependência sem criar um corpo fictício.

## Documentação da sprint

A entrega atualiza, conforme aplicável:

- backlog e estado da iniciativa;
- histórico de mudanças;
- decisão arquitetural;
- análise e telemetria;
- limitações e dependências abertas.

## Critérios de aceite

- JSONs válidos e sanitizados;
- Code nodes organizados e equivalentes aos exports;
- inventário SQL completo quanto ao que está presente e ausente;
- nenhuma credencial ou dado pessoal publicado;
- diff restrito à iniciativa;
- commit publicado e HEAD de `origin/main` confirmado.

Este padrão organiza os artefatos de engenharia. Ele não comprova que um workflow foi importado ou que uma SP foi instalada em produção.
