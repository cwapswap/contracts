## Building:

Build the Javascript based smart contract using `yarn build`.

```
$ yarn build
```

## Deploying:

Build the Javascript based smart contract using `deploy-contracts`.
You need to configure contract instances using configs located at the paths `.cweb-config/config.json`, 
`.cweb-config/dapp-ecosystem.yaml` and the `instances` folder (`packages/dex-app.cm/instances`).

```
$ yarn deploy-contracts
```

Transactions that need to be executed are shown in the output, but since smart
contracts that have already been deployed need not be deployed again, there is
usually nothing that needs to be done wrt deploying and registering the smart
contracts.

However, if you change anything in the smart contract examples, new transactions
for the updated smart contracts will have to be broadcasted.

## Web App development mode:

To run Web App in dev mode use 

```
$ yarn dev
```