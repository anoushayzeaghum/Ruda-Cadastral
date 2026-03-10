# Frontend Update – Step-by-Step Plan (Learn One at a Time)

Use this with your assistant: say **"Do Step 2"** (or 3, 4, …) in a new message to apply the next step and get an explanation.

---

## Step 1: Global theme (colors & fonts)
**File:** `src/index.css`  
**What:** Set a single theme for the whole app (background, text color, font).  
**Why:** Everything else will inherit this; one place to control “feel”.

---

## Step 2: App layout (root and map full-screen)
**File:** `src/App.css`  
**What:** Make `#root` full-screen and remove default padding/centering so the map and header use the full viewport.  
**Why:** Your map page is full-screen; the root must not limit it.

---

## Step 3: Header styling
**File:** `src/pages/Mapview/Header.jsx`  
**What:** Improve header look (height, padding, font, maybe a subtle border or shadow).  
**Why:** First thing users see; sets the tone.

---

## Step 4: Filter panel styling
**File:** `src/pages/Mapview/FilterPanel.jsx`  
**What:** Style the dropdown bar (borders, spacing, hover/focus on selects).  
**Why:** Main interaction; should feel clear and consistent.

---

## Step 5: Map container
**File:** `src/pages/Mapview/Mapview.jsx`  
**What:** Ensure the map div is truly full-screen and sits correctly under the header/panel.  
**Why:** Map is the main content; layout must be correct.

---

## Step 6: Small polish (optional)
**What:** Loading states, empty dropdown options, or focus styles.  
**Why:** Better UX and accessibility.

---

**Next:** Reply with **"Do Step 1"** (or we do Step 1 in this chat) and then **"Do Step 2"**, **"Do Step 3"**, etc. One step per message = one change + one explanation.
