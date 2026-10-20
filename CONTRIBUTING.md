# Contributing to Slicefolio

Bug reports, documentation, accessibility improvements, and focused fixes are welcome.
For substantial behavior or design changes, open an issue before implementation.

## Development

Use Node.js 24 and npm. Fork the repository, create a branch, then run:

```sh
npm install
npm run dev
npm run build
npm run preview
```

Keep TypeScript checks passing. Preserve local file processing: do not introduce
uploads, analytics, external APIs, or remote PDF workers without prior discussion.
Never commit credentials, personal documents, generated exports, or real customer files.

## Pull requests

Explain the problem, resulting behavior, and how you verified it. Include screenshots
for UI changes. Keep changes focused and follow existing code style. Use synthetic
PDF/image fixtures that you are allowed to redistribute.

For processing changes, manually verify PDF and image imports, all three output sizes,
cover/body order, final partial slides, selected/all padding, individual PNG/JPEG export,
ZIP order, cancellation, and file replacement. Check the production preview under
`/slicefolio/` when changing asset paths or deployment.

By contributing, you agree that your contribution is licensed under the project's
MIT license and confirm that you have the right to submit it. Maintainers review and
merge changes; response times are not guaranteed.

Report security vulnerabilities privately using [SECURITY.md](SECURITY.md).
