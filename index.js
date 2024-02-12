import { Telegraf } from "telegraf";
import puppeteer from "puppeteer";
import { readFile, writeFile } from "node:fs";
import { parse } from "node-html-parser";

var last_ep;

readFile("last_ep.txt", "utf8", function (err, data) {
  last_ep = parseInt(data);
});

(async () => {
  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  const bot = new Telegraf(process.env.BOT_TOKEN);

  // Navigate the page to a URL
  await page.goto("https://animeshouse.net/");

  await page.setViewport({ width: 1920, height: 1080 });

  let html_contents = await page.content();
  let root = parse(html_contents);

  await browser.close();

  let cards = root.querySelectorAll(".animation-2.items article .data");

  let episodes = [];
  var url_final
  for (let card of cards) {
    let name = card.querySelector("h3 a").innerText;
    let url = card.querySelector("h3 a").getAttribute("href");
    let ep = card
      .querySelector("center div")
      .innerText.replace("Episódio", "")
      .trim();

    if (name.trim() == "Solo Leveling") {
      url_final = url
      episodes.push(ep);
    }
  }

  for (let current_ep of episodes) {
    if (parseInt(current_ep) > last_ep) {
      bot.telegram.sendMessage(
        process.env.CHAT_ID,
        `Hello, New Episode Solo Leveling:

Solo Leveling Episode ${current_ep}:
${url_final}`
      );
      writeFile("last_ep.txt", current_ep, (err) => {
        if (err) console.log(err);
      });
    }
  }
})();
