import { describe, it, expect, beforeEach } from 'vitest';
import { UserRegistryService } from '@/services/auth/user-registry-service';

describe('User Authentication & Registration Engine', () => {
  beforeEach(() => {
    UserRegistryService.initialize();
  });

  it('authenticates pre-seeded official metrologist with email and valid password', async () => {
    const res = await UserRegistryService.authenticate('sharma.a@metrology.gov.in', 'lead123');
    expect(res.success).toBe(true);
    expect(res.user).toBeDefined();
    expect(res.user?.fullName).toBe('Dr. A. Sharma');
    expect(res.user?.role).toBe('LEAD_METROLOGIST');
  });

  it('authenticates with universal demo PIN 1234', async () => {
    const res = await UserRegistryService.authenticate('verma.amit@metrology.gov.in', '1234');
    expect(res.success).toBe(true);
    expect(res.user?.fullName).toBe('Amit Verma');
    expect(res.user?.role).toBe('TESTING_OFFICER');
  });

  it('rejects authentication with invalid credentials', async () => {
    const res = await UserRegistryService.authenticate('sharma.a@metrology.gov.in', 'wrong_password_999');
    expect(res.success).toBe(false);
    expect(res.user).toBeUndefined();
    expect(res.message).toContain('Incorrect password');
  });

  it('registers a new officer and allows immediate login with new credentials', async () => {
    const newEmail = `officer.test.${Date.now()}@metrology.gov.in`;
    const regResult = await UserRegistryService.register({
      fullName: 'Vikramaditya Rao',
      email: newEmail,
      password: 'securePassword2026',
      role: 'TECHNICAL_REVIEWER',
      accreditationId: 'RRSL-REV-2026-99',
      department: 'Testing Division',
    });

    expect(regResult.success).toBe(true);
    expect(regResult.user).toBeDefined();
    expect(regResult.user?.fullName).toBe('Vikramaditya Rao');
    expect(regResult.user?.role).toBe('TECHNICAL_REVIEWER');

    // Attempt login with the newly created account
    const loginResult = await UserRegistryService.authenticate(newEmail, 'securePassword2026');
    expect(loginResult.success).toBe(true);
    expect(loginResult.user?.id).toBe(regResult.user?.id);
    expect(loginResult.user?.accreditationId).toBe('RRSL-REV-2026-99');
  });

  it('rejects duplicate email registrations', async () => {
    const existingEmail = 'sharma.a@metrology.gov.in';
    const regResult = await UserRegistryService.register({
      fullName: 'Imposter Officer',
      email: existingEmail,
      password: 'password123',
      role: 'TESTING_OFFICER',
    });

    expect(regResult.success).toBe(false);
    expect(regResult.error).toContain('already exists');
  });

  it('enforces password minimum length and full name validation', async () => {
    const resShortPass = await UserRegistryService.register({
      fullName: 'A',
      email: 'invalid@metrology.gov.in',
      password: '123',
      role: 'TESTING_OFFICER',
    });

    expect(resShortPass.success).toBe(false);
  });
});
