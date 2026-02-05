# PR 5: Lint/Type/Test CI Setup

## Branch
`chore/ci/lint-tests`

## Summary
Sets up continuous integration (CI) with GitHub Actions and pre-commit hooks using Husky. Ensures code quality checks run automatically on every commit and PR.

## Files Changed
- `.github/workflows/ci.yml` (new) - GitHub Actions CI workflow
- `client/.eslintrc.cjs` (new) - ESLint configuration
- `client/.husky/pre-commit` (new) - Pre-commit hook script
- `client/.husky/_/husky.sh` (new) - Husky initialization script
- `client/.prettierrc.json` (new) - Prettier configuration (optional)
- `client/package.json` - Added husky, lint-staged, and new scripts

## Features

### GitHub Actions CI
- **Lint & Type Check Job**: Runs ESLint and TypeScript type checking
- **Test Job**: Runs Vitest tests
- **Build Job**: Builds the project and uploads artifacts
- **Triggers**: Runs on push to main/develop and on pull requests
- **Caching**: Uses npm cache for faster builds

### Pre-commit Hooks (Husky)
- **Automatic Checks**: Runs lint and typecheck before every commit
- **Prevents Bad Commits**: Blocks commits with linting or type errors
- **Fast Feedback**: Developers get immediate feedback before pushing

### ESLint Configuration
- **TypeScript Support**: Full TypeScript linting rules
- **React Hooks**: React hooks linting rules
- **Unused Variables**: Warns about unused variables (allows `_` prefix)
- **Any Types**: Warns about `any` types (not errors)

## CI Workflow Jobs

### 1. Lint & Type Check
- Runs ESLint on all TypeScript/TSX files
- Runs TypeScript compiler in check mode
- Fails if any errors found

### 2. Test
- Runs Vitest test suite
- Uses `--run` flag for CI (non-watch mode)
- Fails if any tests fail

### 3. Build
- Builds the project with `npm run build`
- Uploads build artifacts for inspection
- Fails if build fails

## Setup Instructions

### Initial Setup (One-time)
```bash
cd client
npm install
npm run prepare  # Initialize husky
```

### Pre-commit Hook
The pre-commit hook will automatically run:
- `npm run lint` - ESLint check
- `npm run typecheck` - TypeScript type check

If either fails, the commit will be blocked.

### Manual CI Checks
You can run the same checks locally:
```bash
cd client
npm run lint        # Check linting
npm run typecheck   # Check types
npm run test:run    # Run tests
npm run build       # Build project
```

## Testing Steps

### Test Pre-commit Hook
1. Make a change that introduces a linting error:
   ```tsx
   const unused = 'test'  // Should trigger unused variable warning
   ```
2. Try to commit:
   ```bash
   git add .
   git commit -m "test"
   ```
3. Verify commit is blocked with lint error

### Test CI Workflow
1. Push to a branch or create a PR
2. Check GitHub Actions tab
3. Verify all three jobs (lint, test, build) run successfully
4. If any job fails, fix the issue and push again

### Test Locally
```bash
cd client
# Test linting
npm run lint

# Test type checking
npm run typecheck

# Test tests
npm run test:run

# Test build
npm run build
```

## Configuration Details

### ESLint Rules
- `@typescript-eslint/no-unused-vars`: Error on unused vars (allows `_` prefix)
- `@typescript-eslint/no-explicit-any`: Warning on `any` types
- `react-refresh/only-export-components`: Warns about non-component exports

### Husky Pre-commit
- Runs in `client` directory
- Executes `lint` and `typecheck` scripts
- Exits with error code if checks fail

### CI Workflow
- Uses Node.js 20
- Caches npm dependencies
- Runs in parallel jobs for faster feedback
- Uploads build artifacts for 1 day

## Migration Notes
- **No breaking changes** - Existing code continues to work
- Developers need to run `npm install` to get husky hooks
- CI will run automatically on new PRs
- Pre-commit hooks can be bypassed with `--no-verify` (not recommended)

## Benefits
1. **Code Quality**: Catches errors before they reach the repository
2. **Consistency**: All code follows the same linting rules
3. **Fast Feedback**: Developers get immediate feedback
4. **CI/CD Ready**: Automated checks on every PR
5. **Team Alignment**: Everyone uses the same standards

## Troubleshooting

### Pre-commit Hook Not Running
```bash
cd client
npm run prepare  # Re-initialize husky
```

### CI Failing Locally But Passing in GitHub
- Check Node.js version (CI uses 20)
- Clear node_modules and reinstall
- Check for environment-specific issues

### Bypass Pre-commit (Emergency Only)
```bash
git commit --no-verify -m "Emergency fix"
```
⚠️ Use sparingly and fix linting issues immediately after

## Next Steps
- PR 6: Image optimization and lazy loading
- Future: Add commit message linting (commitlint)
- Future: Add code coverage reporting to CI
