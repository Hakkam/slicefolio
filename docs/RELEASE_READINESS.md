# Open-source preparation review — 2026-10-20

Baseline reviewed: `20de4a2cd4693653ccefff531a5b09ec75c9b1e8`.

## Reviewed

- Current tracked text files, dependency manifest, import/render/export paths,
  build metadata, and existing CI/Pages workflows.
- All 61 commits reachable from baseline main, to the initial commit.
- 83 distinct historical text blobs checked for common GitHub token, AWS key,
  private-key, and literal credential patterns; no matches found.
- Historical filenames checked for common environment/key/credential/SQL backups;
  none matched. Only one distinct PNG blob exists in the inspected history;
  its contents were not visually reviewed.

This is a bounded pattern-based review, not a guarantee that every secret or private
datum has been detected. Other refs, issues, discussions, PR comments, Actions
logs/artifacts, and repository settings were not part of this history scan.
Existing commit author metadata becomes visible with public history.

## Added

MIT license, contribution and community guidelines, private security-reporting
instructions, direct runtime dependency notices, issue/PR templates, CODEOWNERS,
Dependabot configuration, editor conventions, Node 24 alignment, and deployment guide.
Pages builds use configured Pages metadata instead of hardcoded project URL assumptions.
Deployment write permissions are scoped to the deployment job.

## Verification and outstanding actions

Local dependency installation was blocked by DNS/network access. A branch-scoped
GitHub Actions job generated the real npm lockfile with Node 24, and an explicit
`npm audit --audit-level=low` found zero known vulnerabilities on 2026-10-20.
The temporary job was removed after saving the lockfile. This result reflects
the advisory database at that time and is not a permanent security guarantee.

Both workflows use `npm ci`, audit dependencies, and build with Node 24.
Actions are pinned to commit SHAs, with Dependabot configured to propose updates.
Every build bundles runtime license/notice texts in `third-party-notices.txt`.
The CI build uses the actual Pages project subpath.

Before release:
1. Require the final preparation PR's locked install, audit, and build checks to pass.
2. Review the remaining publication surfaces and asset ownership.
4. Complete administrator settings in [DEPLOYMENT.md](DEPLOYMENT.md).
5. Verify the production browser workflow before tagging a release.

Repository visibility and Pages settings cannot be changed with the current GitHub
connector's administration capabilities. No claim of public availability is made
by this preparation change.
