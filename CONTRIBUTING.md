# Contributing to Paper Crane

Follow the [development setup](README.md#getting-started), then reproduce the behavior with a sample resume.

## Open a pull request

1. Fork the repository and create a branch from `dev`.
2. Keep the change focused. If there is a related issue, link it in the pull request.
3. Run the relevant checks:

   ```bash
   pnpm format:check
   pnpm lint
   pnpm test
   ```

4. Open the pull request against `dev`. Describe what changed and how you verified it. For UI changes, include the steps a reviewer can follow in the app.

## Report a bug or suggest a feature

Search [existing issues](https://github.com/Vethya/paper-crane/issues) before opening a new one. For bugs, describe the steps, the expected result, and what actually happened. For feature requests, describe the task you were trying to complete and where the app fell short.

Use sample resume data in reproductions, screenshots, and logs. Remove credentials and personal details before attaching files.
