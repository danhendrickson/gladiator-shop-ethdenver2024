#!/bin/sh
GIT='git --git-dir='$PWD'/../.git'

TAG=$1
echo $TAG

# Write version to package.json
search='("version":[[:space:]]*").+(")'
replace="\1${TAG}\2"
sed -i ".json" -E "s/${search}/${replace}/g" "package.json"
rm "package.json.json"

# Write version to in-app JSON
echo "{\"tag\": \"$TAG\"}" > ./src/data/latest-tag.json

# Copy version tag to public dir
cp ./src/data/latest-tag.json ./public/latest-tag.json

# Copy release notes to public dir
cp ./src/data/release-notes.json ./public/release-notes.json

# Commit changes, push changes, and push tags 
GIT add ./package.json
GIT add ./src/data/latest-tag.json
GIT add ./src/data/release-notes.json
GIT add ./public/latest-tag.json
GIT add ./public/release-notes.json
GIT commit -m 'Version Bump'
GIT push
GIT tag -a $TAG -m "Latest Build"
GIT push origin $TAG
