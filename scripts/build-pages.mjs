import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const repository = process.env.GITHUB_REPOSITORY || 'n-tacvla/n-tacvla.github.io';
const [owner, name, extra] = repository.split('/');
if (!owner || !name || extra || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) {
  throw new Error('GITHUB_REPOSITORY must be owner/repository');
}
const basePath = name.toLowerCase() === `${owner.toLowerCase()}.github.io` ? '' : `/${name}`;
const siteUrl = `https://${owner.toLowerCase()}.github.io${basePath}/`;
const replayHash = createHash('sha256').update(readFileSync('public/sample/replay.json')).digest('hex').slice(0, 16);
console.log(`Building static GitHub Pages website: ${siteUrl}`);
const result = spawnSync(process.execPath, ['node_modules/.bin/vinext', 'build'], {
  stdio: 'inherit',
  env: { ...process.env, GITHUB_PAGES: '1', NEXT_PUBLIC_BASE_PATH: basePath, NEXT_PUBLIC_SITE_URL: siteUrl, NEXT_PUBLIC_REPLAY_HASH: replayHash },
});
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status || 1);
// Vinext puts a project site's export inside its basePath directory. GitHub
// supplies that URL prefix itself, so upload the contents as the artifact root.
const source = join('dist/client', basePath.replace(/^\//, ''));
if (!existsSync(join(source, 'index.html'))) throw new Error('Static export did not create index.html');
const destination = 'dist/pages';
rmSync(destination, { recursive: true, force: true });
mkdirSync(destination, { recursive: true });
cpSync(source, destination, { recursive: true });
if (existsSync('dist/client/404.html')) cpSync('dist/client/404.html', join(destination, '404.html'));
writeFileSync(join(destination, '.nojekyll'), '');
console.log(`Static website ready: ${destination}/ → ${siteUrl}`);
