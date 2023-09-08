import { PAPAGO_CLIENT_ID, PAPAGO_CLIENT_SECRET } from "./env.js";

let sourceLang = "en";
let targetLang = "ko";

const OFFSCREEN_DOCUMENT_PATH = "offscreen.html";

function handleChangeLang() {
  const tmp = targetLang;
  targetLang = sourceLang;
  sourceLang = tmp;
}

chrome.commands.onCommand.addListener(async (command) => {
  let isDict = false;

  if (command === "toggle_command") {
    let result = await chrome.storage.local.get(["isDict"]);
    chrome.storage.local.set({ isDict });
    isDict = !result.isDict;
  } else {
    handleChangeLang();
  }

  chrome.tabs.query({ active: true, currentWindow: true }, (pages) => {
    chrome.tabs.sendMessage(pages[0].id, {
      status: 200,
      body: "",
      isDict,
      command,
      sourceLang,
      targetLang,
    });
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const { msg, isDict, results, status } = request;

  if (isDict === false)
    fetch("https://openapi.naver.com/v1/papago/n2mt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Naver-Client-Id": PAPAGO_CLIENT_ID,
        "X-Naver-Client-Secret": PAPAGO_CLIENT_SECRET,
      },
      body: JSON.stringify({
        source,
        target,
        text: msg,
      }),
    }).then((res) => {
      if (res.status === 200) {
        res.text().then((text) => {
          const obj = JSON.parse(text);

          sendResponse({
            status: res.status,
            body: obj.message.result.translatedText,
          });
        });
      } else {
        sendResponse({
          status: res.status,
          body: "",
        });
      }
    });
  else {
    handleHasDocument().then(async (hasDocument) => {
      if (!hasDocument) {
        await chrome.offscreen.createDocument({
          url: OFFSCREEN_DOCUMENT_PATH,
          reasons: [chrome.offscreen.Reason.DOM_PARSER],
          justification: "Parse DOM",
        });

        chrome.runtime.sendMessage(msg);
      } else {
        await chrome.offscreen.closeDocument();

        chrome.tabs.query({ active: true, currentWindow: true }, (pages) => {
          chrome.tabs.sendMessage(pages[0].id, {
            status,
            body: results,
          });
        });
      }
    });
  }

  return true;
});

async function handleCloseOffscreenDocument() {
  if (!(await handleHasDocument())) {
    return;
  }

  await chrome.offscreen.closeDocument();
}

async function handleHasDocument() {
  const matchedClients = await clients.matchAll();
  for (const client of matchedClients) {
    if (client.url.endsWith(OFFSCREEN_DOCUMENT_PATH)) {
      return true;
    }
  }
  return false;
}
