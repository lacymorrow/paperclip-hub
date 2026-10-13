import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site-config";

// Convert base64 string to ArrayBuffer compatible with Edge runtime (no Node Buffer)
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const length = binaryString.length;
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes.buffer;
}

async function loadAssets(): Promise<
  { name: string; data: ArrayBuffer; weight: 400 | 600; style: "normal" }[]
> {
  const [{ base64Font: normal }, { base64Font: mono }, { base64Font: semibold }] =
    await Promise.all([
      import("./geist-regular-otf.json").then((mod) => mod.default || mod),
      import("./geistmono-regular-otf.json").then((mod) => mod.default || mod),
      import("./geist-semibold-otf.json").then((mod) => mod.default || mod),
    ]);

  return [
    {
      name: "Geist",
      data: base64ToArrayBuffer(normal),
      weight: 400 as const,
      style: "normal" as const,
    },
    {
      name: "Geist Mono",
      data: base64ToArrayBuffer(mono),
      weight: 400 as const,
      style: "normal" as const,
    },
    {
      name: "Geist",
      data: base64ToArrayBuffer(semibold),
      weight: 600 as const,
      style: "normal" as const,
    },
  ];
}

function clamp(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max).replace(/\s+\S*$/, "");
  return `${cut.replace(/[.,:;+\s]+$/, "")}...`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = new URL(request.url).origin;
  const title = clamp(searchParams.get("title") ?? siteConfig.title, 56);
  // Real plugin descriptions run to several sentences; keep the card readable.
  const description = clamp(searchParams.get("description") ?? siteConfig.description, 110);
  const url = searchParams.get("url") ?? siteConfig?.url.replace(/https?:\/\//, "");
  const theme = searchParams.get("theme") === "light" ? "light" : "dark";

  const isDark = theme === "dark";
  const colors = {
    bg: isDark ? "#000000" : "#ffffff",
    fg: isDark ? "#ffffff" : "#000000",
    border: isDark ? "#44403c" : "#d6d3d1",
    muted: isDark ? "#78716c" : "#57534e",
    body: isDark ? "#a8a29e" : "#57534e",
  };

  const [fonts] = await Promise.all([loadAssets()]);

  return new ImageResponse(
    <div
      tw="flex h-full w-full"
      style={{ fontFamily: "Geist Sans", backgroundColor: colors.bg, color: colors.fg }}
    >
      <div
        tw="flex absolute inset-y-0 left-16 w-[1px]"
        style={{ borderLeft: `1px dashed ${colors.border}` }}
      />
      <div
        tw="flex absolute inset-y-0 right-16 w-[1px]"
        style={{ borderLeft: `1px dashed ${colors.border}` }}
      />
      <div
        tw="flex absolute inset-x-0 h-[1px] top-16"
        style={{ borderTop: `1px solid ${colors.border}` }}
      />
      <div
        tw="flex absolute inset-x-0 h-[1px] bottom-16"
        style={{ borderTop: `1px solid ${colors.border}` }}
      />
      <div tw="flex absolute bottom-24 right-24">
        {/* biome-ignore lint/performance/noImgElement: next/og renders plain img */}
        <img src={`${origin}/app/og-logo.png`} width={80} height={80} alt="Logo" />
      </div>
      <div
        tw="flex absolute bottom-24 left-24 text-[32px]"
        style={{ fontWeight: 400, color: colors.muted }}
      >
        {url}
      </div>
      <div tw="flex flex-col absolute w-[896px] justify-center inset-32">
        <div
          tw="tracking-tight flex-grow-1 flex flex-col justify-center leading-[1.1]"
          style={{
            textWrap: "balance",
            fontWeight: 600,
            fontSize: title && title.length > 20 ? 64 : 80,
            letterSpacing: "-0.04em",
          }}
        >
          {title}
        </div>
        <div
          tw="text-[36px] leading-[1.4] flex-grow-1"
          style={{
            fontWeight: 500,
            textWrap: "balance",
            color: colors.body,
          }}
        >
          {description}
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 628,
      fonts,
    }
  );
}
