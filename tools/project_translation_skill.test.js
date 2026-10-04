#!/usr/bin/env node
/**
 * [INPUT]: 依赖项目 .agents/skills/baoyu-translate 的技能入口/来源清单、现行 EXTEND 与四语术语表
 * [OUTPUT]: 对外提供项目级技能可发现性、来源摘要、本地引用完整性和配置路径的离线验收
 * [POS]: tools 的 Agent 配置合同；不调用模型、不安装运行依赖、不把翻译 skill 纳入产品运行时
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const YAML = require('yaml');
const { test } = require('node:test');
const root = path.resolve(__dirname, '..');
const skill = path.join(root, '.agents/skills/baoyu-translate');
const read = (name) => fs.readFileSync(path.join(skill, name), 'utf8');

test('project skill has supported discovery metadata and a pinned upstream identity', () => {
  const entry = read('SKILL.md');
  const frontmatter = YAML.parse(entry.match(/^---\n([\s\S]*?)\n---/)[1]);
  assert.equal(frontmatter.name, 'baoyu-translate');
  assert.equal(typeof frontmatter.description, 'string');
  assert.ok(frontmatter.description.length > 0);
  assert.ok(Object.keys(frontmatter).every(key => ['name', 'description', 'license', 'allowed-tools', 'metadata'].includes(key)));
  const provenance = JSON.parse(read('UPSTREAM.json'));
  assert.equal(provenance.repository, 'https://github.com/JimLiu/baoyu-skills');
  assert.match(provenance.commit, /^[a-f0-9]{40}$/);
  assert.equal(frontmatter.metadata.upstream_version, provenance.version);
  assert.equal(provenance.skillPath, 'skills/baoyu-translate');
});

test('full skill supporting files and license match their recorded installed hashes', () => {
  const provenance = JSON.parse(read('UPSTREAM.json'));
  for (const file of provenance.files) {
    const relative = path.normalize(file.path);
    assert.ok(!path.isAbsolute(relative) && !relative.startsWith('..'));
    const content = fs.readFileSync(path.join(skill, relative));
    assert.equal(crypto.createHash('sha256').update(content).digest('hex'), file.installedSha256, relative);
    assert.match(file.upstreamSha256, /^[a-f0-9]{64}$/);
  }
  for (const needed of ['SKILL.md', 'references/refined-workflow.md', 'references/config/extend-schema.md', 'scripts/main.ts', 'scripts/chunk.ts', 'scripts/package.json', 'scripts/bun.lock', 'LICENSE']) {
    assert.ok(provenance.files.some(file => file.path === needed), needed);
  }
  assert.match(read('LICENSE'), /MIT License/);
});

test('actual skill Markdown references resolve within the installed supporting tree', () => {
  const provenance = JSON.parse(read('UPSTREAM.json'));
  for (const { path: relative } of provenance.files.filter(file => file.path.endsWith('.md'))) {
    for (const match of read(relative).matchAll(/\]\(([^)]+\.md)(?:#[^)]*)?\)/g)) {
      if (/^https?:/.test(match[1])) continue;
      const referenced = path.resolve(skill, path.dirname(relative), match[1]);
      assert.ok(fs.existsSync(referenced), `${relative} -> ${match[1]}`);
    }
  }
});

test('existing project preferences retain refined technical mode and point at the real four-language glossary', () => {
  const extend = path.join(root, '.baoyu-skills/baoyu-translate/EXTEND.md');
  const config = YAML.parse(fs.readFileSync(extend, 'utf8'));
  assert.equal(config.target_language, 'zh-CN');
  assert.equal(config.default_mode, 'refined');
  assert.equal(config.audience, 'technical');
  assert.equal(config.style, 'technical');
  assert.equal(config.glossary_files.length, 1);
  const glossary = path.resolve(path.dirname(extend), config.glossary_files[0]);
  assert.equal(glossary, path.join(root, 'docs/cavalry-glossary.md'));
  assert.match(fs.readFileSync(glossary, 'utf8'), /\| en \| zh-Hans \| zh-Hant \| ja_JP \| note \|/);
});
