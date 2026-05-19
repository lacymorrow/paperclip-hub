import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { ErrorService } from "@/server/services/error-service";
import { rateLimitService } from "@/server/services/rate-limit-service";

const V0_PROXY_RATE_LIMIT = { requests: 20, duration: 60 };

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    try {
      await rateLimitService.checkLimit(session.user.id, "v0-proxy", V0_PROXY_RATE_LIMIT);
    } catch (error) {
      if (ErrorService.isAppError(error) && error.code === "RATE_LIMITED") {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          { status: 429, headers: { "Retry-After": String(Math.ceil(((error.metadata?.reset as number) || 0) - Date.now() / 1000)) } }
        );
      }
      throw error;
    }

    const body = await request.json();
    const { componentId } = body;

    if (!componentId) {
      return NextResponse.json({ error: "Component ID is required" }, { status: 400 });
    }

    // Validate component ID format
    if (!componentId.match(/^b_[a-zA-Z0-9]+$/)) {
      return NextResponse.json(
        { error: "Invalid component ID format. Expected format: b_XXXXXXXX" },
        { status: 400 }
      );
    }

    // Fetch the component from v0.dev
    const apiUrl = `https://v0.dev/api/component/${componentId}`;
    console.log(`Proxying request to: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      next: { revalidate: 0 }, // Don't cache
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch component: ${response.statusText}` },
        { status: response.status }
      );
    }

    // Get the component data
    const componentData = await response.json();

    // Return the component data
    return NextResponse.json(componentData);
  } catch (error) {
    console.error("Error proxying v0.dev request:", error);
    return NextResponse.json({ error: "Failed to proxy request to v0.dev" }, { status: 500 });
  }
}
