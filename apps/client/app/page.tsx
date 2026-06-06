import { ClientPromptBox } from "@/components/home/ClientPromptBox";

const emailProviders = [
  {
    name: "Mailchimp",
    iconSrc: "https://www.google.com/s2/favicons?domain=mailchimp.com&sz=64",
  },
  {
    name: "Klaviyo",
    iconSrc: "https://www.google.com/s2/favicons?domain=klaviyo.com&sz=64",
  },
  {
    name: "HubSpot",
    iconSrc: "https://www.google.com/s2/favicons?domain=hubspot.com&sz=64",
  },
  {
    name: "Brevo",
    iconSrc: "https://www.google.com/s2/favicons?domain=brevo.com&sz=64",
  },
  {
    name: "MailerLite",
    iconSrc: "https://www.google.com/s2/favicons?domain=mailerlite.com&sz=64",
  },
];

export default function Page() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <img
        src="/background-photo.webp"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="flex flex-col gap-4">
        <div className="rounded-full backdrop-blur-md bg-white/80 p-2 px-4 madoo-paper-border w-max text-sm flex items-center gap-2">
          <div className="flex h-5 -space-x-1.5">
            {emailProviders.map((provider) => (
              <div
                key={provider.name}
                className="h-full aspect-square overflow-hidden rounded-full bg-white shadow-madoo-border"
              >
                <img
                  src={provider.iconSrc}
                  alt={`${provider.name} logo`}
                  className="h-full w-full rounded-full object-contain p-0.5"
                  loading="lazy"
                />
              </div>
            ))}
          </div>

          Connect your templates with your providers
        </div>

        <h3 className="text-3xl text-black z-50">Let's craft something, Andre</h3>
        <ClientPromptBox />
      </div>
    </main>
  );
}
