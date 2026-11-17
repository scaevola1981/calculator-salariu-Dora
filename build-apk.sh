#!/bin/bash
set -e

echo "=================================================="
echo "🚀 Generare APK Android: Contor Ore Dora"
echo "=================================================="

# Set Java Home if not already set
if [ -z "$JAVA_HOME" ]; then
  if [ -d "/Applications/Android Studio.app/Contents/jbr/Contents/Home" ]; then
    export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
  fi
fi

# Set Android SDK if not already set
if [ -z "$ANDROID_HOME" ]; then
  export ANDROID_HOME="$HOME/Library/Android/sdk"
fi

echo "🔹 JAVA_HOME: $JAVA_HOME"
echo "🔹 ANDROID_HOME: $ANDROID_HOME"

echo "🔹 Pas 1: Compilare interfață web..."
npm run build

echo "🔹 Pas 2: Sincronizare Capacitor Android..."
npx cap sync android

echo "🔹 Pas 3: Compilare APK prin Gradle..."
cd android
./gradlew assembleDebug
cd ..

APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"

if [ -f "$APK_PATH" ]; then
  echo ""
  echo "=================================================="
  echo "✅ APK generat cu succes!"
  echo "📍 Locație: $(pwd)/$APK_PATH"
  echo "📱 Dimensiune: $(ls -lh "$APK_PATH" | awk '{print $5}')"
  echo "=================================================="
else
  echo "⚠️ Fișierul APK nu a fost găsit la $APK_PATH."
fi

