# 📋 PAINEL DO BARBEIRO — como funciona

O "Painel" é um segundo aplicativo (separado do app do cliente) que só **você** usa.

## O que ele faz

| Função | Como usar |
|---|---|
| **Ver todos os agendamentos** | Abre o Painel: cada agendamento do app "Barbearia do Jota" aparece como cartão (nome, telefone, serviço, dia, hora, pagamento). Clique em "📞 Falar no WhatsApp" para ligar o WhatsApp do cliente. |
| **Novo agendamento** | CHEGA DIRETO DO APLICATIVO DO CLIENTE pela internet — nada de ligar o computador. Quando chega, o celular **vibra** e mostra aviso. |
| **Abrir/Fechar quando quiser** | Botões no topo: ⏱️ **Horário automático**, 🟢 **Forçar aberto**, 🔴 **Forçar fechado**. O app do cliente obedece na hora. |
| **Mudar os horários** | Campos "Abre às" e "Fecha às" + botão 💾 **Salvar horários**. Ex.: abrir às 08:00 e fechar às 22:00. O cliente só consegue agendar dentro dessa janela. |

## Como chegam os agendamentos (sem precisar do PC)

Os dois apps conversam **direto pela internet** usando o serviço gratuito **ntfy.sh**:

```
celular do cliente (app Barbearia do Jota)
        │  agendamento enviado pela internet
        ▼
celular do barbeiro (app Painel)  — vibra e salva na hora
```

- O agendamento fica **SALVO dentro do Painel** (no próprio aparelho): pode fechar o app, reiniciar o celular, nada se perde.
- Se o cliente estiver sem internet no momento, o agendamento fica numa fila no celular dele e é enviado sozinho quando a internet voltar.
- **O computador NÃO precisa estar ligado** para agendar e receber.
- O canal guarda as mensagens por **12 horas** — se o Painel ficar totalmente sem internet mais que isso, os agendamentos daquele período são reenviados quando o cliente abrir o app de novo.

## O PC continua OPCIONAL (só para 2 coisas)

1. **Confirmação automática do Pix** — quando o sinal cai, o servidor do PC avisa o Painel "pago" na hora. Sem o PC, o pagamento aparece normalmente, só sem o aviso automático.
2. **Cópia de segurança central** no arquivo `backend\painel.json`.

Para essas duas coisas, ligue `iniciar-tudo.bat` no PC e deixe a janela aberta.

## PIN do Painel

O Painel lê os dados do servidor com um PIN para os dados dos clientes não ficarem abertos na rede.

- PIN padrão: **1234** — troque no ⚙️ Ajustes do Painel e também no arquivo `backend\.env`:
  ```
  PIN_PAINEL=suapin
  ```
  e reinicie o `iniciar-tudo.bat`.

## Ajustes (⚙️) do Painel

Mostra a versão, o PIN, servidores do PC (opcional) e o botão de atualização.

## Atualização do Painel

Igual ao app do cliente: quando sair release nova no GitHub (com um APK chamado `Painel-vX.X.X.apk` anexado), aparece o popup
🔁 *Nova versão do Painel* — botão **Atualizar agora** instala sozinho. "Depois" adia 5 minutos; `[FORCAR]` nas notas da release força.

## Publicar versão nova (os dois apps de uma vez)

Clique 2x em **`publicar-apk.bat`**: ele sobe a versão, gera o APK do cliente **e do Painel**, envia ao GitHub e publica a release com **os dois APKs** anexados.

## Estrutura dos arquivos

```
site+apk+github/
  apk-painel/            <- fonte do Painel (index.html, painel.js)
    android/             <- projeto Android próprio (app com.barbeariadojota.painel)
  site-barbearia/        <- fonte do site / app do cliente
  backend/server.js      <- servidor do PC (opcional: Pix + backup)
  backend/painel.json    <- backup central dos agendamentos
  atualizar-painel.ps1   <- sobe versão e compila o Painel sozinho
  publicar-apk.bat       <- publica os DOIS apps no GitHub
  APK/                   <- APKs compilados prontos para instalar
```
