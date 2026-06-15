import HomePage from "../components/HomePage";
import { fetchLandingCommunityTemplates } from "../lib/community-templates";

export default async function Page() {
  const communityTemplates = await fetchLandingCommunityTemplates();

  return <HomePage communityTemplates={communityTemplates} />;
}
