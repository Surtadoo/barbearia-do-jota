# 📋 PAINEL DO BARBEIRO — como funciona

O "Painel" é um segundo aplicativo (apartamento do app do cliente).

## O que ele faz

| Função | Como usar |
|---|---|
| **Ver todos os agendamentos** | Abre o Painel: cada agendamento do site aparece como cartão (nome, telefone, serviço, dia, hora, pagamento). Clique em "📞 Falar no WhatsApp" para ligar o WhatsApp do cliente. |
| **Novo agendamento** | A lista se atualiza sozinha a cada 5 segundos. Quando chega um agendamento novo, o celular **vibra** e mostra aviso. |
| **Abrir/Fechar quando quiser** | Botões no topo: ⏱️ **Horário automático** (obedece a janela configurada), 🟢 **Forçar aberto**, 🔴 **Forçar fechado**. O site do cliente obedece na hora. |
| **Mudar os horários** | Campos "Abre às" e "Fecha às" + botão 💾 **Salvar horários**. Ex.: abrir às 08:00 e fechar às 22:00. O site só deixa agendar dentro dessa janela. |

## O que precisa estar ligado

O agendamento do site **chega no Painel pelo computador** (mesmo servidor que confere o Pix):

1. No PC da barbearia, ligue **`iniciar-tudo.bat`** (ele sobe o servidor Pix + o site) e **deixe a janela aberta**.
2. No celular com o Painel, o nº precisa estar **na mesma rede Wi-Fi do PC** (ou o servidor publicado na internet).

> Se o PC estiver desligado, o site **não perde** o agendamento: ele fica numa fila no celular do cliente e envia sozinho assim que o PC ligar.

## PIN do Painel

O Painel lê os dados com um PIN para os dados dos clientes não ficarem abertos na rede.

- PIN padrão: **1234**
- Para trocar: no Painel → ⚙️ Ajustes → campo "PIN do painel". E também no PC, no arquivo `backend\.env`, crie/edite a linha:
  ```
  PIN_PAINEL=suatrocinco
  ```
  e reinicie o `iniciar-tudo.bat`.
- **Os dois PINs têm que ser iguais** (o do Painel e o do servidor).

## Endereço do servidor no Painel

⚙️ Ajustes → "Endereço do servidor" — campo com o IP do PC (ex. `http://192.168.1.73:3001`).
Se mudar o IP do PC, atualize aqui e, no Painel ligado ao PIN errado ele avisa.

## Atualização do Painel

Igual ao app do site: quando sair release nova no GitHub (com um APK chamado `Painel-vX.X.X.apk` anexado), o popup
🔁 Nova versão do Painel aparece — botão **Atualizar agora** instala.

## No momento, dentro dos APK

- **Barbearia-do-Jota.apk** (cliente): sem o botão "🗑️ Limpar dados de teste"; envia agendamentos ao Painel.
- **Painel.apk** (barbeiro): listagem completa + abrir/fechar + horários.

## Estrutura dos arquivos

```
site+apk+github/
  apk-painel/            <- fonte do Painel (index.html, painel.js)
    android/             <- projeto Android próprio (app com.barbeariadojota.painel)
  backend/painel.json    <- TODOS os agendamentos + status aberto/fechado
  site-barbearia/        <- site normal (cliente)
  APK/                   <- APKs compilados prontos para instalar
```
