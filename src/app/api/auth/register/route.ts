import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth-utils';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    const { email, password, name } = body;

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Hasher le mot de passe
    const hashedPassword = await hashPassword(password);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    // Créer une session (auto-login après inscription)
    const sessionToken = `${user.id}-${Date.now()}`;
    const cookieStore = await cookies();
    
    // Sur Vercel, utiliser secure: true car HTTPS est toujours activé
    const isProduction = process.env.VERCEL || process.env.NODE_ENV === 'production';
    
    cookieStore.set('session_token', sessionToken, {
      httpOnly: true,
      secure: isProduction, // true sur Vercel (HTTPS)
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 jours
      path: '/',
    });

    return NextResponse.json(
      {
        user,
        message: 'User created successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error registering user:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      meta: error.meta,
      stack: error.stack,
    });
    
    // Gérer les erreurs de connexion à la base de données
    let errorMessage = 'Failed to register user';
    let statusCode = 500;
    
    if (error.code === 'P1001' || error.message?.includes('Can\'t reach database')) {
      errorMessage = 'Database connection error. Please check your DATABASE_URL configuration.';
      statusCode = 503;
    } else if (error.code === 'P2002') {
      errorMessage = 'Email already registered';
      statusCode = 409;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { 
        status: statusCode,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
