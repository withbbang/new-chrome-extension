const type = "offscreen";

chrome.runtime.onMessage.addListener(handleMessages);

async function handleMessages(msg) {
  const dict = {
    한국어사전: 1,
    영어사전: 2,
    영영사전: 3,
  };

  fetch(`https://dic.daum.net/search.do?q=${msg}`).then((res) => {
    const { status } = res;

    if (status === 200) {
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

          chrome.runtime.sendMessage({
            results,
            type,
            status,
          });
        }
      });
    } else {
      chrome.runtime.sendMessage({
        type,
        status,
      });
    }
  });
}
