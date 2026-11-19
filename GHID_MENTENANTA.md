# 🧭 Ghid de Mentenanță, Audit & Note pentru Viitor — Contor Ore Dora

Acest document păstrează starea exactă a proiectului, concluziile review-ului de stabilitate și securitate, și pașii concreți de unde să reluăm lucrul data viitoare.

---

## 📍 Starea Curentă (La Zi)

- **Ultima versiune publicată**: `v1.0.8` (`versionCode 9`, commit `80b9ec9`)
- **Repository GitHub**: `https://github.com/scaevola1981/calculator-salariu-Dora.git` (Public, branch `main`)
- **Application ID Android**: `ro.dora.contorore`
- **Monedă**: EURO (`€`)
- **Sistem de Update**: Live OTA (`web-bundle.zip`) + fallback APK (`app-debug.apk`) prin GitHub Releases + GitHub Actions.

### 🗂️ Harta Fișierelor Principale
| Fișier | Rol |
|---|---|
| `src/context/WorkContext.tsx` | Starea globală: pontaje, cronometru activ, tarif, temă Dark/White, onboarding, verificare update |
| `src/utils/storage.ts` | Persistență `localStorage` + auto-curățare (doar luna curentă + precedentă) |
| `src/utils/updater.ts` | Versiunea aplicației (`APP_VERSION`), verificare GitHub Releases, bridge către pluginul nativ `AppUpdater` |
| `src/components/Dashboard.tsx` | Pagina 1: carduri Ore/Bani, card tură live, grafic bare, Desfășurător Zilnic + Total |
| `src/components/CalendarPage.tsx` | Pagina 2: Tarif pe oră, Calendar pătrat (Lucrat / Concediu), buton Update în header |
| `src/components/DayEditModal.tsx` | Modal editare zi: Ora intrare / Ora ieșire (calcul automat), Concediu (CO), listă sesiuni + Delete roșu |
| `src/components/UpdateModal.tsx` | Modal in-app cu bară de progres `0% -> 100%` pentru OTA (`web-bundle.zip`) sau APK |
| `src/components/OnboardingModal.tsx` | Ecran animat la prima instalare (Nume + Tarif €/h) |
| `src/components/NavBar.tsx` | Bara plutitoare jos + buton central START/STOP cu ripple & particule |
| `src/index.css` | Stiluri Neo-Skeuomorphism + Glassmorphism, temă Dark (`#000`) & White (`#fff`), paletă `#2686F3`/`#6C6CF0` |
| `android/app/src/main/java/ro/dora/contorore/AppUpdaterPlugin.java` | Plugin Android nativ: descărcare OTA, dezarhivare sigură, `Bridge.setServerBasePath`, fallback instalare APK |
| `.github/workflows/build-apk.yml` | CI/CD GitHub Actions: compilează `app-debug.apk` și `web-bundle.zip` și creează Release la tag `v*` |

---

## 📜 Istoric Versiuni (Ce am făcut până acum)

- **`v1.0.0`**: Aplicație inițială Vite + React + Capacitor Android, temă Dark/White, schemă culori `#2686F3` / `#6C6CF0`, iconiță squircle cu steagul României, Desfășurător Zilnic, Concediu (`CO`), Onboarding animat, animații START/STOP, buton Update în header.
- **`v1.0.1`**: Buton Update roșu în stare statică, albastru când există update nou.
- **`v1.0.2`**: Font albastru (`#2686F3`) pentru datele din Desfășurător.
- **`v1.0.3`**: Plugin nativ `AppUpdaterPlugin.java` + `UpdateModal.tsx` (descărcare în aplicație fără Chrome).
- **`v1.0.4`**: Buton de ștergere (Delete) mai mare și roșu în `DayEditModal`.
- **`v1.0.5`**: Unificare `android/app/debug.keystore` între Mac și GitHub Actions (rezolvare conflict semnătură la update).
- **`v1.0.6`**: Înlocuire câmpuri Ore/Minute cu **Ora de intrare** și **Ora de ieșire** + calcul automat, eliminare butoane rapide de ore, opțiune Concediu cu font albastru.
- **`v1.0.7`**: **Live OTA Updates** (`web-bundle.zip` + `Bridge.setServerBasePath`) — update-uri silențioase doar cu bara de încărcare, fără ferestre de sistem Android.
- **`v1.0.8`**: Umbre 3D accentuate pe carduri (`.glass-card`).

---

## 🛡️ Review de Stabilitate & Securitate

### ✅ Ce funcționează foarte solid
1. **Reziliență la închiderea din fundal**: Cronometrul salvează `startTime` (timestamp Unix); chiar dacă telefonul se restartează sau aplicația este închisă din recents, timpul nu se pierde.
2. **Protecție Zip-Slip în OTA**: `AppUpdaterPlugin.unzipSafely()` verifică strict calea canonică a fiecărui fișier extras și validează existența `index.html` înainte de a schimba `CAP_SERVER_PATH`.
3. **Persistență date la update**: `applicationId` (`ro.dora.contorore`) și `androidScheme: 'https'` rămân neschimbate, deci `localStorage` (`https://localhost`) supraviețuiește atât update-urilor OTA, cât și update-urilor de APK.
4. **Curățare automată memorie**: `cleanOldLogs()` păstrează strict luna curentă și luna precedentă, evitând creșterea necontrolată a datelor.
5. **100% privat & offline-first**: Nu există servere externe, baze de date cloud sau tracking; singurul apel de rețea este verificarea opțională de update pe GitHub (cu timeout de 5s și `cache: 'no-store'`).

### ⚠️ Aspecte de îmbunătățit pe viitor (Securitate & Stabilitate)
1. **Cheia de semnare (`android/app/debug.keystore`) în repo public** *(Securitate — Prioritate medie)*:
   - Momentan `android/app/debug.keystore` este urcat în repo-ul public GitHub ca să existe aceeași semnătură între Mac și GitHub Actions. Pentru uz personal/intern e acceptabil, dar dacă aplicația devine publică, e recomandat să generezi un `release.keystore` cu parolă puternică, să îl scoți din Git și să îl stochezi ca **GitHub Secret (base64)**.
2. **Allowlist de domenii în `AppUpdaterPlugin.java`** *(Securitate — Prioritate mică)*:
   - Pentru extra-securitate, `applyOtaUpdate` și `downloadAndInstall` pot valida ca URL-ul să înceapă strict cu `https://github.com/scaevola1981/` sau `https://objects.githubusercontent.com/`.
3. **Duplicate macOS / iCloud (`* 2.*`)** *(Stabilitate build local)*:
   - Proiectul fiind în `~/Desktop` (sincronizat cu iCloud Drive), macOS poate genera fișiere duplicat cu spații în nume (ex. `config 2.xml`, `ic_launcher 2.png`), care blochează Gradle (`Failed file name validation`).
   - **Sfat**: Pe viitor, mută folderul proiectului în `~/Projects/` (în afara iCloud) sau rulează înainte de build:
     ```bash
     find android/app/src/main/res -name "* *" -delete
     ```
4. **Fonturi Google Fonts offline** *(Stabilitate UI)*:
   - `Plus Jakarta Sans` și `JetBrains Mono` sunt încărcate din `fonts.googleapis.com` în `index.html`. Offline aplicația trece curat pe fonturile de sistem fără erori, dar dacă vrei identitate vizuală 100% identică offline, fonturile pot fi descărcate local în `public/fonts/`.
5. **Ture care trec peste miezul nopții**:
   - Dacă cronometrul pornește la `22:00` și se oprește a doua zi la `06:00`, întreaga durată (`8h`) este înregistrată pe ziua opririi. (Comportament intenționat și simplu, de reținut dacă vreodată se dorește împărțirea pe două zile calendaristice).

---

## 🚀 De Unde Să Ne Apucăm Data Viitoare (Checklist & Idei)

### Pași rapizi la reluarea proiectului:
1. Rulează `git status` și `git pull` pentru a te asigura că ești pe ultimul commit din `main`.
2. Verifică să nu existe fișiere duplicat iCloud (`* 2.*`) în `android/app/src/main/res/`.
3. Pentru testare rapidă în browser: `npm run dev`.
4. Când ești gata de o versiune nouă (ex. `v1.0.9`):
   - Crește versiunea în `src/utils/updater.ts` (`APP_VERSION`), `package.json` (`version`) și `android/app/build.gradle` (`versionCode` + `versionName`).
   - Fă `git add . && git commit -m "..." && git push && git tag v1.0.9 && git push origin v1.0.9`.
   - **Reține**: Dacă modifici doar cod React/CSS/TS (web), clientul primește update-ul **instant OTA** (doar cu bara de încărcare). Doar dacă modifici fișiere native Android (`Java`, `AndroidManifest.xml`, iconițe) trebuie reinstalat APK-ul.

### 💡 Idei utile pentru versiunile următoare:
- **Export / Import Backup (JSON) sau Raport WhatsApp**: buton în pagina Calendar pentru a copia/trimite sumarul lunii (ore + concedii + total €) pe WhatsApp sau a face backup înainte de schimbarea telefonului.
- **Editare Nume după Onboarding**: un mic câmp în pagina Calendar pentru a putea schimba numele salvat la instalare.
- **Restricție domeniu HTTPS în `AppUpdaterPlugin.java`** + **mutare `release.keystore` în GitHub Secrets** (dacă proiectul devine pentru mai mulți clienți).
- **Widget Android / Notificare persistentă** cât timp cronometrul este pornit (pentru a vedea tura direct din bara de notificări Android).
