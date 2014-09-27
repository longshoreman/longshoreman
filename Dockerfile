FROM node
RUN npm install -g supervisor
ADD . /usr/src/app
WORKDIR /usr/src/app
EXPOSE 80
ENV PORT 80
ENTRYPOINT supervisor index.js
