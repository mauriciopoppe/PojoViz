#!/usr/bin/env bash

# before push always create the build files
gulp browserify
git commit -am "build files updated"

git push origin master --tags
git push -f origin origin/master:gh-pages