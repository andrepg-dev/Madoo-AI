import { LandingHeader } from "../../components/LandingHeader";
import { PricingFaq } from "../../components/PricingFaq";
import { PricingPlans } from "../../components/PricingPlans";

const pricingHeaderCopy = {
  useCases: "Use cases",
  emailTemplates: "Email Templates",
  pricing: "Pricing",
  login: "Login",
  getStarted: "Get started",
  mobileMenu: "Open navigation",
};

export default function PricingPage() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-white font-ibm-plex-sans">
      <LandingHeader copy={pricingHeaderCopy} />

      <section className="relative z-10 min-h-screen w-full">
        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-20 sm:px-8 sm:py-24">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-semibold leading-none text-madoo-text">
              Plans & Pricing
            </h1>
            <p className="mt-4 text-base leading-7 text-madoo-muted">
              Discover the best price for you, all plans are designed to fit
              your needs.
            </p>
          </div>

          <PricingPlans />
        </div>
      </section>

      <PricingFaq />
    </main>
  );
}
