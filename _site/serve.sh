#! /usr/bin/env bash

# See: https://help.github.com/articles/using-jekyll-with-pages/
#
# 1. Make sure Ruby is installed
# 2. Make sure bundler is installed (gem install bundler)
# 3. Create Gemfile with the following contents:
#
# source 'https://rubygems.org'
# gem 'github-pages'
#
# 4. Run the command below:

bundle exec jekyll serve
open http://localhost:4000
