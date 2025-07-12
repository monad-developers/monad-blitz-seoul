import React, { useState, useEffect } from "react";
import { Link } from "@inertiajs/react";

interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface PageProps {
  features: Feature[];
  hero_title: string;
  hero_highlight: string;
  subtitle: string;
  subtitle_highlight: string;
  cta_primary: string;
  cta_secondary: string;
}

const HomePage = (props: PageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-800 to-pink-800 relative">
      {/* Simple background decoration */}
      <div className="absolute inset-0 overflow-hidden opacity-50">
        <div className="absolute top-20 right-20 w-64 h-64 bg-purple-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-pink-400 rounded-full blur-3xl"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <div
          className={`transition-all duration-700 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          {/* Main heading */}
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            {props.hero_title}
            <span className="block text-transparent bg-gradient-to-r from-pink-300 to-purple-300 bg-clip-text">
              {props.hero_highlight}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
            {props.subtitle}
            <span className="block mt-2 text-pink-200">
              {props.subtitle_highlight}
            </span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/feed"
              className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              {props.cta_primary}
            </Link>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {props.features.map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/15 transition-all duration-300"
              >
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-300 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
