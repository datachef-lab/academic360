import type { Config } from "tailwindcss";
import tailwindAnimate from "tailwindcss-animate";
import flattenColorPalette from "tailwindcss/lib/util/flattenColorPalette";

export default {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/modules/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        blue: {
          50: "rgb(var(--brandb-50) / <alpha-value>)",
          100: "rgb(var(--brandb-100) / <alpha-value>)",
          200: "rgb(var(--brandb-200) / <alpha-value>)",
          300: "rgb(var(--brandb-300) / <alpha-value>)",
          400: "rgb(var(--brandb-400) / <alpha-value>)",
          500: "rgb(var(--brandb-500) / <alpha-value>)",
          600: "rgb(var(--brandb-600) / <alpha-value>)",
          700: "rgb(var(--brandb-700) / <alpha-value>)",
          800: "rgb(var(--brandb-800) / <alpha-value>)",
          900: "rgb(var(--brandb-900) / <alpha-value>)",
          950: "rgb(var(--brandb-950) / <alpha-value>)",
        },
        violet: {
          50: "rgb(var(--brandv-50) / <alpha-value>)",
          100: "rgb(var(--brandv-100) / <alpha-value>)",
          200: "rgb(var(--brandv-200) / <alpha-value>)",
          300: "rgb(var(--brandv-300) / <alpha-value>)",
          400: "rgb(var(--brandv-400) / <alpha-value>)",
          500: "rgb(var(--brandv-500) / <alpha-value>)",
          600: "rgb(var(--brandv-600) / <alpha-value>)",
          700: "rgb(var(--brandv-700) / <alpha-value>)",
          800: "rgb(var(--brandv-800) / <alpha-value>)",
          900: "rgb(var(--brandv-900) / <alpha-value>)",
          950: "rgb(var(--brandv-950) / <alpha-value>)",
        },
        purple: {
          50: "rgb(var(--brand-50) / <alpha-value>)",
          100: "rgb(var(--brand-100) / <alpha-value>)",
          200: "rgb(var(--brand-200) / <alpha-value>)",
          300: "rgb(var(--brand-300) / <alpha-value>)",
          400: "rgb(var(--brand-400) / <alpha-value>)",
          500: "rgb(var(--brand-500) / <alpha-value>)",
          600: "rgb(var(--brand-600) / <alpha-value>)",
          700: "rgb(var(--brand-700) / <alpha-value>)",
          800: "rgb(var(--brand-800) / <alpha-value>)",
          900: "rgb(var(--brand-900) / <alpha-value>)",
          950: "rgb(var(--brand-950) / <alpha-value>)",
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        aurora: {
          "0%": {
            backgroundPosition: "0% 50%, 50% 50%",
          },
          "100%": {
            backgroundPosition: "100% 50%, 50% 50%",
          },
        },
        appear: {
          from: {
            opacity: "0",
          },
          to: {
            opacity: "1",
          },
        },
        slide: {
          from: {
            transform: "translateX(100%)",
          },
          to: {
            transform: "translateX(0%)",
          },
        },
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        appear: "appear 1s ease-in-out",
        slide: "slide 750ms ease-in-out",
        aurora: "aurora 20s linear infinite",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      backgroundImage: {
        "gradient-border": "linear-gradient(to right, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [tailwindAnimate, addVariablesForColors, require("tailwindcss-animate")],
} satisfies Config;

// This plugin adds each Tailwind color as a global CSS variable, e.g. var(--gray-200).
function addVariablesForColors({ addBase, theme }: any) {
  let allColors = flattenColorPalette(theme("colors"));
  let newVars = Object.fromEntries(
    Object.entries(allColors).map(([key, val]) => [`--${key}`, val]),
  );

  addBase({
    ":root": newVars,
  });
}
