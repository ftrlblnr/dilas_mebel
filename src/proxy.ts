import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthed = !!req.auth?.user?.id;
  if (isAuthed) return;

  if (pathname.startsWith("/miniapp")) {
    if (pathname === "/miniapp/login") return;
    return NextResponse.redirect(new URL("/miniapp/login", req.nextUrl));
  }

  if (pathname === "/crm/login") return;
  return NextResponse.redirect(new URL("/crm/login", req.nextUrl));
});

export const config = {
  matcher: ["/crm/:path*", "/miniapp/:path*"],
};
