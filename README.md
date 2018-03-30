# peachjs
Use javascript variables directly in your HTML.

## Installation

### Bower
`bower install peachjs`

### NPM
`npm install peachjs`

## Usage

### HTML
```html
<html>
<head>
	<title>Hello $peach.space</title>
</head>
<body>
	<h1>Hello $peach.space</h1>
	<input type="text" value="$peach.space" />

	<script src="/peachjs/dist/peach.min.js"></script>
</body>
</html>
```

### JavaScript
```javascript
var scope = { space: "world" };

Peach(document.documentElement, scope);
```

## Support

You can reach me via Twitter: @tsoffereins

Please file issues here at GitHub.