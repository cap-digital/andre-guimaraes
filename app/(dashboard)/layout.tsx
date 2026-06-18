import { Suspense } from "react";
import { DataProvider } from "@/components/DataProvider";
import { Shell } from "@/components/dashboard/Shell";
import { FullLoader } from "@/components/ui/States";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DataProvider>
      <Suspense fallback={<FullLoader />}>
        <Shell>{children}</Shell>
      </Suspense>
    </DataProvider>
  );
}
