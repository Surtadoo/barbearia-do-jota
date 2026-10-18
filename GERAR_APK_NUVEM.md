# 📱 Gerar APK pela Nuvem (sem Android Studio)

Este método gera o APK usando o **EAS Build** (build na nuvem da Expo). Não é necessário instalar o Android Studio nem o Android SDK no seu PC.

## O que você precisa
1. **Node.js** instalado (já está no seu PC)
2. Uma **conta gratuita na Expo** (https://expo.dev — cadastre-se antes)

## Como usar

1. Aperte **Win + R**, digite `cmd`, Enter
2. Cole e rode:
   ```
   "C:\Users\Yagoa\Documents\Projeto Padrão\gerar-apk-nuvem.bat"
   ```

## O que o script faz
1. Instala as dependências do app
2. Instala o EAS CLI (ferramenta de build da Expo)
3. Abre o navegador para você fazer login na Expo
4. Gera o APK na nuvem (pode demorar 5-15 minutos)
5. Você baixa o `.apk` pelo link que aparece no terminal

## Onde fica o APK
O arquivo `.apk` fica disponível na sua conta da Expo (expo.dev), na seção de builds. Você baixa direto pelo navegador.

## Alternativa: PWA (instala direto no celular)
O site em `site-barbearia/www/` já é uma PWA (Progressive Web App). Seu cliente pode:
1. Abrir o site no Chrome do celular
2. Clicar nos 3 pontos ⋮ > "Adicionar à tela de início"
3. Fica como um app ícone no celular, sem precisar de APK
