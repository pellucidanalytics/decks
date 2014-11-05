#! /usr/bin/env bash

# Unoffical bash strict mode
set -euo pipefail
IFS=$'\n\t'

# cd to script directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Make sure we're on the master branch
if [ `git rev-parse --abbrev-ref HEAD` != "master" ]; then
  echo "Error: you must be on the master branch to sync gh-pages"
  exit 1
fi

echo "Adding dist files to master..."
git add -A .

echo "Committing dist files to master..."
git commit -m "Updating dist files for publish $(date)"

echo "Checking out gh-pages branch..."
git checkout gh-pages

echo "Updating dist files from master..."
git checkout master -- dist

# Record the last sync time (this also makes sure there is at least one change
# to add and commit (otherwise they may fail)
echo "Last sync $(date)" > last-sync.txt

echo "Adding files to gh-pages..."
git add -A .

echo "Committing files to gh-pages..."
git commit -m "Update gh-pages content $(date)"

echo "Pushing gh-pages to origin..."
git push origin gh-pages

echo "Going back to master..."
git checkout master

echo "Running npm version..."
# TODO: need to pass version string as argument to script
npm version prerelease

echo "Running npm publish..."
npm publish .

echo "Pushing master to origin (with tags)..."
git push --tags origin master
