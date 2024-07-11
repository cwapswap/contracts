#!/bin/bash
#
set -euo pipefail

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT=$DIR/..

cd $ROOT

node > dist/prepare.logs <<EOF
const fs = require('fs');
const yaml = require('js-yaml');
const writeYamlFile = require('write-yaml-file')

const package = require('./dist/out/package.json');

const { name } = package;

const yamlFilePath = './deploy/calls.yaml.template';
const yamlContent = fs.readFileSync(yamlFilePath, 'utf8');
const modifiedYamlContent = yamlContent.replace(/__CWEB_CONTRACT_SELF_REFERENCE__/g, name.substring(5));
let call_object = yaml.load(modifiedYamlContent);
writeYamlFile('deploy/calls.yaml', {calls: [call_object]}).then(() => {
  console.log('Prepare successfuly completed')
})
EOF
