import Image from "next/image";

const logos = [
  "/home/client/airtable.png",
  "/home/client/omAnmol.jpg",
  "/home/client/frontier.png",
  "/home/client/discord.png",
  "/home/client/Cranes-24.jpg",
  "/home/client/google.png",
  "/home/client/reksoft.png",
  "/home/client/basecamp.png",
];

export function ClientsSection() {
  return (
    <section className="bg-white py-20 overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-16">

          {/* Left heading */}
          <div className="text-center lg:text-left shrink-0">
            <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-slate-500 mb-2">
              Trusted by
            </p>
            <h2 className="text-5xl md:text-6xl font-extrabold leading-none">
              <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                OUR
              </span>
              <br />
              <span className="bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                CLIENTS
              </span>
            </h2>
            {/* Decorative colored bar */}
            <div className="mt-4 flex gap-1.5 justify-center lg:justify-start">
              <span className="h-1.5 w-8 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500" />
              <span className="h-1.5 w-5 rounded-full bg-gradient-to-r from-green-500 to-emerald-500" />
              <span className="h-1.5 w-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" />
            </div>
          </div>

          {/* Carousel */}
          <div className="relative w-full overflow-hidden">
            {/* Fade masks */}
            <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-20 bg-gradient-to-r from-white to-transparent" />
            <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-20 bg-gradient-to-l from-white to-transparent" />

            <div className="flex w-max animate-scroll gap-14 hover:[animation-play-state:paused]">
              {[...logos, ...logos].map((src, index) => (
                <div
                  key={index}
                  className="relative h-16 w-40 flex-shrink-0 grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300"
                >
                  <Image
                    src={src}
                    alt="Client Logo"
                    fill
                    className="object-contain"
                    sizes="160px"
                  />
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
