import { ClientPromptBox } from "@/components/home/ClientPromptBox";
import { ProjectShowCase } from "@/components/home/project-show-case";

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
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-6 overflow-hidden px-4">
      <img
        src="/background-photo-3.webp"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-[115vh] w-full object-cover"
      />

      <div className="relative z-50 flex flex-col gap-4 h-[75vh] justify-center pt-36">
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

        <h3 className="z-50 text-3xl text-black">Let's craft something, Andre</h3>
        <div className="self-center">
          <ClientPromptBox />
        </div>
      </div>
      <ProjectShowCase />
    </main>
  );
}
