import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isAdminPath = nextUrl.pathname.startsWith('/admin');

            // Protect admin routes
            if (isAdminPath) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            }

            return true;
        },
        // Enhance session with user ID and username
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                // @ts-ignore
                token.username = user.username;
            }
            // Support updating session client-side
            if (trigger === "update") {
                if (session?.username) token.username = session.username;
                if (session?.name) token.name = session.name;
                if (session?.image) token.picture = session.image;
            }
            return token;
        },
        session({ session, token }) {
            if (session.user && token.sub) {
                session.user.id = token.sub;
            }
            if (session.user && token.username) {
                // @ts-ignore
                session.user.username = token.username;
            }
            if (session.user && token.picture) {
                session.user.image = token.picture;
            }
            return session;
        },
    },
    providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
