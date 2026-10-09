# 💻 Chromebook Manager

Sistema web para gerenciamento de Chromebooks, equipamentos de TI e manutenções em ambiente escolar.

O **Chromebook Manager** tem como objetivo centralizar o controle dos equipamentos, facilitar o acompanhamento das manutenções e permitir uma melhor visualização dos gastos relacionados à infraestrutura de TI.

> 🚧 **Status do projeto:** Em desenvolvimento.

## ✨ Funcionalidades

### 📦 Gestão de equipamentos

* Cadastro de Chromebooks.
* Visualização dos equipamentos cadastrados.
* Edição e exclusão de equipamentos.
* Consulta dos detalhes de cada equipamento.
* Pesquisa por informações como ID, número, MAC, número de série, modelo e sala.
* Filtros por situação do equipamento.
* Indicadores de equipamentos em uso, disponíveis, em reparo e para descarte.

### 🔧 Gestão de manutenções

* Registro e acompanhamento de manutenções.
* Edição e exclusão de registros de manutenção.
* Organização do histórico de serviços realizados.
* Acompanhamento dos custos associados às manutenções.

### 📊 Dashboard e relatórios

* Painel inicial com indicadores gerais.
* Resumo dos equipamentos e das manutenções.
* Relatório de gastos com filtros.
* Visualização dos gastos por período e equipamento.
* Histórico de manutenções e análise de custos.
* Exportação de dados do relatório em CSV.

### 🎨 Interface

* Tema claro e escuro.
* Interface responsiva.
* Componentes visuais padronizados.
* Navegação entre os módulos do sistema.

## 🛠️ Tecnologias utilizadas

| Tecnologia                                    | Finalidade                              |
| --------------------------------------------- | --------------------------------------- |
| [Next.js](https://nextjs.org/)                | Framework da aplicação                  |
| [React](https://react.dev/)                   | Construção da interface                 |
| [TypeScript](https://www.typescriptlang.org/) | Tipagem estática                        |
| [Tailwind CSS](https://tailwindcss.com/)      | Estilização                             |
| LocalStorage                                  | Persistência local dos dados            |
| Git e GitHub                                  | Versionamento e gerenciamento do código |
| Vercel                                        | Hospedagem e implantação                |

## 🚀 Como executar o projeto

### Pré-requisitos

* [Node.js](https://nodejs.org/) instalado.
* [Git](https://git-scm.com/) instalado.
* [pnpm](https://pnpm.io/) instalado.

### 1. Clonar o repositório

```bash
git clone https://github.com/yagodiax/chromebook-manager.git
```

### 2. Entrar na pasta do projeto

```bash
cd chromebook-manager
```

### 3. Instalar as dependências

```bash
pnpm install
```

### 4. Iniciar o servidor de desenvolvimento

```bash
pnpm dev
```

### 5. Acessar a aplicação

Abra o navegador e acesse:

```text
http://localhost:3000
```

Se a porta 3000 estiver ocupada, o Next.js poderá utilizar outra porta, como a 3001. Confira o endereço exibido no terminal.

## 💾 Armazenamento de dados

Atualmente, a aplicação utiliza o `localStorage` do navegador para armazenar os dados.

Isso permite manter os registros no mesmo navegador após atualizar ou fechar a página. Entretanto, os dados não são automaticamente compartilhados entre diferentes computadores ou navegadores.

### Melhorias planejadas

* Migração para banco de dados centralizado.
* Implementação de autenticação e controle de acesso.
* Gestão de estoque de peças e consumíveis.
* Histórico de instalação, substituição e destino de componentes.
* Aprimoramentos na gestão de equipamentos e manutenções.

## 📁 Estrutura do projeto

```text
chromebook-manager/
├── src/
│   ├── app/          # Páginas e rotas da aplicação
│   ├── lib/          # Funções e regras de negócio
│   └── types/        # Tipos e interfaces TypeScript
├── public/           # Arquivos estáticos
├── package.json      # Dependências e scripts
├── pnpm-lock.yaml    # Versões das dependências
└── README.md         # Documentação do projeto
```

## 🌐 Projeto online

* **Repositório:** [github.com/yagodiax/chromebook-manager](https://github.com/yagodiax/chromebook-manager)
* **Aplicação:** [Acessar o Chromebook Manager](https://chromebook-manager-caqi3gdvh-yagodiax.vercel.app/)

## 🎯 Objetivo

Desenvolver uma ferramenta para auxiliar a equipe de TI escolar no gerenciamento do patrimônio tecnológico, no acompanhamento das manutenções e no controle dos gastos, com foco em organização, praticidade e evolução contínua.

---

Desenvolvido como projeto em evolução para gestão de equipamentos e manutenção de TI escolar.

**Chromebook Manager** 💻
