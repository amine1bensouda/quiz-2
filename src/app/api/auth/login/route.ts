import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { comparePassword } from '@/lib/auth-utils';
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
    
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Vérifier le mot de passe
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Créer une session (utiliser un token simple pour l'instant)
    // En production, utiliser JWT ou NextAuth.js
    const sessionToken = `${user.id}-${Date.now()}`;
    
    // Stocker le token dans un cookie
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

    // Retourner les informations utilisateur (sans le mot de passe)
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
      message: 'Login successful',
    });
  } catch (error: any) {
    console.error('Error logging in:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      meta: error.meta,
      stack: error.stack,
    });
    
    // Gérer les erreurs de connexion à la base de données
    let errorMessage = 'Failed to login';
    let statusCode = 500;
    
    if (error.code === 'P1001' || error.message?.includes('Can\'t reach database')) {
      errorMessage = 'Database connection error. Please check your DATABASE_URL configuration.';
      statusCode = 503;
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
