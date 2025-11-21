# 🔗 MiniCRM Integráció

## Áttekintés

A PRV AI Assistant most integr álva van a MiniCRM rendszerrel, lehetővé téve a teendők (to-do-k) határidejének módosítását közvetlenül az alkalmazásból, miután betöltötted egy kapcsolat email történetét.

---

## ✨ Funkciók

### 1. **Automatikus Kapcsolat Keresés**
- Email cím betöltése után automatikusan megkeresi a kapcsolatot a MiniCRM-ben
- Ha talál egyezést, lekérdezi a hozzá tartozó teendőket

### 2. **Teendők Megjelenítése**
- Szép, modern panel jelenik meg a teendőkkel
- Mutatja:
  - Teendő címét
  - Leírását
  - Jelenlegi határidőt
  - Státuszt

### 3. **Határidő Módosítás**
- Minden teendőnél van egy dátum választó
- Új határidő kiválasztása
- "Mentés" gombbal frissíted a MiniCRM-ben

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
   1. Válassz új dátumot a dátum választóval
   2. Kattints a "💾 Mentés" gombra
   3. A MiniCRM-ben azonnal frissül a határidő
   4. Toast üzenet jelenik meg a sikerről
   ```

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
- Kérés:
  ```json
  {
    "contact_id": 123
  }
  ```
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

