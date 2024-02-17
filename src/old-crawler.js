import puppeteer from "puppeteer";
import dedent from 'dedent-js'
import { Telegraf } from "telegraf";
import { readFile, writeFile } from "node:fs";
import { parse } from "node-html-parser";

// Função para verificar e notificar sobre novos episódios
async function checkForNewEpisodes() {
  var last_ep;

  // Lê o número do último episódio do arquivo
  readFile("last_ep.txt", "utf8", function (err, data) {
    if (err) {
      console.error("Erro ao ler arquivo: ", err);
      return;
    }
    last_ep = parseInt(data);
  });

  // Inicia o navegador
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Acessa a página dos episódios
  await page.goto("https://animeshouse.net/");
  await page.setViewport({ width: 1920, height: 1080 });

  // Extrai informações sobre os episódios
  let html_contents = await page.content();
  let root = parse(html_contents);
  let cards = root.querySelectorAll(".animation-2.items article .data");
  let episodes = [];
  let url_final;


  // Verifica cada episódio encontrado
  for (let card of cards) {
    let name = card.querySelector("h3 a").innerText;
    let url = card.querySelector("h3 a").getAttribute("href");
    let ep = card
      .querySelector("center div")
      .innerText.replace("Episódio", "")
      .trim();

    if (name.trim() == "Solo Leveling") {
      url_final = url;
      episodes.push(ep);
    }
  }


  if (episodes.length === 0) {
    console.log('sem novos episodios')
    await browser.close();
    return
  } 
  // Notifica sobre novos episódios e atualiza o arquivo
  for (let current_ep of episodes) {
    if (parseInt(current_ep) > last_ep) {
      bot.telegram.sendMessage(
        process.env.CHAT_ID,
        dedent(`Hello, New Episode Solo Leveling:

        Solo Leveling Episode ${current_ep}:
        ${url_final}`)
      );
      writeFile("last_ep.txt", current_ep, (err) => {
        if (err) console.log(err);
      });

      clearInterval(intervalo)
    }
    else {
      console.log('sem novos episodios')
      await browser.close();
      return
    }
  }
  
  // Fecha o navegador
  await browser.close();
}

// Cria um loop para verificar episódios a cada 5 minutos
var intervalo = setInterval(checkForNewEpisodes, 5 * 60 * 1000);

// Cria o bot do Telegram
const bot = new Telegraf(process.env.BOT_TOKEN);
