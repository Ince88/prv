# 🔗 MiniCRM Integráció

## Áttekintés

A PRV AI Assistant most integr álva van a MiniCRM rendszerrel, lehetővé téve a teendők (to-do-k) határidejének módosítását közvetlenül az alkalmazásból, miután betöltötted egy kapcsolat email történetét.

---

## ✨ Funkciók

### 1. **Automatikus Kapcsolat Keresés**
- Email cím betöltése után automatikusan megkeresi a kapcsolatot a MiniCRM-ben
- **FONTOS**: Egy email cím több Contact-ként is szerepelhet (pl: különböző szerepkörök)
  - Példa: Koch Emil mint projekt cég kapcsolattartó (PCS) ÉS mint beszállító kapcsolattartó (ACS)
  - A rendszer **MINDEN Contact-ot** megtalál és **MINDEN projektjüket** lekérdezi
- Ha talál egyezést, lekérdezi a hozzá tartozó teendőket az **összes projektből**

### 2. **Teendők Megjelenítése**
- Szép, modern panel jelenik meg a teendőkkel
- Mutatja:
  - Teendő címét
  - Leírását
  - Jelenlegi határidőt
  - Státuszt

### 3. **Határidő Módosítás**
- Minden teendőnél van egy dátum és idő választó
- Új határidő kiválasztása (dátum ÉS idő)
- "Mentés" gombbal frissíted a MiniCRM-ben

### 4. **Termék (CategoryId) Szerinti Szűrés** 🆕
- Beállíthatod hogy csak egy **adott termék** (ACS/PCS) teendői jelenjenek meg
- Settings → Prompt Settings → "📦 MiniCRM Termék (CategoryId)"
- Opciók:
  - **ACS (CategoryId: 23)** - Csak ACS projektek
  - **PCS (CategoryId: 41)** - Csak PCS projektek
  - **Összes termék** - Minden termék projektjei
- **Fontos**: Ha egy cég több termékben is szerepel, ez határozza meg hogy melyik projekteket kérdezzük le!

### 5. **Felelős Szerinti Szűrés** 🆕
- Beállíthatod hogy csak a **hozzád rendelt** teendők jelenjenek meg
- Settings → Prompt Settings → "🔗 MiniCRM Felhasználó ID"
- ⚠️ **NUMERIKUS User ID** szükséges (pl: 120420), NEM a neved!
- Ha üresen hagyod, az **összes** teendő megjelenik (az adott termékből)
- User ID megtalálása: Railway log → "Unique UserIds in project"

---

## 🚀 Használat

### Lépések:

1. **Email Betöltése**
   ```
   1. Írj be egy email címet a "Email Context" szekcióban
   2. Kattints a "Load Email History" gombra
   3. Az email kommunikáció betöltődik
   ```

2. **MiniCRM Teendők Panel**
   ```
   - Ha a MiniCRM-ben létezik ez az email cím
   - És vannak hozzá teendők
   - Automatikusan megjelenik egy lila panel "📋 MiniCRM Teendők" címmel
   ```

3. **Határidő Módosítása**
   ```
   1. Válassz új dátumot ÉS időpontot (datetime picker)
   2. Kattints a "💾 Mentés" gombra
   3. A MiniCRM-ben azonnal frissül a határidő
   4. Toast üzenet jelenik meg a sikerről
   ```

4. **Termék Választás (ACS/PCS)** 🆕
   ```
   📦 Válaszd ki melyik termék projektjeit akarod látni!
   
   Beállítás:
   1. Kattints a "⚙️ Settings" gombra
   2. Válaszd a "💬 Prompt Settings" opciót
   3. Keresd meg: "📦 MiniCRM Termék (CategoryId)"
   4. Válassz:
      - ACS (CategoryId: 23) - Ha ACS-ben dolgozol
      - PCS (CategoryId: 41) - Ha PCS-ben dolgozol
      - Összes termék - Minden termék projektjei
   5. Kattints "💾 Save Settings"
   ```

5. **Teendők Szűrése Felelős Szerint** 🆕
   ```
   ⚠️ FONTOS: A MiniCRM NUMERIKUS User ID-t kell megadni, NEM a nevedet!
   
   Hogyan találod meg a User ID-d:
   1. Töltsd be egy email történetét
   2. Nézd meg a Railway log-ot
   3. Keresd meg: "Unique UserIds in project: {120420, 123456}"
   4. Ez a TE User ID-d (pl: 120420)
   
   Beállítás:
   1. Kattints a "⚙️ Settings" gombra
   2. Válaszd a "💬 Prompt Settings" opciót
   3. Görgess le a "🔗 MiniCRM Felhasználó ID" mezőhöz
   4. Írd be a NUMERIKUS ID-t (pl: "120420")
   5. Kattints "💾 Save Settings"
   6. Ezután csak a HOZZÁD rendelt teendők jelennek meg (a kiválasztott termékből)!
   7. Ha üresen hagyod → MINDEN teendő megjelenik (a kiválasztott termékből)
   ```

---

## 🔄 Több Contact Ugyanazzal az Email Címmel

### Miért Létezik Ez?

A MiniCRM-ben **ugyanaz az email cím több Contact-ként is szerepelhet**, különböző szerepkörökben:

**Példa: Koch Emil**
```
koch.emil@koerber.com
  ├─ Contact 1 (ID: 26187, Business: 24606) → Körber mint PROJEKT CÉG (PCS projekt)
  ├─ Contact 2 (ID: 12651, Business: 26xxx) → Körber mint BESZÁLLÍTÓ (ACS projekt)
  └─ Contact 3 (ID: ???, Business: ???)    → Esetleg más szerepkör
```

### Hogyan Kezeli a Rendszer?

✅ **Automatikusan egyesít minden projektet!**

1. **Email keresés**: `koch.emil@koerber.com`
2. **Találat**: 3 Contact ugyanazzal az email címmel
3. **BusinessIds gyűjtése**: [24606, 26xxx, ???]
4. **Projekt lekérdezés**: Mindhárom BusinessId-hoz
5. **Egyesítés**: Minden projekt teendői egy listában
6. **Szűrés**: CategoryId (ACS/PCS) és UserId szerint

### Railway Log Példa

```
Found 3 contacts
Contact #1: Koch Emil (ID: 26187, BusinessId: 24606)
Contact #2: Koch Emil (ID: 26188, BusinessId: 26450)
Contact #3: Koch Emil (ID: 26189, BusinessId: 27123)
Collected 3 unique Business IDs: [24606, 26450, 27123]

Getting todos for 3 Business ID(s): [24606, 26450, 27123]

Getting projects for business 24606: ...&CategoryId=41 (PCS)
Found 1 projects for business 24606
  Project: Körber Hungária Kft. PCS (ID: 11114, CategoryId: 41, BusinessId: 24606)

Getting projects for business 26450: ...&CategoryId=41 (PCS)
Found 0 projects for business 26450

Getting projects for business 27123: ...&CategoryId=23 (ACS)  
Found 1 projects for business 27123
  Project: Körber Hungária Kft. ACS (ID: 12651, CategoryId: 23, BusinessId: 27123)

Total projects found across 3 Business ID(s): 2
```

### Eredmény

✅ Egy email betöltése → **MINDEN projekthez tartozó teendő** megjelenik  
✅ CategoryId szűréssel → Csak az adott termék (ACS/PCS) projektjei  
✅ UserId szűréssel → Csak a hozzád rendelt teendők

---

## ⚙️ Beállítás

### Railway/Production Környezeti Változók:

```bash
MINICRM_SYSTEM_ID=12345         # A MiniCRM rendszer azonosítód (5 számjegy max)
MINICRM_API_KEY=your_api_key     # A MiniCRM API kulcsod
```

### Honnan szerzed meg ezeket?

1. **Bejelentkezés MiniCRM-be** (adminisztrátori jogosultsággal)
2. **Navigálj**: Beállítások → Rendszer
3. **Kattints**: "Új API kulcs készítése"
4. **System ID**: A böngésző címsorában találod: `r3.minicrm.hu/[SYSTEM_ID]/`

### Lokális Fejlesztés (.env fájl):

```bash
MINICRM_SYSTEM_ID=12345
MINICRM_API_KEY=abc123xyz456
```

---

## 🔧 Technikai Részletek

### Backend Endpoints:

#### 1. `/api/minicrm/status` (GET)
- Ellenőrzi, hogy a MiniCRM integráció engedélyezett-e
- Válasz:
  ```json
  {
    "enabled": true,
    "system_id": "12345"
  }
  ```

#### 2. `/api/minicrm/find_contact` (POST)
- Megkeresi a kapcsolatot email cím alapján
- Kérés:
  ```json
  {
    "email": "ince@prv.hu"
  }
  ```
- Válasz:
  ```json
  {
    "found": true,
    "contact": {
      "id": 123,
      "name": "Czechner Ince",
      "email": "ince@prv.hu",
      "company": "PRV",
      "phone": "+36 20 260 3335"
    }
  }
  ```

#### 3. `/api/minicrm/get_todos` (POST)
- Lekérdezi a kapcsolathoz tartozó teendőket
- Opcionális szűrés termék és felelős szerint
- Kérés:
  ```json
  {
    "business_id": 28260,
    "contact_name": "Juhász András",
    "category_id": "23",      // Optional: CategoryId (Termék: ACS=23, PCS=41)
    "filter_user": "120420"   // Optional: NUMERIC UserId for filtering
  }
  ```
- `category_id` paraméter:
  - **Opcionális**: Ha nincs megadva vagy `null`, minden termék projektjeit lekérdezi
  - **Termék CategoryId**: 
    - **"23"** = ACS termék projektjei
    - **"41"** = PCS termék projektjei
    - **""** vagy `null` = Minden termék
  - Fontos ha egy cég több termékben is szerepel (pl: ACS + PCS)
  - API hívás: `/Api/R3/Project?MainContactId={business_id}&CategoryId={category_id}`
  
- `filter_user` paraméter:
  - **Opcionális**: Ha nincs megadva vagy üres string, minden teendő visszaadásra kerül (az adott termékből)
  - **NUMERIKUS User ID**: pl. "120420" - string formátumban!
  - ⚠️ A MiniCRM UserId mező NUMERIKUS, NEM név!
  - Példa: `"UserId": 120420` (MiniCRM todo JSON)
  - Csak a megadott UserId-hoz rendelt teendők jelennek meg
  - Debug: Backend log-ban: "Unique UserIds in project: {120420, 123456}"
- Válasz:
  ```json
  {
    "success": true,
    "todos": [
      {
        "id": 456,
        "title": "Visszahívni Kovács Pétert",
        "description": "Ajánlat megbeszélése",
        "deadline": "2024-12-15T12:00:00",
        "status": "Active",
        "completed": false
      }
    ],
    "count": 1
  }
  ```

#### 4. `/api/minicrm/update_todo_deadline` (POST)
- Frissíti a teendő határidejét
- Kérés:
  ```json
  {
    "todo_id": 456,
    "deadline": "2024-12-20T12:00:00"
  }
  ```
- Válasz:
  ```json
  {
    "success": true,
    "message": "Határidő sikeresen frissítve!",
    "todo_id": 456,
    "new_deadline": "2024-12-20T12:00:00"
  }
  ```

### Frontend Funkciók:

#### `loadMiniCRMTodos(email)`
- Email betöltés után automatikusan fut
- Ellenőrzi a MiniCRM státuszt
- Megkeresi a kapcsolatot
- Lekérdezi a teendőket
- Megjeleníti a panelt

#### `displayMiniCRMTodosPanel(todos, contact)`
- Létrehozza a lila panelt
- Megjeleníti a teendőket
- Dátum választókat tesz minden teendőhöz
- Mentés gombokat ad hozzá

#### `updateTodoDeadline(todoId)`
- Beolvassa az új határidőt
- API hívás a backend-hez
- Toast értesítés sikeres/sikertelen mentésről
- Újratölti a panelt

#### `closeMiniCRMPanel()`
- Bezárja a MiniCRM panelt

#### `formatDate(dateString)`
- Formázza a dátumot `YYYY-MM-DD` formátumba

---

## 🎨 UI/UX

### Panel Stílus:
- **Szín**: Lila gradient (667eea → 764ba2)
- **Árnyék**: Lágy, 3D hatás
- **Animáció**: Smooth scroll-al jelenik meg
- **Reszponzív**: Mobilon és asztali gépen is működik

### Teendő Kártyák:
- Félig átlátszó fehér háttér
- Backdrop blur effekt
- Minden teendő külön kártyán
- Dátum választó + Mentés gomb inline

---

## 🔒 Biztonság

- **Basic Authentication**: Minden endpoint védett
- **Timeout**: 10 másodperc max API hívásokra
- **Error Handling**: Minden hiba esetén felhasználóbarát üzenet
- **API Key Titkosítás**: Környezeti változókban tárolva, soha nem kerül a frontendre

---

## ❗ Gyakori Problémák

### 1. "MiniCRM integration not configured"
**Ok**: Hiányzó vagy hibás környezeti változók  
**Megoldás**: Ellenőrizd a `MINICRM_SYSTEM_ID` és `MINICRM_API_KEY` értékeket

### 2. "No contact found with this email"
**Ok**: Az email cím nem létezik a MiniCRM-ben  
**Megoldás**: Először hozd létre a kapcsolatot a MiniCRM-ben

### 3. "MiniCRM API timeout"
**Ok**: Lassú internet vagy MiniCRM szerver probléma  
**Megoldás**: Próbáld újra néhány másodperc múlva

### 4. A panel nem jelenik meg
**Ok**: Lehet, hogy nincs teendő a kapcsolathoz  
**Megoldás**: Nézz rá a böngésző konzoljára (F12) részletekért

---

## 📊 Előfeltételek

### MiniCRM Oldalon:
- ✅ **Professional vagy Enterprise** előfizetés
- ✅ **"MiniCRM REST API + XML szinkronizáció"** kiegészítő bekapcsolva
- ✅ **API kulcs** generálva

### PRV AI Assistant Oldalon:
- ✅ Gmail kapcsolat működik
- ✅ MiniCRM környezeti változók beállítva
- ✅ Email betöltés funkció használva

---

## 🔄 Workflow Példa

```
1. Felhasználó: bemásol egy email címet: kovacs.peter@example.com
2. Kattint: "Load Email History"
3. Rendszer:
   - Betölti a Gmail emaileket
   - Automatikusan keresi a MiniCRM kapcsolatot
   - Lekérdezi a teendőket
   - Megjeleníti a lila panelt
4. Felhasználó:
   - Látja a 3 teendőt
   - Kiválaszt egy új dátumot: 2024-12-25
   - Kattint: "💾 Mentés"
5. Rendszer:
   - Frissíti a MiniCRM-ben
   - Sikeres üzenet: "✅ Határidő sikeresen frissítve!"
   - Panel automatikusan frissül az új dátummal
```

---

## 🚀 Jövőbeli Fejlesztési Lehetőségek

1. **Új teendő létrehozása** az alkalmazásból
2. **Teendő teljesítésének jelölése** (completed = true)
3. **Megjegyzések hozzáadása** a teendőkhöz
4. **Automatikus emlékeztetők** közelgő határidőkről
5. **CRM adatok szinkronizálása** a Cég Intelligencia funkcióval
6. **Bulk teendő létrehozás** a Bulk Email kampányból

---

## 📞 Támogatás

Ha kérdésed van vagy problémád akad:
1. Nézd meg a konzol hibákat (F12 → Console)
2. Ellenőrizd a környezeti változókat
3. Teszteld az API kulcsot közvetlenül a MiniCRM-ben
4. Konzultálj a MiniCRM dokumentációval: https://www.minicrm.hu/help/

---

**Utolsó frissítés**: 2024. december  
**Verzió**: 1.0  
**Fejlesztő**: PRV AI Assistant Team

