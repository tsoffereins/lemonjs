# staplerjs
Use javascript variables directly in your HTML.

## Installation

### Bower
`bower install staplerjs`

### NPM
`npm install staplerjs`

## Usage

### HTML
```html
<html>
<head>
	<title>Hello $stapler.space</title>
</head>
<body>
	<h1>Hello $stapler.space</h1>
	<input type="text" value="$stapler.space" />

	<script src="/staplerjs/dist/stapler.min.js"></script>
</body>
</html>
```

### JavaScript
```javascript
var scope = { space: "world" };

Stapler(document.documentElement, scope);
```

## Support

You can reach me via Twitter: @tsoffereins

Please file issues here at GitHub.