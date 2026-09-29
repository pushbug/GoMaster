Status: ACTIVE
Milestone Reference: Milestone 1: Frontend Go Board & Complete Rule Engine (Sub-task: Repository Setup & GitHub Remote Initialization)
Goal: Configure comprehensive .gitignore rules, create .env.example and README.md, audit for zero secret/binary leaks, and push initial commit to GitHub remote https://github.com/pushbug/GoMaster.git.
Docs to read during .dev:
- docs/INDEX.md
- docs/core/compliance.md
- docs/roadmap.md
- docs/tests/CATALOG.md

Files Affected:
- .gitignore -> [MODIFY] Add exclusion patterns for 94MB KataGo models, binary caches, and environment secrets
- engine/models/.gitkeep -> [NEW] Preserve engine/models folder structure in Git
- .env.example -> [NEW] Public template for environment variables (GEMINI_API_KEY, KataGo paths)
- README.md -> [NEW] Project documentation, architecture overview, installation and quickstart guide
- docs/current_plan.md -> [MODIFY] Plan tracking and step verification

Test Mapping:
- SEC-ENV-01: .env.local and secrets are strictly ignored by Git
- SEC-BIN-01: Large binary models (*.bin.gz) are excluded from Git tree
- Regression guard: npm test continues passing 47/47 cases

Steps (max 7):
- [x] Step 1: Update .gitignore to exclude 94MB KataGo models and protect .env files while keeping .gitkeep -> Verify: git check-ignore -v .env.local engine/models/kata1-b18c384nbt-humanv0.bin.gz
- [x] Step 2: Create engine/models/.gitkeep and .env.example template -> Verify: test -f engine/models/.gitkeep && test -f .env.example
- [x] Step 3: Create comprehensive README.md documenting features, tech stack, and setup -> Verify: test -f README.md && npx tsc --noEmit
- [x] Step 4: Audit git staging area ensuring zero tracked secrets and zero model binaries -> Verify: git status --ignored
- [ ] Step 5: Stage all project files and create initial Git commit on main branch -> Verify: git log -n 1 --oneline
- [ ] Step 6: Configure remote origin to https://github.com/pushbug/GoMaster.git -> Verify: git remote -v
- [ ] Step 7: Push main branch to remote repository -> Verify: git status

Risks & Dependencies:
- Secret Leakage Risk: Verify .env.local is 100% ignored before running git add . to prevent accidental GEMINI_API_KEY exposure.
- Model Bloat Risk: Verify engine/models/kata1-b18c384nbt-humanv0.bin.gz is 100% ignored before staging.
- Network / Credentials: Push to GitHub requires network authorization (GitHub HTTPS / SSH credentials).

Out of Scope:
- Modifying Go gameplay or engine analysis logic.
- Setting up GitHub Actions CI/CD pipelines (deferred to future milestone).
