#!/usr/bin/env bash

# before push always create the build files
NODE_ENV=production gulp build
git commit -am "build files updated"

git push origin master --tags
git push -f origin origin/master:gh-pages