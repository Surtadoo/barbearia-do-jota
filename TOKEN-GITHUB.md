# Criar o token do GitHub (fazer uma vez só)

O `publicar-apk.bat` precisa de uma **chave de acesso** para criar as releases
pelo site do GitHub. Você cria uma vez, cola num arquivo, e pronto — não precisa
instalar mais nada.

---

## Passo a passo

**1.** Entre no GitHub e abra esta página:

```
https://github.com/settings/tokens/new
```

**2.** Preencha:

| Campo | O que colocar |
|---|---|
| Note (descrição) | `PC da barbearia` |
| Expiration | `90 days` (ou `1 year`) |
| Repository access | `Only select repositories` → escolha `barbearia-do-jota` |
| Permissions | marque **Contents** → **Read and write** |

> Só precisa da permissão **Contents**. Não marque mais nada.

**3.** Desça até o fim e clique em **Generate token**.

**4.** Copie o token que apareceu (começa com `ghp_`).

> Ele só aparece **uma vez**. Se perder, é só criar outro.

**5.** Na pasta do projeto, crie um arquivo chamado **`github-token.txt`** e cole
o token dentro:

```
ghp_suaChaveAqui1234567890
```

Pode usar o Bloco de Notas. Salve como `github-token.txt` (não `.txt.txt` —
o Bloco de Notas às vezes coloca a extensão duas vezes).

**6.** Pronto. Agora clique duas vezes em `publicar-apk.bat` como sempre.

---

## Segurança

O arquivo `github-token.txt` **não vai para o GitHub** — ele está no
`.gitignore`. Mesmo que alguém veja o repositório, não consegue ler.

**Se o token vazar**, volte ao GitHub → **Settings** → **Developer settings**
→ **Personal access tokens** e clique em **Revoke**.

---

## Quando o token vencer

O script avisa:

```
ERRO: 401 - Bad credentials
```

Aí é só criar outro token no mesmo endereço e trocar o conteúdo do arquivo.

---

## O que o script faz com o token

Duas coisas, e só isso:

1. Cria a *release* com a tag `v1.0.03`
2. Anexa o arquivo `.apk` nela

É tudo pelo site do GitHub. Nenhum dado sai do seu computador.
