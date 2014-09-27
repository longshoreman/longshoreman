FROM node
RUN npm install http-server -g
ADD ./app /usr/src/app
WORKDIR /usr/src/app
EXPOSE 3000
ENTRYPOINT http-server -p 3000 .
