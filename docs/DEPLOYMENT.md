# Publishing Slicefolio

## GitHub Pages

The intended public repository is https://github.com/Hakkam/slicefolio and its project
Pages address is https://hakkam.github.io/slicefolio/. This address is not evidence
that a deployment is already live.

1. Before making the repository public, review all branches, tags, Git history,
   issues, PRs, Actions logs/artifacts, and media for credentials, private data,
   and redistribution rights. Deleting a file from the latest commit does not
   remove it from history. Revoke any exposed credentials before publication.
2. Merge the preparation branch after build checks pass.
3. In **Settings → General → Danger Zone → Change repository visibility**, select
   **Public**. Repository administration access is required.
4. In **Settings → Pages → Build and deployment → Source**, select **GitHub Actions**.
5. Open **Actions → Deploy to GitHub Pages → Run workflow** on `main`, or push to
   `main`. Wait for both build and deploy jobs to succeed.
6. Verify the deployed URL, favicon, PDF worker, import, preview, PNG/JPEG/ZIP
   exports, canonical URL, and sharing image.

The workflow uses GitHub's configured Pages URL and base path, including custom
domains. No deployment secret or personal access token is required.

## Maintainer settings

- Set About description to “Convert PDFs and long designs into carousel slides locally in your browser.”
- Set Website to the verified Pages address.
- Suggested topics: `react`, `typescript`, `pdf`, `carousel`, `design-tools`, `privacy`.
- Enable Dependabot alerts, secret scanning/push protection where available, and
  private vulnerability reporting.
- Protect `main` with a ruleset requiring PR review and the Frontend CI build check;
  block force pushes and branch deletion. CODEOWNERS alone does not enforce review.
- Review Action permissions and restrict third-party Actions to trusted publishers.
- After deployment verification, create a release/tag with actual changes and known limitations.

These settings require administrator access and are not enabled by committing files.

## Custom domain

Configure the domain in Pages settings and follow GitHub's displayed DNS instructions.
The deployment uses `actions/configure-pages` metadata for the canonical URL and asset
base. Do not point a custom domain here until its ownership and DNS are configured.
For non-GitHub hosting, set `SLICEFOLIO_SITE_URL` and `SLICEFOLIO_BASE_PATH` in
`.env.local` before building and publish only `dist/`.

## Rollback

Revert the faulty commit on `main` to rebuild the prior source, or rerun a known-good
deployment after checking its source and dependency state. Avoid rewriting public history.
