/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			colors: {
				primary: {
					100: "#d3e5ec",
					200: "#a7cad9",
					300: "#7cb0c6",
					400: "#5095b3",
					500: "#247ba0",
					600: "#1d6280",
					700: "#164a60",
					800: "#0e3140",
					900: "#071920",
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
};
