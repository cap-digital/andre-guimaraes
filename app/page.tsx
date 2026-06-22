import { Suspense } from "react";
import { DataProvider } from "@/components/DataProvider";
import { Landing } from "@/components/landing/Landing";
import { FullLoader } from "@/components/ui/States";

export default function HomePage() {
  return (
    <Suspense fallback={<FullLoader />}>
      <DataProvider>
        <Landing />
      </DataProvider>
    </Suspense>
  );
}
