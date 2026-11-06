import { Outlet } from "react-router-dom";
import { Clapperboard, Heart, ShieldCheck, Sparkles } from "lucide-react";
import { Logo } from "../components/Logo";
import { Aurora } from "./Aurora";

const perks = [
  {
    icon: Clapperboard,
    title: "Upload in HD",
    text: "Share videos with drag-and-drop uploads.",
  },
  {
    icon: Heart,
    title: "Build a community",
    text: "Comments, likes, posts & subscriptions.",
  },
  {
    icon: Sparkles,
    title: "Creator studio",
    text: "Track views, likes and growth.",
  },
  {
    icon: ShieldCheck,
    title: "Secure by design",
    text: "Rotating JWT sessions & rate limiting.",
  },
];

export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col text-foreground">
      <Aurora />
      <header className="mx-auto flex h-20 w-full max-w-6xl items-center px-6">
        <Logo />
      </header>
      <div className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-4 pb-12 lg:grid-cols-2 lg:px-6">
        <div className="hidden animate-fade-up lg:block">
          <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight">
            Watch. Create.
            <br />
            <span className="text-gradient">Share your story.</span>
          </h1>
          <p className="mt-5 max-w-md text-lg text-muted-foreground">
            VideoTube is a home for creators — upload videos, grow an audience
            and connect with your community.
          </p>
          <div className="mt-10 grid max-w-lg grid-cols-2 gap-3">
            {perks.map(({ icon: Icon, title, text }) => (
              <div key={title} className="glass rounded-2xl p-4">
                <Icon className="mb-2 h-5 w-5 text-fuchsia-300" />
                <p className="text-sm font-semibold">{title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex animate-fade-up justify-center lg:justify-end">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
