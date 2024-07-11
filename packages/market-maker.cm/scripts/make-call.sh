#!/bin/bash
#
set -euo pipefail

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT=$DIR/..

cd $ROOT

node > deploy/.calls-package.yaml <<EOF
const fs = require('fs');

const yamlFilePath = './deploy/calls.yaml.template';
const yamlContent = fs.readFileSync(yamlFilePath, 'utf8');
const modifiedYamlContent = yamlContent.replace(/__CWEB_CONTRACT_SELF_REFERENCE__/g, '6dd42c61b8f5115c8b93fb76f5bac362537f41f8c9188e2233304c604629f8d3');

console.log(modifiedYamlContent); // Output the modified YAML content
EOF
