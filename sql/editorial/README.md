# Stored Procedures de deduplicação editorial

As definições abaixo ainda não foram fornecidas:

- `SP_DEDUPLICA_EDITORIAL`;
- `SP_DEDUPLICA_EDITORIAL_FINALIZA`.

Elas são dependências do item `CORE-003` no backlog. Não foram criados stubs SQL porque uma assinatura incompleta poderia ser confundida com a implementação real.

## Coleta necessária

Executar na instância MySQL autorizada:

```sql
SHOW CREATE PROCEDURE SP_DEDUPLICA_EDITORIAL;
SHOW CREATE PROCEDURE SP_DEDUPLICA_EDITORIAL_FINALIZA;
```

Antes da publicação no repositório:

1. confirmar schema, versão e ambiente de origem;
2. remover a cláusula `DEFINER`;
3. revisar referências a hosts, contas, chaves ou dados internos;
4. salvar uma procedure por arquivo `.sql` nesta pasta;
5. comparar as assinaturas com as chamadas nos workflows M360 e PEL;
6. atualizar o inventário, o backlog e o histórico.

O versionamento das definições não autoriza execução no MySQL. Instalação e validação funcional exigem uma ação de implantação separada.
