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

echo "Checking out gh-pages branch..."
git checkout gh-pages

# Record the last sync time (this also makes sure there is at least one change
# to add and commit (otherwise they may fail)
echo "Last sync $(date)" > last-sync.txt

echo "Adding files..."
git add -A .

echo "Updating dist files from master..."
git checkout master -- dist

echo "Committing files..."
git commit -m "Update gh-pages content $(date)"

echo "Pushing to gh-pages..."
git push origin gh-pages

echo "Going back to master..."
git checkout master
