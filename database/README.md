# Migração do banco — inventário universal

Execute os arquivos abaixo no editor SQL do TiDB Cloud, **nesta ordem**:

1. `001_criar_equipamentos_universais.sql`
2. `002_criar_historico_unificado.sql`

Eles criam as tabelas `equipamentos`, `historico_equipamentos` e `historico_equipamento_anexos`.

## Atenção

- Os scripts não apagam as tabelas antigas `chromebooks`, `manutencoes` e `manutencao_anexos`.
- Eles não migram automaticamente os registros antigos. O inventário universal começa vazio para que os equipamentos sejam cadastrados novamente, conforme combinado.
- Não execute comandos `DROP TABLE` para limpar as tabelas antigas; as rotas antigas ainda podem depender delas.
- Execute o segundo script somente depois de o primeiro terminar sem erros, porque o histórico possui uma chave estrangeira para `equipamentos`.

## Verificação após executar

Rode:

```sql
SHOW TABLES;
```

Confirme que as três tabelas novas aparecem. Depois, na aplicação, entre com uma conta autenticada e teste primeiro o cadastro de um equipamento de teste. Em seguida, teste uma ocorrência, uma manutenção interna, um envio para reparo e um retorno de reparo antes de começar a cadastrar o inventário real.
