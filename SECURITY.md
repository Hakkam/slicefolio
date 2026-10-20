# Security policy

## Supported version

Security fixes target the latest code on the default branch. Older snapshots are
not maintained separately.

## Report a vulnerability

Do not post exploits, sensitive documents, or credentials in public issues.
Use GitHub's **Security → Advisories → Report a vulnerability** when private
vulnerability reporting is enabled. If that option is unavailable, contact the
maintainer through the contact options at https://hakkam.com and request a private
channel before sharing sensitive material.

Include affected commit/version, browser/OS, reproducible steps, expected and actual
behavior, and impact. Use a minimal synthetic file. There is no guaranteed response
or fix deadline.

## Security model

Selected files are processed locally using browser APIs and a bundled PDF.js worker.
This is not an assurance that arbitrary untrusted files are harmless. Keep your browser
and dependencies updated. Large files can exhaust browser memory; the upload limit is
250 MB and actual capacity depends on the device. Do not add remote processing or
telemetry without documenting the privacy implications and obtaining project agreement.
