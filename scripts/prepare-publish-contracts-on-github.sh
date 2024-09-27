#!/usr/bin/env bash

FILES=$(comm -23 \
  <(git ls-files | sort) \
  <(git ls-files | grep -v dapp-ui  | grep -v .env.production | sort))

git rm -- "$FILES"
