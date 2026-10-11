import { Suspense } from "react";
import { LandingPage } from "@/components/landing/landing-page";

export default function HomePage() {
  return (
    <Suspense>
      <LandingPage />
    </Suspense>
  );
}
