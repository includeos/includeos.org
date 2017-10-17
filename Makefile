
# Full sync with remote
deploy:
	rm -rf _dest
	npm run build
	gsutil -m rsync -r _dest/ gs://www.includeos.org/

# Skip assets (most of the time is spent here)
partial: 
	gsutil -m rsync -r -x ^assets/ _dest/ gs://www.includeos.org/

rebuild:
	rm -r _dest
	npm run build

build:
	npm run build

install:
	bundle install
	npm install
	bower install
  # composer install
