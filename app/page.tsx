import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
      <main className="flex flex-col items-center gap-6 p-8 text-center sm:p-20">
        <div className="relative size-32 md:size-48">
          <img src="/logo.png" alt="Obsidian Logo" className="object-contain w-full h-full drop-shadow-[0_0_20px_rgba(0,71,171,0.5)]" />
        </div>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white font-[family-name:var(--font-geist-sans)]">
          Obsidian — Unbreakable Construction Intelligence
        </h1>

        <div className="flex gap-4">
          <Button asChild size="lg">
            <Link href="/dashboard">Get Started</Link>
          </Button>
          <Button variant="outline" asChild size="lg">
            <Link href="/auth/login">Login</Link>
          </Button>
        </div>
      </main>
      <footer className="p-8 text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Obsidian. All rights reserved.
      </footer>
    </div>
  );
}
