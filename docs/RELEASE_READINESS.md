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

Local dependency installation was blocked by network access; offline installation
also failed because required packages were not cached. A lockfile could not be
generated safely. No lockfile has been fabricated, and no local build success is claimed.
CI continues using `npm install` until a real lockfile is committed.

Before release:
1. Require the preparation PR's build check to pass.
2. Generate and commit `package-lock.json` with Node 24, run `npm audit`, address
   findings with review, then change both workflows and contributor instructions
   to `npm ci`. Do not use automatic force upgrades without compatibility review.
3. Review the remaining publication surfaces and asset ownership.
4. Complete administrator settings in [DEPLOYMENT.md](DEPLOYMENT.md).
5. Verify the production browser workflow before tagging a release.

Repository visibility and Pages settings cannot be changed with the current GitHub
connector's administration capabilities. No claim of public availability is made
by this preparation change.
