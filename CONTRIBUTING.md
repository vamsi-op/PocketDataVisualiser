# Contributing to Pocket Data Visualizer

Thank you for your interest in contributing! 🎉

## Ways to Contribute

- 🐛 **Report bugs** — use the Bug Report issue template
- 💡 **Suggest features** — use the Feature Request template
- 🔧 **Fix issues** — pick any open issue and open a PR
- 📖 **Improve docs** — fix typos, add examples, improve clarity

## Development Setup

```bash
git clone https://github.com/VamsiKrishna/data-visualizer.git
cd data-visualizer
npm install
npm run dev
```

## Pull Request Guidelines

1. **Branch from `main`** — `git checkout -b feat/your-feature`
2. **Keep PRs focused** — one feature or fix per PR
3. **Lint your code** — `npm run lint` must pass
4. **Write JSDoc comments** for any new utility functions
5. **Test manually** — verify with at least 2 different CSV files
6. **Update the README** if you add a new feature or change behavior

## PR Checklist

Before opening a PR, please confirm:
- [ ] `npm run lint` passes
- [ ] The app runs without console errors (`npm run dev`)
- [ ] New utility functions have JSDoc comments
- [ ] README is updated if needed

## Code Style

- Use `const` and `let`, never `var`
- Prefer named exports over default exports for utilities
- Component files: `PascalCase.jsx`
- Utility files: `camelCase.js`
- CSS files: same name as the component they style

## Commit Message Format

```
type: short description

feat:  new feature
fix:   bug fix
docs:  documentation only
style: formatting, no logic change
refactor: code restructure, no behavior change
test:  adding tests
```

Example: `feat: add histogram bin count slider`

## Questions?

Open a [Discussion](../../discussions) or tag `@VamsiKrishna` in your issue.
