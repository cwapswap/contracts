ARG NODE_VERSION=18.20
ARG NGINX_VERSION=1.23

FROM node:$NODE_VERSION AS build
WORKDIR /cwap

# Copy only the necessary files for yarn install
COPY .yarn/ .yarn/
COPY scripts/ scripts/
COPY package.json yarn.lock .yarnrc.yml .env.yarn* ./
COPY packages/dapp-ui/package.json packages/dapp-ui/
COPY packages/dex-app.cm/package.json packages/dex-app.cm/

# Install dependencies
RUN yarn install

# Copy the rest of the application files
COPY . .
RUN npm run-script build --prefix=packages/dex-app.cm
RUN npm run-script build --prefix=packages/dapp-ui

FROM nginx:$NGINX_VERSION AS run
ARG PORT=5000
COPY --from=build /cwap/packages/dapp-ui/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE $PORT
# Run nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
