# staplerjs
Use javascript variables directly in your HTML.

StaplerJS is NOT a templating engine that allows you to reuse HTML snippets and fill it with data. No, instead of taking the data as the source of the application it makes the view leading. Is it usefull? I have no idea! Let me know if you see any benefit.

## Installation

### Bower
`bower install staplerjs`

### NPM
`npm install staplerjs`

## Basic usage

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

scope.space = "room";
```

## Documentation

### Variables in HTML
A variable in your HTML is recognized by a scope name prefix. The default scope name is `$stapler`, but you can define your own as well (see Bind scope to HTML).

A variable as text content of an element can be used as follows:
```html
<h1>$stapler.title</h1>
<p>$stapler.post.content</p>
<footer>© tsoffereins $stapler.year</footer>
```

You can alse use a variable as the value of an attribute:
```html
<a href="$stapler.link">click me</h1>
```

Input-like elements also support two-way binding; for example:
```html
<input type="text" value="$stapler.title" />
```
This will print the value of `foo` in the input field, but will also update `foo` when t;he user changes the text.

### Scope
A scope is the base object you use to feed your HTML. This object can have nested objects and keys with any value except for array.
```javascript
var scope = { 
	title: "StaplerJS",
	blog: {
		content: "lorem ipsum dolor sit amet"
	},
	year: 2018,
	link: "dev.tsoffereins.com"
};
```

When a variable points to a function in the scope, this function is executed and the return value used in the view.
```javascript
var scope = { 
	title: function() {
		return "Stapler" + "JS";
	}
};
```

### Bind scope to HTML
A scope is bound to a piece of HTML using the Stapler function.
```javascript
Stapler(document.body, scope);
```

If you want a custom name for your scope (instead of `$stapler`), you can pass it as the first parameter; make sure it is not too common. The scope name is used in the regular expression to find matches in your html, special characters are escaped.
```javascript
Stapler('$myScope', document.body, scope);
```

### Changing the scope.
The scope variable is an object and therefor a reference, changing its contents will result in the view being updated with the new value.
```javascript
scope.title = "Anything";
```

```html
<h1>$stapler.title</h1> <!-- prints "Anything" -->
```
StaplerJS uses smart parsing when the scope is bound to the HTML; this means that only the nodes that contain the changed variable will be updated; it won't rerender anything else.

Since the view is in the lead, it does not matter if the data is absent. Whenever the data appears on the scope it will be used by the view again.
```javascript
scope.blog = null;
```
```html
<h1>$stapler.blog.content</h1> <!-- prints "" -->
```
```javascript
scope.blog = { content: "foo bar" };
```
```html
<h1>$stapler.blog.content</h1> <!-- prints "foo bar" -->
```

## Support

You can reach me via Twitter: @tsoffereins

Please file issues here at GitHub.