export class View {

    constructor(...args){
        this.instantiate(...args);
    }

	tag = "div";
	// capture = true; // this is set on View.prototype at end of file

	instantiate(...args){
		this.assign(...args);
		this.prerender();
		this.initialize();
	}

    assign(...args){
		return Object.assign(this, ...args);
	}

	initialize(){
		this.append(this.render);
	}

	render(){}

	prerender(){
		this.el = this.el || document.createElement(this.tag || "div");
		this.capture && View.captor && View.captor.append(this);
		this.classify && this.classify();
	}

	// add class
	ac(...args){
		for (const arg of args){
			arg && arg.split(" ").forEach(cls => this.el.classList.add(cls));
		}
		return this;
	}

	// remove class
	rc(...args){
		for (const arg of args){
			arg && arg.split(" ").forEach(cls => this.el.classList.remove(cls));
		}
		return this;
	}

	classify(){
		this.ac(this.classes); // probably a bad idea, this won't stay sync'd...

		var cls = this.constructor;

		while (cls !== View){
			this.ac(cls.name.replace("View", "").toLowerCase());
			cls = Object.getPrototypeOf(cls);
		}

		if (this.name)
			this.ac(this.name);
	}

	append(...args){
		for (const arg of args){
			if (arg && arg.el){
				arg.parent = this;
				this.el.appendChild(arg.el);
			} else if (is.fn(arg?.render)){
				this.append_fn(() => arg.render(this));
			} else if (is.pojo(arg)){
				this.append_pojo(arg);
			} else if (is.arr(arg)){
				this.append.apply(this, arg);
			} else if (is.fn(arg)){
				this.append_fn(arg);
			} else {
				// DOM, str, undefined, null, etc
				this.el.append(arg);
			}
		}
		return this;
	}

	prepend(...args){
		for (const arg of args){
			if (arg && arg.el){
				arg.parent = this;
				this.el.prepend(arg.el);
			} else if (is.pojo(arg)){
				this.prepend_pojo(arg);
			} else if (is.obj(arg)){
				console.error("maybe not");
			} else if (is.arr(arg)){
				this.prepend.apply(this, arg);
			} else if (is.fn(arg)){
				this.prepend_fn(arg);
			} else {
				// DOM, str, undefined, null, etc
				this.el.prepend(arg);
			}
		}
		return this;
	}

	append_fn(fn){
		View.set_captor(this);
		const return_value = fn.call(this, this);
		View.restore_captor();

		if (is.def(return_value))
			this.append(return_value);

		return this;
	}

	append_pojo(pojo){
		for (const prop in pojo){
			this.append_prop(prop, pojo[prop]);
		}
		
		return this;
	}

	append_prop(prop, value){
		var view;
		if (value && value.el){
			view = value;
		} else {
			view = (new View({ tag: this.tag })).append(value);
		}

		view.ac(prop).append_to(this);

		if (!this[prop]){
			this[prop] = view;
		} else {
			console.warn(`.${prop} property is already taken`);
		}

		return this;
	}

	append_to(view){
		if (is.dom(view)){
			view.appendChild(this.el);
		} else {
			view.append(this);
		}
		return this;
	}

	has_class(cls){
		return this.el.classList.contains(cls);
	}

	hc(cls){
		return this.has_class(cls);
	}

	toggle_class(cls){
		return this.has_class(cls) ? this.rc(cls) : this.ac(cls);
	}

	tc(cls){
		const classes = cls.split(" ");
		for (const clas of classes)
			this.toggle_class(clas);
		return this;
	}

	html(value){
		// set
		if (is.def(value) && value !== this.el.innerHTML){  
									// don't re-update, important for contenteditable change events
									// and losing focus upon re-update, etc.
									// does touching this.el.innerHTML cause a performance hit?
			this.el.innerHTML = value;
			return this;

		// get
		} else {
			return this.el.innerHTML
		}
	}

	text(value){
		// set
		if (is.def(value) && value !== this.el.textContent){ // see comment in html()
			this.el.textContent = value;
			return this;

		// get
		} else {
			return this.el.textContent;
		}
	}

	attr(name, value){
		// set
		if (is.def(value) && value !== this.el.getAttribute(name)){ // see comment in html()
			this.el.setAttribute(name, value);
			return this;

		// get
		} else {
			return this.el.getAttribute(name);
		}
	}

	click(cb){
		if (!cb) console.error("must provide a callback");
		return this.on("click", cb);
	}

	on(event, cb){
		this.el.addEventListener(event, (...args) => {
			cb.call(this, ...args);
		});

		return this;
	}

	off(event, cb){
		this.el.removeEventListener(event, cb);
		return this;
	}

	// this might mess up the normal capturing?
	// this would be called synchronously... it might work though
	// load(src){
	// 	set this as captor
	// 	const mod = await import(src);
	// 	console.log("loaded script", src, mod);
	// 	restor captor
	// }

	// returns index of self relative to parentNode.children
	index(){
		return Array.prototype.indexOf.call(this.el.parentNode.children, this.el);
	}

	insert(el, index){
		// can content be an array? can you not insert multiple?
		// maybe insert(index, ...content) is better?
		// but upgrading all inputs ("str", num, capturing fns, views, and elements)
		// to viable dom-worthy values is going to be tricky...
		if (el.el)
			el = el.el; // if you pass in a view

		if (index >= this.el.children.length){
			this.append(el);
		} else {
			this.el.insertBefore(el, this.el.children[index]);
		}

		return this;
	}

	empty(...args){
		this.el.innerHTML = "";
		this.append(...args);
		return this;
	}

	// inline styles
	style(prop, value){
		// set with object
		if (is.obj(prop)){
			for (var p in prop){
				this.style(p, prop[p]);
			}
			return this;

		// set with "prop", "value"
		} else if (prop && is.def(value)) {
			this.el.style[prop] = value;
			return this;

		// get with "prop"
		} else if (prop) {
			return this.el.style[prop];

		// get all
		} else if (!arguments.length){
			return this.el.style;
		} else {
			throw "whaaaat";
		}
	}
	hide(){
		this.el.style.display = "none";
		return this;
	}
	show(){
		this.el.style.display = "";
		return this;
	}
	// this doesn't work if css display: none is the starting point...
	toggle(){
		if (getComputedStyle(this.el).display === "none")
			return this.show();
		else {
			return this.hide();
		}
	}
	remove(){
		this.el.parentNode?.removeChild(this.el);
		return this;
	}

	replace(view){
		this.el.replaceWith(view.el ? view.el : view);
		return this;
	}

	buffer(){
		this._buffer_clone = this.el.cloneNode(true);
		this.el.replaceWith(this._buffer_clone);
		return this;
	}

	flush(){
		this._buffer_clone.replaceWith(this.el);
		delete this._buffer_clone;
		return this;
	}

	// this might be prone to recapturing
	clone(){
		return new this.constructor({
			el: this.el.cloneNode(true)
		});
	}

	static set_captor(view){
		View.previous_captors.push(View.captor);
		View.captor = view;
	}

	static restore_captor(){
		View.captor = View.previous_captors.pop();
	}

	static stylesheet(url){
		return new View({ tag: "link" }).attr("rel", "stylesheet").attr("href", url).append_to(document.head);
	}

	static elements(){
		const View = this;
		const fns = {
			el(tag, ...args){
				return new View({ tag }).append(...args);
			},
			div(){
				return new View().append(...arguments);
			}
		};

		fns.el.c = function(tag, classes, ...args){
			return new View({ tag }).ac(classes).append(...args);
		};

		fns.div.c = function(classes, ...args){
			return new View().ac(classes).append(...args);
		};

		["p", "h1", "h2", "h3"].forEach(tag => {
			fns[tag] = function(){
				return new View({ tag }).append(...arguments);
			};

			fns[tag].c = function(classes, ...args){
				return new View({ tag }).ac(classes).append(...args);
			};
		})

		return fns;
	}

	// setup body as captor
	static body(){
		if (View._body){
			return View._body;
		} else {
			View._body = new View({
				tag: "body",
				el: document.body,
				capture: false,
				init(){
					View.set_captor(this);
					return this;
				}
			});

			// View.set_captor(View._body); // this might backfire, if you're trying to get View.body() inside another view, for example..
			return View._body;
		}
	}
}

View.previous_captors = [];
View.prototype.capture = true;


export function icon(name){
	return el.c("span", "material-icons icon", name);
}

export const { el, div, p, h1, h2, h3 } = View.elements();


// App.stylesheet() in class definitions
// Maybe this should be View.stylesheet()?
// We might not want to import App for all the things...

export class App {

    constructor(...args){
        this.instantiate(...args);
    }

	instantiate(...args){
		this.assign(...args);
		this.initialize_app(); // 1
	}

    assign(...args){
		return Object.assign(this, ...args);
	}
	
	async initialize_app(){ // 1
		this.initialize_root(); // 2
		this.initialize_page(); // 3
		// this.loaders.push(this.initialize_page());
		await this.initialize_page(); // finish this first
		this.initialize(); // 4 ???
		await this.ready;
		this.inject(); // 6
	}

	initialize_root(){ // 2
		this.$body = View.body();
		this.$root = div().attr("id", "root"); //.append_to(this.$body);
		View.set_captor(this.$root);
	}
	
	async initialize_page(){ // 3
		// "/path/" -> "/path/page.js"
		// "/path/sub" -> "/path/sub.page.js"

		// previously: const mod = await import(App.path_to_page_url(window.location.pathname));
		
		var mod = import(App.path_to_page_url(window.location.pathname)); // !! mod is promise...
		// this.loaders.push(mod); // make sure app.inject() doesn't happen before page runs
			// wouldn't normally happen, but could, if all fonts/stylesheets are cached and load faster than the page
		mod = await mod; // !! mod becomes the module
		
		// after page is requested, we initialize the app
		// this requests all the styles+fonts+sockets+files
		// in the imported page, we (probably) import the app, which has a delayed export when its ready
		// by this point in this method, we must be ready?
		
		// the page.js can, but doesn't need to export a default
		this.page = mod.default;
		
		// render the page
		if (this.page){
			this.$root.append(this.page);
			// this.$root is not in the body yet
		}
	}

	initialize(){ // 4
		this.render();
	}
	
	render(){}

	// could app.ready fulfill before page runs, if all things are cached?
	// line 38-41 should fix this
	inject(){ // 6
        // inject root into body
        this.$body.append(this.$root);
	}



	// loads a predefined font (see Font class below)
	font(name){
		if (!Font.fonts[name])
			throw "Unknown font";

		if (Font.fonts[name].font){
			console.warn("font already loaded");	
			return;
		}

		const font = new Font(Font.fonts[name]);
		const loaded = font.load(); // promise
		this.loaders.push(loaded); // save the promise
		Font.fonts[name].font = font; // cache the font
		return loaded; // allow await app.font(...)
	}

	stylesheet(meta, url){
		return this.constructor.stylesheet(meta, url);
	}

	get ready() {
		return Promise.all(this.constructor.stylesheets.concat(this.loaders))
	}

	/**
	 * App.stylesheet("path/file.css")
	 * or
	 * App.stylesheet(import.meta, "path/file.css")
	 */
	static stylesheet(meta, url){
		if (is.str(meta)){ // stylesheet("/styles.css");
			url = meta;
		} else { // stylesheet(import.meta, "file.css");
			url = new URL(url, meta.url).pathname;
		}

		const prom = new Promise((res, rej) => {
			View.stylesheet(url).on("load", () => {
				res();
			});
		});
		
		this.stylesheets.push(prom);

		return prom;
	}

	static path_to_page_url(path){
		if (path.endsWith("/")){
			return path + "page.js";
		
		// "/sub" -> "/sub.page.js" or
		// "/path/sub" -> "/path/sub.page.js"
		} else {
			return path + ".page.js";
		}
	}
}

App.stylesheets = [];
App.prototype.loaders = [];

class Font {
    constructor(){
        this.fontface = new FontFace(this.name, `url(${this.url})`, this.options);
    }

	async load(){
		await this.fontface.load();
		document.fonts.add(this.fontface);
	}
}

Font.fonts = {
	Montserrat: {
		name: "Montserrat",
		url: "https://fonts.gstatic.com/s/montserrat/v30/JTUSjIg1_i6t8kCHKm459Wlhyw.woff2",
		options: {
			weight: '100 900'
		}
	},
	"Material Icons": {
		name: "Material Icons",
		url: "https://fonts.gstatic.com/s/materialicons/v143/flUhRq6tzZclQEJ-Vdg-IuiaDsNc.woff2",
		options: {
			style: "normal",
			weight: "400"
		}
	}
};

// this needs to be import.meta.resolve("framework.css") for it to work on a CDN
// App.stylesheet("/framework/framework.css");


export const is = {
	arr: function(value){
		return Array.isArray(value);
	},
	obj: function(value){
		return typeof value === "object" && !is.arr(value);
	},
	dom: function(value){
		return value && value.nodeType > 0;
	},
	el: function(value){
		return value && value.nodeType === 1;
	},
	str: function(value){
		return typeof value === "string";
	},
	num: function(value){
		return typeof value === "number";
	},
	bool: function(value){
		return typeof value === 'boolean';
	},
	fn: function(value){
		return typeof value === 'function';
	},
	def: function(value){
		return typeof value !== 'undefined';
	},
	undef: function(value){
		return typeof value === 'undefined';
	},
	pojo: function(value){
		return is.obj(value) && value.constructor === Object;
	},
	proto: function(value){
		return is.obj(value) && value.constructor && value.constructor.prototype === value;
	},
	class(value){
		return typeof value === 'function' && typeof value.prototype === 'object';
	},
	mobile(){
    	return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop|Mobile/i.test(navigator.userAgent);
	},
	promise(obj){
		return !!obj && typeof obj.then === 'function';
	}
};