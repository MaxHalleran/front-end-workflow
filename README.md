# Front end workflow 

## 7 - 1 Structure

* A directory containing the 7 folders with readme's

Articles:
* Guidelines to SCSS in general https://sass-guidelin.es/
* SASS Basics https://sass-lang.com/guide
* Structuring a project
	* http://thesassway.com/beginner/how-to-structure-a-sass-project
	* https://itnext.io/structuring-your-sass-projects-c8d41fa55ed4
* SASS documentation http://sassdoc.com/
	* SASS Doc w/ gulp http://sassdoc.com/gulp/

## New internal gulp script -- SCSS

We need an internal gulp script that compiles the CSS from SCSS, autoprefixes it, minifies it, adds the header on top and then updates the main.css file (should we have a main.min.css file and a main.css file?). 

kd-main.css

Our watch script will have to 

A) Watch .scss files for changes: 	Run style compilation then deploy
B) Watch all other files: 			Deploy

Considerations: Where should we store the scss folder structure? We could keep it inside src which makes sense as it's compiling into an adjacent file. We could also keep it distinct and outside of the src folder, 

## New internal gulp script -- js

## New internal deployment -- webpack



### Development flow

We have two folders set up in this project, the example-project project which will become our main template for custom website builds going forward and internal-gulp-project which will be the new gulp script. 

Example project should be pulling in internal-gulp-project as a dev-dependency. In example project we're testing out the new sass structure and the new gulp script. 

The gulp script should watch the SCSS files for changes and upon any changes, compile everything and deploy. It should also watch every other file and immediately deploy if it detects any changes. We should NOT be pushing any SCSS files to the site itself.

1. Let's set up the example project to be pulling the internal-gulp-project for now and connect it to a test site to see if we can get it to behave as desired.

Goal: have normal deploy behaviour.

CHECK

2. Exclude SASS files from deploy

CHECK

3. Watch SASS files, compile upon change and then deploy just the main.css file

CHECK 