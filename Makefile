all: run

install:
	npm install
	bower install

dobuild:
	NODE_ENV=production gulp build

test:
	gulp test

run:
	gulp