# Como está organizado o site da barbearia

## A regra de ouro

**Só existe UM lugar onde você edita o site:**

```
site-barbearia\
    index.html       <- estrutura da página
    app.js           <- toda a lógica (serviço, calendário, Pix, WhatsApp)
    styles.css       <- visual
    logo.svg         <- logo
    img\             <- as 8 fotos
    manifest.json
```

**Tudo o que está em outros lugares é cópia gerada automaticamente.** Se você
editar lá, a próxima execução dos `.bat` sobrescreve suas mudanças sem avisar.

---

## As pastas que são cópias (não editar)

| Pasta | Para que serve | Como é gerada |
|---|---|---|
| `site-barbearia\www\` | O Capacitor lê daqui para montar o APK | `iniciar-tudo.bat` e `gerar-apk.bat` copiam da raiz |
| `site-barbearia\android\app\src\main\assets\public\` | Cópia dentro do projeto Android | `npx cap sync android` |
| `site-barbearia\android\app\build\...` | Arquivos temporários da compilação | Gradle, apagável |

Todas essas pastas têm um arquivo **`LEIA-ME.txt`** dizendo que são geradas.
Se você abrir alguma delas, o Windows mostra o aviso.

---

## Os arquivos que não são do site

| Arquivo/Pasta | O que é |
|---|---|
| `backend\` | Servidor que confere o Pix na InfinitePay |
| `APK\` | APKs prontos para instalar |
| `app-barbearia\` | Projeto Expo (abandonado, pode apagar) |
| `jogo\`, `jogo-corrida\` | Projetos antigos, não relacionados |
| `*.bat` | Scripts para ligar, gerar APK e publicar |
| `*.md` | Documentação |
| `servidor.log` | Log do servidor do Pix |

---

## Fluxo de edição

```
1. Abra site-barbearia\index.html (ou app.js, styles.css)
2. Edite no bloco CONFIG (app.js) ou onde for
3. Salve
4. Rode iniciar-tudo.bat para ver no navegador
5. Rode gerar-apk.bat para gerar o APK
```

Nunca edite a pasta `www\` ou `android\`. Os scripts sempre sincronizam
da pasta `site-barbearia\` para as outras.

---

## Por que existe a pasta www\

O Capacitor (ferramenta que vira o site em APK) **exige** que os arquivos
estejam em uma subpasta chamada `www`. Por isso a pasta existe — mas é
apenas uma cópia de trabalho, não um segundo site.

---

## Se quiser apagar as pastas que não são do site

Pode apagar sem medo:

- `app-barbearia\` (projeto Expo abandonado)
- `jogo\`, `jogo-corrida\` (projetos antigos)
- `site-barbearia\android\app\build\` (será recriado no próximo build)
- `servidor.log`, `servidor-erro.log`
- `site-barbearia.rar`, `corrida-maluca.zip`

**NÃO apague** `site-barbearia\android\` (é o projeto do APK),
`backend\` (é o servidor do Pix), `APK\` (seus APKs prontos),
nem os `.bat` e `.md`.
