FROM jplu/node

MAINTAINER Pasquale Lisena <pasquale.lisena@eurecom.fr>

ENV NODE_ENV=production

WORKDIR /usr/src/app
COPY . /usr/src/app

# Install app dependencies
RUN npm install --production

RUN adduser -D -g sudo nodeuser -u 1000 \
    && chown -R nodeuser /usr/src/app \
    && chmod -R 777 /root \
    && echo '%sudo ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

EXPOSE 3000
EXPOSE 3001
EXPOSE 3003

COPY run.sh /run.sh

RUN chmod +x /run.sh

CMD [ "/run.sh" ]
