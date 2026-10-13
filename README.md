# Meus Gastos

App pessoal para controlar gastos fixos e aleatórios, organizado por mês e categoria. Funciona como um site instalável (PWA), sem cadastro e sem servidor.

## Funcionalidades

- Registro de gastos **fixos** e **aleatórios**
- Categorias e totais por mês
- Histórico com exclusão de registros
- Exportação e importação de backup em arquivo
- Funciona offline depois do primeiro acesso (service worker)
- Instalável na tela inicial do celular ou do computador

## Como rodar

Não há build nem dependências. Basta servir a pasta com qualquer servidor estático:

```bash
npx serve .
```

Ou abra `index.html` direto no navegador para uma prévia. Para instalar como app, sirva por HTTPS ou `localhost`.

## Privacidade

Os gastos ficam no **armazenamento local do navegador** (`localStorage`). Nada é enviado para servidor. Por isso, limpar os dados do navegador apaga os registros: use a exportação de backup com frequência.

## Estrutura

| Arquivo | Função |
|---|---|
| `index.html` | Estrutura da tela e diálogo de novo gasto |
| `app.js` | Regras de negócio, renderização e armazenamento |
| `styles.css` | Estilo visual |
| `sw.js` | Service worker para uso offline |
| `manifest.webmanifest` | Metadados de instalação |
