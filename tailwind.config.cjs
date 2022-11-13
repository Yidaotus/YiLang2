/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {},
	},
	daisyui: {
		themes: [
			{
				light: {
					// eslint-disable-next-line @typescript-eslint/no-var-requires
					...require("daisyui/src/colors/themes")["[data-theme=pastel]"],
					"--rounded-btn": "0.5rem",
				},
			},
		],
	},
	plugins: [require("daisyui")],
};
