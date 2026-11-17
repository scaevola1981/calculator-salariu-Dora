Rol, Platformă și Arhitectură:

Construiește o aplicație mobilă de sine stătătoare (standalone) destinată telefoanelor Android, pregătită pentru a fi compilată și instalată ca APK (folosind Capacitor / Cordova peste un build web modern, sau React Native / Flutter, cu funcționare 100% offline, fără a depinde de un server extern).

Regulă Strictă de Gestiune a Memoriei (Doar Luna Curentă + Luna Precedentă):

Toate datele (pontajele zilnice, starea cronometrului activ și tariful orar) se salvează local pe telefon (localStorage / SQLite / Preferences).

Auto-curățare inteligentă: Aplicația trebuie să păstreze în memorie exclusiv datele din luna curentă și luna imediat precedentă. La deschiderea aplicației sau la schimbarea lunii, orice înregistrări mai vechi de luna precedentă sunt șterse automat pentru a menține aplicația ușoară, rapidă și curată.

Pe Pagina 1 (Dashboard), cardurile și graficul afișează implicit luna curentă, dar poți include un mic selector discret (Luna curentă / Luna precedentă) pentru a putea verifica și pontajul de luna trecută.

Stil Vizual și Design (UI/UX Mobile-First):

Estetică: Neo-Skeuomorphism combinat cu iOS Glassmorphism (elemente translucide cu backdrop-filter: blur, umbre moi interioare și exterioare pentru efect tactil 3D, contururi fine luminoase și colțuri rotunjite 20px-24px).

Adaptare Android: Respectă zonele de siguranță ale ecranului (safe-area-inset pentru bara de status Android și bara de gesturi de jos), fără scroll orizontal, cu butoane mari, ușor de apăsat cu degetul mare.

Formatul timpului: Afișează orele în format clar (08h 30m sau intervale de 30 de minute / ore zecimale).

Structura Aplicației (2 Pagini + NavBar Fix Jos):

1. Bara de Navigare (Bottom NavBar – stil iOS Floating Tab Bar):

Fixată în partea de jos a ecranului, cu efect glass, conținând 3 elemente:

Buton Pagina 1 (Sumar / Grafic) – navigare către ecranul principal.

Buton Central Tactil (Start / Stop Tură): Un buton central reliefat (design skeuomorphic, ca un întrerupător fizic/cronometru). La apăsare pornește cronometrul pentru tura curentă (afisând timpul scurs live și schimbând starea vizuală în „În tură / Stop”). Important: Dacă utilizatorul închide aplicația din fundal pe Android în timp ce cronometrul merge, la redeschidere cronometrul trebuie să își continue calculul corect pe baza orei de start salvate (timestamp). La oprire, salvează durata în ziua curentă.

Buton Pagina 2 (Calendar & Tarif) – navigare către a doua pagină.

2. Pagina 1: Dashboard (Sumar & Statistici):

Header cu două carduri alăturate (50% / 50% lățime):

Cardul din stânga (Ore Lucrate): Afișează totalul orelor lucrate în luna selectată (implicit luna curentă).

Cardul din dreapta (Bani Acumulați): Afișează suma calculată automat (Total Ore × Tarif Orar, calcul simplu 1:1).

Secțiunea de sub carduri (Grafic):

Un grafic de tip Bar Chart curat, cu bare rotunjite și animații fluide, care arată orele lucrate pe fiecare zi din lună.

3. Pagina 2: Calendar & Tarif Orar:

Input Tarif Orar: Un câmp numeric clar („Plată pe oră”) unde utilizatorul introduce tariful orar. Valoarea rămâne salvată permanent în memoria telefonului și actualizează instantaneu suma de bani de pe Pagina 1.

Calendar Lunar: Afișează calendarul (permițând navigarea doar între luna curentă și luna precedentă). Zilele lucrate sunt evidențiate vizual și afișează numărul de ore lucrate în acea zi. La apăsarea pe o zi, se deschide un mic panou/modal pentru a vedea detaliile sau a ajusta manual orele dacă a fost uitat cronometrul pornit/oprit.

„Configurează proiectul cu Capacitor (@capacitor/android) și oferă-mi pașii/comenzile pentru a genera fișierul app-debug.apk gata de instalat pe telefonul Android.”