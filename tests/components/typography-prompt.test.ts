import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Google Fonts Prompt & 14px Base Typography Scale (UI-FONT-PROMPT-01)', () => {
  const rootDir = process.cwd();

  it('configures next/font/google Prompt with thai and latin subsets in app/layout.tsx', () => {
    const layoutPath = path.join(rootDir, 'app/layout.tsx');
    const content = fs.readFileSync(layoutPath, 'utf-8');

    // Asserts Next.js Google font loader for Prompt
    expect(content).toMatch(/import\s*\{\s*Prompt\s*\}\s*from\s*['"]next\/font\/google['"]/);
    expect(content).toContain('subsets:');
    expect(content).toContain("'thai'");
    expect(content).toContain("'latin'");
    expect(content).toMatch(/prompt\.className|prompt\.variable/);
  });

  it('defines 14px base font size and Prompt font stack in app/globals.css', () => {
    const cssPath = path.join(rootDir, 'app/globals.css');
    const content = fs.readFileSync(cssPath, 'utf-8');

    // Asserts font-family includes Prompt and font-size is 14px
    expect(content).toMatch(/font-family:.*['"]?Prompt['"]?/);
    expect(content).toMatch(/font-size:\s*14px/);
  });

  it('ensures CoachAdviceCard uses readable typography scale for Thai strategic advice', () => {
    const coachPath = path.join(rootDir, 'components/go/CoachAdviceCard.tsx');
    const content = fs.readFileSync(coachPath, 'utf-8');

    // Asserts that main advice paragraph is at least text-sm (14px) or text-[13.5px]
    expect(content).toMatch(/text-sm|text-\[14px\]|text-\[13\.5px\]/);
  });

  it('ensures EvaluationBar uses clear typography for player badges and score points', () => {
    const evalPath = path.join(rootDir, 'components/go/EvaluationBar.tsx');
    const content = fs.readFileSync(evalPath, 'utf-8');

    // Asserts player badges have sufficient vertical padding for Thai tone marks
    expect(content).toMatch(/eval-player-black/);
    expect(content).toMatch(/eval-player-white/);
  });
});
