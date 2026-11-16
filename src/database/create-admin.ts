
import 'dotenv/config';
import * as bcrypt from 'bcrypt';

import AppDataSource from './data-source.js';
import { User, UserRole } from '../users/entities/user.entity.js';

async function createAdmin() {
  const fullName = process.env.BOOTSTRAP_ADMIN_NAME;
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

  if (!fullName || !email || !password) {
    throw new Error(
      'Set BOOTSTRAP_ADMIN_NAME, BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD in .env',
    );
  }

  if (password.length < 8 || password.length > 72) {
    throw new Error('Admin password must be between 8 and 72 characters');
  }

  await AppDataSource.initialize();

  try {
    const userRepository = AppDataSource.getRepository(User);

    const existingUser = await userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new Error(
        'This email already exists. The bootstrap script will not modify an existing account.',
      );
    }

    const admin = userRepository.create({
      fullName,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role: UserRole.ADMIN,
      isActive: true,
    });

    await userRepository.save(admin);

    console.log('First Admin account created successfully.');
    console.log(`Admin email: ${email}`);
    console.log('You can now log in through POST /api/v1/auth/login.');
  } finally {
    await AppDataSource.destroy();
  }
}

createAdmin().catch((error: unknown) => {
  console.error(
    'Admin bootstrap failed:',
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
});
