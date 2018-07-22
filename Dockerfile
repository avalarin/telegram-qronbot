FROM node
WORKDIR /opt/app

RUN npm install -g typescript tslint concurrently nodemon

ADD package.json package-lock.json tsconfig.json tslint.json /opt/app/
RUN npm install

ADD src/ /opt/app/src
ADD config/ /opt/app/config
RUN npm run build

VOLUME /opt/app/src
VOLUME /opt/app/config

CMD node dist/app.js