FROM rg.fr-par.scw.cloud/coinweb-devnet/main:latest AS devnet
COPY gid uid prepare-user.sh /tmp/
# Match UID and GID of the host's user inside the container to avoid permission
# issues. We are using files, because $UID and $GID host's environment variables
# are not always available to read.
RUN /tmp/prepare-user.sh "$(cat /tmp/gid)" "$(cat /tmp/uid)"
RUN npm install --location=global corepack typescript
