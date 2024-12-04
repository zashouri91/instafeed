import { AuthError } from '@supabase/supabase-js';

export function getAuthErrorMessage(error: AuthError | Error | unknown): string {
  if (error instanceof AuthError) {
    switch (error.status) {
      case 400:
        return 'Invalid email or password format';
      case 401:
        return 'Invalid credentials';
      case 403:
        return 'Email not confirmed';
      case 404:
        return 'User not found';
      case 422:
        return 'Email already registered';
      case 429:
        return 'Too many login attempts. Please try again later';
      default:
        return error.message || 'Authentication error occurred';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
}

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof Response) {
    switch (error.status) {
      case 400:
        return 'Invalid request';
      case 401:
        return 'Please log in to continue';
      case 403:
        return 'You do not have permission to perform this action';
      case 404:
        return 'Resource not found';
      case 429:
        return 'Too many requests. Please try again later';
      case 500:
        return 'Server error. Please try again later';
      default:
        return `Error: ${error.statusText}`;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
}
