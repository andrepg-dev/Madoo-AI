import { Suspense } from "react";
import { CampaignsScreen } from "@/components/campaigns/CampaignsScreen";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CampaignsScreen />
    </Suspense>
  );
}
