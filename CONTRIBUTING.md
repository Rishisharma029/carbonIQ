# Contributing to CarbonIQ

First off, thank you for considering contributing to CarbonIQ! Contributions make the open-source community an amazing place to learn, inspire, and create.

---

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please report any unacceptable behavior to the project maintainers.

---

## How Can I Contribute?

### 🐛 Reporting Bugs
Before submitting a bug report, please check the existing issues to ensure it hasn't already been reported. When reporting a bug, please include:
- A clear, descriptive title.
- Steps to reproduce the issue.
- Expected vs. actual behavior.
- Screenshots or log outputs if applicable.
- Your environment details (OS, Node.js version, browser).

### 💡 Suggesting Enhancements
We welcome ideas for new features or improvements! Please open an issue and include:
- A clear description of the proposed feature.
- Explain why this feature would be useful to CarbonIQ users.
- Mockups, diagrams, or examples of how the feature should behave.

### 🔧 Submitting Pull Requests (PRs)
1. **Fork the Repository**: Create your own copy of the repository on GitHub.
2. **Clone Locally**: Clone your fork to your development machine.
3. **Create a Branch**: Create a branch off the `main` branch:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```
4. **Implement & Test**: Write your code, following the styling and testing patterns of the repository.
   - For backend changes, ensure that vitest integration tests pass: `npm run test` (in `/backend`).
   - For frontend changes, verify that the compilation is successful: `npm run build` (in `/frontend`).
5. **Commit Changes**: Make clear, concise commit messages.
6. **Push & Open PR**: Push your branch to your fork and submit a Pull Request to our `main` branch.

---

## Development & Code Guidelines

### Branch Naming Conventions
- Features: `feature/short-description`
- Bug Fixes: `fix/short-description`
- Documentation: `docs/short-description`
- Refactoring: `refactor/short-description`

### Code Style
- We use **Prettier** for formatting. You can run formatting in the frontend folder with `npm run format`.
- Ensure there are no TypeScript compiler warnings or unused variables before submitting code.
