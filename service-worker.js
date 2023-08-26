import { PAPAGO_CLIENT_ID, PAPAGO_CLIENT_SECRET } from "./env.js";

chrome.commands.onCommand.addListener((command) => {
  chrome.storage.local.get(["isDict"], (result) => {
    if (result.isDict === false) chrome.storage.local.set({ isDict: true });
    else chrome.storage.local.set({ isDict: false });
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const { msg, isDict } = request;
  const dict = {
    한국어사전: 1,
    영어사전: 2,
    영영사전: 3,
  };

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
  else
    fetch(`https://dic.daum.net/search.do?q=${msg}`).then((res) => {
      if (res.status === 200) {
        res.text().then((text) => {
          const parser = new DOMParser();
          const searchResults = [
            ...parser
              .parseFromString(text, "text/html")
              .querySelectorAll(".tit_word"),
          ] // 돔 파싱 후, 언어 사전 타이틀 읽어오기
            .filter(
              (titleWordTag) =>
                titleWordTag.innerText === "한국어사전" ||
                titleWordTag.innerText === "영어사전" ||
                titleWordTag.innerText === "영영사전"
            ) // 특정 언어 사전만 걸러내기
            .sort((a, b) => {
              if (dict[a.innerText] < dict[b.innerText]) return -1;
              else return 1;
            }) // 순서 설정 -> 한국어, 영어, 영영
            .map((tag) => tag.parentElement)
            .map((tag) => tag.nextElementSibling); // 뜻 담고있는 부모 태그 리스트 접근

          if (
            searchResults &&
            Array.isArray(searchResults) &&
            searchResults.length > 0
          ) {
            let searchLi = [];

            searchResults.forEach((result) => {
              searchLi = [...searchLi, ...result.getElementsByTagName("li")];
            });

            const results = [...searchLi].map((li) =>
              [...li.getElementsByClassName("txt_search")]
                .map((txt) => txt.innerHTML.replace(/(<([^>]+)>)/gi, ""))
                .join("")
            ); // 뜻만 추출하여 리스트업

            sendResponse({
              status: res.status,
              body: results,
            });
          }
        });
      } else {
        sendResponse({
          status: res.status,
        });
      }
    });

  return true;
});
