export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  subcategory: string;
  description: string;
  rating: number;
  reviews: number;
}

export const products: Product[] = [
  {
    id: "1",
    name: "Rose Petal Wedding Cake",
    price: 189.99,
    image: "/src/assets/cake-wedding.jpg",
    category: "Cakes",
    subcategory: "Wedding Cakes",
    description: "An elegant three-tier wedding cake adorned with hand-crafted sugar roses and pearl details.",
    rating: 5,
    reviews: 48,
  },
  {
    id: "2",
    name: "Rainbow Sprinkle Birthday Cake",
    price: 59.99,
    image: "/src/assets/cake-birthday.jpg",
    category: "Cakes",
    subcategory: "Birthday Cakes",
    description: "A fun and colorful birthday cake loaded with rainbow sprinkles and buttercream frosting.",
    rating: 4.8,
    reviews: 124,
  },
  {
    id: "3",
    name: "Pink Ombré Custom Cake",
    price: 99.99,
    image: "/src/assets/cake-custom.jpg",
    category: "Cakes",
    subcategory: "Custom Cakes",
    description: "A stunning pink ombré cake with rose gold drip and handcrafted sugar flowers.",
    rating: 4.9,
    reviews: 67,
  },
  {
    id: "4",
    name: "Classic Red Velvet Slice",
    price: 8.99,
    image: "/src/assets/cake-redvelvet.jpg",
    category: "Desserts",
    subcategory: "Cake Slices",
    description: "Rich red velvet cake with silky cream cheese frosting. Pure indulgence in every bite.",
    rating: 4.7,
    reviews: 203,
  },
  {
    id: "5",
    name: "French Pastry Collection",
    price: 34.99,
    image: "/src/assets/pastries.jpg",
    category: "Pastries",
    subcategory: "Assorted",
    description: "A curated selection of freshly baked French croissants and mini pastries.",
    rating: 4.6,
    reviews: 89,
  },
  {
    id: "6",
    name: "Chocolate Raspberry Mousse",
    price: 12.99,
    image: "/src/assets/desserts.jpg",
    category: "Desserts",
    subcategory: "Mousse",
    description: "Decadent Belgian chocolate mousse topped with fresh raspberries and gold leaf.",
    rating: 4.9,
    reviews: 156,
  },
  {
    id: "7",
    name: "Pink Frosted Cupcake",
    price: 5.99,
    image: "/src/assets/cupcake-accent.png",
    category: "Pastries",
    subcategory: "Cupcakes",
    description: "A perfectly swirled pink buttercream cupcake with decorative sprinkles.",
    rating: 4.8,
    reviews: 312,
  },
  {
    id: "8",
    name: "Luxury Celebration Cake",
    price: 129.99,
    image: "/src/assets/cake-custom.jpg",
    category: "Cakes",
    subcategory: "Custom Cakes",
    description: "A bespoke celebration cake with fondant flowers and metallic accents.",
    rating: 5,
    reviews: 34,
  },
];

export const categories = ["All", "Cakes", "Pastries", "Desserts"];
export const subcategories: Record<string, string[]> = {
  Cakes: ["All", "Wedding Cakes", "Birthday Cakes", "Custom Cakes"],
  Pastries: ["All", "Cupcakes", "Assorted"],
  Desserts: ["All", "Cake Slices", "Mousse"],
};
