export interface InstagramConfig {
  content_pillars: string[];
  visual_style: string;
  hashtag_count: number;
  auto_post_reels: boolean;
}

export const defaultConfig: InstagramConfig = {
  content_pillars: ["Reels & Shorts", "Product Showcases", "Behind The Scenes"],
  visual_style: "Aesthetic Minimalist",
  hashtag_count: 15,
  auto_post_reels: false,
};
