# ⏱️ Contor Ore Dora (Android & Web Standalone)

Aplicație mobilă modernă, elegantă și 100% offline, concepută pentru telefoanele Android pentru pontarea orelor de lucru și calculul automat al veniturilor.

Construită pe o estetică **Neo-Skeuomorphism + iOS Glassmorphism** (elemente translucide cu blur de fundal, umbre 3D moi, contururi fine luminoase și butoane tactile cu răspuns haptic).

---

## 🌟 Caracteristici Principale

1. **Gestionează Exclusiv Luna Curentă și Luna Precedentă (Regula Strictă de Memorie)**:
   - Toate datele se salvează local pe telefon (`localStorage` / Capacitor Preferences).
   - **Auto-curățare inteligentă**: la deschiderea aplicației sau schimbarea lunii, orice pontaje mai vechi de luna precedentă sunt șterse automat, păstrând aplicația ultra-rapidă și curată.
   - Selector rapid între **Luna Curentă** și **Luna Precedentă** atât pe Dashboard cât și în Calendar.

2. **Cronometru Inteligent & Rezistent la Închiderea din Fundal**:
   - Buton central tactil stil întrerupător 3D / ceas de lux (*Start / Stop Tură*).
   - **Rezistent la închidere**: Dacă aplicația este închisă din lista de aplicații recente pe Android în timp ce tura merge, la redeschidere cronometrul calculează exact timpul scurs pe baza timestamp-ului salvat. Nu se pierde nicio secundă!
   - La oprire, durata se adaugă automat în ziua curentă și oferă feedback haptic.

3. **Pagina 1: Dashboard (Sumar & Statistici)**:
   - Header cu două carduri 50% / 50%:
     - **Ore Lucrate**: Total formatat clar (`08h 30m` și valoare zecimală).
     - **Bani Acumulați**: Calculat automat (`Ore Lucrate × Tarif Orar`).
   - Card animat în timp real când tura este pornită (arată secundele live și banii acumulați în tura curentă).
   - **Grafic cu Bare (Bar Chart)**: Afișează fiecare zi din lună cu bare rotunjite și gradient. La apăsarea pe o bară, apare un panou cu detaliile zilei respective.

4. **Pagina 2: Calendar & Tarif Orar**:
   - **Tarif Orar (RON/h)**: Câmp numeric neo-skeuomorphic cu butoane `+` / `-` și pastile predefinite (30, 40, 50, 60, 75, 100). Modificarea tarifului recalculează instantaneu toți banii din aplicație.
   - **Calendar Lunar**: Zilele lucrate sunt evidențiate cu insignă de ore.
   - **Modal Editare Zi**: Permite ajustarea manuală a orelor (în caz că ai uitat cronometrul pornit sau oprit), adăugarea de intervale sau ștergerea pontajului unei zile.

---

## 🛠️ Comenzi Rapide

### 1. Rulare în mod de dezvoltare (în browser):
```bash
npm run dev
```
Deschide `http://localhost:3000` în browser sau testează cu modul Mobile DevTools (Ctrl+Shift+M / Cmd+Shift+M).

### 2. Generare APK gata de instalat pe telefon (`app-debug.apk`):
Execută scriptul dedicat:
```bash
./build-apk.sh
```
sau prin comanda npm:
```bash
npm run build:apk
```

Fișierul APK va fi generat la:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 📱 Cum instalezi APK-ul pe telefonul Android:

1. **Prin Cablu USB (ADB)**:
   Dacă telefonul are opțiunea *USB Debugging* activată:
   ```bash
   adb install -r android/app/build/outputs/apk/debug/app-debug.apk
   ```

2. **Fără cablu**:
   - Copiază fișierul `app-debug.apk` pe telefon (prin Google Drive, WhatsApp, Telegram, transfer prin cablu sau descărcare directă).
   - Pe telefon, apasă pe fișierul `.apk` și selectează **Instalează** (dacă ți se solicită, permite instalarea aplicațiilor din surse necunoscute pentru aplicația respectivă).

