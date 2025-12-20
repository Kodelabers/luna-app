# UI/UX Dizajn

## Pregled

Ovaj dokument opisuje dizajn principe, UI komponente i korisničko iskustvo za Luna sustav - aplikaciju za upravljanje godišnjim odmorima, bolovanja i planiranje rasporeda zaposlenika.

## Obavezno koristiti isključivo shadcn komponente i blokove, te tailwind css s mogucnoscu promjene theme koja odgovara shadcn defaultnim themama (rose, red, orange...)

## 0. Tehnička konfiguracija (Setup)

### 0.1 Tailwind CSS i shadcn/ui kompatibilnost

**VAŽNO**: shadcn/ui zahtijeva **Tailwind CSS v3** (ne v4 beta verziju).

#### Potrebne dependency verzije:

```json
{
  "devDependencies": {
    "tailwindcss": "^3",
    "autoprefixer": "latest"
  }
}
```

**NE koristiti:**
- ❌ `tailwindcss@^4` 
- ❌ `@tailwindcss/postcss@^4`

#### PostCSS konfiguracija (`postcss.config.mjs`):

```javascript
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
```

#### Globals CSS (`app/globals.css`):

**Koristiti klasične Tailwind direktive (NE `@import "tailwindcss"`):**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;
    --primary: 346.8 77.2% 49.8%;
    --primary-foreground: 355.7 100% 97.3%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 346.8 77.2% 49.8%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 20 14.3% 4.1%;
    --foreground: 0 0% 95%;
    --card: 24 9.8% 10%;
    --card-foreground: 0 0% 95%;
    --popover: 0 0% 9%;
    --popover-foreground: 0 0% 95%;
    --primary: 346.8 77.2% 49.8%;
    --primary-foreground: 355.7 100% 97.3%;
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 0 0% 15%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 12 6.5% 15.1%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 85.7% 97.3%;
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --ring: 346.8 77.2% 49.8%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

#### Tailwind Config (`tailwind.config.ts`):

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;
```

#### Instalacija (ako kreiraš projekt ispočetka):

```bash
# Prvo instaliraj Tailwind v3
npm install -D tailwindcss@^3 autoprefixer --legacy-peer-deps

# Zatim dodaj shadcn/ui
npx shadcn@latest init
```

**Simptomi ako je nešto krivo:**
- Dropdown meniji su prozirni (nema pozadine)
- Dialozi su prozirni
- Komponente nemaju pravilne boje i stilove

**Rješenje ako se problem pojavi:**
```bash
# Ukloni Tailwind v4
npm uninstall tailwindcss @tailwindcss/postcss --legacy-peer-deps

# Instaliraj Tailwind v3
npm install -D tailwindcss@^3 autoprefixer --legacy-peer-deps
```

Zatim ažuriraj konfiguracije kako je opisano gore.

## 1. Dizajn Principi

## 5. Layout Structure

### 5.1 Overall Layout

Koristi mi Shadcn sidebar za sidebar, na vrhu sidebara omoguci promjenu organizacije, nakon toga Dashboard, Moji Zahtjevi, te odjeli koji u sebi imaju pod manu iteme kao što su zahtjevi, kalendar, zaposlenici,..
nakon toga administracija koja ima poditeme za zaposlenike, odjele, ... pogledaj prisma schemu i user storije

isto tako dodaj rule u cursor da uvijek agent mora koristiti shadcn komponente, te ukoliko neka komponenta ne postoji, da me pita i predloži rješenje, s tim da i dalje koristi shadcn basic principe i komponente kao gradivne elemente

# specifično
Za odabir raspona datuma na zahtjevu koristi Range Calendar komponentu, osim za bolovanja jer tamo mož biti odabran samo datum od, bez da se odabere datum do.
