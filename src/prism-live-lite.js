/**
 * 
 * 
 * based on source code from prism-live.js
 * dated 2021-07-27
 * 
 * Source Code: https://raw.githubusercontent.com/PrismJS/live/master/src/prism-live.js
 * 
 * Github: https://github.com/PrismJS/live
 * 
 * 
	Prism Live: Code editor based on Prism.js
	Works best in Chrome. Currently only very basic support in other browsers (no snippets, no shortcuts)
	@author Lea Verou


MIT License

Copyright (c) 2021 Prism Live

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


*/
 





(async function() {


	const Prism = window.Prism;

	const NO_REPLACEMENT = Symbol();

/**
 * 
 * based on source code from bliss.shy.js
 * dated 2021-07-27
 * 
 * Source Code: https://blissfuljs.com/bliss.shy.js
 * 
 * GitHub: https://github.com/LeaVerou/bliss

The MIT License (MIT)

Copyright (c) 2015 Lea Verou

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


 * 
 */
	// extracted coding from bliss.shy.js //
	
const setProps= {

	// Set the contents as a string, an element, an object to create an element or an array of these
	contents: function (val) {
		if (val || val === 0) {
			(Array.isArray(val)? val : [val]).forEach(function (child) {
				var type = typeof child;

				if (/^(string|number)$/.test(type)) {
					child = document.createTextNode(child + "");
				}

				if (child instanceof Node) {
					this.appendChild(child);
				}
			}, this);
		}
	},

	// Append the element inside another element
	inside: function (element) {
		element && element.appendChild(this);
	},

	// Insert the element before another element
	before: function (element) {
		element && element.parentNode.insertBefore(this, element);
	},

	// Insert the element after another element
	after: function (element) {
		element && element.parentNode.insertBefore(this, element.nextSibling);
	},

	// Insert the element before another element's contents
	start: function (element) {
		element && element.insertBefore(this, element.firstChild);
	},

	// Wrap the element around another element
	around: function (element) {
		if (element && element.parentNode) {
			element && element.parentNode.insertBefore(this, element);
		}

		this.appendChild(element);
	}
};

function domCreate (tag, o) {

	let dom = document.createElement(tag);

	if(o){

		for(const key of Object.keys(o)){

			let value = o[key];
			if (key in setProps) {
				setProps[key].call(dom, value);
			}
			else if (key in dom) {
				dom[key] = value;
			}
			else {
				dom.setAttribute(key, value);
			}


		}
	}

	return dom;

	// return Bliss.set(document.createElement(tag), o);
}

function domBind(dom, types){

	for(const type of Object.keys(types)){
		let fn = types[type];

		for(const t of type.split(/\s+/)){

			dom.addEventListener(t, fn, false)

		}		

	}

}

function domFire (dom, type) {
	var evt = document.createEvent("HTMLEvents");

	evt.initEvent(type, true, true );

	// Return the result of dispatching the event, so we
	// can know if `e.preventDefault` was called inside it
	return dom.dispatchEvent(evt);
	
}


/**
 * 
 * End of Bliss's coding
 * 
 * */



var ready = Promise.resolve();

var superKey = navigator.platform.indexOf("Mac") === 0? "metaKey" : "ctrlKey";

var PL = Prism.Live = class PrismLive {
	constructor(source) {
		this.source = source;
		this.sourceType = source.nodeName.toLowerCase();

		this.wrapper = domCreate("div", {
			className: "prism-live",
			around: this.source
		});

		if (this.sourceType === "textarea") {
			this.textarea = this.source;
			this.code = domCreate("code");

			this.pre = domCreate("pre", {
				className: this.textarea.className + " no-whitespace-normalization",
				contents: this.code,
				before: this.textarea
			});
		}
		else {
			this.pre = this.source;
			// Normalize once, to fix indentation from markup and then remove normalization
			// so we can enter blank lines etc

			// Prism.plugins.NormalizeWhitespace.normalize($("code", this.pre), {});
			this.pre.classList.add("no-whitespace-normalization");
			this.code = this.pre.querySelector("code");

			this.textarea = domCreate("textarea", {
				className: this.pre.className,
				value: this.pre.textContent,
				after: this.pre
			});
		}

		PL.all.set(this.textarea, this);
		PL.all.set(this.pre, this);
		PL.all.set(this.code, this);

		this.pre.classList.add("prism-live");
		this.textarea.classList.add("prism-live");
		this.source.classList.add("prism-live-source");

		if (self.Incrementable) {
			// TODO data-* attribute for modifier
			// TODO load dynamically if not present
			new Incrementable(this.textarea);
		}

		domBind(this.textarea, {
			"input": evt => this.update(false),

			"keyup": evt => {
				if (evt.key == "Enter") { // Enter
					// Maintain indent on line breaks
					PL._update_delayed=PL._update_delayed.then(()=>new Promise(update_resolve=>{
							this.insert(this.currentIndent);
							this.syncScroll();
							update_resolve();
					}))
				}
			},

			"keydown": evt => {
				if (evt.key == "Tab" && !evt.altKey) {
					// Default is to move focus off the textarea
					// this is never desirable in an editor
					evt.preventDefault();

					if (this.tabstops && this.tabstops.length > 0) {
						// We have tabstops to go
						this.moveCaret(this.tabstops.shift());
					}
					else if (this.hasSelection) {
						var before = this.beforeCaret("\n");
						var outdent = evt.shiftKey;

						this.selectionStart -= before.length;

						var selection = PL.adjustIndentation(this.selection, {
							relative: true,
							indentation: outdent? -1 : 1
						});

						this.replace(selection);

						if (outdent) {
							var indentStart = PL.regexp.gm`^${this.indent}`;
							var isBeforeIndented = indentStart.test(before);
							this.selectionStart += before.length + 1 - (outdent + isBeforeIndented);
						}
						else { // Indent
							var hasLineAbove = before.length == this.selectionStart;
							this.selectionStart += before.length + 1 + !hasLineAbove;
						}
					}
					else {
						// Nothing selected, expand snippet
						var selector = PL.match(this.beforeCaret(), /\S*$/);
						var snippetExpanded = this.expandSnippet(selector);

						if (snippetExpanded) {
							requestAnimationFrame(() => domFire(this.textarea, "input"));
						}
						else {
							this.insert(this.indent);
						}
					}
				}
				else if (PL.pairs[evt.key]) {
					var other = PL.pairs[evt.key];
					this.wrapSelection({
						before: evt.key,
						after: other,
						outside: true
					});
					evt.preventDefault();
				}
				else {
					for (let shortcut in PL.shortcuts) {
						if (PL.checkShortcut(shortcut, evt)) {
							PL.shortcuts[shortcut].call(this, evt);
							evt.preventDefault();
						}
					}
				}
			},

			"click": evt => {
				//var l = this.getLine();
				//var v = this.value;
				//var ss = this.selectionStart;
				//console.log(ss, v[ss], l, v.slice(l.start, l.end));
			},

			"click keyup": evt => {
				if (!evt.key || evt.key.lastIndexOf("Arrow") > -1) {
					// Caret moved
					this.tabstops = null;
				}
			}
		});

		// this.syncScroll();
		this.textarea.addEventListener("scroll", (evt)=>this.syncScroll(), {passive: true});

		domBind(window, {
			"resize": evt => this.syncStyles()
		});


		if(this.observer_resize_textarea){
			this.observer_resize_textarea.takeRecords();
			this.observer_resize_textarea.unobserve();
			this.observer_resize_textarea=null;
		}
		this.observer_resize_textarea=new ResizeObserver(entries=>{
			if(entries[0].target == this.textarea) this.updateScrollBarVar();
		});
		this.observer_resize_textarea.observe(this.textarea)


		// Copy styles with a delay
		requestAnimationFrame(() => {
			this.syncStyles();

			var sourceCS = getComputedStyle(this.source);

			this.pre.style.height = this.source.style.height || sourceCS.getPropertyValue("--height");
			this.pre.style.maxHeight = this.source.style.maxHeight || sourceCS.getPropertyValue("--max-height");
		});

		this.update();
		this.lang = (this.code.className.match(/lang(?:uage)?-(\w+)/i) || [,])[1];

		this.observer = new MutationObserver(r => {
			if (document.activeElement !== this.textarea) {
				this.textarea.value = this.pre.textContent;
			}
		});

		this.observe();

		this.source.dispatchEvent(new CustomEvent("prism-live-init", {bubbles: true, detail: this}));
	}

	observe () {
		return this.observer && this.observer.observe(this.pre, {
			childList: true,
			subtree: true,
			characterData: true
		});
	}

	unobserve () {
		if (this.observer) {
			this.observer.takeRecords();
			this.observer.disconnect();
		}
	}

	expandSnippet(text) {
		if (!text) {
			return false;
		}

		var context = this.context;

		if (text in context.snippets || text in PL.snippets) {
			// Static Snippets
			var expansion = context.snippets[text] || PL.snippets[text];
		}
		else if (context.snippets.custom) {
			var expansion = context.snippets.custom.call(this, text);
		}

		if (expansion) {
			// Insert snippet
			var stops = [];
			var replacement = [];
			var str = expansion;
			var match;

			while (match = PL.CARET_INDICATOR.exec(str)) {
				stops.push(match.index + 1);
				replacement.push(str.slice(0, match.index + match[1].length));
				str = str.slice(match.index + match[0].length);
				PL.CARET_INDICATOR.lastIndex = 0;
			}

			replacement.push(str);
			replacement = replacement.join("");

			if (stops.length > 0) {
				// make first stop relative to end, all others relative to previous stop
				stops[0] -= replacement.length;
			}

			this.delete(text);
			this.insert(replacement, {matchIndentation: true});
			this.tabstops = stops;
			this.moveCaret(this.tabstops.shift());
		}

		return !!expansion;
	}

	get selectionStart() {
		return this.textarea.selectionStart;
	}
	set selectionStart(v) {
		this.textarea.selectionStart = v;
	}

	get selectionEnd() {
		return this.textarea.selectionEnd;
	}
	set selectionEnd(v) {
		this.textarea.selectionEnd = v;
	}

	get hasSelection() {
		return this.selectionStart != this.selectionEnd;
	}

	get selection() {
		return this.value.slice(this.selectionStart, this.selectionEnd);
	}

	get value() {
		return this.textarea.value;
	}
	set value(v) {
		if(this.textarea.value!==v)
		this.textarea.value = v;
	}

	get indent() {
		return PL.match(this.value, /^[\t ]+/m, PL.DEFAULT_INDENT);
	}

	get currentIndent() {
		var before = this.value.substring(0, this.selectionStart-1);
		return PL.match(before, /^[\t ]*/mg, "", -1);
	}

	// Current language at caret position
	get currentLanguage() {
		var node = this.getNode();
		node = node? node.parentNode : this.code;
		var lang = PL.match(node.closest('[class*="language-"]').className, /language-(\w+)/, 1);
		return PL.aliases[lang] || lang;
	}

	// Get settings based on current language
	get context() {
		var lang = this.currentLanguage;
		return PL.languages[lang] || PL.languages.DEFAULT;
	}

	update () {
 

		let tf = ()=>{
			PL._update_delayed= PL._update_delayed.then(()=>new Promise(update_resolve=>{
				(async()=>{

					let baseCodeValue = this.textarea.value;
	
					var code = baseCodeValue;
	
					
	
					// If code ends in newline then browser "conveniently" trims it
					// but we want to see the new line we just inserted!
					// So we insert a zero-width space, which isn't trimmed
					if (/\n$/.test(this.value)) {
						code += "\u200b";
					}
					
					
					if(this.__last_update_code__ === code ) return update_resolve();

					
					this.__last_update_code__ = code;
	
					//console.log(1212)
	
	
	
					//await new Promise(setTimeout)
	
					let bCode = this.code;
	
	
					let isEU = false;



					//this.pre = null;
	
	
					let vCode =await new Promise(subtask=>{
	
	
						(async()=>{ 
	
							let vCode_P = bCode.parentNode.cloneNode(false), vCode = bCode.cloneNode(false);
							vCode_P.appendChild(vCode);
	
						vCode.__onPageCode__ = bCode;
						vCode.textContent = code;
						
						Prism.__effective_update_highlightedCode = null;
	
	
	
						await new Promise(requestAnimationFrame);
						if( baseCodeValue !== this.value) return update_resolve();
						
						this.unobserve();
						let _pre = this.pre, _code = this.code;
						this.pre = null;
						this.code = null;

						Prism.highlightElement(vCode, false);

						this.pre = _pre;
						this.code =_code;
						this.observe();


						delete vCode.__onPageCode__;

						if( baseCodeValue !== this.value) return update_resolve();
						await new Promise(requestAnimationFrame) 
						
						if( baseCodeValue !== this.value) return update_resolve();
						 
						if(Prism.__effective_update_highlightedCode===NO_REPLACEMENT){
							isEU=true;
							//console.log(1233)
						}
	
						subtask(vCode);
	
					})()
	
	
					})


	
					console.log(12121, this.value === this.code.textContent )

					
					if( baseCodeValue !== this.value) {
						
						this.observe();
						return update_resolve();
					}

					

					let isContentCorrect = this.value === this.code.textContent



					if(!isContentCorrect){


	
						this.unobserve();
						let _pre = this.pre, _code = this.code;
						this.pre = null;
						this.code = null;
	

						if(!isEU){

							//initial

							bCode.parentNode.replaceChild(vCode, bCode);
							this.code = vCode;

						}else{

							//exceptional case


							let vCode_P = bCode.parentNode.cloneNode(false), vCode = bCode.cloneNode(false);
							vCode_P.appendChild(vCode);
	
							delete vCode.__onPageCode__;
							vCode.textContent = this.value;
							
							Prism.__effective_update_highlightedCode = null;
	
							Prism.highlightElement(vCode, false);
	
							bCode.parentNode.replaceChild(vCode, bCode);
							this.code = vCode;

						}


						this.pre = _pre;
						//this.code =_code;
						this.observe();
						


					
					}
	
	
					update_resolve()
	
				})();
	
			}));
	
		};

		tf()

	}

	syncStyles() {
		// Copy pre metrics over to textarea
		var cs = getComputedStyle(this.pre);

		// Copy styles from <pre> to textarea
		this.textarea.style.caretColor = cs.color;

		var properties = /^(font|lineHeight)|[tT]abSize/gi;

		for (var prop in cs) {
			if (cs[prop] && prop in this.textarea.style && properties.test(prop)) {
				this.wrapper.style[prop] = cs[prop];
				this.textarea.style[prop] = this.pre.style[prop] = "inherit";
			}
		}
	
		// This is primarily for supporting the line-numbers plugin.
		this.textarea.style['padding-left'] = cs['padding-left'];

		this.update();
	}


	updateScrollBarVar(){
		
		let pre = this.pre;
		let styleElm = (pre.closest('div.prism-live')||pre);
		if(!styleElm) return;

		styleElm.style.setProperty('--prism-textarea-scrollbar-width',`${this.textarea.offsetHeight - this.textarea.clientHeight}px`);
		styleElm.style.setProperty('--prism-textarea-scrollbar-height',`${this.textarea.offsetHeight - this.textarea.clientHeight}px`);

	}

	syncScroll() {
		if (this.pre.clientWidth === 0 && this.pre.clientHeight === 0) {
			return;
		}
		//this.updateScrollBarVar();
		this.pre.scrollTop = this.textarea.scrollTop;
		this.pre.scrollLeft = this.textarea.scrollLeft;
	}

	beforeCaretIndex (until = "") {
		return this.value.lastIndexOf(until, this.selectionStart);
	}

	afterCaretIndex (until = "") {
		return this.value.indexOf(until, this.selectionEnd);
	}

	beforeCaret (until = "") {
		var index = this.beforeCaretIndex(until);

		if (index === -1 || !until) {
			index = 0;
		}

		return this.value.substring(index, this.selectionStart);
	}

	getLine(offset = this.selectionStart) {
		var value = this.value;
		var lf = "\n", cr = "\r";
		var start, end, char;

		for (var start = this.selectionStart; char = value[start]; start--) {
			if (char === lf || char === cr || !start) {
				break;
			}
		}

		for (var end = this.selectionStart; char = value[end]; end++) {
			if (char === lf || char === cr) {
				break;
			}
		}

		return {start, end};
	}

	afterCaret(until = "") {
		var index = this.afterCaretIndex(until);

		if (index === -1 || !until) {
			index = undefined;
		}

		return this.value.substring(this.selectionEnd, index);
	}

	setCaret(pos) {
		this.selectionStart = this.selectionEnd = pos;
	}

	moveCaret(chars) {
		if (chars) {
			this.setCaret(this.selectionEnd + chars);
		}
	}

	insert(text, {index} = {}) {
		if (!text) {
			return;
		}

		this.textarea.focus();

		if (index === undefined) {
			// No specified index, insert in current caret position
			this.replace(text);
		}
		else {
			// Specified index, first move caret there
			var start = this.selectionStart;
			var end = this.selectionEnd;

			this.selectionStart = this.selectionEnd = index;
			this.replace(text);

			this.selectionStart = start + (index < start? text.length : 0);
			this.selectionEnd = end + (index <= end? text.length : 0);
		}
	}

	// Replace currently selected text
	replace (text) {
		var hadSelection = this.hasSelection;

		this.insertText(text);

		if (hadSelection) {
			// By default inserText places the caret at the end, losing any selection
			// What we want instead is the replaced text to be selected
			this.selectionStart = this.selectionEnd - text.length;
		}
	}

	// Set text between indexes and restore caret position
	set (text, {start, end} = {}) {
		var ss = this.selectionStart;
		var se = this.selectionEnd;

		this.selectionStart = start;
		this.selectionEnd = end;

		this.insertText(text);

		this.selectionStart = ss;
		this.selectionEnd = se;
	}

	insertText (text) {
		if (!text) {
			return;
		}

		if (PL.supportsExecCommand === true) {
			document.execCommand("insertText", false, text);
		}
		else if (PL.supportsExecCommand === undefined) {
			// We still don't know if document.execCommand("insertText") is supported
			let value = this.value;

			document.execCommand("insertText", false, text);

			PL.supportsExecCommand = value !== this.value;
		}

		if (PL.supportsExecCommand === false) {
			this.textarea.setRangeText(text, this.selectionStart, this.selectionEnd, "end");
			requestAnimationFrame(() => this.update());
		}

		return PL.supportsExecCommand;
	}

	/**
	 * Wrap text with strings
	 * @param before {String} The text to insert before
	 * @param after {String} The text to insert after
	 * @param start {Number} Character offset
	 * @param end {Number} Character offset
	 */
	wrap ({before, after, start = this.selectionStart, end = this.selectionEnd} = {}) {
		var ss = this.selectionStart;
		var se = this.selectionEnd;
		var between = this.value.substring(start, end);

		this.set(before + between + after, {start, end});

		if (ss > start) {
			ss += before.length;
		}

		if (se > start) {
			se += before.length;
		}

		if (ss > end) {
			ss += after.length;
		}

		if (se > end) {
			se += after.length;
		}

		this.selectionStart = ss;
		this.selectionEnd = se;
	}

	wrapSelection (o = {}) {
		var hadSelection = this.hasSelection;

		this.replace(o.before + this.selection + o.after);

		if (hadSelection) {
			if (o.outside) {
				// Do not include new text in selection
				this.selectionStart += o.before.length;
				this.selectionEnd -= o.after.length;
			}
		}
		else {
			this.moveCaret(-o.after.length);
		}
	}

	toggleComment() {
		var comments = this.context.comments;

		// Are we inside a comment?
		var node = this.getNode();
		var commentNode = node.parentNode.closest(".token.comment");

		if (commentNode) {
			// Remove comment
			var start = this.getOffset(commentNode);
			var commentText = commentNode.textContent;

			if (comments.singleline && commentText.indexOf(comments.singleline) === 0) {
				var end = start + commentText.length;
				this.set(this.value.substring(start + comments.singleline.length, end), {start, end});
				this.moveCaret(-comments.singleline.length);
			}
			else {
				comments = comments.multiline || comments;
				var end = start + commentText.length - comments[1].length;
				this.set(this.value.substring(start + comments[0].length, end), {start, end: end + comments[1].length});
			}
		}
		else {
			// Not inside comment, add
			if (this.hasSelection) {
				comments = comments.multiline || comments;

				this.wrapSelection({
					before: comments[0],
					after: comments[1]
				});
			}
			else {
				// No selection, wrap line
				// FIXME *inside indent*
				comments = comments.singleline? [comments.singleline, ""] : comments.multiline || comments;
				end = this.afterCaretIndex("\n");
				this.wrap({
					before: comments[0],
					after: comments[1],
					start: this.beforeCaretIndex("\n") + 1,
					end: end < 0? this.value.length : end
				});
			}
		}
	}

	duplicateContent () {
		var before = this.beforeCaret("\n");
		var after = this.afterCaret("\n");
		var text = before + this.selection + after;

		this.insert(text, {index: this.selectionStart - before.length});
	}

	delete (characters, {forward, pos} = {}) {
		var i = characters = characters > 0? characters : (characters + "").length;

		if (pos) {
			var selectionStart = this.selectionStart;
			this.selectionStart = pos;
			this.selectionEnd = pos + this.selectionEnd - selectionStart;
		}

		while (i--) {
			document.execCommand(forward? "forwardDelete" : "delete");
		}

		if (pos) {
			// Restore caret
			this.selectionStart = selectionStart - characters;
			this.selectionEnd = this.selectionEnd - pos + this.selectionStart;
		}
	}

	/**
	 * Get the text node at a given chracter offset
	 */
	getNode(offset = this.selectionStart, container = this.code) {
		var node, sum = 0;
		var walk = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);

		while (node = walk.nextNode()) {
			sum += node.data.length;

			if (sum >= offset) {
				return node;
			}
		}

		// if here, offset is larger than maximum
		return null;
	}

	/**
	 * Get the character offset of a given node in the highlighted source
	 */
	getOffset(node) {
		var range = document.createRange();
		range.selectNodeContents(this.code);
		range.setEnd(node, 0);
		return range.toString().length;
	}

	// Utility method to get regex matches
	static match(str, regex, def, index = 0) {
		if (typeof def === "number" && arguments.length === 3) {
			index = def;
			def = undefined;
		}

		var match = str.match(regex);

		if (index < 0) {
			index = match.length + index;
		}

		return match? match[index] : def;
	}

	static checkShortcut(shortcut, evt) {
		return shortcut.trim().split(/\s*\+\s*/).every(key => {
			switch (key) {
				case "Cmd":   return evt[superKey];
				case "Ctrl":  return evt.ctrlKey;
				case "Shift": return evt.shiftKey;
				case "Alt":   return evt.altKey;
				default: return evt.key === key;
			}
		});
	}

	static matchIndentation(text, currentIndent) {
		// FIXME this assumes that text has no indentation of its own
		// to make this more generally useful beyond snippets, we should first
		// strip text's own indentation.
		text = text.replace(/\r?\n/g, "$&" + currentIndent);
	}

	static adjustIndentation(text, {indentation, relative = true, indent = PL.DEFAULT_INDENT}) {
		if (!relative) {
			// First strip min indentation
			var minIndent = text.match(PL.regexp.gm`^(${indent})+`).sort()[0];

			if (minIndent) {
				text.replace(PL.regexp.gm`^${minIndent}`, "");
			}
		}

		if (indentation < 0) {
			return text.replace(PL.regexp.gm`^${indent}`, "");
		}
		else if (indentation > 0) { // Indent
			return text.replace(/^/gm, indent);
		}
	}
};



// Static properties
Object.assign(PL, {
	all: new WeakMap(),
	ready,
	DEFAULT_INDENT: "\t",
	CARET_INDICATOR: /(^|[^\\])\$(\d+)/g,
	snippets: {
		"test": "Snippets work!",
	},
	pairs: {
		"(": ")",
		"[": "]",
		"{": "}",
		'"': '"',
		"'": "'",
		"`": "`"
	},
	shortcuts: {
		"Cmd + /": function() {
			this.toggleComment();
		},
		"Ctrl + Shift + D": function() {
			this.duplicateContent();
		}
	},
	languages: {
		DEFAULT: {
			comments: {
				multiline: ["/*", "*/"]
			},
			snippets: {}
		}
	},
	// Map of Prism language ids and their canonical name
	aliases: (() => {
		var ret = {};
		var canonical = new WeakMap(Object.entries(Prism.languages).map(x => x.reverse()).reverse());

		for (var id in Prism.languages) {
			var grammar = Prism.languages[id];

			if (typeof grammar !== "function") {
				ret[id] = canonical.get(grammar);
			}
		}

		return ret;
	})(),

	regexp: (() => {
		var escape = s => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
		var fnRegExp = (flags, strings, ...values) => {
			var pattern = strings[0] + values.map((v, i) => escape(v) + strings[i+1]).join("");
			return RegExp(pattern, flags);
		};
		var cache = {};

		return new Proxy(fnRegExp.bind(PL, ""), {
			get: (t, property) => {
				return t[property] || cache[property] || (cache[property] = fnRegExp.bind(PL, property));
			}
		});
	})(),

	_update_delayed: Promise.resolve()
});

PL.supportsExecCommand = document.execCommand? undefined : false;

Prism.hooks.add('before-insert', function(env){

	if(typeof Prism.__effective_update_highlightedCode=='string') env.highlightedCode = Prism.__effective_update_highlightedCode
	else if(Prism.__effective_update_highlightedCode==NO_REPLACEMENT) env.highlightCode = env.element.innerHTML ;


	if(Prism.__effective_update_highlightedCode==NO_REPLACEMENT){


		env.__element__ = env.element
		env.element={innerHTML:function(){}};


	}

	//env.highlightedCode
//console.log(444, env);

})


Prism.hooks.add('before-insert', function(env){

	if(
		env.__element__ ) env.element= env.__element__

})


let sTokens =new Map();
let sTokensU=0x1000;



function domBatchRemove(elements){

	let a= document.createDocumentFragment(); 
	a.textContent='x'; 
	a.firstChild.replaceWith(...elements)

	a.textContent='';
	a=null


}



function domBatchAdd(elements, parentNode, insertBefore){

	let a= document.createDocumentFragment(); 
	a.textContent='x'; 
	a.firstChild.replaceWith(...elements)

	parentNode.insertBefore(a, insertBefore);

	a=null;

}



Prism.hooks.add('before-tokenize', function(env){

	//console.log(555, env);
	
	})


	let isArray =(x)=>typeof x?.[Symbol.iterator] == 'function' && typeof x =='object';

	function tokensReplacement (tokens){


		if(!isArray(tokens)) return tokens;


		const Token = Prism.Token;
		let newTokens = [];
		for(var i=0;i<tokens.length;i++){

			let token = tokens[i]; 
			if (typeof token =='string'){


				tps=token.split(/((?:\r\n|\n\r|\r|\n)\u200b?)/)
 

				for(var j=0;j<tps.length;j++){

					if(j%2){
							newTokens.push(new Token('plain-newline',  tps[j], undefined, tps[j]));

					}else{

						if(tps[j]) newTokens.push(new Token('plain',  tps[j], undefined, tps[j]));

					}


				}

				
				//plain element could be with empty textnode
				//this prevents newline bug
				token = null;



			}else if(token instanceof Token && isArray(token.content)){
				token.content = tokensReplacement(token.content);
				
			}

			if(token) newTokens.push(token)



		}

		return newTokens;

	};

	class TLine extends Array{

		tokenize(){
			const Token = Prism.Token;

			const len=(x)=>{

				if(x instanceof Token) return x.length;
				else if(isArray(x)) return x.reduce((a,c)=>a+len(c),0);
				else if(typeof x =='string') return x.length;
				else return 0; 
			}
  

			return new Token("content-line", [...this], undefined , new Array( 1+ len(this) ).join() )
		}
	};

	let hl_workingOn = null;
	let previousTokenMap ={};


	let onWrap_sToken=(env)=>{

		let stringify = env.content;

		if(typeof stringify =='string'){
			
			if(!sTokens.has(stringify)) sTokens.set(stringify,++sTokensU);
			
			env.attributes['data-prism-stoken']= ""+sTokens.get(stringify)
		
		}



	}



	Prism.hooks.add('__effective_update__',function(env){


		const Token = Prism.Token;
 
		if(!env.__previousTokens__) return;
		if( !isArray(env.tokens) || !isArray(env.__previousTokens__)) return;

 

		let tokens_before=env.__previousTokens__

		let tokens_after=env.tokens
 

		let elm_code = env.__element__;


		
		let onPageCode = elm_code.__onPageCode__;
		if( !onPageCode ) return;

		let prevElements = [...onPageCode.childNodes].filter(elm=>elm.nodeType===1 && elm.hasAttribute('data-prism-stoken') );

 

		if(tokens_before.length != prevElements.length) return;
 

			let skipBefore = 0;
			let skipAfter = 0;


			let hashs_before, hashs_after;

			hashs_before= tokens_before.__tokens_stringify__.split('<&\u02A6\u00a0&>')
			hashs_after= tokens_after.__tokens_stringify__.split('<&\u02A6\u00a0&>')
 


			for(let i=0, l = Math.min(hashs_after.length, hashs_before.length);i<l;i++){

				if( hashs_before[i] === hashs_after[i] ) skipBefore++;
				else break;

			}

			minS=skipBefore;

			for(let i=0, l = Math.min(hashs_after.length, hashs_before.length)-skipBefore;i<l;i++){

				let j1 = hashs_before.length-1-i;
				let j2 = hashs_after.length-1-i;

				if( hashs_before[j1] === hashs_after[j2] ) skipAfter++;
				else break;

				

			}


			let u0=skipBefore; //>=0
			let u1=tokens_before.length-skipAfter-1;
			let v0=u0; //>=0; same as u0
			let v1= tokens_after.length-skipAfter-1;


			const log =()=>{
				console.log('!!before', `keep[0,${u0-1}]`, `change[${u0},${u1}]`, `keep[${u1+1},${tokens_before.length-1}]` );
				console.log('!!after', `keep[0,${v0-1}]`, `change[${v0},${v1}]`, `keep[${v1+1},${tokens_after.length-1}]` );
			} 

			log();


			
			if(u1<u0 && v1<v0) return;  // idenitical?

			let subTokens =  v1>=v0? tokens_after.slice(v0, v1+1): [];
			let afterElements_sub=[];


			if(subTokens.length>0){

				//console.log(223,subTokens)

				let html_subtokens=Token.stringify(Prism.util.encode(subTokens), env.language);


				let div=document.createElement('pesudo-element-holder'); // noscript, createDocumentFragment are not suitable for innerHTML
				div.innerHTML=html_subtokens;

				afterElements_sub = [...div.childNodes].filter(elm=>elm.nodeType===1 && elm.hasAttribute('data-prism-stoken') );

				if(afterElements_sub.length !== subTokens.length) return;

			}

 
			let prevElements_sub =  u1>=u0?prevElements.slice(u0,u1+1):[];

			//console.log('dd', prevElements_sub, afterElements_sub)

			let rNode = null, pNode;
			if(prevElements_sub.length>0){

				for(const s of prevElements_sub){
					if(rNode && rNode !=s.previousSibling){
						rNode = null;
						break;
					}
					rNode = s;
				}
				if(!rNode) return;

				pNode = rNode.parentNode;
				rNode=rNode.nextSibling;

			}else{

				let jdxInsertAfter = v0-1;
				if(jdxInsertAfter>=0){
					pNode = prevElements[jdxInsertAfter].parentNode;
					rNode = prevElements[jdxInsertAfter].nextSibling;
				}else{
					pNode = onPageCode;
					rNode = onPageCode.firstChild;
				}

			}

			//console.log('ee', prevElements_sub, afterElements_sub)
			if( prevElements_sub.includes( rNode)  ) return;


			//console.log('ff', prevElements_sub, afterElements_sub)


			Prism.__effective_update_highlightedCode=NO_REPLACEMENT


			env.__set_token_empty_to_skip_stringify__ =true;
 


			if(prevElements_sub.length===1){

				prevElements_sub[0].replaceWith(...afterElements_sub);

			}else if(pNode){

				domBatchRemove(prevElements_sub)
				domBatchAdd(afterElements_sub, pNode, rNode);
			}
 
let textarea = elm_code.__onPageCode__.parentNode.parentNode.querySelector('textarea')
if(textarea)

{

	//console.log( 12120, textarea.value , elm_code.__onPageCode__.textContent   )


	console.log( 12124, textarea.value === elm_code.__onPageCode__.textContent   )


	//console.log('g71',textarea.value)

	//console.log('g72',elm_code.__onPageCode__.textContent)

	//console.log('g73',JSON.parse(JSON.stringify(tokens_after)))
	//console.log('g74',JSON.parse(JSON.stringify(subTokens)))



}


	})

	Prism.hooks.add('before-highlight', function(env){

		hl_workingOn={
			element:env.element,
			code:env.code
		}

		Prism.__effective_update_highlightedCode=null;


	})


	// This is NOT a replacement of JSON.stringify
	// It is just a trick for tokens' comparision
	function tokensStringify(x, w){
		if(typeof x =='object' && x){
			let p =[];
			if(isArray(x)){
				for(const z of x) p.push(`[${ tokensStringify(z) }]`)
			}else{
				for(var k in x) p.push(`{"${k}": ${tokensStringify(x[k])}}`)
			}
			return p.join(w||', ')
		}
		return `${typeof x}"${x}"`;
	}

	Prism.hooks.add('after-tokenize', function(env){
	
		const Token = Prism.Token;

		env.tokens=tokensReplacement(env.tokens);

		Prism.hooks.run('after-tokenize-tokens-replacement', env)



		/*

		let lines =[new TLine];

		for(const token of env.tokens){
			
			if(token instanceof Token && token.type=='plain-newline'){

				lines[lines.length-1].push(token)
				lines.push(new TLine)
			}else{
				lines[lines.length-1].push(token)
			}
		}

		if(lines.length>1){

			for(var i =0; i<lines.length;i++){
				let line = lines[i];
				if(line instanceof TLine) lines[i]= line.tokenize()
			}

			env.tokens=lines;
		}

		
		Prism.hooks.run('after-tokenize-lines-replacement', env)

		*/



		env.tokens.__tokens_stringify__ = tokensStringify(env.tokens,'<&\u02A6\u00a0&>')

		
		Prism.hooks.run('after-tokenize-tokens-stringify', env)

		 if(typeof env.code =='string' && hl_workingOn && hl_workingOn.code === env.code && hl_workingOn.element && hl_workingOn.element.nodeType==1){
			let env_copy = Object.assign({},env);
			let elm_code = hl_workingOn.element
			env_copy.__element__ = elm_code
			if(!elm_code.hasAttribute('data-prism-code-uid')) elm_code.setAttribute('data-prism-code-uid',`${ ++sTokensU }`)
			env_copy.__previousTokens__ = previousTokenMap[ elm_code.getAttribute('data-prism-code-uid') ] ||null;
			Prism.hooks.run('__effective_update__', env_copy)
			previousTokenMap[ elm_code.getAttribute('data-prism-code-uid') ] =  env_copy.tokens;
			if(env_copy.__set_token_empty_to_skip_stringify__) env.tokens=[];
		}


		Prism.hooks.run('after-tokenize-completed', env)
		
		})

		Prism.hooks.add('wrap', function(env){

			if(env.type =='plain') env.tag='prism-plain';
			else if(env.type =='plain-newline') env.tag='prism-plain-newline';
			else if(env.type =='content-line') env.tag='prism-content-line';
			onWrap_sToken(env)
			
			})


function onReady(){
	for(const source of document.querySelectorAll(":not(.prism-live) > textarea.prism-live, :not(.prism-live) > pre.prism-live")){
		if (!PL.all.get(source)) {
			new PL(source);
		}
	};
}

if (document.readyState != 'loading') {
	onReady();
} else {
	window.addEventListener("DOMContentLoaded", onReady, false);
}

})();
