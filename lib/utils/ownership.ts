import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Validates that a resource belongs to the current user
 * @param supabase Supabase client instance
 * @param userId The user ID from auth
 * @param resourceId The ID of the resource to check
 * @param tableName The table name to check against
 * @param userIdColumn The column name that stores the user ID (default: 'user_id')
 */
export async function validateOwnership(
  supabase: SupabaseClient,
  userId: string,
  resourceId: string,
  tableName: string,
  userIdColumn: string = 'user_id'
): Promise<boolean> {
  const { data, error } = await supabase
    .from(tableName)
    .select(userIdColumn)
    .eq('id', resourceId)
    .single();

  if (error) return false;
  return data && typeof data === 'object' && userIdColumn in data && data[userIdColumn] === userId;
}

/**
 * Validates ownership and throws error if not authorized
 */
export async function requireOwnership(
  supabase: SupabaseClient,
  userId: string,
  resourceId: string,
  tableName: string,
  userIdColumn: string = 'user_id'
): Promise<void> {
  const isOwner = await validateOwnership(supabase, userId, resourceId, tableName, userIdColumn);
  if (!isOwner) {
    throw new Error('Unauthorized: Resource does not belong to user');
  }
}