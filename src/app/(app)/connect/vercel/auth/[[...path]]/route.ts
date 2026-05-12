import { and, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { BASE_URL } from "@/config/base-url";
import { routes } from "@/config/routes";
import { STATUS_CODES } from "@/config/status-codes";
import { env } from "@/env";
import { routeRedirect } from "@/lib/utils/redirect";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { accounts } from "@/server/db/schema";

interface RouteContext {
  params: Promise<{
    path?: string[];
  }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  console.log("[Vercel OAuth] Callback hit", { url: request.url });

  if (!env.NEXT_PUBLIC_FEATURE_VERCEL_INTEGRATION_ENABLED) {
    console.log("[Vercel OAuth] Feature flag disabled, redirecting to /");
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    const session = await auth();
    console.log("[Vercel OAuth] Session check", {
      hasUser: !!session?.user,
      userId: session?.user?.id,
    });

    if (!session?.user) {
      return NextResponse.redirect(new URL(routes.auth.signIn, request.url));
    }

    // Await the params Promise
    const resolvedParams = await context.params;
    // Determine the base path for redirection from the dynamic route parameter
    const pathSegments = resolvedParams.path;
    let redirectBasePath = routes.home; // Default

    if (pathSegments && pathSegments.length > 0) {
      const decodedPath = pathSegments.map(decodeURIComponent).join("/");
      // Ensure the path starts with a slash
      redirectBasePath = decodedPath.startsWith("/") ? decodedPath : `/${decodedPath}`;
    }

    // Helper function to construct redirect URLs
    const constructRedirectUrl = (params: Record<string, string>) => {
      const url = new URL(redirectBasePath, request.url);
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
      return url;
    };

    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const configurationId = searchParams.get("configurationId");
    const teamId = searchParams.get("teamId");

    // Log all parameters for debugging
    console.log("Vercel OAuth callback parameters:", {
      code: code ? "present" : "missing",
      state,
      error,
      configurationId,
      teamId,
      allParams: Object.fromEntries(searchParams.entries()),
    });

    if (error) {
      console.error("Error in Vercel OAuth callback:", error);
      // Use dynamic redirect path for error
      return NextResponse.redirect(constructRedirectUrl({ code: "VERCEL_CONNECTION_FAILED" }));
    }

    // CRITICAL: Validate CSRF token
    // Since sessionStorage is client-side only, we need to pass the state through cookies
    // Get the stored state from cookie instead
    const cookieStore = request.cookies;
    const storedState = cookieStore.get("vercel_oauth_state")?.value;

    if (!state || !storedState || state !== storedState) {
      console.error("[Vercel OAuth] CSRF validation failed:", {
        stateFromQuery: state ?? "missing",
        stateFromCookie: storedState ?? "missing",
        cookiesPresent: request.cookies.getAll().map((c) => c.name),
      });
      return NextResponse.redirect(constructRedirectUrl({ code: "VERCEL_CONNECTION_FAILED" }));
    }

    if (!code) {
      console.error("No code provided in Vercel OAuth callback");
      // Use dynamic redirect path for error
      return NextResponse.redirect(constructRedirectUrl({ code: "VERCEL_CONNECTION_FAILED" }));
    }

    // Validate required credentials before attempting token exchange
    const clientId = env.VERCEL_CLIENT_ID;
    const clientSecret = env.VERCEL_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error("[Vercel OAuth] Missing VERCEL_CLIENT_ID or VERCEL_CLIENT_SECRET env vars");
      return NextResponse.redirect(constructRedirectUrl({ code: "VERCEL_CONNECTION_FAILED" }));
    }

    // The redirect_uri MUST match the Redirect URL configured in the Vercel Integration Console
    // Use BASE_URL (canonical production URL) rather than request.url.origin to ensure consistency
    const vercelCallbackUri = `${BASE_URL}/connect/vercel/auth`;

    console.log("[Vercel OAuth] Token exchange", {
      baseUrl: BASE_URL,
      requestOrigin: new URL(request.url).origin,
      vercelCallbackUri,
    });

    // Exchange code for access token
    const tokenResponse = await fetch("https://api.vercel.com/v2/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: vercelCallbackUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("[Vercel OAuth] Token exchange failed:", {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        body: errorText,
        redirectUri: vercelCallbackUri,
      });
      return NextResponse.redirect(constructRedirectUrl({ code: "VERCEL_CONNECTION_FAILED" }));
    }

    const tokenData = await tokenResponse.json();
    console.log("[Vercel OAuth] Token exchange successful");

    const { access_token, refresh_token, expires_in, team_id } = tokenData;

    // Get user info from Vercel
    const userResponse = await fetch("https://api.vercel.com/v2/user", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!userResponse.ok) {
      console.error("Failed to get user info from Vercel");
      // Use dynamic redirect path for error
      return NextResponse.redirect(constructRedirectUrl({ code: "VERCEL_CONNECTION_FAILED" }));
    }

    const userData = await userResponse.json();
    console.log("User info retrieved:", {
      hasUserId: !!(userData.user?.id || userData.user?.uid),
      user: userData.user
        ? {
            id: userData.user.id || userData.user.uid,
            email: userData.user.email,
            username: userData.user.username,
            name: userData.user.name,
          }
        : null,
    });

    const vercelUserId = userData.user?.id || userData.user?.uid;

    if (!vercelUserId) {
      console.error("Failed to get Vercel user ID");
      // Use dynamic redirect path for error
      return NextResponse.redirect(constructRedirectUrl({ code: "VERCEL_CONNECTION_FAILED" }));
    }

    // Calculate token expiry date - default to 30 days if expires_in is not provided
    let expiresAt = null;
    if (expires_in) {
      expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + expires_in);
      expiresAt = Math.floor(expiresAt.getTime() / 1000); // Convert to Unix timestamp
    } else {
      // Default to 30 days if expires_in is not provided
      expiresAt = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
    }

    // Store the access token and user info in the database
    try {
      if (!db) {
        console.error("Database not initialized - cannot save Vercel connection");
        return routeRedirect(routes.home, {
          code: STATUS_CODES.CONNECT_VERCEL_ERROR.code,
          nextUrl: request.url,
          request: request,
        });
      }

      // First, check if this Vercel account (by providerAccountId) already exists
      const existingAccount = await db
        .select()
        .from(accounts)
        .where(and(eq(accounts.provider, "vercel"), eq(accounts.providerAccountId, vercelUserId)))
        .limit(1);

      if (existingAccount && existingAccount.length > 0) {
        // If exists, update instead of insert
        await db
          .update(accounts)
          .set({
            userId: session.user.id, // Update to current user if account exists but belongs to another user
            access_token,
            refresh_token,
            expires_at: expiresAt,
            token_type: "bearer",
            scope: "user team",
          })
          .where(
            and(eq(accounts.provider, "vercel"), eq(accounts.providerAccountId, vercelUserId))
          );

        console.log("Updated existing Vercel account for user:", session.user.id);
      } else {
        // Delete any existing Vercel connections for this user (different providerAccountId)
        await db
          .delete(accounts)
          .where(and(eq(accounts.provider, "vercel"), eq(accounts.userId, session.user.id)));

        // Insert new account
        await db.insert(accounts).values({
          userId: session.user.id,
          type: "oauth",
          provider: "vercel",
          providerAccountId: vercelUserId,
          access_token,
          refresh_token,
          expires_at: expiresAt,
          token_type: "bearer",
          scope: "user team",
          id_token: null,
          session_state: null,
        });

        console.log("Inserted new Vercel account for user:", session.user.id);
      }
    } catch (dbError) {
      console.error("Database error handling Vercel account:", dbError);
      throw dbError;
    }

    console.log("Account data stored in database for user:", session.user.id);

    // Try to update the session directly - this won't always work in a server route
    // but can help in some cases by signaling the auth system that accounts have changed
    try {
      const { update } = await import("@/server/auth");
      await update({
        user: {
          accounts: [{ provider: "vercel", providerAccountId: vercelUserId }],
        },
      });
      console.log("Auth session updated with Vercel account");
    } catch (error) {
      console.warn("Could not update session directly:", error);
      // This is non-fatal, the UI will handle updating via updateSession
    }

    // Redirect back using the dynamic path with success message and clear CSRF cookie
    const successResponse = NextResponse.redirect(
      constructRedirectUrl({ code: STATUS_CODES.CONNECT_VERCEL.code })
    );
    successResponse.cookies.delete("vercel_oauth_state");
    return successResponse;
  } catch (error) {
    console.error("Error in Vercel OAuth callback:", error);
    // Await the params Promise in catch block as well
    const resolvedParams = await context.params;
    // Determine the base path for redirection even in the catch block
    const pathSegments = resolvedParams.path;
    let redirectBasePath = routes.home; // Default
    if (pathSegments && pathSegments.length > 0) {
      const decodedPath = pathSegments.map(decodeURIComponent).join("/");
      redirectBasePath = decodedPath.startsWith("/") ? decodedPath : `/${decodedPath}`;
    }
    const errorUrl = new URL(redirectBasePath, request.url);
    errorUrl.searchParams.set("code", "VERCEL_ERROR");
    return NextResponse.redirect(errorUrl);
  }
}
