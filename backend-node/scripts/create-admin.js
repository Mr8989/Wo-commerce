#!/usr/bin/env node
// Creates or updates a dashboard admin. This replaces the Django admin site,
// which was the only way to manage `admin_users` rows before.
//
//   npm run create-admin -- --username ayerkie --email you@example.com
//   npm run create-admin -- --username ayerkie --password 'S3cret...' --deactivate

import readline from 'node:readline';
import prisma from '../src/db.js';
import { makePassword } from '../src/lib/django-password.js';

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      args[key] = next;
      i += 1;
    } else {
      args[key] = true;
    }
  }
  return args;
}

function ask(question, { silent = false } = {}) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });

  return new Promise((resolve) => {
    if (silent) {
      // Suppress the echo of typed characters, keeping the prompt itself.
      rl._writeToOutput = function writeToOutput(text) {
        if (text.includes(question)) rl.output.write(text);
      };
    }
    rl.question(question, (answer) => {
      if (silent) rl.output.write('\n');
      rl.close();
      resolve(answer.trim());
    });
  });
}

function validatePassword(password) {
  const problems = [];
  if (password.length < 8) problems.push('at least 8 characters');
  if (!/[A-Z]/.test(password)) problems.push('an uppercase letter');
  if (!/[a-z]/.test(password)) problems.push('a lowercase letter');
  if (!/\d/.test(password)) problems.push('a number');
  return problems;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const username = args.username || (await ask('Username: '));
  if (!username) throw new Error('A username is required');

  const existing = await prisma.adminUser.findUnique({ where: { username } });
  if (existing) console.log(`Admin "${username}" already exists — updating it.`);

  const email = args.email ?? (await ask(`Email${existing?.email ? ` [${existing.email}]` : ''}: `)) ?? '';

  let password = args.password;
  if (!password) {
    password = await ask('Password: ', { silent: true });
    const confirmation = await ask('Password (again): ', { silent: true });
    if (password !== confirmation) throw new Error('Passwords do not match');
  }

  if (!password && !existing) throw new Error('A password is required for a new admin');

  if (password) {
    const problems = validatePassword(password);
    if (problems.length) throw new Error(`Password must contain ${problems.join(', ')}`);
  }

  const data = {
    ...(password ? { password: await makePassword(password) } : {}),
    ...(email ? { email } : {}),
    isActive: !args.deactivate,
    // A password change or reactivation should clear any standing lockout.
    failedLoginAttempts: 0,
    lockedUntil: null,
  };

  const admin = existing
    ? await prisma.adminUser.update({ where: { id: existing.id }, data })
    : await prisma.adminUser.create({ data: { username, ...data } });

  console.log(`\n${existing ? 'Updated' : 'Created'} admin "${admin.username}" (${admin.isActive ? 'active' : 'inactive'})`);
  console.log('Sign in at /admin/login on the storefront.');
}

main()
  .catch((error) => {
    console.error(`\nError: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
