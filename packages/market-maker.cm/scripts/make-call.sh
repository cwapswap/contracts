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
const modifiedYamlContent = yamlContent.replace(/__CWEB_CONTRACT_SELF_REFERENCE__/g, '3c246eff905d93d89484e692799926205d31c9618a5cae2377d5cd758d598242');

console.log(modifiedYamlContent); // Output the modified YAML content
EOF
