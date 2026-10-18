# Atualização automática do aplicativo

O aplicativo pergunta no GitHub se existe uma versão nova. Se tiver, aparece
um popup com **Atualizar agora** e **Depois**.

---

## 1. Ligar uma vez só

Abra o aplicativo, toque na **engrenagem ⚙️** no alto e preencha:

**Repositório do GitHub** → `seu-usuario/barbearia-do-jota`

Toque em **Salvar e procurar atualização**. O endereço fica salvo no celular.

> Também dá para escrever direto no código, lá no topo de
> `site-barbearia\app.js`:
> ```js
> GITHUB_USER: 'seu-usuario',
> GITHUB_REPO: 'barbearia-do-jota',
> ```

---

## 2. Publicar uma versão nova

Clique duas vezes em **`publicar-apk.bat`** na pasta principal.

Ele pergunta o número da versão e:

1. Sobe o número no `app.js`
2. Gera o APK novo
3. Manda tudo para o GitHub
4. Cria a *Release* com o APK anexado

Depois é só instalar o APK novo no seu celular. Quem já tem o app instalado
vê o popup ao abrir.

### Precisa ter instalado uma vez

- **Git** — https://git-scm.com/download/win
- **GitHub CLI** — https://cli.github.com (só para criar a release automático)

Se o `gh` não estiver instalado, o script avisa no final e mostra o link para
criar a release na mão. **Sem a release o popup não aparece.**

### Se for a primeira publicação

Rode estes comandos uma vez só:

```
cd /d "C:\Users\Yagoa\Documents\Projeto Padrão"
git init
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/barbearia-do-jota.git
git push -u origin main
```

Depois é só usar o `publicar-apk.bat`.

---

## 3. O que o cliente vê

```
┌─────────────────────────────┐
│             ⬆️               │
│   Versão 1.2.0 disponível    │
│   Você está na versão 1.1.0  │
│                             │
│  Pagamento do Pix agora      │
│  confere sozinho             │
│  Fotos maiores no topo       │
│                             │
│  ⬇️ Atualizar agora          │
│       Depois                 │
└─────────────────────────────┘
```

- **Atualizar agora** abre o navegador na página de download do APK novo.
  O Android pergunta se pode instalar — toque em **Instalar**.
- **Depois** fecha o popup e não lembra de novo por **1 hora**. Na próxima
  hora ele volta a aparecer.

O popup só aparece sozinho 1 vez por versão. Se você quiser conferir na
hora, é pelo botão nos ajustes.

---

## 4. Detalhes técnicos

**Quanto tempo o app espera:** 2,5 segundos depois de abrir, e depois a cada
6 horas enquanto estiver aberto.

**Comparação de versões:** `1.10.0` > `1.9.9` (compara número por número,
não por texto). Testado.

**Se o GitHub estiver fora do ar:** o app não trava, só não mostra o popup.

**Limite do GitHub:** a API permite 60 consultas por hora sem login. Como o
app só checa de 6 em 6 horas, não é problema.

**Permissão no Android:** o app pede permissão para instalar pacotes
(`REQUEST_INSTALL_PACKAGES`). Sem ela o Android bloqueia a instalação do
APK novo. Na primeira vez ele abre uma tela pedindo autorização — toque em
**Permitir**.

---

## 5. Problemas

**O popup não aparece**

1. O repositório está preenchido nos ajustes?
2. A release foi criada no GitHub com a tag certa? (ex: `v1.2.0`)
3. O arquivo `.apk` foi anexado na release?
4. A tag é maior que a versão do app? O app não consegue se atualizar
   para uma versão menor.

**Aparece "GitHub respondeu 404"**

O repositório não existe ou o nome está errado. Confira a URL no navegador:
`https://github.com/seu-usuario/barbearia-do-jota`

**Aparece "GitHub respondeu 403"**

Passou do limite de 60 consultas por hora. Espere uma hora e tente de novo.

**"Atualizar agora" não faz nada**

O navegador não abriu. Verifique se o celular tem internet e tente de novo
pelo link da release direto no navegador.

**O Android diz que não pode instalar**

Abra o aplicativo, vá em **Ajustes** do sistema → **Instalar aplicativos
desconhecidos** →允许 (permita) o aplicativo que está abrindo o navegador.
