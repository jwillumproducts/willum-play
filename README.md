# Willum Play

Calm browser games for young children. Parents pick a device and a level; the child practises one new button at a time. No account, timer, ads, or failure.

Rolige spil i browseren til små børn. Forældrene vælger enhed og bane. Barnet øver én ny knap ad gangen. Ingen konto, tid, reklamer eller nederlag.

A JWillum Kids game.

Source: https://github.com/jwillumproducts/willum-play

## Local

```bash
npm install
npm run dev
```

Build: `npm run build`. Preview: `npm run preview`.

The Vite `base` defaults to `./` so the app can live in a sub-path. For GitHub Pages the deploy workflow sets `BASE_PATH` from the repository. For a custom domain at the site root, build with `BASE_PATH=/`.

## GitHub Pages

**English:** the site is built and published by GitHub Actions on every push to `main`.

1. Open https://github.com/jwillumproducts/willum-play
2. Go to **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **GitHub Actions**.
4. Push to `main` (or run the **Deploy to GitHub Pages** workflow). The game will be at `https://jwillumproducts.github.io/willum-play/`.

Do not add a `public/CNAME` file yet. When a custom domain is ready, put the hostname in a `CNAME` file in `public/` (Vite copies `public/` into `dist/`) and point DNS at GitHub Pages.

**Dansk:** siden bygges og udgives af GitHub Actions ved hvert push til `main`.

1. Åbn https://github.com/jwillumproducts/willum-play
2. Gå til **Settings → Pages**.
3. Under **Build and deployment → Source** vælg **GitHub Actions**.
4. Push til `main` (eller kør workflowet **Deploy to GitHub Pages**). Spillet ligger på `https://jwillumproducts.github.io/willum-play/`.

Opret ikke en `public/CNAME`-fil endnu. Når det brugerdefinerede domæne er klar, lægges værtsnavnet i en `CNAME`-fil i `public/` (Vite kopierer `public/` over i `dist/`), og DNS pege på GitHub Pages.
