import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

describe('Command Gate & Audit Skill Integrity (TOOL-CMD-01)', () => {
  const rootDir = path.resolve(__dirname, '../../');

  it('declares .audit command prefix and .scrutinize alias in .agent/AGENTS.md', () => {
    const agentsPath = path.join(rootDir, '.agent/AGENTS.md');
    const content = fs.readFileSync(agentsPath, 'utf-8');

    expect(content).toContain('.audit');
    expect(content).toContain('.scrutinize');
    expect(content).toMatch(/Prefixes:.*\.audit/);
    expect(content).toContain('| `.audit` (alias: `.scrutinize`) | audit, testing |');
  });

  it('mirrors .audit command gate in .agent/.cursor/rules/copilot-core.mdc', () => {
    const cursorRulesPath = path.join(rootDir, '.agent/.cursor/rules/copilot-core.mdc');
    const content = fs.readFileSync(cursorRulesPath, 'utf-8');

    expect(content).toContain('.audit');
    expect(content).toMatch(/Prefixes:.*\.audit/);
    expect(content).toContain('| `.audit` (alias: `.scrutinize`) | audit, testing |');
  });

  it('provides audit SKILL.md in both .agent/skills and .agent/.cursor/skills in parity', () => {
    const agentSkillPath = path.join(rootDir, '.agent/skills/audit/SKILL.md');
    const cursorSkillPath = path.join(rootDir, '.agent/.cursor/skills/audit/SKILL.md');

    expect(fs.existsSync(agentSkillPath)).toBe(true);
    expect(fs.existsSync(cursorSkillPath)).toBe(true);

    const agentSkill = fs.readFileSync(agentSkillPath, 'utf-8');
    const cursorSkill = fs.readFileSync(cursorSkillPath, 'utf-8');

    expect(agentSkill).toContain('name: audit');
    expect(agentSkill).toContain('.audit');
    expect(agentSkill).toBe(cursorSkill);
  });

  it('updates adjacent skills to reference .audit for plan/dev review', () => {
    const codingSkill = fs.readFileSync(path.join(rootDir, '.agent/skills/coding/SKILL.md'), 'utf-8');
    const consultSkill = fs.readFileSync(path.join(rootDir, '.agent/skills/consult/SKILL.md'), 'utf-8');
    const handoffSkill = fs.readFileSync(path.join(rootDir, '.agent/skills/handoff/SKILL.md'), 'utf-8');

    expect(codingSkill).toContain('.audit');
    expect(consultSkill).toContain('.audit');
    expect(handoffSkill).toContain('.audit');
  });
});
