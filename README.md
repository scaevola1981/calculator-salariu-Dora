# ⏱️ Contor Ore Dora (`v1.0.8`)

Aplicație mobilă Android standalone (**React + TypeScript + Vite + Capacitor 7**), 100% funcțională offline, pentru pontarea orelor de lucru, evidența zilelor de concediu și calculul automat al veniturilor în **EURO (€)**.

Construită în stil **Neo-Skeuomorphism + iOS Glassmorphism**, cu temă **Dark (`#000000`) / White (`#FFFFFF`)**, paletă de culori personalizată (`#2686F3`, `#6C6CF0`, `#8A84E2`, `#84AFE6`, `#79BEEE`), feedback haptic și sistem de **Live OTA Updates** direct în aplicație.

---

## 🌟 Funcționalități Principale

1. **Configurare Inițială Animată (Onboarding)**:
   - La prima instalare, aplicația afișează un ecran animat unde utilizatorul își introduce **Numele** și **Tariful pe oră (€/h)**.
2. **Temă Dark / White & Design Neo-Glass**:
   - Comutator rapid **Dark (`#000`) / White (`#fff`)** în header-ul ambelor pagini, sincronizat automat cu bara de status Android.
   - Carduri translucide `#6C6CF0` cu umbre 3D accentuate și butoane tactile `#2686F3`.
   - Iconiță **squircle** personalizată cu steagul României și cronometru `€`.
3. **Cronometru Rezistent la Închidere & Animații START/STOP**:
   - Buton central tactil centrat în bara de navigare plutitoare.
   - Efect de undă (ripple), particule animate și bannere personalizate la intrarea/ieșirea din schimb.
   - Calcul bazat pe timestamp (`Date.now() - startTime`): dacă aplicația este închisă din fundal sau telefonul repornește în timpul turei, cronometrul continuă fără a pierde timp.
4. **Pagina 1: Dashboard (Sumar, Grafic & Desfășurător)**:
   - Selector rapid **Luna Curentă / Luna Precedentă**.
   - Carduri 50% / 50%: **Ore Lucrate** (`08h 30m` + zecimal) și **Bani Acumulați (`€`)**.
   - **Grafic cu Bare (Bar Chart)**: toate zilele lunii fără scroll orizontal; apăsarea pe o bară afișează detaliile zilei.
   - **Desfășurător Zilnic**: listă detaliată pe fiecare zi lucrată sau de concediu (`CO`), cu rând de **TOTAL** la final.
5. **Pagina 2: Calendar & Tarif Orar**:
   - **Tarif pe Oră (€/h)** cu butoane `-` / `+` și salvare automată.
   - **Calendar Lunar** cu căsuțe pătrate (`aspect-square`): zilele lucrate au fundal albastru (`#2686F3`), iar zilele de concediu au fundal portocaliu (`CO`).
   - **Modal Editare Zi**: introducere **Ora de intrare** și **Ora de ieșire** cu calcul automat al duratei (inclusiv ture de noapte), opțiune **Zi de Concediu (CO)** și ștergere individuală a înregistrărilor.
6. **Regulă Strictă de Memorie (Auto-curățare)**:
   - Păstrează exclusiv **luna curentă și luna precedentă** în `localStorage`; înregistrările mai vechi sunt șterse automat.
7. **Actualizări Silențioase în Aplicație (Live OTA Updates)**:
   - Buton de Update în header-ul paginii Calendar (**roșu** când aplicația e la zi, **albastru `#2686F3`** cu punct pulsatil când există un Release nou pe GitHub).
   - Descarcă `web-bundle.zip` cu bară de progres `0% -> 100%` direct în modal și aplică noua versiune instant prin Capacitor `Bridge.setServerBasePath(...)`, fără ferestre de sistem Android și fără pierderea datelor.

---

## 📱 Descărcare & Instalare pe Android

- **Link direct APK (ultima versiune)**:
  https://github.com/scaevola1981/calculator-salariu-Dora/releases/latest/download/app-debug.apk
- **Pagina de Releases**:
  https://github.com/scaevola1981/calculator-salariu-Dora/releases/latest

> Odată instalată versiunea `v1.0.7`+, actualizările viitoare de interfață și logică se aplică direct din aplicație (butonul albastru de Update), fără reinstalare manuală.

---

## 🛠️ Comenzi de Dezvoltare & Release

### Rulare locală în browser:
```bash
npm install
npm run dev
```

### Compilare locală APK (`app-debug.apk`):
```bash
./build-apk.sh
```
APK-ul este generat la `android/app/build/outputs/apk/debug/app-debug.apk`.

### Instalare pe telefon conectat prin USB (ADB):
```bash
~/Library/Android/sdk/platform-tools/adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

### Publicare versiune nouă (Update OTA + APK prin GitHub Actions):
1. Actualizează versiunea în 3 locuri:
   - `src/utils/updater.ts` -> `APP_VERSION`
   - `package.json` -> `"version"`
   - `android/app/build.gradle` -> `versionCode` (+1) și `versionName`
2. Fă commit, push și urcă noul tag:
   ```bash
   git add . && git commit -m "Release v1.0.9: descriere" && git push
   git tag v1.0.9 && git push origin v1.0.9
   ```
3. GitHub Actions ([.github/workflows/build-apk.yml](.github/workflows/build-apk.yml)) compilează automat `app-debug.apk` + `web-bundle.zip` și publică Release-ul.

---

## 📚 Documentație Suplimentară
- Vezi [GHID_MENTENANTA.md](GHID_MENTENANTA.md) pentru auditul de stabilitate & securitate, istoricul complet al versiunilor și checklist-ul pentru data viitoare când reluăm proiectul.
