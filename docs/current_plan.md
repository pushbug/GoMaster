# Current Plan

## Issue

The Next.js development overlay reports a hydration attribute mismatch on the root `<body>` in `app/layout.tsx`. The screenshot shows `location="localhost"` on the client-rendered body, while the server-rendered markup does not contain that attribute. The application source has no matching `location` attribute or render-time browser location access, so the evidence points to a browser extension or other client-side HTML mutation.

## Resolution

Added React's `suppressHydrationWarning` to the root `<body>` in `app/layout.tsx`. This scopes suppression to root-level attribute differences caused by external browser HTML mutation and avoids changing application behavior.

## Verification

- `npm run lint` passed.
- `npm test` passed: 27 files and 225 tests.
- `npm run build` passed.
- `git diff --check` passed.
