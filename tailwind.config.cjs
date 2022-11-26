/** @type {import('tailwindcss').Config} */
const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
	content: ["./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			fontFamily: {
				sans: ["Noto Sans", ...defaultTheme.fontFamily.sans],
			},
			colors: {
				primary: {
					base: "#388ae5",
					light: "#add5d5",
					dark: "#2c7a7b",
					darker: "#285e61",
				},
				base: {
					100: "#fdfdfd",
					200: "#fbfbfb",
					300: "#f9f8fa",
					400: "#f7f6f8",
					500: "#f5f4f6",
					600: "#c4c3c5",
					700: "#939294",
					800: "#626262",
					900: "#313131",
				},
				contrast: {
					100: "#d9d9d9",
					200: "#b2b2b2",
					300: "#8c8c8c",
					400: "#656565",
					500: "#3f3f3f",
					600: "#323232",
					700: "#262626",
					800: "#191919",
					900: "#0d0d0d",
				},
			},
		},
	},
	plugins: [
		require("tailwind-scrollbar"),
		require("@tailwindcss/typography"),
		require("@tailwindcss/forms"),
	],
};
