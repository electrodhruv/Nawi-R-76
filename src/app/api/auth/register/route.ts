import { NextRequest, NextResponse } from 'next/server';
import { UserRegistryService } from '@/services/auth/user-registry-service';
import { z } from 'zod';

const RegisterSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum([
    'LEAD_METROLOGIST',
    'TESTING_OFFICER',
    'TECHNICAL_REVIEWER',
    'LABORATORY_DIRECTOR',
    'AUDITOR_INSPECTOR',
  ]),
  accreditationId: z.string().optional(),
  department: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid registration data' },
        { status: 400 }
      );
    }

    const result = await UserRegistryService.register(parsed.data);

    if (!result.success || !result.user) {
      return NextResponse.json(
        { success: false, error: result.error || 'Registration failed' },
        { status: 400 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: 'Officer account created successfully',
      user: {
        id: result.user.id,
        fullName: result.user.fullName,
        email: result.user.email,
        role: result.user.role,
        roleTitle: result.user.roleTitle,
        department: result.user.department,
        accreditationId: result.user.accreditationId,
        avatarInitials: result.user.avatarInitials,
      },
    }, { status: 201 });

    // Set secure session cookie
    response.cookies.set('nawi_session_user', JSON.stringify({
      id: result.user.id,
      email: result.user.email,
      role: result.user.role,
      fullName: result.user.fullName,
    }), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Internal server error' },
      { status: 500 }
    );
  }
}
