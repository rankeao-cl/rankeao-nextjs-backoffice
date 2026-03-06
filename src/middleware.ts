import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow login page
    if (pathname === "/admin/login") {
        return NextResponse.next();
    }

    // Protect all /admin/* routes
    if (pathname.startsWith("/admin")) {
        // Check for auth token in cookie or as a fallback check the header
        const token =
            request.cookies.get("rankeao_admin_token")?.value ||
            request.headers.get("authorization")?.replace("Bearer ", "");

        if (!token) {
            const loginUrl = new URL("/admin/login", request.url);
            loginUrl.searchParams.set("redirect", pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*"],
};
