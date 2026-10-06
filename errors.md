# Errors Log

## Task 1
- **File:** `C:\Users\mubas\OneDrive\kompair\frontend\package.json`
- **Line Number:** N/A (CLI command execution)
- **Error:** `npm error could not determine executable to run` when attempting to run `npx tailwindcss init -p`.
- **Cause:** We were using Tailwind CSS v4, which no longer requires a `tailwind.config.js` or `postcss.config.js` and therefore lacks the init script in the same way, opting instead for `@tailwindcss/vite`.
- **Fix:** Used `@tailwindcss/vite` plugin in `vite.config.ts` and `@import "tailwindcss"` in `index.css`.

## Task 2
- **File:** N/A (Terminal execution)
- **Line Number:** N/A
- **Error:** `Security Warning: Script Execution Risk Invoke-WebRequest parses the content of the web page.`
- **Cause:** In PowerShell, `curl` is an alias for `Invoke-WebRequest`, which displays a security warning about parsing web content unless explicitly bypassed.
- **Fix:** Provide the user with the `-UseBasicParsing` flag or use `Invoke-RestMethod` instead.
