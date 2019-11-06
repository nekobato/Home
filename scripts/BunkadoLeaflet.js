#!/usr/bin/env node

const Nightmare = require('nightmare');
const nightmare = Nightmare({ show: false });
const fs = require('fs-extra');
const { IncomingWebhook } = require('@slack/webhook');

const cacheFile = __dirname + '/../caches/bunkado-lieflet-urls-v1.json';

const slack = new IncomingWebhook(process.env.SLACK_WEBHOOK_URL);

async function notify(src) {
  return await slack.send({
    text: src,
  });
}

async function scrape() {
  console.log('2');
  if (!fs.existsSync(cacheFile)) await fs.writeFile(cacheFile, JSON.stringify([]));
  const histories = require(cacheFile);
  console.log('3');

  try {
    const srcs = await nightmare
      .goto('https://tokubai.co.jp/%E6%96%87%E5%8C%96%E5%A0%82/4114')
      .wait('a.leaflet_card')
      .evaluate(() => {
        const anchors = document.querySelectorAll('a.leaflet_card img');
        let srcs = [];
        anchors.forEach((element) => {
          const imageSrc = element.src.replace('w=600,h=300,mc=true,wo=0,ho=0,cw=600,ch=300,aw=600', 'o=true');
          srcs.push(imageSrc);
        });
        return srcs;
      })
      .end();
    console.log('4');

    await Promise.all(srcs.map((src) => {
      console.log('5');
      if (histories.indexOf(src) == -1) {
        histories.push(src);
        console.log(`New leaflet: ${src}`);
        return notify(src);
      }
    }));
  } catch (error) {
    throw(error);
  }

  console.log('6');
  fs.writeFileSync(cacheFile, JSON.stringify(histories));
  console.log('Done.');
}

console.log('1');
scrape();
