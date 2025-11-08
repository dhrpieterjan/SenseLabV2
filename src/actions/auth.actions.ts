'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getUserById } from '@/services/users.service';

/**
 * Authentication actions for user login/logout
 */

const COOKIE_NAME = 'senselab_user_id';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const loginSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

export interface ActionResponse {
  success: boolean;
  error?: string;
}

/**
 * Login action - validates user and sets cookie
 */
export async function loginAction(formData: FormData): Promise<ActionResponse> {
  try {
    // Validate input
    const result = loginSchema.safeParse({
      userId: formData.get('userId'),
    });

    if (!result.success) {
      return {
        success: false,
        // @ts-expect-error - ZodError is not typed correctly
        error: result.error.errors[0]?.message || 'Invalid input',
      };
    }

    const { userId } = result.data;

    // Verify user exists and is active
    const userResponse = await getUserById(userId);
    if (!userResponse.success || !userResponse.data) {
      return {
        success: false,
        error: 'Invalid user selected',
      };
    }

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: 'Login failed. Please try again.',
    };
  }
}

/**
 * Logout action - clears cookie and redirects
 */
export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect('/');
}

/**
 * Get current logged-in user ID from cookie
 */
export async function getCurrentUserId(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}

/**
 * Get current logged-in user data
 */
export async function getCurrentUser() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return null;
  }

  const userResponse = await getUserById(userId);
  return userResponse.success ? userResponse.data : null;
}
