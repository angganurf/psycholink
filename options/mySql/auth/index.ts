import {
    DrizzleMySQLAdapter
  } from "@lucia-auth/adapter-drizzle";
  import type { Session, User } from "lucia";
  import { Lucia } from "lucia";
  import { cookies } from "next/headers";
  import { cache } from "react";
  import { db } from "../db";
  import { sessionTable } from "../db/schema/session";
  
  import { User as UserType } from "@/lib/db/schema/user";
  import { userTable } from "../db/schema/user";
  
  export const adapter = new DrizzleMySQLAdapter(db, sessionTable, userTable);
  // https://lucia-auth.com/getting-started/nextjs-app
  export const lucia = new Lucia(adapter, {
    sessionCookie: {
      // this sets cookies with super long expiration
      // since Next.js doesn't allow Lucia to extend cookie expiration when rendering pages
      expires: false,
  
      attributes: {
        // set to `true` when using HTTPS
        secure: process.env.NODE_ENV === "production",
      },
    },
    getUserAttributes: (attributes) => {
      return {
        // attributes has the type of DatabaseUserAttributes
        username: attributes.username,
        email: attributes.email,
        email_verified: attributes.email_verified,
        setupTwoFactor: attributes.two_factor_secret !== null,
      };
    },
  });
  
  export const validateRequest = cache(
    async (): Promise<
      { user: User; session: Session } | { user: null; session: null }
    > => {
      const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null;
      if (!sessionId) {
        return {
          user: null,
          session: null,
        };
      }
  
      const result = await lucia.validateSession(sessionId);
      // next.js throws when you attempt to set cookie when rendering page
      try {
        if (result.session && result.session.fresh) {
          const sessionCookie = lucia.createSessionCookie(result.session.id);
          cookies().set(
            sessionCookie.name,
            sessionCookie.value,
            sessionCookie.attributes
          );
        }
        if (!result.session) {
          const sessionCookie = lucia.createBlankSessionCookie();
          cookies().set(
            sessionCookie.name,
            sessionCookie.value,
            sessionCookie.attributes
          );
        }
      } catch {}
      return result;
    }
  );
  
  declare module "lucia" {
    interface Register {
      Lucia: typeof lucia;
      DatabaseUserAttributes: DatabaseUserAttributes;
    }
  }
  
  interface DatabaseUserAttributes extends UserType {}