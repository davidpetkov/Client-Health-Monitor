import { Suspense } from "react";
import { HomeContent } from "./home-content";

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p>Loading...</p>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
