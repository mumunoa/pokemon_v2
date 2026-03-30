import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isRootRoute = createRouteMatcher(['/']);

export default clerkMiddleware(async (auth, req) => {
    const { userId } = await auth();
    // ログイン済みユーザーがトップページ (/) にアクセスした際、強制的に /practice へ飛ばす
    if (isRootRoute(req) && userId) {
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
