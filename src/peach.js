var Peach = (function()
{
	/*
	|--------------------------------------------------------------------------
	| Peach
	|--------------------------------------------------------------------------
	|
	| A Peach searches for the variables in a host element and binds a scope to it.
	|
	*/

	/**
	 * Create a new peach.
	 * 
	 * @param  {string}  baseKey
	 * @param  {HTMLElement}  host
	 * @param  {object}  scope
	 * @return {void}
	 */
	function Peach(baseKey, host, scope) 
	{
		if (isObject(baseKey)) {
			scope = host;
			host = baseKey;
			baseKey = '$peach';
		}

		parseHost(host, baseKey);

		return new Scope(scope, baseKey);
	}

	/**
	 * Fill the bucket with stuff.
	 * 
	 * @param  {HTMLElement}  host
	 * @param  {string}  baseKey
	 * @return {vobaseKey}
	 */
	function parseHost(host, baseKey) 
	{
		var regex = new RegExp('(.*?)' + escapeRegExp(baseKey) + '.([a-zA-Z0-9_\.]+)', 'g');

		host.querySelectorAll(':not(script)').forEach(function(el) 
		{
			getNonEmptyTextNodes(el).forEach(scanTextNodeForVariables);

			scanAttributesForVariables(el);
		});

		/**
		 * Scan a text node for appearing variables and split them up into their own node.
		 * 
		 * @param  {HTMLNode}  node
		 * @return {void}
		 */
		function scanTextNodeForVariables(node) 
		{
			var match, hasVar, newTextNodes = [];
			var content = node.textContent;

			while ((match = regex.exec(node.textContent))) {
				parseMatchedTextVariable(match);

				hasVar = true;
			}

			if (hasVar) {
				// If there is any content left, put it in its own text node.
				if (content) {
					newTextNodes.push(document.createTextNode(content));
				}

				newTextNodes.reverse().forEach(function(newNode) 
				{
					node.after(newNode);
				});

				node.remove();
			}

			/**
			 * Parse matched variables into new text nodes.
			 * 
			 * @param  {array}  match
			 * @return {void}
			 */
			function parseMatchedTextVariable(match) 
			{
				var staticText = match[1];
				var dynamicText = match[2];
				var key = makeKey(baseKey, dynamicText);

				content = content.replace(staticText, '');
				newTextNodes.push(document.createTextNode(staticText));
			
				var dynamicTextNode = document.createTextNode(dynamicText);
				content = content.replace(key, '');
				newTextNodes.push(dynamicTextNode);

				// Watch for changes on the variable that is mentioned in the text 
				// node and update the content of the node when it does.
				(new Watcher(key)).onChange(function(newValue) 
				{
					dynamicTextNode.textContent = newValue;
				});
			}
		}

		/**
		 * Scan a text node for appearing variables and split them up into their own node.
		 * 
		 * @param  {HTMLElement}  el
		 * @return {void}
		 */
		function scanAttributesForVariables(el)
		{
			for (var i = 0; i < el.attributes.length; i++) {
				var attribute = el.attributes[i];

				while ((match = regex.exec(attribute.nodeValue))) {
					var watcher = new Watcher(makeKey(baseKey, match[2]));

					// Update the attribute value when the value of the key changes.
					watcher.onChange(updateAttribute.bind(null, attribute));

					window.foobar = attribute;

					if (attribute.nodeName === 'value' && el.tagName === 'INPUT') {
						var event = 'change';

						switch (el.type) {
							case 'text':
							case 'email':
							case 'password':
								event = 'keyup';
								break;
						}

						el.addEventListener(event, triggerWatcherWithValue.bind(null, watcher, el));
					}
				}
			}
		}
	}

	/**
	 * Update an attribute with a value.
	 * 
	 * @param  {HTMLNode}  attribute
	 * @param  {mixed} value
	 * @return {void}
	 */
	function updateAttribute(attribute, value)
	{
		attribute.nodeValue = value;
	}

	/**
	 * Trigger a watcher with the value of an element.
	 * 
	 * @param  {Watcher}  watcher
	 * @param  {HTMLElement}  el
	 * @return {void}
	 */
	function triggerWatcherWithValue(watcher, el)
	{
		watcher.change(el.value);
	}

	/*
	|--------------------------------------------------------------------------
	| Scope
	|--------------------------------------------------------------------------
	|
	| A Scope sets up a piece of data so it can be tracked for changes.
	|
	*/

	/**
	 * Construct a new scope for data.
	 * 
	 * @param  {object}  data
	 * @param  {string}  key
	 */
	var Scope = function(data, key) 
	{
		var properties = {};
		var watcher = new Watcher(key);

		watcher.getChildWatchers().forEach(setupProperty);

		return data;

		/**
		 * Setup the property for a child key.
		 * 
		 * @param  {Watcher}  watcher
		 * @return {void}
		 */
		function setupProperty(watcher) 
		{
			var origValue = data[watcher.name];

			Object.defineProperty(data, watcher.name, {

				/**
				 * Get the value of a property.
				 * 
				 * @return {mixed}
				 */
				get: function() 
				{
					return properties[watcher.name];
				},

				/**
				 * Set the value of a property.
				 * 
				 * @param  {mixed}  value
				 * @return {void}
				 */
				set: function(value) 
				{
					if (isObject(value)) {
						value = new Scope(value, makeKey(key, watcher.name));
					}

					properties[watcher.name] = value;

					watcher.change(value);
				}
			});

			data[watcher.name] = origValue; // Triggers the setter.
		}
	};

	/*
	|--------------------------------------------------------------------------
	| WATCHER
	|--------------------------------------------------------------------------
	|
	| A Watcher handles communication involving the change of a value on a
	| scope key.
	|
	*/

	var Watcher = (function()
	{
		/**
		 * Instances are cached to prevent duplicate watching.
		 * 
		 * @type {Object}
		 */
		var cache = {};

		/**
		 * Construct a watcher for a key.
		 *
		 * @param  {string}  key
		 */
		var Watcher = function(key) 
		{
			if (cache[key]) return cache[key];
			cache[key] = this;

			var segments = key.split('.');

			this.key = key;
			this.name = segments.pop(); // Name is the last segment of the key.
			this.listeners = [];

			if (segments.length > 0) {
				this.parentWatcher = new Watcher(segments.join('.'));
			}
		};

		/**
		 * Register a callback for changes on the scope key.
		 * 
		 * @param  {Function}  callback
		 * @return {void}
		 */
		Watcher.prototype.onChange = function(callback) 
		{
			this.listeners.push(callback);

			if (this.parentWatcher) {
				this.parentWatcher.onChange(parentCallback.bind(null, callback));
			}
		};

		/**
		 * When the parent changes, determine the value of ourself and call the callback with it.
		 * 
		 * @param  {mixed}  value
		 * @return {void}
		 */
		function parentCallback(callback, value)
		{
			value = isObject(value) ? value[this.name] : undefined;

			callback(value);
		}

		/**
		 * Change the value of a scope key.
		 * 
		 * @param  {mixed}  value
		 * @return {void}
		 */
		Watcher.prototype.change = function(value) 
		{
			this.listeners.forEach(function(listener) 
			{ 
				listener(value); 
			});
		};

		/**
		 * Get the watcher for child keys.
		 * 
		 * @return {array}
		 */
		Watcher.prototype.getChildWatchers = function() 
		{
			var regex = new RegExp('^' + escapeRegExp(this.key) + '\\.[a-zA-Z0-9_]+$');
			var watchers = [];

			// Loop through all keys in the cache object and test a regular expression 
			// on it to see if it is a child key.
			for (var key in cache) {
				if (regex.test(key)) {
					watchers.push(cache[key]);
				}
			}

			return watchers;
		};

		return Watcher;
	})();

	/*
	|--------------------------------------------------------------------------
	| HELPERS
	|--------------------------------------------------------------------------
	|
	| Here we define helper functions to make programming easier.
	|
	*/

	/**
	 * Escape a string for usage in a regular expression.
	 * 
	 * @param  {string}  string
	 * @return {string}
	 */
	function escapeRegExp(string) 
	{
		return string.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
	}

	/**
	 * Determine if a value is an Object.
	 * 
	 * @param  {mixed}  value
	 * @return {boolean}
	 */
	function isObject(value) 
	{
		return typeof value === 'object' && value !== null;
	}

	/**
	 * Get all non-empty (skip linebreaks) text nodes from a host element.
	 * 
	 * @param  {HTMLElement}  host
	 * @return {array}
	 */
	function getNonEmptyTextNodes(host) 
	{
		return Array.prototype.filter.call(host.childNodes, function(node) 
		{
			return node.nodeType === 3 && ! node.textContent.match(/^[\s]*$/);
		});
	}

	/**
	 * Make a key.
	 * 
	 * @param  {string}  ...
	 * @return {string}
	 */
	function makeKey() 
	{
		var key = Array.prototype.join.call(arguments, '.');

		if ( ! /^[a-zA-Z0-9_\.\$]+$/.test(key)) {
			throw new Error(key + ' is not a valid identifier');
		}

		return key;
	}

	return Peach;
})();