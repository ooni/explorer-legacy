#!/bin/bash
# Script used to deploy to heroku
set -e 

git branch -D deploy || echo "First deployment"
git checkout -b deploy
grunt build:production
git add -f client/dist/
git commit -m "Deploying to Heroku"
git push heroku -f deploy:master
git checkout master
