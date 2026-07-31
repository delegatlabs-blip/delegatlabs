"use client";

import Image from "next/image";
import { testimonialsIntro, testimonials } from "@/data/testimonials";
import { SectionHeading } from "@/components/section-heading";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import { useSwiperStyles } from "@/components/swiper-styles";

// One star color per testimonial slot (cycles)
const STAR_GRADIENTS = [
  "from-yellow-400 to-orange-500",
  "from-green-500 to-emerald-500",
  "from-blue-500 to-cyan-500",
  "from-purple-500 to-indigo-500",
  "from-red-500 to-pink-500",
];

// Card accent colors per slot
const CARD_ACCENTS = [
  "border-t-4 border-yellow-400",
  "border-t-4 border-green-500",
  "border-t-4 border-blue-500",
  "border-t-4 border-purple-500",
  "border-t-4 border-red-500",
];

interface TestimonialsSectionProps {
  intro?: typeof testimonialsIntro;
  items?: typeof testimonials;
  maxItems?: number;
}

export function TestimonialsSection({
  intro = testimonialsIntro,
  items = testimonials,
  maxItems = 4,
}: TestimonialsSectionProps) {
  useSwiperStyles();
  const list = items.slice(0, maxItems);
  // Loop requires more slides than slidesPerView (max 2); need at least 5 for safe loop
  const canLoop = list.length >= 5;

  return (
    <section className="py-16 sm:py-20 lg:py-28 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section label */}
        <p className="text-xs sm:text-sm font-bold uppercase tracking-widest bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent">
          {intro.title}
        </p>

        <SectionHeading
          title={intro.sectionTitle}
          className="mt-2 text-2xl sm:text-3xl lg:text-4xl"
        />

        {/* Slider */}
        <div className="mt-10 sm:mt-14">
          <Swiper
            modules={[Autoplay]}
            spaceBetween={20}
            slidesPerView={1}
            loop={canLoop}
            autoplay={{ delay: 2500, disableOnInteraction: false }}
            breakpoints={{
              640: { slidesPerView: 1, spaceBetween: 20 },
              768: { slidesPerView: list.length >= 2 ? 2 : 1, spaceBetween: 24 },
              1280: { slidesPerView: list.length >= 2 ? 2 : 1, spaceBetween: 30 },
            }}
          >
            {list.map((t, i) => (
              <SwiperSlide key={t.id}>
                <div
                  data-type="image"
                  data-value={t.image || "/HeroSection.jpg"}
                  className={`bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-10 lg:p-12 h-full shadow-sm ${CARD_ACCENTS[i % CARD_ACCENTS.length]}`}
                >
                  <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 lg:gap-12">

                    {/* Left */}
                    <div className="flex flex-col items-center text-center w-full lg:w-1/3">
                      <div className="w-40 h-40 sm:w-48 sm:h-48 lg:w-52 lg:h-52 rounded-2xl overflow-hidden shadow-md bg-slate-50 flex items-center justify-center">
                        <Image
                          src={t.image || "/placeholder-avatar.png"}
                          alt={t.author}
                          width={208}
                          height={208}
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                      </div>

                      <h3 className="mt-5 text-lg sm:text-xl font-semibold text-slate-900">
                        {t.author}
                      </h3>
                      <p className="text-sm text-slate-500">{t.role}</p>
                    </div>

                    {/* Right */}
                    <div className="w-full lg:w-2/3">
                      <h4 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-slate-800">
                        {t.title}
                      </h4>

                      {/* Gradient stars */}
                      <div className="flex justify-center lg:justify-start gap-1 mt-4 text-lg sm:text-xl">
                        {Array.from({ length: t.rating }).map((_, si) => (
                          <span
                            key={si}
                            className={`bg-gradient-to-r ${STAR_GRADIENTS[i % STAR_GRADIENTS.length]} bg-clip-text text-transparent`}
                          >
                            ★
                          </span>
                        ))}
                      </div>

                      <p className="mt-5 text-base sm:text-lg leading-relaxed text-slate-600 text-center lg:text-left">
                        &ldquo;{t.quote}&rdquo;
                      </p>
                    </div>

                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
}
