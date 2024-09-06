#!/usr/bin/env sh

set -x

# Check if API_ENDPOINT_DEVNET is not defined or empty
# It is possible that the API_ENDPOINT_DEVNET is defined within the devnet container for example
if [ -z "${API_ENDPOINT_DEVNET}" ]; then
    echo "#API_ENDPOINT_DEVNET=${API_ENDPOINT_DEVNET}" > .env.yarn.devnet
    echo "API_ENDPOINT_DEVNET=https://api-devnet.coinweb.io/wallet" >> .env.yarn.devnet
else
    echo "#API_ENDPOINT_DEVNET=https://api-devnet.coinweb.io/wallet" > .env.yarn.devnet
    echo "API_ENDPOINT_DEVNET=${API_ENDPOINT_DEVNET}" >> .env.yarn.devnet
fi

if [ -f .env.production ]; then
    yarn run envsub --env-file .env.production .cweb-config/config-template.yaml .cweb-config/config.yaml
    if grep -q '\$' .cweb-config/config.yaml; then
        echo "Error: you are missing important secrets in .env.production"
        exit 1 
    fi
else
    echo "Error: you are missing important secrets in .env.production"
    exit 1 
fi
