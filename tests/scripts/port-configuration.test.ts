import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

describe('Port Configuration Integrity (TOOL-PORT-01)', () => {
  const rootDir = path.resolve(__dirname, '../../');

  it('configures package.json dev and start scripts to bind to port 3500', () => {
    const pkgPath = path.join(rootDir, 'package.json');
    const pkgRaw = fs.readFileSync(pkgPath, 'utf-8');
    const pkg = JSON.parse(pkgRaw);

    expect(pkg.scripts.dev).toBe('next dev -p 3500');
    expect(pkg.scripts.start).toBe('next start -p 3500');
  });

  it('configures macOS launcher script to check and open port 3500', () => {
    const scriptPath = path.join(rootDir, 'scripts/create-macos-app.sh');
    const scriptContent = fs.readFileSync(scriptPath, 'utf-8');

    expect(scriptContent).toContain('http://localhost:3500');
    expect(scriptContent).not.toContain('http://localhost:3001');
    expect(scriptContent).not.toContain('http://localhost:3000');
  });

  it('updates README.md instructions to reference port 3500', () => {
    const readmePath = path.join(rootDir, 'README.md');
    const readmeContent = fs.readFileSync(readmePath, 'utf-8');

    expect(readmeContent).toContain('http://localhost:3500');
    expect(readmeContent).not.toContain('http://localhost:3001');
  });
});

