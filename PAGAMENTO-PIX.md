# Pagamento Pix Automático — como trocar tudo

Este arquivo explica **onde fica cada configuração** do pagamento automático,
para você mudar sem precisar de alguém de programação.

---

## Resumo em 10 segundos

| O que | Onde fica |
|---|---|
| Modo do pagamento (link único ou link fixo) | `backend\.env` |
| Chave da API da InfinitePay | `backend\.env` |
| Seu Handle / Infinite Tag | `backend\.env` |
| Valor do sinal | `backend\.env` |
| Endereços que o site tenta | `site-barbearia\app.js` (topo do arquivo) |
| Telefone, endereço, nome, chave Pix | `site-barbearia\app.js` (bloco `CONFIG`) |

---

## 1. Os dois modos de pagamento

Abra `backend\.env` e veja a linha `MODO_PAGAMENTO`.

### `link_unico` — RECOMENDADO (é o que está agora)

Cada agendamento cria uma cobrança nova na InfinitePay.

- ✅ Vários clientes podem pagar ao mesmo tempo
- ✅ O sistema sabe com certeza de quem é cada pagamento
- ✅ O cliente nunca libera vaga de graça
- ❌ Cada agendamento vira uma cobrança nova no seu painel da InfinitePay

### `link_fixo`

Todo mundo paga no mesmo link (o seu `VC1B-ZROqZmZFD4-10,00`).

- ✅ Você tem um link só, o mesmo de sempre
- ❌ Só dá para confirmar quem pagou se o link **ainda não estava pago**
- ❌ Se dois clientes pagarem juntos, um deles vai ter que falar com você

**Para trocar:** abra `backend\.env`, troque a linha e reinicie o servidor.

```
MODO_PAGAMENTO=link_unico
```

---

## 2. Credenciais da InfinitePay

Em `backend\.env`:

```
INFINITYPAY_API_KEY=inchk_r8sDyR4Cz9wHulzOert5pcjrny9ARfACvfC0TGVI50c
INFINITEPAY_HANDLE=yago-assumpcao-y9d
```

**A chave nunca vai para o site.** Ela fica só no servidor. Se alguém te pedir
essa chave, não mande para o site — ela vaza e qualquer um consegue fazer cobrança
no seu nome.

Onde pegar outra chave: painel da InfinitePay → Desenvolvedor → API Keys.

---

## 3. Valor do sinal

Em `backend\.env`:

```
SIGNAL_VALUE=10
```

É o valor que o cliente paga antes. O site já desconta esse valor do total
automaticamente no resumo do agendamento.

---

## 4. Endereço do servidor (quando muda)

Abra `site-barbearia\app.js` e procure o bloco `CONFIG`, lá no começo:

```js
API_BASES: [
  'http://localhost:3001',
  'http://192.168.1.73:3001',
],
```

- `localhost:3001` → funciona no computador
- `192.168.1.73:3001` → funciona no celular, na sua rede de casa

> **Importante:** o celular **também** pode trocar esse endereço sozinho, sem
> refazer o APK. É só tocar na **engrenagem ⚙️** no alto do aplicativo, digitar
> o endereço e salvar. Ele fica salvo no aparelho.

Quando você publicar o servidor na internet, troque por algo assim:

```js
API_BASES: [
  'https://barbearia.onrender.com',
],
```

---

## 5. Testar se está funcionando

1. Abra `iniciar-tudo.bat` (liga o site e o servidor)
2. Abra `http://localhost:8080`
3. Faça um agendamento escolhendo **Pix**
4. Aparecerá um QR Code e o botão "Pagar R$ 10,00 agora"
5. **Pague de verdade** os R$ 10
6. Em poucos segundos o site vira "Pagamento confirmado" sozinho
   e o botão do WhatsApp aparece

Se aparecer a mensagem vermelha de que o Pix automático não está funcionando,
o endereço está errado. No celular, use a engrenagem ⚙️ para corrigir.

---

## 6. Onde ficam as coisas

```
Projeto Padrão\
│
├─ iniciar-tudo.bat ............. liga site + servidor (clique 2x)
├─ iniciar-servidor.bat ......... liga só o servidor do Pix
├─ gerar-apk.bat ................ gera o APK do aplicativo
├─ APK\Barbearia-do-Jota.apk .... o aplicativo pronto
│
├─ backend\
│  ├─ .env ...................... SUAS CONFIGURAÇÕES (mode, chave, valor)
│  ├─ .env.example .............. modelo, com explicação de cada linha
│  ├─ server.js ................. o servidor que confere o Pix
│  └─ pagamentos.json ........... o que foi confirmado (criado sozinho)
│
└─ site-barbearia\
   ├─ app.js ..................... configuração do site no topo (bloco CONFIG)
   ├─ index.html
   ├─ styles.css
   ├─ www\ ....................... cópia que vai para dentro do APK
   └─ img\ ....................... as fotos da barbearia
```

---

## 7. Perguntas rápidas

**Troquei o valor do sinal e não mudou**
Reinicie o servidor. Feche a janela preta e abra `iniciar-tudo.bat` de novo.

**Aparece "sem credenciais"**
A `INFINITYPAY_API_KEY` está vazia ou com erro de digitação em `backend\.env`.

**Funciona no computador mas não no celular**
O endereço em `API_BASES` não é o certo para o celular. Toque na ⚙️ no
aplicativo e ajuste. Também pode ser o firewall do Windows bloqueando —
abra o `iniciar-tudo.bat` como administrador uma vez.

**Como vejo quem pagou**
Abra `backend\pagamentos.json`. Cada agendamento aparece com
`"pago": true` quando o Pix foi confirmado.

**Um cliente pagou mas o site não liberou**
Abra `backend\pagamentos.json`, ache o código do cliente (começa com `BK`).
Se `jaPagoAntes` estiver `true`, o link já estava pago antes dele chegar —
o sistema não libera sozinho por segurança. Fale com o cliente no WhatsApp.

---

## 8. Publicar na internet (quando quiser)

Hoje o servidor roda só no seu computador. Para o pagamento funcionar
para qualquer cliente, ele precisa estar na internet.

1. Crie conta no **Render.com** (grátis)
2. "New" → "Web Service" → conecte o GitHub
3. Pasta: `backend`
   Build: `npm install`
   Start: `npm start`
4. Copie o endereço que ele gerar (`https://sua-app.onrender.com`)
5. Coloque no `app.js`:

```js
API_BASES: [
  'https://sua-app.onrender.com',
],
```

6. De volta no Render, em Environment, adicione:

```
INFINITYPAY_API_KEY=inchk_r8sDyR4Cz9wHulzOert5pcjrny9ARfACvfC0TGVI50c
INFINITEPAY_HANDLE=yago-assumpcao-y9d
MODO_PAGAMENTO=link_unico
SIGNAL_VALUE=10
PUBLIC_BASE_URL=https://sua-app.onrender.com
```

> No plano grátis o Render dorme depois de 15 minutos sem uso. O primeiro
> agendamento pode demorar ~30 segundos para acordar. Para isso não falhar,
> o Render tem plano pago por uns 7 dólares/mês.
