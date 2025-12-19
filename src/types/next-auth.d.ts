import 'next-auth';
import 'next-auth/jwt';

/**
 * Extend NextAuth types to include custom user properties and tokens
 */

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    error?: string;
    user: {
      id?: string;
      username?: string;
      email?: string;
      name?: string;
      firstName?: string;
      lastName?: string;
      image?: string;
    };
  }

  interface User {
    id?: string;
    username?: string;
    email?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    error?: string;
    user?: {
      id?: string;
      username?: string;
      email?: string;
      name?: string;
      firstName?: string;
      lastName?: string;
    };
  }
}
