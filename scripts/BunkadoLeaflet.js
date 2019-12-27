#!/usr/bin/env node

const puppeteer = require("puppeteer");
const fs = require("fs-extra");
const path = require("path");
const { IncomingWebhook } = require("@slack/webhook");

const cacheFile = path.join(
  __dirname,
  "../caches/bunkado-lieflet-urls-v1.json"
);

const slack = new IncomingWebhook(process.env.SLACK_WEBHOOK_URL);

async function notify(src) {
  return await slack.send({
    text: src
  });
}

(async () => {
  if (!fs.existsSync(cacheFile))
    await fs.writeFile(cacheFile, JSON.stringify([]));
  const histories = require(cacheFile);

  console.log(
    "Latest URL:",
    histories ? histories[histories.length - 1] : "none"
  );

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("https://tokubai.co.jp/%E6%96%87%E5%8C%96%E5%A0%82/4114");

  const srcs = await page.evaluate(() => {
    const anchors = document.querySelectorAll("a.leaflet_card img");
    let srcs = [];
    anchors.forEach(element => {
      const imageSrc = element.src.replace(
        "w=600,h=300,mc=true,wo=0,ho=0,cw=600,ch=300,aw=600",
        "o=true"
      );
      srcs.push(imageSrc);
    });
    return srcs;
  });

  await browser.close();

  await Promise.all(
    srcs.map(src => {
      if (histories.indexOf(src) == -1) {
        histories.push(src);
        console.log(`New leaflet: ${src}`);
        return notify(src);
      }
    })
  );

  fs.writeFileSync(cacheFile, JSON.stringify(histories));
  console.log("Done.");
})();
