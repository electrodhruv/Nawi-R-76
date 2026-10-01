import { NextRequest, NextResponse } from 'next/server';
import { UserRegistryService } from '@/services/auth/user-registry-service';

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('nawi_session_user');
    if (!sessionCookie?.value) {
      return NextResponse.json({ success: false, user: null }, { status: 401 });
    }

    const sessionData = JSON.parse(sessionCookie.value);
    const users = UserRegistryService.getAllUsers();
    const user = users.find((u) => u.email.toLowerCase() === sessionData.email?.toLowerCase());

    if (!user) {
      return NextResponse.json({ success: false, user: null }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        roleTitle: user.roleTitle,
        department: user.department,
        accreditationId: user.accreditationId,
        avatarInitials: user.avatarInitials,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, user: null }, { status: 401 });
  }
}
