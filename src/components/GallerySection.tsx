import { useState } from "react";
import { motion } from "framer-motion";
import { Lightbox, type GalleryImage } from "@/components/Lightbox";
import { Expand } from "lucide-react";

import screenshotChat from "@/assets/gallery/screenshot-chat.jpg";
import screenshotRoadmap from "@/assets/gallery/screenshot-roadmap.jpg";
import screenshotSchedule from "@/assets/gallery/screenshot-schedule.jpg";
import screenshotDashboard from "@/assets/gallery/screenshot-dashboard.jpg";

const galleryImages: GalleryImage[] = [
  { src: screenshotChat, alt: "AI Chat Interface", caption: "Chat với AI Mentor — nhận diện cảm xúc và đưa lời khuyên" },
  { src: screenshotRoadmap, alt: "Study Roadmap", caption: "Roadmap học tập — milestone và tiến độ rõ ràng" },
  { src: screenshotSchedule, alt: "Smart Schedule", caption: "Schedule & Analytics — quản lý task và thống kê" },
  { src: screenshotDashboard, alt: "Student Dashboard", caption: "Dashboard — tổng quan hiệu suất học tập" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

export default function GallerySection() {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <>
      <section id="gallery" className="py-24 relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="text-xs font-medium text-primary uppercase tracking-widest">Screenshots</span>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mt-3 mb-4">
              Giao diện <span className="gradient-text">thực tế</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Khám phá các màn hình chính của NeuroPlan AI — click để xem chi tiết.
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {galleryImages.map((img, i) => (
              <motion.button
                key={i}
                variants={fadeUp}
                custom={i}
                onClick={() => openLightbox(i)}
                className="group relative rounded-2xl overflow-hidden glass-hover cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={`View ${img.alt}`}
              >
                {/* Blur placeholder background */}
                <div
                  className="absolute inset-0 scale-110 blur-xl opacity-40"
                  style={{ backgroundImage: `url(${img.src})`, backgroundSize: "cover", backgroundPosition: "center" }}
                />

                {/* Image */}
                <div className="relative">
                  <img
                    src={img.src}
                    alt={img.alt}
                    loading="lazy"
                    className="w-full aspect-video object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center backdrop-blur-sm border border-primary/30">
                      <Expand className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </div>

                {/* Caption */}
                <div className="p-3 relative">
                  <p className="text-sm text-foreground font-medium">{img.alt}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{img.caption}</p>
                </div>
              </motion.button>
            ))}
          </motion.div>
        </div>
      </section>

      <Lightbox
        images={galleryImages}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}
