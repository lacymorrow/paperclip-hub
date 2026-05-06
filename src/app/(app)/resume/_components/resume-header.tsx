import type { ResumeBasics } from "../_lib/resume-types";
import { Globe, Mail, Phone, Github, Linkedin, Twitter } from "lucide-react";

const NETWORK_ICONS: Record<string, typeof Globe> = {
  github: Github,
  linkedin: Linkedin,
  twitter: Twitter,
};

export function ResumeHeader({ basics }: { basics: ResumeBasics }) {
  return (
    <header className="mb-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">{basics.name}</h1>
          <p className="mt-1 text-lg text-muted-foreground">{basics.label}</p>
        </div>
        <div className="flex flex-col items-end gap-1 text-sm text-muted-foreground">
          <a
            href={`tel:${basics.phone}`}
            className="flex items-center gap-1.5 whitespace-nowrap hover:text-foreground"
          >
            <Phone className="h-3.5 w-3.5" />
            {basics.phone}
          </a>
          <a
            href={basics.url}
            className="flex items-center gap-1.5 hover:text-foreground"
          >
            <Globe className="h-3.5 w-3.5" />
            {basics.url.replace("http://", "")}
          </a>
          <a
            href={`mailto:${basics.email}`}
            className="flex items-center gap-1.5 hover:text-foreground"
          >
            <Mail className="h-3.5 w-3.5" />
            {basics.email}
          </a>
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        {basics.profiles.map((profile) => {
          const Icon =
            NETWORK_ICONS[profile.network.toLowerCase()] ?? Globe;
          return (
            <a
              key={profile.network}
              href={profile.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              <Icon className="h-4 w-4" />
            </a>
          );
        })}
      </div>

      <p className="mt-4 text-sm leading-relaxed whitespace-pre-line">
        {basics.summary.split("\n\n")[0]}
      </p>
    </header>
  );
}
