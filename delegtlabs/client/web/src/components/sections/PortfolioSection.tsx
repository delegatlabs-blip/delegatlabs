"use client";

import Image from "next/image";
import { portfolioIntro, portfolioItems } from "@/data/portfolio";
import { SectionHeading } from "@/components/section-heading";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import { useSwiperStyles } from "@/components/swiper-styles";

interface PortfolioSectionProps {
  intro?: typeof portfolioIntro;
  items?: typeof portfolioItems;
  maxItems?: number;
  showHeader?: boolean;
}

export function PortfolioSection({
  intro = portfolioIntro,
  items = portfolioItems,
  maxItems = 6,
  showHeader = true,
}: PortfolioSectionProps) {
  useSwiperStyles();
  const list = items.slice(0, maxItems);
  // Duplicate slides so Swiper loop mode has enough items for smooth infinite scroll
  const loopList = list.length > 0 ? [...list, ...list, ...list] : list;

  return (
    <section id="portfolio" className="py-20 bg-white overflow-hidden scroll-mt-24">
      <div className="container mx-auto px-4">
        {showHeader && (
          <div className="mb-12">
            <p className="text-xs sm:text-sm font-bold uppercase tracking-widest bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent mb-2">
              {intro.title}
            </p>
            <SectionHeading title={intro.sectionTitle} className="mt-1" />
          </div>
        )}

        <Swiper
          modules={[Autoplay]}
          loop={true}
          freeMode={true}
          speed={2000} // controls smoothness (higher = smoother)
          autoplay={{
            delay: 0,
            disableOnInteraction: false,
          }}
          slidesPerView="auto"
          spaceBetween={24}
          grabCursor={false}
          allowTouchMove={false}
        >
          {loopList.map((item, idx) => (
            <SwiperSlide
              key={`${item.id}-${idx}`}
              className="!w-[300px]" // fixed width for smooth continuous scroll
            >
              <div
                data-type="image"
                data-value={item.image || "/HeroSection.jpg"}
                className="group block overflow-hidden rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition bg-white"
              >
                <div
                  className={`relative h-56 overflow-hidden flex items-center justify-center rounded-t-xl ${item.bgColor}`}
                >
                  {item.image && (
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-contain p-6 transition duration-500 group-hover:scale-105"
                    />
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-slate-900 group-hover:text-green-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {item.tags.join(", ")}
                  </p>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
