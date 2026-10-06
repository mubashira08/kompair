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

## Task 5
- **File:** `C:\Users\mubas\OneDrive\kompair\package.json`
- **Line Number:** N/A (Terminal execution)
- **Error:** `npm error code ENOENT ... open 'C:\Users\mubas\OneDrive\kompair\package.json'`
- **Cause:** You ran `npm run dev` in the root `kompair` directory, but the project is split into separate `frontend` and `backend` folders, so there is no `package.json` at the root.
- **Fix:** Run `cd backend` before running `npm run dev` (and open a second terminal to run `cd frontend && npm run dev` for the frontend).
