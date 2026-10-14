# Deploy to GitHub Pages

Each folder is a complete, self-contained static PWA. No build step, no dependencies.

## One command per site (with the GitHub CLI)

```bash
cd ~/Projects/"F STAGE"/site
git init -b main && git add -A && git commit -m "F.STAGE storefront preview by Alpha Agency"
gh repo create fstage-preview --public --source=. --push
gh api -X POST repos/:owner/fstage-preview/pages -f 'source[branch]=main' -f 'source[path]=/'
```

Then the link to send the client is:
`https://<your-github-username>.github.io/fstage-preview/`

Repeat with `sportive-preview`, `matcha-preview`, `we-preview`.

## Without the gh CLI
Create an empty public repo on github.com, then:
```bash
cd ~/Projects/"F STAGE"/site
git init -b main && git add -A && git commit -m "preview"
git remote add origin https://github.com/<username>/fstage-preview.git
git push -u origin main
```
Then Settings → Pages → Source: `main` / root. Live in about a minute.

## Notes
- HTTPS is required for install-to-home-screen. GitHub Pages gives you that automatically.
- Fonts are self-hosted in `fonts/` — nothing loads from Google, so it works fine on Iranian connections.
- `sw.js` caches the shell for offline use. After you push an update, bump `var C='<slug>-vN'` at the top of `sw.js` so returning visitors get the new version.
