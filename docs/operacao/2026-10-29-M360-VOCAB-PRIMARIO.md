# Próximo passo CORE-029 — aliases do banco na análise contextual

Artefato preparado em 29/10/2026: [Similaridade Editorial v0.5.1](../../codes/m360/similaridade-editorial-v0.5.1-vocab-primario.js). **Não há evidência de implantação deste código no n8n.** O fluxo publicado relatado pelo operador ainda usa a v0.5.0.

## Limite da mudança

- A carga de `ADM_vocabulario_editorial`, lida pela SP e validada por `Normaliza Vocabulário Editorial v0.2.0`, passa a ser a fonte dos aliases de clube, pessoa, organização e competição **somente na análise contextual em observação**.
- A comparação lexical, os limites, a ordenação, `NOVO`/`SUSPEITO`/`DUPLICADO` e o fluxo de publicação permanecem iguais. A recomendação contextual não passa a decidir nem a publicar.
- A baseline estática permanece no código como fallback quando o objeto de vocabulário faltar ou for inválido. Portanto, esta etapa ainda não reduz substancialmente as linhas do node; essa remoção só deve ser avaliada após a fonte do banco e o rollback serem comprovados.
- Os literais do banco são normalizados como título/link antes do casamento; aliases que se tornem iguais após remover acentos e pontuação invalidam a carga no node e acionam fallback, evitando canônicos ambíguos.
- `auditoria_vocabulario.fonte_contextual` distingue `BANCO` de `ESTATICO_FALLBACK`, inclusive se a carga estiver ausente; `aplicado_no_contexto` e `aplicado_na_decisao` explicitam o alcance. As regras seguem omitidas da saída.
- Nenhuma proposta ou regra nova é inserida/ativada automaticamente. `SP_VOCABULARIO_EDITORIAL/PROPOR` continua fora do fluxo.

## Implantação node a node

1. Manter `Gate Temporal v0.1.0`, `SWITCH Temporal`, SPs e `Normaliza Vocabulário Editorial v0.2.0` como estão. Não depender da próxima ocorrência de `BLOQUEAR` no PAI para esta etapa.
2. Substituir somente o código do node **`Similaridade Editorial v0.5.0`**, sem renomear o node neste momento. `Retorno Final v0.2.1` busca esse nome literalmente. Guardar o código atual para rollback. O código interno passa a informar versão `0.5.1`; até a revisão posterior do Retorno Final, `resultado_origem` nele ainda será `similaridade_editorial_v0.5.0` (nome do node), não a versão interna.
3. Em uma execução `CHECK`, conferir `auditoria_vocabulario.status = CARREGADO_COMO_FONTE_CONTEXTUAL`, `fonte_contextual = BANCO`, `aplicado_no_contexto = true`, `aplicado_na_decisao = false`, 72 regras e nenhuma divergência com a baseline atual. Conferir que `resultado`, score e melhor match lexicais permanecem iguais.
4. Caso a carga falte ou seja inválida, a Similaridade usa fallback estático. Falha na própria consulta/normalização acontece antes do node e ainda interrompe `CHECK`; este artefato não promete fallback para falha de conexão.
5. Se houver divergência inesperada ou efeito funcional, restaurar apenas o código anterior da Similaridade e republicar. Não alterar o Gate Temporal para rollback desta migração.

O caso 1331, “Brasileirão: jogo do Flamengo x Vasco vai passar na Globo hoje?”, reforça a separação: `hoje` sem âncora confiável deve seguir; a similaridade lexical retornou `NOVO` a 54,86%, enquanto o contexto apenas sugeriu `RELACIONADO`. Ainda não há comprovação de `BLOQUEAR` atravessando o PAI e liberando o candidato seguinte.

Critério para a etapa posterior: observar a fonte `BANCO` em candidatos reais, manter equivalência da baseline de 72 regras, testar uma regra adicional aprovada com revisão humana e atualizar a versão comunicada no Retorno Final antes de eliminar aliases estáticos. Não ativar regras novas somente por aparecerem em alertas.
