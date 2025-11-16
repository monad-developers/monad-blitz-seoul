import { GrantConsole } from "@/components/grant-tool/grant-console";

const Page = () => (
  <main className="min-h-screen w-full bg-gradient-to-b from-[#04080f] via-[#050a13] to-black text-white">
    <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.15),_transparent_50%)]" />
    <div className="relative z-10">
      <GrantConsole />
    </div>
  </main>
);

export default Page;
