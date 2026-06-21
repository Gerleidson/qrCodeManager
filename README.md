# WMS — Gerador de QR Code & Código de Barras 🏷️

Sistema web para gestão de credenciais de colaboradores, com geração automática de **QR Code** e **Código de Barras** (CODE128/CODE39) contendo usuário e senha de acesso ao sistema WMS. Organize colaboradores por turno, gere e imprima crachás/etiquetas de forma rápida e padronizada.

🔗 **Acesse:** [qr-code-manager-two.vercel.app](https://qr-code-manager-two.vercel.app/)

![Versão](https://img.shields.io/badge/versão-1.0-blue)
![Licença](https://img.shields.io/badge/licença-MIT-green)
![Status](https://img.shields.io/badge/status-Ativo-brightgreen)
![Deploy](https://img.shields.io/badge/deploy-Vercel-black)

---

## 📋 Índice

- [Características](#-características)
- [Stack Tecnológico](#-stack-tecnológico)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Como Usar](#-como-usar)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Funcionalidades](#-funcionalidades)
- [Módulos](#-módulos)
- [Dados](#-dados)
- [Deploy](#-deploy)
- [Troubleshooting](#-troubleshooting)
- [Contribuindo](#-contribuindo)
- [Licença](#-licença)

---

## ✨ Características

✅ **Gestão de Colaboradores** - Cadastro, edição e exclusão com nome, usuário, senha e turno

✅ **Organização por Turno** - Filtre colaboradores entre Todos, T1, T2 e T3

✅ **Geração de QR Code** - Crie QR Codes com as credenciais (usuário/senha) de acesso ao WMS

✅ **Geração de Código de Barras** - Suporte aos padrões **CODE128** e **CODE39**

✅ **Download de Imagens** - Baixe QR Code e Código de Barras separadamente ou em um único PNG

✅ **Impressão Pronta** - Layout otimizado para impressão direta dos códigos de barras

✅ **Documento Confidencial** - Geração automática de documento com credenciais de acesso ao sistema

✅ **Contadores em Tempo Real** - Totais por turno (T1, T2, T3) e total geral de colaboradores

✅ **Interface Responsiva** - Design limpo e adaptável a diferentes tamanhos de tela

---

## 🛠️ Stack Tecnológico

| Tecnologia | Descrição |
|-----------|-----------|
| **React / Next.js** | Construção da interface (ajuste conforme sua stack real) |
| **JavaScript (Vanilla)** | Lógica de aplicação |
| **Lib de QR Code** (ex: `qrcode`, `qrcode.react`) | Geração dos QR Codes |
| **Lib de Código de Barras** (ex: `JsBarcode`) | Geração dos códigos CODE128/CODE39 |
| **Vercel** | Hospedagem e deploy contínuo |

> ℹ️ Ajuste a tabela acima para refletir exatamente o framework e as bibliotecas usadas no seu `package.json`.

---

## 📦 Pré-requisitos

- [Node.js](https://nodejs.org/) 18+ instalado
- Conta na [Vercel](https://vercel.com/) (para deploy)

---

## 🚀 Instalação

### Clone do repositório

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/qr-code-manager.git

# Acesse o diretório
cd qr-code-manager

# Instale as dependências
npm install
```

### Executando localmente

```bash
npm run dev
```

Acesse `http://localhost:3000` no seu navegador.

---

## 💻 Como Usar

### Fluxo Operacional

```
QRCode Manager
├── Colaboradores → Cadastrar nome, usuário, senha e turno (T1/T2/T3)
├── Selecionar colaborador na tabela
├── QR Code → Gerar e baixar (PNG)
├── Código de Barras → Escolher padrão (CODE128/CODE39), gerar e baixar/imprimir
└── Documento de Credenciais → Gerado automaticamente para o colaborador selecionado
```

### Passo a passo

1. **Adicione um colaborador** informando turno, nome, usuário e senha
2. **Selecione o colaborador** na tabela para liberar a geração dos códigos
3. **Gere o QR Code** com as credenciais de acesso ao WMS
4. **Gere o Código de Barras** no padrão desejado (CODE128 ou CODE39)
5. **Baixe** os códigos separadamente ou em um único PNG, ou **imprima** diretamente
6. **Edite ou remova** colaboradores quando necessário

---

## 📁 Estrutura do Projeto

> Estrutura sugerida — ajuste conforme a organização real do seu projeto.

```
qr-code-manager/
├── src/ (ou pages/, app/)
│   ├── components/
│   │   ├── EmployeeTable.jsx     # Tabela de colaboradores
│   │   ├── EmployeeForm.jsx      # Formulário de cadastro/edição
│   │   ├── QRCodeGenerator.jsx   # Geração do QR Code
│   │   └── BarcodeGenerator.jsx  # Geração do Código de Barras
│   ├── utils/
│   │   └── storage.js            # Persistência dos dados
│   └── App.jsx
├── public/
├── package.json
└── README.md
```

---

## 🎯 Funcionalidades

### Painel Geral
- Contador **total** de colaboradores
- Contadores por **turno** (T1, T2, T3)

### Colaboradores
**Operações:**
- ✅ Adicionar novo colaborador
- ✅ Editar colaborador existente
- ✅ Remover colaborador
- ✅ Filtrar por turno (Todos, T1, T2, T3)

**Campos:**
```
- Turno (T1, T2 ou T3)
- Nome
- Usuário
- Senha
```

### QR Code
- Geração de QR Code com usuário e senha do colaborador selecionado
- Download em **PNG**

### Código de Barras
- Suporte aos padrões **CODE128** e **CODE39**
- Geração com usuário e senha do colaborador selecionado
- Download em PNG (separado ou combinado com o QR Code)
- Opção de **impressão direta**

### Documento de Credenciais
- Geração automática de documento "WMS — Credenciais de Acesso ao Sistema"
- Inclui usuário, senha e identificação do documento como confidencial

---

## 🧩 Módulos

### 1. Cadastro de Colaboradores

Gerencia os dados de cada colaborador (nome, usuário, senha, turno), permitindo criação, edição e exclusão.

### 2. Geração de QR Code

Recebe as credenciais do colaborador selecionado e gera um QR Code correspondente para download.

### 3. Geração de Código de Barras

Gera o código de barras nos padrões CODE128 ou CODE39 a partir do usuário/senha do colaborador, com opções de download e impressão.

### 4. Filtro por Turno

Permite visualizar todos os colaboradores ou filtrar especificamente por T1, T2 ou T3.

---

## 💾 Dados

Os dados dos colaboradores são armazenados de acordo com a implementação do projeto (ex: `localStorage`, banco de dados na nuvem ou API própria).

> ℹ️ Atualize esta seção com o método de persistência real utilizado (localStorage, Firebase, Supabase, banco SQL, etc.).

---

## ☁️ Deploy

O projeto está hospedado na **Vercel**:

```bash
# Instale a CLI da Vercel (opcional)
npm i -g vercel

# Faça o deploy
vercel
```

---

## ❓ Troubleshooting

### "QR Code ou Código de Barras não aparece"
**Solução:** Verifique se um colaborador foi selecionado na tabela antes de gerar os códigos

### "Download não funciona"
**Solução:** Verifique se o navegador está bloqueando downloads automáticos ou pop-ups

### "Impressão sai cortada ou desalinhada"
**Solução:** Ajuste a configuração de margens e escala na janela de impressão do navegador

### "Página carrega em branco"
**Solução:**
- Abra o DevTools (F12)
- Verifique a aba Console para erros
- Limpe o cache do navegador (Ctrl+Shift+Del)

---

## 🤝 Contribuindo

Contribuições são bem-vindas!

**Passos rápidos:**
1. Faça um Fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto é licenciado sob a **Licença MIT** - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

## 👨‍💻 Autor

Desenvolvido por **Gerleidson Bomfim**

---

<div align="center">

**[⬆ Voltar ao topo](#wms--gerador-de-qr-code--código-de-barras-)**

</div>
