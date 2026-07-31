import Image from "next/image";

export function AchievementsSection() {
  const partners = [
    "/home/partner/aws_logo.png",
    "/home/partner/figma_logo.png",
    "/home/partner/google.png",
    "/home/partner/meta.png",
    "/home/partner/microsoft.png",
    "/home/partner/salesforce_logo.png",
  ];

  const badges = [
    "/home/achievement/clutch1.png",
    "/home/achievement/clutch-2.svg",
    "/home/achievement/clutch-3.svg",
    "/home/achievement/clutch-4.svg",
  ];

  // Glow ring color per badge
  const badgeRings = [
    "ring-2 ring-yellow-400/40",
    "ring-2 ring-green-400/40",
    "ring-2 ring-blue-400/40",
    "ring-2 ring-purple-400/40",
  ];

  return (
    <section className="bg-[#f3f4f6] py-20 overflow-hidden">
      <div className="container mx-auto px-4">

        {/* ── Section label ── */}
        <p className="text-center text-xs sm:text-sm font-bold uppercase tracking-widest bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-3">
          Recognition
        </p>

        {/* ── Title ── */}
        <h2 className="text-center text-4xl font-bold text-slate-800">
          Our{" "}
          <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            Achievements
          </span>
        </h2>

        {/* ── Achievement badges ── */}
        <div className="mt-16 flex flex-wrap justify-center gap-10">
          {badges.map((src, index) => (
            <div
              key={index}
              className={`relative h-[200px] w-[200px] rounded-3xl bg-white shadow-sm ${badgeRings[index % badgeRings.length]} transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center justify-center`}
            >
              <Image
                src={src}
                alt="Achievement Badge"
                fill
                className="object-contain p-5"
                sizes="200px"
              />
            </div>
          ))}
        </div>

        {/* ── Partner With ── */}
        <p className="mt-24 text-center text-xs sm:text-sm font-bold uppercase tracking-widest bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent mb-3">
          Ecosystem
        </p>

        <h3 className="text-center text-3xl font-bold text-slate-800">
          Partner{" "}
          <span className="bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
            With
          </span>
        </h3>

        {/* Partner carousel */}
        <div className="mt-14 relative w-full overflow-hidden">
          {/* Fade masks */}
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-[#f3f4f6] to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-[#f3f4f6] to-transparent" />

          <div className="flex animate-scroll whitespace-nowrap">
            {[...partners, ...partners].map((src, index) => (
              <div
                key={index}
                className="relative mx-4 h-20 w-52 flex-shrink-0 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow flex items-center justify-center cursor-default"
              >
                <Image
                  src={src}
                  alt="Partner Logo"
                  fill
                  className="object-contain p-5"
                  sizes="208px"
                />
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
