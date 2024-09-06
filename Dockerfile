ARG NODE_VERSION=22.5.1
ARG NGINX_VERSION=1.23
ARG BRANCH_NAME

FROM node:$NODE_VERSION AS build
WORKDIR /cwap

# Copy only the necessary files for yarn install
COPY .yarn/ .yarn/
COPY scripts/ scripts/
COPY .cweb-config/config-template.yaml .cweb-config/config-template.yaml
COPY package.json yarn.lock .yarnrc.yml .env.yarn* .env.production ./
COPY packages/dapp-ui/package.json packages/dapp-ui/
COPY packages/dex-app.cm/package.json packages/dex-app.cm/
COPY packages/market-maker.cm/package.json packages/market-maker.cm/

# Install dependencies
RUN yarn install

# Copy the rest of the application files
COPY . .
RUN case $BRANCH_NAME in \
    main) yarn build:production ;; \
    *) yarn build ;; \
esac

FROM nginx:$NGINX_VERSION AS run
ARG PORT=5000
COPY --from=build /cwap/packages/dapp-ui/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE $PORT
# Run nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
