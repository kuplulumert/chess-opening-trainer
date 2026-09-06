# Opening Trainer

**Live: https://kuplulumert.github.io/chess/**

A focused chess app for one thing only: memorizing openings. Pick a line, choose a
colour, and play the book moves from memory — the app plays the opponent's replies
and tells you when you've gone off book.

## How it works

- **Quiz mode** — you play every move for your colour. A move that isn't the book
  move is rejected and the piece snaps back, so the board never leaves the line.
  The opponent's replies are played automatically.
- **Study mode** — the whole line replays itself so you can watch it before drilling it.
- **Hints** — press `? Hint` any time, or make two wrong attempts in a row and the
  correct move is revealed automatically.
- **Progress** — finishing a line in quiz mode marks it with a ✓ in the sidebar,
  per colour. Progress is stored in the browser's `localStorage`.

Each line stops at a sensible point (6–7 moves), which is where memorization actually
pays off — deep enough to reach the opening's characteristic structure, short enough
to drill in a few minutes.

## Openings included

27 lines across the major families: Italian Game, Ruy Lopez, Scotch, Petrov, Vienna,
King's Gambit, Sicilian (Najdorf, Dragon, Sveshnikov, Rossolimo), French, Caro-Kann,
Pirc, Scandinavian, Queen's Gambit (Declined and Accepted), Slav, King's Indian,
Nimzo-Indian, Grünfeld, English, London System, and the Catalan.

## Running it

```bash
npm install
npm run dev      # dev server on http://localhost:5173
npm run build    # typecheck + production build into dist/
npm run lint
```

## Adding your own lines

Openings live in [`src/data/openings.ts`](src/data/openings.ts). Add an entry with the
moves in SAN and it shows up in the sidebar, grouped under its `family`:

```ts
{
  id: "my-line",
  family: "Ruy Lopez",
  name: "Marshall Attack",
  eco: "C89",
  moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", /* … */],
  description: "…",
}
```

Moves are validated by `chess.js` at runtime, so a typo in a SAN string will simply
fail to play — worth double-checking new lines in the app after adding them.

## Stack

React + TypeScript on Vite, [`chess.js`](https://github.com/jhlywa/chess.js) for move
legality and [`react-chessboard`](https://github.com/Clariity/react-chessboard) for the
board.

## iOS app

The app is wrapped as a native iOS project with [Capacitor](https://capacitorjs.com) in
[`ios/`](ios/). It's a thin native shell around the same web build — the whole app runs
in a `WKWebView`, so features and openings data are shared with the web version.

```bash
npm run ios:sync   # builds the web app (root-relative paths) and copies it into ios/
npm run ios:open   # opens the Xcode project (macOS + Xcode required)
```

`ios:sync` works on any platform, since it's just a web build + file copy. Opening,
building, running on a simulator/device, and archiving for the App Store all require
Xcode, so `ios:open` (and everything after it) needs a Mac — either your own or a cloud
Mac CI like [Codemagic](https://codemagic.io) or [Xcode Cloud](https://developer.apple.com/xcode-cloud/).
The iOS project uses Swift Package Manager (no CocoaPods), so `pod install` isn't needed.

Whenever you change the web app and want it reflected in the iOS build, rerun
`npm run ios:sync`, then re-run/re-build in Xcode. First-time setup on a Mac:

1. `npm run ios:sync`
2. `npm run ios:open` — opens `ios/App/App.xcodeproj` in Xcode
3. In Xcode, select the `App` target → *Signing & Capabilities* → pick your Apple
   Developer team (a free account works for running on your own device; a paid
   [Apple Developer Program](https://developer.apple.com/programs/) membership,
   $99/year, is required to publish to the App Store)
4. Pick a simulator or your connected iPhone as the run destination and press ▶

The app icon is generated from [`public/favicon.svg`](public/favicon.svg); regenerate
`ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` if the favicon
changes.

## Publishing to the App Store (no Mac required)

Since building/signing an iOS app requires Xcode, this repo publishes through
[Codemagic](https://codemagic.io) — a cloud CI that builds on a real Mac, signs the
app, and uploads it to App Store Connect — configured in [`codemagic.yaml`](codemagic.yaml).
One-time setup, all done from a browser:

1. **Apple Developer Program** — enroll at [developer.apple.com/programs](https://developer.apple.com/programs/)
   ($99/year). Required to distribute on the App Store at all.
2. **App Store Connect record** — at [appstoreconnect.apple.com](https://appstoreconnect.apple.com),
   create a new app with bundle ID `com.kuplulumert.openingtrainer` (must match
   [`capacitor.config.ts`](capacitor.config.ts)), name, category, age rating, and a
   privacy policy URL (the app stores everything locally in the device's
   `localStorage` and talks to no server, so the privacy questionnaire is "data not
   collected").
3. **App Store Connect API key** — in App Store Connect under *Users and Access →
   Integrations → App Store Connect API*, generate a key with the *App Manager*
   role and download it.
4. **Codemagic** — sign up at [codemagic.io](https://codemagic.io), connect this
   GitHub repo, then under *Team settings → Integrations → App Store Connect* add
   the API key from step 3 (name it `codemagic` to match `codemagic.yaml`, or update
   the file to match whatever name you pick). Codemagic auto-manages signing
   certificates and provisioning profiles through that same key — no manual
   certificate wrangling needed.
5. **Run the workflow** — in Codemagic, start the `ios-app-store` workflow (or just
   push to `main`, since it's configured to trigger on push). It builds the web app,
   syncs Capacitor, builds and signs the `.ipa`, and uploads it to TestFlight.
6. **Submit for review** — once the build appears in App Store Connect (under
   TestFlight first), fill in the remaining store listing fields (screenshots,
   description, support URL) and submit it for review from the *App Store* tab.
   Flip `submit_to_app_store: true` in `codemagic.yaml` once you're comfortable
   having new pushes go straight to review instead of stopping at TestFlight.

Apple's review is usually 24–48 hours. The most common rejection reason for a
Capacitor/webview app is Guideline 4.2 (Minimum Functionality) — reviewers want to
see it feel like a real app, not a bare website; this one already qualifies since
it's fully offline-capable and has no server dependency at all.
