# Internal theme gulp script

Goals:
* Watch all files and run gulp tasks appropriately depending on file changes. 
* Automatically deploy ONLY the 'build' files.

Build files:

* src/
	* All php files
	* I'm assuming all .txt files except the readme
	* All CSS files (style.css)
	* css/
		* bootstrap.min.css
		* main.min.css
	* fonts/**
	* images/**
	* inc/**
	* js/**
	* languages/
	* layouts/**
	* template-parts/**

Excluded files:

* src/
	* Gruntfile.js
	* grunt-settings.js
	* index.php.old
	* package.json
	* package-lock.json
	* README.md
	* readme.txt
	* css/
		* bootstrap.css
		* main.css
	* languages/
		* readme.txt
	* old/**
	* scss/**
	* sourceimage/**
	* sourcejs/**
	* node_modules/**

Does it matter if we push main.css and bootstrap.css? I dont think it does. Let's not over complicate the src.