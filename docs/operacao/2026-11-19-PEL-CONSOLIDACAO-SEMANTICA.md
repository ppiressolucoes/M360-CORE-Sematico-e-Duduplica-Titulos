# PEL — consolidação da evolução semântica

Registro de 19/11/2026. A aplicação no n8n é manual, sob responsabilidade do operador. Este documento reúne os artefatos e as evidências fornecidas até o candidato 1863.

## Estado e evidências

| Etapa | Estado registrado |
| --- | --- |
| Similaridade Editorial v0.4.0 | Produz a classificação lexical consumida pelo switch funcional. |
| Análise Editorial PEL v0.5.1 | Produzia sugestões contextuais baseadas em tokens e heurísticas de fase, em observação. |
| Análise Editorial PEL v0.6.0 | [Código versionado](../../codes/pel/analise-editorial-observacao-v0.6.0.js), aplicado manualmente segundo o operador. A [saída do candidato 1863](2026-11-19-PEL-ANALISE-V060-1863.md) mostra a versão e os novos campos. |
| Decisão Autônoma Editorial PEL v0.1.0 | Aplicação em produção confirmada pelo operador; saídas anteriores documentadas nos checkpoints. O snapshot de 1863 não contém sua saída. |
| Persistência e switch | O desenho preparado inclui gravação analítica e mantém a condição lexical. Faltam evidências da gravação e do caminho efetivo do switch nas amostras recentes. |

A v0.6.0 preserva o contrato e o ranking legado usado pelo decisor, acrescentando menções literais de entidades e objetos, fase heurística, campos desconhecidos e pares prioritários para revisão. Sua lista de entidades e objetos é limitada; menções compartilhadas não confirmam identidade do evento. O código foi aplicado preservando o nome do node como orientação de integração, mas ainda não foi fornecido export posterior para verificar a configuração efetiva e as referências pelo nome.

O export versionado em `workflows/pel-deduplicacao-semantica.json` é uma cópia preparada, inativa e sanitizada, anterior à v0.6.0. Ele não é evidência de equivalência com o fluxo atualmente aplicado. Obter e sanitizar export posterior antes de atualizar a referência e comparar o código do node com o arquivo separado.

## Observações editoriais

- [1852 e 1853](2026-11-19-PEL-DECISAO-CASOS-1852-1853.md): possíveis vínculos de evento sobre postes e ação judicial de baterias; dependem de revisão humana e comparação do conteúdo.
- [1855–1858](2026-11-19-PEL-DECISAO-LOTE-1855-1858.md): três sugestões contextuais entre vagas com cargos ou empregadores diferentes; decisor retornou `INDETERMINADO`.
- 1863: a análise reconheceu o tema genérico de vagas, mas não distinguiu empregador, cargo e local. A sugestão legada de `RELACIONADO` decorre de palavras compartilhadas e não confirma identidade.

## Próximas evidências e evolução

1. Receber saída do decisor após a análise v0.6.0 e confirmar preservação do status lexical e dos dados de entrada.
2. Confirmar gravação de `decisao_autonoma_pel` e versão da análise no banco, além do ramo efetivo do switch.
3. Obter export sanitizado posterior e confirmar conexões, nome do node e equivalência do código com o artefato versionado.
4. Coletar rótulos humanos para os pares prioritários e ampliar a extração de entidade, objeto, cargo, local e fase sem inferir identidade a partir de tema comum.
5. Tratar métricas lexicais ausentes para pares contextuais fora do TOP 3 lexical e avaliar os gates de qualidade antes de qualquer promoção funcional.

`CORE-030` e `CORE-031` seguem em andamento. As amostras não medem precisão ou recall e não autorizam alteração de limiares.
