"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MarketplaceOpportunity } from "@/lib/contracts/marketplace";

interface Product {
  id: string;
  name: string;
  type: "service" | "product";
  category: "cleaning" | "battery" | "automation" | "ev";
  image: string;
  rating: number;
  reviews: number;
  price: string;
  priceModel: "starting" | "fixed";
  provider?: string;
  description: string;
  ctaText: string;
}

// Mock database for the startup real-world marketplace feel
const MARKETPLACE_DATABASE: Product[] = [
  {
    id: "prod_cleaning_1",
    name: "Panel Cleaning Service",
    type: "service",
    category: "cleaning",
    image: "https://images.unsplash.com/photo-1508514177221-188b1c422c54?auto=format&fit=crop&q=80&w=400&h=300",
    rating: 4.9,
    reviews: 128,
    price: "₪350",
    priceModel: "starting",
    provider: "Jerusalem, Israel",
    description: "Professional cleaning using deionized water to maximize yields.",
    ctaText: "Book Now"
  },
  {
    id: "prod_battery_sedg",
    name: "SolarEdge Battery 10kWh",
    type: "product",
    category: "battery",
    image: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&q=80&w=400&h=300",
    rating: 4.8,
    reviews: 89,
    price: "₪28,900",
    priceModel: "fixed",
    provider: "Official Partner",
    description: "Store excess energy for evening usage and increase self-consumption.",
    ctaText: "Get Quote"
  },
  {
    id: "prod_ev_wallbox",
    name: "Smart EV Charger",
    type: "product",
    category: "ev",
    image: "https://images.unsplash.com/photo-1664121689255-bfaad34a0209?auto=format&fit=crop&q=80&w=400&h=300",
    rating: 4.7,
    reviews: 56,
    price: "₪3,290",
    priceModel: "fixed",
    provider: "Wallbox Pulsar Plus",
    description: "Charge your EV using pure solar power during peak production hours.",
    ctaText: "Buy Now"
  },
  {
    id: "prod_shelly",
    name: "Smart Switch for Boiler",
    type: "product",
    category: "automation",
    image: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&q=80&w=400&h=300",
    rating: 4.8,
    reviews: 74,
    price: "₪490",
    priceModel: "fixed",
    provider: "Shelly Pro 1PM",
    description: "Automate your boiler to run strictly on solar export.",
    ctaText: "Buy Now"
  },
  {
    id: "prod_cleaning_robot",
    name: "Automatic Panel Cleaner",
    type: "product",
    category: "cleaning",
    image: "https://images.unsplash.com/photo-1621905252472-841f92e3428c?auto=format&fit=crop&q=80&w=400&h=300",
    rating: 4.6,
    reviews: 34,
    price: "₪2,900",
    priceModel: "starting",
    provider: "AI Solar Robot",
    description: "Set-and-forget robotic cleaner to ensure maximum output year round.",
    ctaText: "Get Quote"
  }
];

interface MarketplaceCarouselProps {
  opportunities: MarketplaceOpportunity[];
  siteId: string;
  accessToken?: string;
}

export function MarketplaceCarousel({ opportunities }: MarketplaceCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Determine which product categories to show based on AI Actions
  const activeCategories = new Set(opportunities.map(opp => opp.topic));
  
  // If no specific opportunities exist, show a general mix. Otherwise strictly filter.
  const displayProducts = activeCategories.size > 0 
    ? MARKETPLACE_DATABASE.filter(p => activeCategories.has(p.category))
    : MARKETPLACE_DATABASE;

  const scrollAction = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (displayProducts.length === 0) return null;

  return (
    <div className="mt-12">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Marketplace
          </h2>
          <p className="text-sm text-slate-400 mt-1">Verified professionals and products exactly matching your system needs</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors hidden sm:block">
            View All Marketplace
          </button>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => scrollAction('left')}
              className="h-8 w-8 rounded-full border border-slate-700 bg-slate-900 flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button 
              onClick={() => scrollAction('right')}
              className="h-8 w-8 rounded-full border border-slate-700 bg-slate-900 flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide snap-x"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {displayProducts.map(product => (
          <div 
            key={product.id} 
            className="flex-none w-[280px] sm:w-[320px] rounded-2xl border border-slate-800 bg-slate-950/50 overflow-hidden flex flex-col transition-all hover:border-slate-700 hover:bg-slate-900/80 snap-start"
          >
            <div className="h-40 w-full overflow-hidden bg-slate-900 relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={product.image} 
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
              <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-slate-300">
                {product.type === "service" ? "Service Provider" : "Hardware"}
              </div>
            </div>

            <div className="p-5 flex flex-col flex-1">
              <h3 className="font-bold text-slate-100 text-lg leading-tight mb-1">{product.name}</h3>
              {product.provider && (
                <p className="text-sm text-slate-500 mb-3">{product.provider}</p>
              )}
              
              <div className="flex items-center gap-4 text-xs font-medium mt-auto mb-4">
                <div className="flex items-center text-amber-500">
                  <Star className="h-3.5 w-3.5 fill-amber-500 mr-1" />
                  {product.rating} <span className="text-slate-500 ml-1">({product.reviews})</span>
                </div>
                <div className="flex items-center text-slate-300">
                  {product.priceModel === "starting" ? <span className="text-slate-500 mr-1">From</span> : ""}
                  {product.price}
                </div>
              </div>

              <Button className="w-full font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
                {product.ctaText}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
