# Jekyll Foundation

[![Build Status](https://travis-ci.org/core77/jekyll-foundation.svg)](https://travis-ci.org/core77/jekyll-foundation)
[![devDependencies](https://david-dm.org/core77/jekyll-foundation/dev-status.svg)](https://david-dm.org/core77/jekyll-foundation#info=devDependencies)
[![Join the chat at https://gitter.im/core77/jekyll-foundation](https://badges.gitter.im/core77/jekyll-foundation.svg)](https://gitter.im/core77/jekyll-foundation?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

This is a Jekyll project with Zurb Foundation 6 based off of [this starter project]( https://github.com/core77/jekyll-foundation).

It provides a [Gulp.js](http://gulpjs.com/) workflow with

- Browsersync (live reload and synchronised browser testing)
- Concatenation and minification of CSS and JavaScript files
- Asset management is done by Bower (and Composer if you need serverside libraries)  
- Deployment with rsync

# Required
Git  
Ruby and Ruby Gems  
Jekyll - gem install jekyll  
Bundler - gem install bundler (mac users may need sudo)  

NodeJS - use the installer  
GulpJS - npm install -g gulp (mac users may need sudo)  
Bower - npm install -g bower  

### Optional
Composer (installs PHPMailer)  
Make (used with rsync for deploying)

# Local Installation

Git clone this repository, or download it into a directory of your choice. Inside the directory run

1. `bower install` (reference: .bowerrc and bower.json)
2. `npm install` (reference: package.json)
3. `bundle install` (reference: Gemfile and Gemfile.lock)
4. `composer install` (optional, reference: composer.json and composer.lock)  

# Get Up and Running

### Build and Serve

- Run `npm start`  
  - This will build your Jekyll site, give you file watching, browser synchronization, auto-rebuild, CSS injecting, Sass sourcemaps etc.
  - The site will be built into the `_dest` folder.
- Go to: http://127.0.0.1.xip.io:3000
  - Here you can access your site. If you want to access it with your phone or tablet, use the external access address which is showing up in the terminal window.
- Go to: http://127.0.0.1.xip.io:3001
  - Here you can access the Browsersync UI.  

### Build for Production

- Run `npm run build`  
  - This builds your site for production, with minified CSS and JavaScript. Run this before you deploy your site!  

### Foundation for Sites Components

We don't want to include unused CSS or JavaScript.

```
Uncomment the components you want to use
1. Sass in _src/assets/scss/foundation/_foundation.scss  
2. JavaScript in /gulp/config.yml in javascript.src (you need to restart gulp)
```

Customize the variables used by Foundation in the settings file located in `_src/assets/scss/foundation/`.
Copy the default settings from the foundation-sites package (`_src/assets/vendor/foundation-sites/scss/settings/_settings.scss`) and then change them to your needs  

Place your custom sass in the subfolders of `_src/assets/scss/`. These folders follow the SMACSS architecture. This should be the most scalable solution - from small to very large sites.

### Deploy your site

Use gs-util to deploy site on Google Cloud Storage. Use the bucket www.includeos.org.

gsutil rsync -r ./ gs://www.includeos.org/

# Rsync is used here to sync our local `_dest` with the remote host. Adjust the SSH-USER, SSH-HOST and REMOTE-PATH in the Makefile.

# Be careful with these settings since rsync is set to delete the files on the remote path!

Deploy with
```
make deploy
```.

# Restrictions

### compress.html layout

Inline JavaScript can become broken where // comments used. Please remove the comments or change to /**/ style. compress.html Docs
