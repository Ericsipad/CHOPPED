## CHOPPED Frontend: Landing Page Integration Plan (Vobius Labs template)

Scope: Replace visual layout of landing page using components from `real-connections-unfiltered` template. Preserve existing sign-in/sign-up logic and endpoints. No backend changes.

### 1) Dependencies (completed)
- Runtime UI: `lucide-react`, `@radix-ui/react-slot`, `class-variance-authority`, `clsx`, `tailwind-merge`
- Build-time: `tailwindcss`, `postcss`, `autoprefixer`, `tailwindcss-animate`

### 2) File imports (no logic changes)
- Copy from template into our app:
  - `Hero.tsx`, `Features.tsx`, `Authenticity.tsx`, `Testimonials.tsx`, `Footer.tsx`
  - `components/ui/button.tsx`
  - `lib/utils.ts`
  - `assets/hero-image.png`
- Target locations:
  - `frontend/src/landing/components/template/Hero.tsx`
  - `frontend/src/landing/components/template/Features.tsx`
  - `frontend/src/landing/components/template/Authenticity.tsx`
  - `frontend/src/landing/components/template/Testimonials.tsx`
  - `frontend/src/landing/components/template/Footer.tsx`
  - `frontend/src/landing/components/ui/button.tsx`
  - `frontend/src/landing/lib/utils.ts`
  - `frontend/src/landing/assets/hero-image.png`
- Adjust imports inside copied files to use relative paths (no alias `@/`):
  - `import { Button } from "../ui/button"`
  - `import heroImage from "../../assets/hero-image.png"`
  - `import { cn } from "../../lib/utils"`

### 3) Tailwind integration
- Keep existing `frontend/src/landing/styles/landing.css` with:
  - `@tailwind base; @tailwind components; @tailwind utilities;`
  - Brand tokens and classes already aligned with template (gradients, animations, btn styles).
- Ensure Tailwind is active for all landing sources (config to include):
  - `index.html`, `mobile.html`, `account.html`, `chopping-board.html`, `profile.html`
  - `src/**/*.{ts,tsx}`
- Update `frontend/postcss.config.cjs` if needed to:
  ```js
  module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } }
  ```
- Create `frontend/tailwind.config.ts` (if missing) to include content globs; extend only if necessary for missing tokens. Prefer minimal changes to avoid drift.

### 4) Landing page composition
- Update `frontend/src/landing/pages/LandingPage.tsx`:
  - Import the template components from `components/template/*`.
  - Manage local state: `openSignIn`, `openSignUp`.
  - Render: `<Hero />`, `<Features />`, `<Authenticity />`, `<Testimonials />`, `<Footer />`.
  - Render dialogs: `<SignInDialog open={openSignIn} onClose={()=>setOpenSignIn(false)} />` and `<SignUpDialog open={openSignUp} onClose={()=>setOpenSignUp(false)} />`.
  - Pass CTA handlers:
    - Replace template hero CTA Buttons with our `SignUpButton` and `SignInButton` components, preserving the button class names from template (`btn-hero`, `btn-hero-outline`).
    - `onClick` for sign up → `setOpenSignUp(true)`; sign in → `setOpenSignIn(true)`.
  - On mount, if `window.CHOPPED_OPEN_SIGNIN` is true, set `openSignIn` true.

### 5) Keep existing auth logic unchanged
- Reuse `src/shared/auth/SignInButton`, `SignUpButton`, `SignInDialog`, `SignUpDialog` unchanged.
- Do not modify `src/lib/config.ts`. Env behavior remains as-is.

### 6) Clean-up (after visual validation)
- If the new landing fully replaces old sections, archive/remove:
  - `src/landing/components/HeroSection.tsx`
  - `src/landing/components/LowerImageSection.tsx`
- Retain `InfiniteBackground.tsx` only if used elsewhere.

### 7) QA checklist
- Buttons open the correct dialogs; submit flows hit existing endpoints.
- `signedUp=1` redirect still opens sign-in via `window.CHOPPED_OPEN_SIGNIN`.
- Visual parity with template; responsive checks at common breakpoints.
- No console errors; Tailwind classes render correctly.

### 8) Rollback plan
- Revert `LandingPage.tsx` to prior import/JSX if any visual or functional issues arise.
- Components added live under `src/landing/components/template/`, so revert is contained.

### 9) Out of scope (intentionally omitted)
- Template router, toasters, global providers, and unused shadcn/ui controls.
- Any backend or environment variable changes.


