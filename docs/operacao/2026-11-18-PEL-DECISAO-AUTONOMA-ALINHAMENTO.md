# PEL — alinhamento para decisão editorial autônoma

Data do alinhamento: 18/11/2026.

Este registro consolida a análise do export informado pelo operador, `SUB _ Deduplicação e Semântica - PEL [ Core Editorial ] 18-11-2026.json`, e o acordo de evolução da análise de consenso. O export foi consultado como evidência do desenho; este registro não comprova que o mesmo conteúdo esteja ativo na instância n8n.

## Estado observado no export

O caminho de comparação segue, em alto nível:

```text
SP DEDUPLICA EDITORIAL
  → Normaliza Deduplica Editorial v0.2.2
  → SWITCH | Resultado
  → consulta e normalização do vocabulário
  → Contexto Vocabulário Editorial PEL v0.1.0
  → Similaridade Editorial v0.4.0
  → Análise Editorial PEL v0.5.1
  → SWITCH | Similaridade Editorial
```

O node `Análise Editorial PEL v0.5.1` também envia a observação à persistência. O switch atual roteia o resultado lexical: `DUPLICADO` finaliza como duplicado; `SUSPEITO` finaliza como suspeito e depois chama `Consenso Editorial v0.1.0` e o alerta; `NOVO` segue para publicação.

O consenso v0.1.0 é observacional, consome os melhores matches lexicais e declara que não altera status nem roteamento. Como está ligado após a finalização do ramo `SUSPEITO`, não participa da decisão dos ramos `DUPLICADO` e `NOVO`. O contexto vocabular também é observacional: identifica facetas no candidato e comparáveis, mas não muda a decisão lexical. A análise PEL v0.5.1 registra o estado do vocabulário, porém suas heurísticas atuais não incorporam as facetas à classificação.

As heurísticas da análise v0.5.1 incluem igualdade de títulos normalizados, tokens compartilhados e algumas diferenças de fase factual. O próprio node registra como limitações a ausência de resolução de entidades, objeto e data do evento. Assim, a decisão autônoma ainda não está pronta para direcionar publicação ou finalização funcional.

## Alinhamento

O ponto proposto para um decisor editorial é **após `Análise Editorial PEL v0.5.1` e antes de `SWITCH | Similaridade Editorial`**. Nesse ponto estão disponíveis a comparação lexical, os comparáveis históricos e o contexto vocabular. O decisor deverá inicialmente produzir apenas uma recomendação explicável em modo sombra.

O switch e as finalizações produtivas permanecem inalterados durante a avaliação. A recomendação não será tratada como rótulo humano, e nenhuma classe será promovida por limiar lexical ou consenso de fontes isoladamente.

## Plano passo a passo

1. Congelar o export e o contrato de entrada/saída usados como baseline, registrando versões, hashes e amostras sanitizadas dos ramos.
2. Formalizar o contrato da recomendação: classe sugerida, confiança, versão, comparáveis determinantes, evidências, bloqueadores, campos desconhecidos e motivo de revisão.
3. Integrar facetas do vocabulário ao contexto de candidato e comparáveis, preservando a origem e os IDs das regras. Regra ausente, ambígua ou inválida deve permanecer desconhecida.
4. Avaliar os comparáveis por par, incluindo identidade de entidade/objeto, faceta, fase factual, tempo e contradições. Não decidir apenas pelo TOP1 ou TOP 3 quando o contrato fornece uma base histórica maior.
5. Executar a recomendação em modo sombra e persistir sugestão e decisão lexical lado a lado, sem alterar status, publicação, finalização ou alerta operacional.
6. Coletar rótulos editoriais independentes e revisar falsos duplicados, falsos novos, relações e atualizações. Sugestão automática nunca preenche o rótulo humano.
7. Definir critérios de qualidade por classe, feature flag, canário, monitoramento e rollback antes de propor qualquer mudança de roteamento. Qualquer promoção funcional exige avaliação e autorização próprias.

## Gates e dependências

- A validação isolada de falhas, conflitos e pareamento da persistência de observação, os vínculos do histórico e a confirmação do status WordPress permanecem pendências do `CORE-030`.
- O registro PEL de 12/11 relata exemplos operacionais, mas não constitui uma amostra humana rotulada e representativa para medir qualidade por classe.
- O baseline deve incluir exemplos de `NOVO`, `SUSPEITO` e `DUPLICADO`, inclusive casos de divergência entre similaridade lexical e contexto vocabular.
- A hipótese de uma futura rota para `NOVO` lexical com sinal contextual forte continua sem critério validado; permanece fora de qualquer automação até passar pelos gates de avaliação.

## Resultado desta entrega

Foi registrado o ponto de inserção e o plano de avaliação. Nenhum node foi criado, nenhum workflow foi alterado ou importado e nenhuma mudança foi aplicada ao n8n, MySQL ou WordPress.

## Referências

- [Checkpoint PEL de 12/11](2026-11-12-PEL-CHECKPOINT.md)
- [Backlog consolidado](../planejamento/BACKLOG.md)
- [Sprint de modo sombra](../sprints/SPRINT-V0.2.0-MODO-SOMBRA.md)
