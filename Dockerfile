FROM quay.io/qasimtech/mega-bot:latest

WORKDIR /root/tohid-ai

RUN git clone https://github.com/Tohidkhan6332/TOHID-AI . && \
    npm install

EXPOSE 5000

CMD ["npm", "start"]
