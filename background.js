import { PAPAGO_CLIENT_ID, PAPAGO_CLIENT_SECRET } from "./env.js";

const OFFSCREEN_DOCUMENT_PATH = "offscreen.html";

chrome.commands.onCommand.addListener((command) => {
  chrome.storage.local.get(["isDict"], (result) => {
    if (result.isDict === false) chrome.storage.local.set({ isDict: true });
    else chrome.storage.local.set({ isDict: false });
  });
});

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  const { msg, isDict, results, type, status } = request;

  if (isDict === false)
    fetch("https://openapi.naver.com/v1/papago/n2mt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Naver-Client-Id": PAPAGO_CLIENT_ID,
        "X-Naver-Client-Secret": PAPAGO_CLIENT_SECRET,
      },
      body: JSON.stringify({
        source: "en",
        target: "ko",
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
        });
      }
    });
  else {
    if (!(await handleHasDocument())) {
      await chrome.offscreen.createDocument({
        url: OFFSCREEN_DOCUMENT_PATH,
        reasons: [chrome.offscreen.Reason.DOM_PARSER],
        justification: "Parse DOM",
      });

      chrome.runtime.sendMessage(msg);
    }

    if (type === "offscreen") {
      console.log(results);
      sendResponse({
        status,
        body: results,
      });

      await handleCloseOffscreenDocument();
    }
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