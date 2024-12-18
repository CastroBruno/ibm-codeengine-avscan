FROM node:current-alpine


RUN apk update
RUN apk add openrc --no-cache


VOLUME /mnt/entry
VOLUME /mnt/clean
VOLUME /mnt/dirty


RUN apk add clamav
RUN apk add clamav-daemon
RUN apk add clamav-libunrar
RUN freshclam


RUN mkdir -p /usr/src/app/data 
RUN mkdir -p /usr/src/app/infected
# Create app directory
WORKDIR /usr/src/app




# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
RUN npm ci --only=production

# Bundle app source
COPY . .


CMD [ "node", "index.js" ]
