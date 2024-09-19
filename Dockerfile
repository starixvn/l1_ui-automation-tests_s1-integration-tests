FROM hub.lumigame.com/base/playwright:v1.44.0-focal

WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH

RUN mkdir -p /app/tests
COPY tests /app/tests
COPY playwright.config.ts .
COPY package.json .
COPY .npmrc .

RUN npm install
RUN npx playwright@1.44 install chromium