import { db } from '@/lib/db';
import type { User } from '@/lib/db-types';

/**
 * Service layer for user operations.
 * Returns structured responses with success/error states.
 */

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Get all active users (employees) from tbl_Contacten
 * Filters by ContactMedewerkerActief = true
 */
export async function getActiveUsers(): Promise<ServiceResponse<User[]>> {
  try {
    const users = await db
      .selectFrom('tbl_Contacten')
      .selectAll()
      .where('ContactMedewerkerActief', '=', true)
      .orderBy('ContactFullName', 'asc')
      .execute();

    return {
      success: true,
      data: users,
    };
  } catch (error) {
    console.error('Error fetching active users:', error);
    return {
      success: false,
      error: 'Failed to fetch active users',
    };
  }
}

/**
 * Get a specific user by their GUID
 */
export async function getUserById(userId: string): Promise<ServiceResponse<User>> {
  try {
    const user = await db
      .selectFrom('tbl_Contacten')
      .selectAll()
      .where('ContactGUID', '=', userId)
      .where('ContactMedewerkerActief', '=', true)
      .executeTakeFirst();

    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    return {
      success: true,
      data: user,
    };
  } catch (error) {
    console.error('Error fetching user:', error);
    return {
      success: false,
      error: 'Failed to fetch user',
    };
  }
}
