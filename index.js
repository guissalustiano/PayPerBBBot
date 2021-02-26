require('dotenv').config()
const ac = require("@antiadmin/anticaptchaofficial");
const puppeteer = require('puppeteer')

function delay(time) {
  return new Promise(function(resolve) {
    setTimeout(resolve, time)
  });
}

ac.setAPIKey(process.env.AC_KEY);

let config = {
  headless: false, // Debug
}

WEB_SITE_KEY = "0344cdb0-b885-4e96-8d19-c1f149a40a7f"
HOST_KEY = "gshow.globo.com"
G1_URL = "https://g1.globo.com/"
VOTE_URL = "https://gshow.globo.com/realities/bbb/bbb21/votacao/paredao-bbb21-vote-para-eliminar-arthur-gilberto-ou-karol-conka-838ec4d5-7d17-4263-a335-29e13c3a769b.ghtml"
VOTO_POS = 3

async function login(browser) {
  const page = await browser.newPage();
  await page.goto(G1_URL, {
    waitUntil: 'networkidle2'
  });
  await page.click('#barra-item-login')

  // email
  await page.waitForSelector("#login")
  await page.click("#login");
  await page.type("#login", process.env.GLOBO_USER)

  // password
  await page.keyboard.down('Tab')
  await page.keyboard.type(process.env.GLOBO_PASSWORD)

  // buttom
  await page.click(".button.ng-scope");

  await page.close();
}

async function vote(browser) {
  const page = await browser.newPage();
  await page.goto(VOTE_URL, {
    waitUntil: 'networkidle2'
  });

  await page.evaluate(() => {
    const bods = document.querySelector('#roulette-root').childNodes[0].childNodes
    const bod = [...bods].filter(b => b.classList.length < 3)[0]

    const divs = bod.childNodes[3].childNodes[0].childNodes
    const voteFields = [...divs].filter(e => e.offsetHeight > 10).filter(e => e.offsetTop > 0)
    const index = voteFields.map(e => e.innerText).indexOf("Karol Conká")
    voteFields[index].querySelectorAll('div').forEach(function(div) {
      if (div.innerHTML === "Karol Conká") {
        div.parentElement.parentElement.parentElement.parentElement.click()
        return
      }
    })
  })
  await page.waitForSelector('#roulette-root')

  try {
    const gresponse = await ac.solveHCaptchaProxyless(HOST_KEY, WEB_SITE_KEY);
    console.log(gresponse)
  } catch (e) {
    console.error("Error solvin captha")
    console.error(e)
    return
  }
  await delay(30000);

  try {
    const gresponse = await ac.getTaskResult()
    console.log(gresponse)
    if (gresponse.status != ready) {
      throw new Error("Not ready after 30s")
    }
  } catch (e) {
    console.error("Error solvin captha")
    console.error(e)
    return
  }

  await delay(5000);
}

async function main() {
  const browser = await puppeteer.launch(config);
  // await login(browser);
  await vote(browser);
  // await browser.close()
}

main()
