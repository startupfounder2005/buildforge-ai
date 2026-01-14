import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ObsidianLogo } from "@/components/ui/ObsidianLogo";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#0A0A0A] to-black text-foreground relative overflow-hidden">
      {/* Subtle Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]pointer-events-none" />

      <main className="relative z-10 flex flex-col items-center gap-10 p-8 text-center sm:p-20">
        <div className="relative size-40 md:size-80 animate-in fade-in zoom-in duration-1000">
          <ObsidianLogo className="relative z-10 w-full h-full" />
        </div>

        <div className="space-y-4 max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white font-[family-name:var(--font-geist-sans)] drop-shadow-2xl">
            Obsidian <span className="text-gray-400 font-light">—</span> Unbreakable Construction Intelligence
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 mt-8">
          <Button asChild size="lg" className="h-12 px-8 text-base bg-[#0047AB] hover:bg-[#003580] text-white shadow-[0_0_20px_rgba(0,71,171,0.4)] hover:shadow-[0_0_30px_rgba(0,71,171,0.6)] transition-all">
            <Link href="/dashboard">Get Started</Link>
          </Button>
          <Button variant="outline" asChild size="lg" className="h-12 px-8 text-base border-white/20 hover:bg-white/10 hover:border-white/40 transition-all backdrop-blur-sm">
            <Link href="/auth/login">Login</Link>
          </Button>
        </div>
      </main>
      <footer className="relative z-10 p-8 text-sm text-muted-foreground/60">
        &copy; {new Date().getFullYear()} Obsidian. All rights reserved.
      </footer>
    </div>
  );
}
