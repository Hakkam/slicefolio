import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

// Preserve installed runtime dependency licenses in every distributable build.
const lock = JSON.parse(await readFile('package-lock.json', 'utf8'));
const sections = [
  'Slicefolio — license and third-party notices',
  await readFile('LICENSE', 'utf8'),
];
for (const [directory, metadata] of Object.entries(lock.packages)) {
  if (!directory || metadata.dev) continue;
  let files;
  try {
    files = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    // Optional platform-specific packages may be absent on this runner.
    if (error.code === 'ENOENT' && metadata.optional) continue;
    throw error;
  }
  const manifest = JSON.parse(await readFile(join(directory, 'package.json'), 'utf8'));
  let noticeDirectory = directory;
  let notices = files.filter((file) =>
    file.isFile() && /^(licen[cs]e|notice|copying)([._-]|$)/i.test(file.name),
  ).sort((a, b) => a.name.localeCompare(b.name));
  // Native canvas platform packages share their parent package's license.
  if (!notices.length && /^@napi-rs\/canvas-/.test(manifest.name)) {
    noticeDirectory = 'node_modules/@napi-rs/canvas';
    const parentFiles = await readdir(noticeDirectory, { withFileTypes: true });
    notices = parentFiles.filter((file) =>
      file.isFile() && /^(licen[cs]e|notice|copying)([._-]|$)/i.test(file.name),
    ).sort((a, b) => a.name.localeCompare(b.name));
  }
  // Some older MIT packages keep copyright and licensing only in README.
  if (!notices.length && (manifest.license ?? metadata.license) === 'MIT') {
    const readme = files.find((file) => file.isFile() && /^readme([._-]|$)/i.test(file.name));
    if (readme) {
      const text = await readFile(join(directory, readme.name), 'utf8');
      if (/license|copyright|©/i.test(text)) {
        sections.push(manifest.name + '@' + manifest.version + ' — MIT');
        sections.push(text);
        const mit = await readFile('LICENSE', 'utf8');
        sections.push(mit.slice(mit.indexOf('Permission is hereby granted')));
        continue;
      }
    }
  }
  if (!notices.length) {
    throw new Error('Missing license/notice file for ' + manifest.name);
  }
  sections.push(manifest.name + '@' + manifest.version + ' — ' + (manifest.license ?? metadata.license ?? 'See notices'));
  for (const file of notices) {
    sections.push(file.name + '\n' + await readFile(join(noticeDirectory, file.name), 'utf8'));
  }
}
await writeFile('dist/third-party-notices.txt', sections.join('\n\n' + '='.repeat(72) + '\n\n') + '\n');
console.log('Wrote third-party license notices to dist/third-party-notices.txt');
