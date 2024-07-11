#!/usr/bin/env sh

# Check if API_ENDPOINT_DEVNET is not defined or empty
# It is possible that the API_ENDPOINT_DEVNET is defined within the devnet container for example
if [ -z "${API_ENDPOINT_DEVNET}" ]; then
    echo "#API_ENDPOINT_DEVNET=${API_ENDPOINT_DEVNET}" > .env.yarn.devnet
    echo "API_ENDPOINT_DEVNET=https://api-devnet.coinweb.io/wallet" >> .env.yarn.devnet
else
    echo "#API_ENDPOINT_DEVNET=https://api-devnet.coinweb.io/wallet" > .env.yarn.devnet
    echo "API_ENDPOINT_DEVNET=${API_ENDPOINT_DEVNET}" >> .env.yarn.devnet
fi