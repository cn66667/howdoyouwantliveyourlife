import { Link } from "react-router-dom";
import { Seal } from "./Seal";

export function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-6 py-24 text-center">
      <Seal text="失" className="h-12 w-12 text-base" />
      <h1 className="mt-6 font-kai text-2xl tracking-[0.12em]">
        这一卷没有收进集子里
      </h1>
      <p className="mt-2 text-sm text-ink-faint">换一条路，或者回到卷首。</p>
      <Link to="/" className="btn-ghost mt-8">
        回到卷首
      </Link>
    </main>
  );
}
