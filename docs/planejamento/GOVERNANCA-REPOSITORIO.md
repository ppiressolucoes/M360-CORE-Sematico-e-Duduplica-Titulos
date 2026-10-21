# Governança e sincronização do repositório

Vigência: 20/10/2026.

## Fonte oficial

O repositório `ppiressolucoes/M360-CORE-Sematico-e-Duduplica-Titulos`, na branch remota `main`, é a fonte compartilhada para o Core Semântico e Deduplicação de Títulos.

Arquivos existentes apenas no workspace, em anexos do chat ou em exports locais não representam uma entrega consolidada. Uma entrega passa a ser compartilhável quando está versionada, publicada em `main` e com o HEAD remoto verificado.

## Registros obrigatórios

Cada iniciativa relevante deve atualizar, na mesma entrega, os registros aplicáveis:

| Registro | Quando atualizar |
| --- | --- |
| `docs/planejamento/BACKLOG.md` | Mudança de prioridade, escopo, estado, dependência ou critério de aceite |
| `CHANGELOG.md` | Inclusão de artefato, análise, decisão arquitetural ou correção |
| `README.md` | Novo ponto de entrada, documento principal ou mudança do estado geral |
| `docs/arquitetura/` | Decisão ou contrato que afeta n8n, MySQL ou o processo editorial |
| `docs/analises/` e `docs/telemetria/` | Nova evidência, lote de alertas, reprodução ou métrica |
| `workflows/` | Novo export de referência, sempre sanitizado e desativado |
| `sql/` | Nova definição de SP ou DDL, sem `DEFINER` ou dados de conexão |

Discussões e hipóteses que ainda não geraram uma decisão podem permanecer na análise correspondente. Quando virarem iniciativa, recebem um ID `CORE-NNN` no backlog.

## Fluxo de consolidação

1. Atualizar a referência local a partir de `origin/main` e identificar divergências.
2. Incorporar somente os arquivos relacionados à ação atual.
3. Atualizar o backlog, o histórico e a documentação afetada.
4. Validar formatos, links relativos, sanitização e diferenças do Git.
5. Criar commit descritivo.
6. Publicar o commit na branch remota `main`.
7. Confirmar que o hash local é igual ao hash remoto.

Não deve existir uma entrega intencional mantida apenas no workspace ao encerrar uma ação autorizada de consolidação.

## Definição de concluído

Uma ação de repositório está concluída quando:

- o artefato ou decisão possui documentação suficiente para outra conta colaboradora;
- o item correspondente do backlog reflete o estado real;
- limitações, dependências e ausência de validação produtiva estão explícitas;
- arquivos estruturados foram validados;
- dados sensíveis foram removidos;
- o diff contém apenas mudanças relacionadas;
- o commit foi publicado;
- o HEAD de `origin/main` corresponde ao commit informado na entrega.

## Proteção de dados e credenciais

Não publicar:

- referências de credenciais n8n;
- `pinData` operacional;
- senhas, tokens, hosts privados ou strings de conexão;
- cláusulas `DEFINER` com contas do servidor;
- cabeçalhos de e-mail, remetentes, destinatários ou identificadores pessoais;
- anexos `.msg` brutos quando contiverem dados operacionais ou pessoais.

Exports n8n públicos devem usar `active: false`. Alertas usados como evidência devem ser transformados em datasets sanitizados ou em corpos `.txt`/`.html` sem cabeçalhos pessoais.

## Estado funcional versus documentação

Um commit neste repositório documenta referência, análise ou proposta. Ele não comprova importação no n8n, execução de SP, alteração do banco ou implantação em produção. Qualquer operação funcional deve ser registrada separadamente com ambiente, versão, resultado e evidência de validação.

## Manutenção do backlog

- `CONCLUÍDO` exige evidência versionada.
- `PRONTO` indica que o trabalho pode começar com as informações atuais.
- `DEPENDÊNCIA` identifica exatamente o artefato ou acesso ausente.
- `PLANEJADO` depende de itens anteriores.

Itens não são removidos quando concluídos. Eles permanecem no backlog ou são transferidos para uma seção histórica com seu ID preservado, permitindo rastrear decisões entre contas colaboradoras.
