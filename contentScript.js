"use strict";

let posX;
let posY;
const type = "contentScript";

const reqMessage = async (e) => {
  const msg = window.getSelection().toString();

  if (!msg.trim() || !chrome.runtime) return;

  const { isDict } = await chrome.storage.local.get(["isDict"]);
  console.log("isDict: ", isDict);

  const { status, body } = await chrome.runtime.sendMessage({
    msg,
    isDict,
  });
  console.log("status, body: ", status, body);

  if (status === 200) {
    const prevDiv =
      document.getElementById("dict") ?? document.getElementById("dict");

    prevDiv && prevDiv.parentNode.removeChild(prevDiv);

    const div = document.createElement("div");
    div.classList.add("dict");
    div.setAttribute("id", "dict");

    const ul = document.createElement("ul");

    if (Array.isArray(body) && body.length > 0)
      body.forEach((word) => {
        const li = document.createElement("li");
        li.textContent = word;
        ul.appendChild(li);
      });
    else {
      const li = document.createElement("li");
      li.textContent = body;
      ul.appendChild(li);
    }

    div.style.zIndex = "9999999999999999999";
    div.style.position = "absolute";
    div.style.backgroundColor = "#eee";
    div.style.padding = "5px";

    div.style.top = `${
      parseInt(posY + window.scrollY + e.target.style.height) + 15
    }px`;
    div.style.left = `${posX}px`;

    div.appendChild(ul);
    document.body.appendChild(div);

    document.onkeyup = (e) => {
      e.key === "Escape" && div.parentNode && div.parentNode.removeChild(div);
    };

    document.onclick = () => div.parentNode && div.parentNode.removeChild(div);
  }
};

// ctrl + alt 키 눌렀을 때 이벤트 요청
document.onkeydown = async (e) => {
  e.metaKey && e.ctrlKey && (await reqMessage(e));
};

// 사전 혹은 번역 팝업 생성할 위치 받아오기
document.onmouseup = (e) => {
  posX = e.clientX;
  posY = e.clientY;
};
