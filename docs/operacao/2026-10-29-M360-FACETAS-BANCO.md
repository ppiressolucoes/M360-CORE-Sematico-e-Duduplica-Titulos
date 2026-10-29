# M360 — primeira extensão de facetas no banco

## Códigos para aplicação manual

1. No node `Normaliza Vocabulário Editorial v0.2.0`, substituir somente o campo JavaScript pelo [código v0.2.1](../../codes/m360/normaliza-vocabulario-editorial-v0.2.1.js). Executar o node com a consulta atual: deve devolver um item, 72 regras e os cinco tipos anteriores. O nome do node pode permanecer o mesmo; não mudar conexões.
2. No node cujo nome operacional é `Similaridade Editorial v0.5.0`, substituir somente o campo JavaScript pelo [código interno v0.5.3](../../codes/m360/similaridade-editorial-v0.5.3-facetas-banco.js). Preservar exatamente o nome operacional, usado por `Retorno Final v0.2.2`, e executar um `CHECK_SIMILARITY`. Com as 72 regras atuais, conferir `duplicidade_editorial.versao: 0.5.3`, fonte `BANCO`, resultado lexical e score iguais aos da mesma entrada anterior; o retorno terminal deve informar `resultado_origem: similaridade_editorial_v0.5.3`.
3. Somente depois dos dois nodes validados, propor e aprovar regras `FACETA_EDITORIAL` de expressão `LITERAL` no escopo `ESPORTE/M360`, versão de vocabulário `0.1.0`. Cada canônico deve usar letras maiúsculas, números e `_`. Não ativar regras desse tipo enquanto a Similaridade ainda estiver na v0.5.2: ela rejeita o tipo e registra contexto indisponível. A SP `LISTAR` atual já lê o tipo sem nova conexão.

O primeiro passo pode ser aplicado isoladamente com as 72 regras atuais. O segundo também preserva as facetas legadas se ainda não houver `FACETA_EDITORIAL` no banco. As novas regras acrescentam facetas contextuais em `OBSERVACAO`; não mudam a decisão lexical, os limites, o Gate Temporal ou o Retorno Final. Não há inserção ou ativação automática de regras. Este artefato prepara extensão modular; a migração das facetas legadas e dos estados factuais ainda não está concluída.

Em caso de divergência inesperada, restaurar o JavaScript anterior do node alterado. Nenhum workflow n8n foi modificado por este repositório.

## Verificação local

Os testes da nova etapa verificam equivalência do Normaliza com as 72 regras, rejeição de faceta inválida, replay dos 98 casos preservando decisão lexical e contexto sem novas regras, leitura de duas facetas de exemplo apenas no banco e comportamento sem vocabulário válido. A suíte completa passou com 113 testes. O exemplo usa dados sintéticos de teste; nenhuma regra foi proposta ou ativada no banco produtivo.
