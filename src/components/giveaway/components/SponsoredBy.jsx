import React, { useState } from "react";
import SponsorLogo from '../assets/sponser_logo_bg.png';
import { MessageCircle } from "lucide-react"; // WhatsApp Icon
import { FaWhatsapp } from "react-icons/fa";

const SponsoredBy = ({ sponsors = [] }) => {
  // Default sponsors if none are provided
  const defaultSponsors = [
    {
      id: 1,
      name: "Delta Holidays",
      logo: SponsorLogo,
      website: "https://deltaaholidays.com/",
      tier: "platinum",
      phone1: "+917888538885",
      phone2: "+917888428881"
    },
  ];

  // Use provided sponsors or fall back to defaults
  const [displayedSponsors] = useState(sponsors.length > 0 ? sponsors : defaultSponsors);

  // Determine tier-based styling
  const getTierStyle = (tier) => {
    switch (tier) {
      case "platinum":
        return "border-purple-400 bg-purple-900 bg-opacity-30";
      case "gold":
        return "border-yellow-400 bg-yellow-900 bg-opacity-30";
      case "silver":
        return "border-gray-400 bg-gray-800 bg-opacity-30";
      case "bronze":
        return "border-orange-400 bg-orange-900 bg-opacity-30";
      default:
        return "border-blue-400 bg-blue-900 bg-opacity-30";
    }
  };

  return (
    <div className="mt-10 p-4 border-t border-gray-700 mx-auto">
      <h2 className="text-xl font-bold text-center mb-2">Sponsored By</h2>

      <div className="grid grid-cols-1 gap-4 my-5">
        {displayedSponsors.map((sponsor) => (
          <a
            key={sponsor.id}
            href={sponsor.website}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex flex-col items-center p-4 rounded-lg ${getTierStyle(sponsor.tier)}`}
          >
            <div className="flex items-center justify-center w-full mb-2">
              <span className="text-xl font-semibold">{sponsor.name}</span>
            </div>

            <div className="h-24 w-full flex items-center justify-center mb-3  transition-transform hover:scale-105">
              {sponsor.logo ? (
                <img
                  src={sponsor.logo}
                  alt={`${sponsor.name} logo`}
                  className="max-w-full h-20 object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/api/placeholder/200/100";
                  }}
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-gray-800 rounded">
                  <span className="text-xl font-bold">{sponsor.name}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col items-center justify-center w-full">
              <span className="text-lg font-semibold mb-1">Contact:</span>
              <div className="flex flex-col sm:flex-row gap-3 text-center items-center">
                <div className="flex items-center justify-center gap-1  transition-transform hover:scale-105">
                  <a
                    href={`https://api.whatsapp.com/send/?phone=${sponsor.phone1.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center h-8 w-auto px-4 gap-1 rounded-full bg-green-600 hover:bg-green-700 transition-colors duration-200"
                  >
                    <FaWhatsapp size={16} className="text-white" />
                    <span className="text-base">Sales & Support - 1</span>
                  </a>
                  {/* <span className="text-base">{sponsor.phone1}</span> */}
                </div>
                {sponsor.phone2 && (
                  <>
                    <span className="hidden sm:inline">|</span>
                    <div className="flex items-center justify-center gap-1  transition-transform hover:scale-105">
                      <a
                        href={`https://api.whatsapp.com/send/?phone=${sponsor.phone2.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center h-8 w-auto px-4 gap-1 rounded-full bg-green-600 hover:bg-green-700 transition-colors duration-200"
                      >
                        <FaWhatsapp size={16} className="text-white" />
                        <span className="text-base">Sales & Support - 2</span>
                      </a>
                      {/* <span className="text-base">{sponsor.phone2}</span> */}

                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="hidden mt-3 text-center">
              <span className="inline-block px-3 py-1 rounded-full text-xs capitalize"
                style={{
                  backgroundColor:
                    sponsor.tier === "platinum" ? "#9333ea" :
                      sponsor.tier === "gold" ? "#eab308" :
                        sponsor.tier === "silver" ? "#71717a" :
                          sponsor.tier === "bronze" ? "#c2410c" : "#1e3a8a"
                }}
              >
                {sponsor.tier} Sponsor
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default SponsoredBy;