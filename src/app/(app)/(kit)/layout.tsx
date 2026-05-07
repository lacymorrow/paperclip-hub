import type React from "react";
import { Footer } from "@/components/footers/extended-footer";
import { Header } from "@/components/headers/header";
import MainLayout from "@/components/layouts/main-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <MainLayout
      // Blur and settle the marketing header immediately when visitors start scrolling.
      header={<Header searchVariant={"none"} variant="sticky" opaqueOnScroll={0} />}
      footer={<Footer />}
    >
      {children}
    </MainLayout>
  );
}
