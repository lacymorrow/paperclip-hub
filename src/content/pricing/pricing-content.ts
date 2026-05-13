import { routes } from "@/config/routes";

export interface PricingPlan {
  title: string;
  description: string;
  price: {
    monthly?: number;
    annually?: number;
    oneTime?: number;
  };
  features: string[];
  infos?: string[];
  href: string;
  isBestValue?: boolean;
  noCardRequired?: boolean;
  isComingSoon?: boolean;
}

export const singlePlan: PricingPlan = {
  title: "Paperclip Hub",
  description: "$249 one-time. Lifetime updates. No recurring fees.",
  isBestValue: true,
  price: { oneTime: 249 },
  href: routes.external.buy,
  features: [
    "Next.js 15 App Router + TypeScript",
    "Auth that works out of the box (Better Auth + OAuth)",
    "Postgres + Drizzle, already migrated",
    "LemonSqueezy payments, pre-wired",
    "Payload CMS with admin panel",
    "Resend email with templates",
    "100+ shadcn/ui components",
    "Cursor rules + AI context files included",
    "AI workflows + v0.dev integration",
    "Deploy to Vercel in one click",
  ],
};

export const oneTimePlans: PricingPlan[] = [
  {
    title: "Paperclip Bones",
    description: "Perfect for indie developers and small projects",
    price: { oneTime: 0 },
    href: routes.external.buy,
    features: [
      "Next.js 15 App Router Setup",
      "Authentication (Better Auth)",
      "TypeScript Configuration",
      "Basic UI Components",
      "Basic Testing Setup",
      "Community Support",
    ],
    noCardRequired: true,
  },
  singlePlan,
];


