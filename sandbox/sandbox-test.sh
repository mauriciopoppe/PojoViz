#!/usr/bin/env bash

npm pack
mv pojoviz-*.tgz ./sandbox
cd sandbox
npm install pojoviz-*
node playground