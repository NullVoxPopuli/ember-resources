#!/bin/bash

node ./build.mjs

mv dist/functions dist/funcs  
find ./dist -type f -name '*.html' \
  | xargs sed -i.bak --regexp-extended 's:(href="[^"]+)functions/:\1funcs/:g' 
