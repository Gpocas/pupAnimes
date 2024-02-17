import puppeteer from "puppeteer";
import dedent from 'dedent-js'
import { Telegraf } from "telegraf";
import { parse } from "node-html-parser";
import { getAnimes, updateEpisode } from "./db-tools.js"

// Função para verificar e notificar sobre novos episódios
async function checkForNewEpisodes() {

  const animesInfo = await getAnimes();

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
  let page_animes = [];


  // Verifica cada episódio encontrado
  for (let card of cards) {
    let name = card.querySelector("h3 a").innerText;
    let url = card.querySelector("h3 a").getAttribute("href");
    let ep = card
      .querySelector("center div")
      .innerText.replace("Episódio", "")
      .trim();

    for(let anime of animesInfo) {
      if (name.trim() == anime.name) {
        page_animes.push([name, ep, url]);
      }
    }
  
  }

  if (page_animes.length === 0) {
    console.log('sem episodios')
    await browser.close();
    return
  }

  // Notifica sobre novos episódios e atualiza o arquivo
  for (let curAnime of page_animes) {
    let curAnimeInfo = animesInfo.filter((animeInfo) => animeInfo.name === curAnime[0])[0]
    if (curAnime[1] > curAnimeInfo.episode) {

      bot.telegram.sendMessage(
        process.env.CHAT_ID,
        dedent(`Hello, New Episode ${curAnime[0]}:

        ${curAnime[0]} Episode ${curAnime[1]}:
        ${curAnime[2]}`)
      );

      updateEpisode(curAnimeInfo.id, parseInt(curAnime[1]))
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
