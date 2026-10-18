# 📱 Compilar o site em APK (Android)

O site está em `site-barbearia/` e pode ser transformado em APK com o **Capacitor** (embrulho nativo para Android).

## Arquivos criados
- `site-barbearia/capacitor.config.json` — configuração do Capacitor
- `compilar-apk.bat` — script para iniciar a compilação (Windows)

## Como usar o .bat

1. Duplo-clique em **`compilar-apk.bat`** (na raiz do projeto)
2. Ele vai:
   - Criar a pasta `www/` com os arquivos do site
   - Inicializar o Capacion
   - Adicionar a plataforma Android
   - Sincronizar o web com o Android
3. Depois, abra o **Android Studio**:
   - `Open an existing Android Studio project`
   - Selecione a pasta `site-barbearia/android`
   - `Build > Build Bundle(s) / APK(s) > Build APK(s)`
4. O APK final ficará em:
   `site-barbearia/android/app/build/outputs/apk/release/app-release.apk`

## Requisitos no Windows
- [Node.js](https://nodejs.org/) instalado
- [Android Studio](https://developer.android.com/studio) com SDK do Android configurado
- Variável de ambiente `ANDROID_HOME` apontando para o SDK

## Alternativa: já existe um app React Native

Na pasta `app-barbearia/` já está um app nativo (Expo/React Native) com as mesmas funções. Se quiser compilar ele em APK:

```bash
cd app-barbearia
npm install
npx expo build:android
```

Isso gera um APK direto na nuvem da Expo, sem precisar do Android Studio instalado localmente.
