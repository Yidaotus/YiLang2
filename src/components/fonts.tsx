import { Global } from "@emotion/react";

const Fonts = () => (
	<Global
		styles={`
		/* outfit-300 - latin */
	@font-face {
	font-family: 'Outfit';
	font-style: normal;
	font-weight: 300;
	src: local(''),
		url('/fonts/outfit-v6-latin-300.woff2') format('woff2'), /* Chrome 26+, Opera 23+, Firefox 39+ */
		url('/fonts/outfit-v6-latin-300.woff') format('woff'); /* Chrome 6+, Firefox 3.6+, IE 9+, Safari 5.1+ */
	}
	/* outfit-regular - latin */
	@font-face {
	font-family: 'Outfit';
	font-style: normal;
	font-weight: 400;
	src: local(''),
		url('/fonts/outfit-v6-latin-regular.woff2') format('woff2'), /* Chrome 26+, Opera 23+, Firefox 39+ */
		url('/fonts/outfit-v6-latin-regular.woff') format('woff'); /* Chrome 6+, Firefox 3.6+, IE 9+, Safari 5.1+ */
	}
	/* outfit-500 - latin */
	@font-face {
	font-family: 'Outfit';
	font-style: normal;
	font-weight: 500;
	src: local(''),
		url('/fonts/outfit-v6-latin-500.woff2') format('woff2'), /* Chrome 26+, Opera 23+, Firefox 39+ */
		url('/fonts/outfit-v6-latin-500.woff') format('woff'); /* Chrome 6+, Firefox 3.6+, IE 9+, Safari 5.1+ */
	}
	/* outfit-600 - latin */
	@font-face {
	font-family: 'Outfit';
	font-style: normal;
	font-weight: 600;
	src: local(''),
		url('/fonts/outfit-v6-latin-600.woff2') format('woff2'), /* Chrome 26+, Opera 23+, Firefox 39+ */
		url('/fonts/outfit-v6-latin-600.woff') format('woff'); /* Chrome 6+, Firefox 3.6+, IE 9+, Safari 5.1+ */
	}
	/* outfit-700 - latin */
	@font-face {
	font-family: 'Outfit';
	font-style: normal;
	font-weight: 700;
	src: local(''),
		url('/fonts/outfit-v6-latin-700.woff2') format('woff2'), /* Chrome 26+, Opera 23+, Firefox 39+ */
		url('/fonts/outfit-v6-latin-700.woff') format('woff'); /* Chrome 6+, Firefox 3.6+, IE 9+, Safari 5.1+ */
	}	
	/* source-sans-3-regular - latin */
@font-face {
  font-family: 'Source Sans 3';
  font-style: normal;
  font-weight: 400;
  src: local(''),
       url('/fonts/source-sans-3-v8-latin-regular.woff2') format('woff2'), /* Chrome 26+, Opera 23+, Firefox 39+ */
       url('/fonts/source-sans-3-v8-latin-regular.woff') format('woff'); /* Chrome 6+, Firefox 3.6+, IE 9+, Safari 5.1+ */
}
/* source-sans-3-500 - latin */
@font-face {
  font-family: 'Source Sans 3';
  font-style: normal;
  font-weight: 500;
  src: local(''),
       url('/fonts/source-sans-3-v8-latin-500.woff2') format('woff2'), /* Chrome 26+, Opera 23+, Firefox 39+ */
       url('/fonts/source-sans-3-v8-latin-500.woff') format('woff'); /* Chrome 6+, Firefox 3.6+, IE 9+, Safari 5.1+ */
}
/* source-sans-3-600 - latin */
@font-face {
  font-family: 'Source Sans 3';
  font-style: normal;
  font-weight: 600;
  src: local(''),
       url('/fonts/source-sans-3-v8-latin-600.woff2') format('woff2'), /* Chrome 26+, Opera 23+, Firefox 39+ */
       url('/fonts/source-sans-3-v8-latin-600.woff') format('woff'); /* Chrome 6+, Firefox 3.6+, IE 9+, Safari 5.1+ */
}
/* source-sans-3-700 - latin */
@font-face {
  font-family: 'Source Sans 3';
  font-style: normal;
  font-weight: 700;
  src: local(''),
       url('/fonts/source-sans-3-v8-latin-700.woff2') format('woff2'), /* Chrome 26+, Opera 23+, Firefox 39+ */
       url('/fonts/source-sans-3-v8-latin-700.woff') format('woff'); /* Chrome 6+, Firefox 3.6+, IE 9+, Safari 5.1+ */
}
/* source-sans-3-800 - latin */
@font-face {
  font-family: 'Source Sans 3';
  font-style: normal;
  font-weight: 800;
  src: local(''),
       url('/fonts/source-sans-3-v8-latin-800.woff2') format('woff2'), /* Chrome 26+, Opera 23+, Firefox 39+ */
       url('/fonts/source-sans-3-v8-latin-800.woff') format('woff'); /* Chrome 6+, Firefox 3.6+, IE 9+, Safari 5.1+ */
}
/* source-sans-3-900 - latin */
@font-face {
  font-family: 'Source Sans 3';
  font-style: normal;
  font-weight: 900;
  src: local(''),
       url('/fonts/source-sans-3-v8-latin-900.woff2') format('woff2'), /* Chrome 26+, Opera 23+, Firefox 39+ */
       url('/fonts/source-sans-3-v8-latin-900.woff') format('woff'); /* Chrome 6+, Firefox 3.6+, IE 9+, Safari 5.1+ */
}
/* noto-sans-jp-regular - latin_japanese */
@font-face {
  font-family: 'Noto Sans JP';
  font-style: normal;
  font-weight: 400;
  src: local(''),
       url('/fonts/noto-sans-jp-v42-latin_japanese-regular.woff2') format('woff2'), /* Chrome 26+, Opera 23+, Firefox 39+ */
       url('/fonts/noto-sans-jp-v42-latin_japanese-regular.woff') format('woff'); /* Chrome 6+, Firefox 3.6+, IE 9+, Safari 5.1+ */
}
/* noto-sans-jp-500 - latin_japanese */
@font-face {
  font-family: 'Noto Sans JP';
  font-style: normal;
  font-weight: 500;
  src: local(''),
       url('/fonts/noto-sans-jp-v42-latin_japanese-500.woff2') format('woff2'), /* Chrome 26+, Opera 23+, Firefox 39+ */
       url('/fonts/noto-sans-jp-v42-latin_japanese-500.woff') format('woff'); /* Chrome 6+, Firefox 3.6+, IE 9+, Safari 5.1+ */
}
/* noto-sans-jp-700 - latin_japanese */
@font-face {
  font-family: 'Noto Sans JP';
  font-style: normal;
  font-weight: 700;
  src: local(''),
       url('/fonts/noto-sans-jp-v42-latin_japanese-700.woff2') format('woff2'), /* Chrome 26+, Opera 23+, Firefox 39+ */
       url('/fonts/noto-sans-jp-v42-latin_japanese-700.woff') format('woff'); /* Chrome 6+, Firefox 3.6+, IE 9+, Safari 5.1+ */
}
/* noto-sans-jp-900 - latin_japanese */
@font-face {
  font-family: 'Noto Sans JP';
  font-style: normal;
  font-weight: 900;
  src: local(''),
       url('/fonts/noto-sans-jp-v42-latin_japanese-900.woff2') format('woff2'), /* Chrome 26+, Opera 23+, Firefox 39+ */
       url('/fonts/noto-sans-jp-v42-latin_japanese-900.woff') format('woff'); /* Chrome 6+, Firefox 3.6+, IE 9+, Safari 5.1+ */
}
      `}
	/>
);

export default Fonts;
