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
    <Suspense fallback={<FullLoader />}>
      <DataProvider>
        <Shell>{children}</Shell>
      </DataProvider>
    </Suspense>
  );
}
