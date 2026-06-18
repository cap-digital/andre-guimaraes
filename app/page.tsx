import { DataProvider } from "@/components/DataProvider";
import { Landing } from "@/components/landing/Landing";

export default function HomePage() {
  return (
    <DataProvider>
      <Landing />
    </DataProvider>
  );
}
