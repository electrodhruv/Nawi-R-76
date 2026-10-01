import { NextRequest, NextResponse } from 'next/server';
import { UserRegistryService } from '@/services/auth/user-registry-service';
import { z } from 'zod';

const LoginSchema = z.object({
  identifier: z.string().min(1, 'Email or Employee ID is required'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid login payload' },
        { status: 400 }
      );
    }

    const { identifier, password } = parsed.data;
    const result = await UserRegistryService.authenticate(identifier, password);

    if (!result.success || !result.user) {
      return NextResponse.json(
        { success: false, error: result.message || 'Invalid credentials' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
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
    });

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
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Internal server error' },
      { status: 500 }
    );
  }
}
