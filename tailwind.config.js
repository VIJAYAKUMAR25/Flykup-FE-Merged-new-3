/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // primaryWhite: "#fffffe",
        primaryNavy: "#272343",
        lightNavy: "#2d334a",
        secondaryGreen: "#e3f6f5",
        darkOrange: "#FF8C00",
        // yellow: "#FBBD23",
        whiteYellow: "#FEF9C3",
        Grey: "#1F2937",
        primaryBlack: "#16161a",
        lightYellow: "#fbdd74",
        primaryYellow: "#fbdd74",
        streamBlue: "#3498db",
        liveRed: "#e74c3c",
        productGreen: "#2ecc71",
        primaryWhite: "#ffffee",
        lightBlack: "rgba(255, 255, 255, 0.1)",
        inputYellow: "#F0F7FF",
        newYellow: 'rgba(247, 206, 69, 1)',
        newBlack: '#16171B',
        newWhite: '#F5F5F5',


        blackLight:"rgba(30, 30, 30, 1)",
        blackDark:"rgba(0, 0, 0, 1)",
        whiteLight:"rgba(250, 250, 250, 1)",
        whiteHalf:"rgba(250, 250, 250, .62)",
        whiteSecondary:"rgba(250, 250, 250, 0.42)",
        greenLight:"#22C55E",
        greyLight:"#404040",
        greyDark:"#2a2a2a",
        yellowHalf:"rgba(48, 45, 35, 1)",
        

      },
      fontFamily: {
        sans: ["Inter", "system-ui", "Avenir", "Helvetica", "Arial", "sans-serif"],
        display: ["Poppins", "system-ui", "sans-serif"],
        montserrat: ["Montserrat", "sans-serif"],
        // Add individual fonts:
        roboto: ["Roboto", "sans-serif"],
        openSans: ["Open Sans", "sans-serif"],
        poppins: ["Poppins", "sans-serif"],
        lato: ["Lato", "sans-serif"],
        oswald: ["Oswald", "sans-serif"],
        raleway: ["Raleway", "sans-serif"],
        merriweather: ["Merriweather", "serif"],
        playfair: ["Playfair Display", "serif"],
        sourceSans: ["Source Sans Pro", "sans-serif"],
        lora: ["LoRa", "serif"],
        notoSans: ["Noto Sans", "sans-serif"],
        nunito: ["Nunito", "sans-serif"],
        ptSerif: ["PT Serif", "serif"],
        rubik: ["Rubik", "sans-serif"],
        ubuntu: ["Ubuntu", "sans-serif"],
        workSans: ["Work Sans", "sans-serif"],
        barlow: ["Barlow", "sans-serif"],
        bitter: ["Bitter", "serif"],
        inter: ["Inter", "sans-serif"],
        muli: ["Muli", "sans-serif"],
        alegreya: ["Alegreya", "serif"],
        droidSerif: ["Droid Serif", "serif"],
      },
      backgroundImage: {
        navyGradiant: "linear-gradient(90deg, #a78bfa, #c026d3, #a78bfa)",
        // primaryYellow: "linear-gradient(to right, #E9C66D, #D49F31, #C18518)",
        primaryWhite: " linear-gradient(120deg, #fdfbfb 0%, #ebedee 100%)",
        secondaryWhite: 'linear-gradient(-180deg, rgba(255,255,255,0.50) 0%, rgba(0,0,0,0.50) 100%)',
         newGradiant:"  linear-gradient(180deg, rgba(126, 14, 2, 0.29) 0%, rgba(253, 209, 34, 0.29) 100%)",
         borderGradiant:" linear-gradient(105.55deg, rgba(255, 59, 48, 0) -58.34%, #F7CE45 111.85%)",

        // New gradient for live stream
        liveStreamGradient: "linear-gradient(135deg, #ff6b6b, #4ecdc4)",
        metallicGradient: "linear-gradient(270deg, #d4af37, #c0c0c0, #d4af37)", // Royal gold-silver-gold

      },
      screens: {
        "custom-md": "930px",
        "video-lg": "1200px",
        "mobile-sm": "375px",
      },
      boxShadow: {
        "product-hover": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        "stream-card": "0 4px 6px rgba(0, 0, 0, 0.1)",
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        marquee: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        'fade-in-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(10px)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)'
          },
        },
        "fadeIn": {
          "0%": { opacity: 0, transform: "translateY(10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" }
        },
        "fade-in": {
          "0%": { opacity: 0, transform: "translateY(-20px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        "pulse-live": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "pulse-live": "pulse-live 2s ease-in-out infinite",
        'fade-in-up': 'fade-in-up 0.3s ease-out',
        marquee: 'marquee 30s linear infinite',
        "fadeIn": "fadeIn 0.8s ease-out forwards",
        shimmer: "shimmer 6s ease-in-out infinite",

      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        "durai-dark": {
          "color-scheme": "dark",
          "primary": "oklch(82% 0.189 84.429)",
          "primary-content": "oklch(26% 0.079 36.259)",
          "secondary": "oklch(55% 0.163 48.998)",
          "secondary-content": "oklch(100% 0 0)",
          "accent": "oklch(76% 0.177 163.223)",
          "accent-content": "oklch(26% 0.051 172.552)",
          "neutral": "oklch(26% 0 0)",
          "neutral-content": "oklch(98% 0 0)",
          "base-100": "oklch(14% 0 0)",
          "base-200": "oklch(20% 0 0)",
          "base-300": "oklch(26% 0 0)",
          "base-content": "oklch(97% 0 0)",
          "info": "oklch(68% 0.169 237.323)",
          "info-content": "oklch(98% 0.019 200.873)",
          "success": "oklch(72% 0.219 149.579)",
          "success-content": "oklch(98% 0.018 155.826)",
          "warning": "oklch(90% 0.182 98.111)",
          "warning-content": "oklch(0% 0 0)",
          "error": "oklch(63% 0.237 25.331)",
          "error-content": "oklch(97% 0.013 17.38)",
          "border-radius": "2rem",
          "--radius-selector": "2rem",
          "--radius-field": "2rem",
          "--radius-box": "2rem",
          "--size-selector": "0.25rem",
          "--size-field": "0.25rem",
          "--border": "1.5px",
          "--depth": "0",
          "--noise": "1",
        },
      },
      "light",
      "dark",
    ],
  },
};