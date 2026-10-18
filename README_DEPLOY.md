# 💈 Barbearia do Jota — Site de Agendamento (servidor pronto)

## Estrutura

```
site-barbearia/      # Frontend (HTML/JS/CSS) — abre no navegador
  index.html
  app.js
  styles.css
  logo.svg           # logo do site (recriada em SVG; pode trocar por sua foto logo.png)
backend/             # Backend Node.js (Express) — token do MP fica só aqui
  server.js
  package.json
  .env.example       # copie para .env e preencha
```

## 1. Rodar local (teste)

### Backend
```bash
cd backend
copy .env.example .env        # Windows
# ou: cp .env.example .env    # Mac/Linux
# Abra o .env e cole: MP_ACCESS_TOKEN=seu_token
npm install
npm start
```
Backend sobe em `http://localhost:3001`.

### Frontend
No `site-barbearia/app.js`, confirme:
```js
API_BASE: 'http://localhost:3001',
```
Abra o `site-barbearia/index.html` no navegador (ou `python -m http.server 8000`).

### Celular na mesma Wi-Fi
O frontend precisa rodar acessível na rede:
```bash
# no Windows, no PowerShell como administrador:
netsh advfirewall firewall add rule name="BarbeariaSite" dir=in action=allow protocol=TCP localport=8000
python -m http.server 8000 --bind 0.0.0.0
```
No celular: `http://<IP-DO-PC>:8000`

## 2. Publicar na internet (grátis, PC pode desligar)

### Backend (Render / Railway)
1. Crie conta em https://render.com ou https://railway.app
2. Conecte sua pasta `backend/`
3. Variáveis de ambiente: `MP_ACCESS_TOKEN`, `SIGNAL_VALUE=10`, `PIX_KEY`, `PUBLIC_BASE_URL=https://seu-backend.onrender.com`
4. Deploy. Anote a URL do backend (ex: `https://barbearia-api.onrender.com`)

### Frontend (GitHub Pages / Netlify / Vercel)
1. Suba a pasta `site-barbearia/` para o GitHub
2. Publique no GitHub Pages (ou arraste a pasta no Netlify Drop)
3. No `site-barbearia/app.js`, troque:
```js
API_BASE: 'https://barbearia-api.onrender.com',
```
4. Faça deploy novamente.

No painel do Mercado Pago, configure o webhook para:
`https://seu-backend.onrender.com/api/webhook/mercadopago`

## 3. Configurações obrigatórias (edite antes de usar)

No topo de `site-barbearia/app.js` (CONFIG):
- `BARBER_WHATSAPP` — número real da barbearia (só dígitos, ex: 5521990772663)
- `BARBER_ADDRESS` — endereço real
- `API_BASE` — URL do backend em produção

No `backend/.env`:
- `MP_ACCESS_TOKEN` — token do Mercado Pago (sem ele, o Pix roda em modo manual)

## Fluxo do cliente

1. Etapa 1 — escolhe o corte
2. Etapa 2 — escolhe dia (segunda fechada) e hora
3. Etapa 3 — preenche nome, WhatsApp, observação e escolhe pagamento:
   - **Dinheiro** → abre WhatsApp com resumo completo
   - **Pix R$ 10** → gera Pix via Mercado Pago; quando paga, mostra PAGO e libera WhatsApp

Agendamentos expirados (hora passada) são liberados automaticamente ao abrir o site.
