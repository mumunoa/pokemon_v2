import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

export default clerkMiddleware(async (auth, req) => {
    const { userId } = await auth();
    const { pathname } = req.nextUrl;
    
    // ログイン済みユーザーがトップページ (/) にアクセスした際
    // スマホの Google 認証結果が / に着地するのを確実に拾って /practice へ転送
    if (pathname === '/' && userId) {
        return Response.redirect(new URL('/practice', req.url));
    }
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
