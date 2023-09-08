"use strict";

let posX = null;
let posY = null;
let target = null;

const reqMessage = (e) => {
  const msg = window.getSelection().toString();
  target = e.target;

  if (!msg.trim() || !chrome.runtime) return;

  chrome.storage.local.get(["isDict"], (result) => {
    chrome.runtime.sendMessage({ msg, isDict: result.isDict }, (res) => {
      let status, body;
      res && ({ status, body } = res);
      handleDisplayContents(status, body, target);
    });
  });
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  let status, body, isDict, command, sourceLang, targetLang;
  request &&
    ({ status, body, isDict, command, sourceLang, targetLang } = request);

  if (command) {
    handleFadeInOut(command, sourceLang, targetLang, isDict);
    return;
  }

  handleDisplayContents(status, body, target);
});

function handleDisplayContents(status, body, target) {
  if (status === 200) {
    const prevDiv =
      document.getElementById("dict") ?? document.getElementById("dict");

    prevDiv && prevDiv.parentNode.removeChild(prevDiv);

    const ul = document.createElement("ul");
    const div = document.createElement("div");
    div.classList.add("dict");
    div.setAttribute("id", "dict");

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

    div.style.top = `${
      parseInt(posY + window.scrollY + target.style.height) + 15
    }px`;
    div.style.left = `${posX}px`;

    div.appendChild(ul);
    document.body.appendChild(div);

    document.onkeyup = (e) => {
      if (e.key === "Escape" && div.parentNode) {
        div.parentNode.removeChild(div);
        posX = null;
        posY = null;
        target = null;
      }
    };

    document.onclick = () => {
      if (div.parentNode) {
        div.parentNode.removeChild(div);
        posX = null;
        posY = null;
        target = null;
      }
    };
  }
}

function handleFadeInOut(command, sourceLang, targetLang, isDict) {
  const animationTime = 1000;
  const span = document.createElement("span");
  span.classList.add("alert");
  span.setAttribute("id", "alert");

  if (command === "toggle_command") {
    if (isDict) span.innerText = "사전";
    else span.innerText = "번역";
  } else {
    span.innerText = `${sourceLang.toUpperCase()} -> ${targetLang.toUpperCase()}`;
  }

  span.classList.add("fade-in");
  document.body.appendChild(span);

  setTimeout(() => {
    span.classList.remove("fade-in");
    span.classList.add("fade-out");
  }, animationTime);

  setTimeout(() => {
    span.remove();
  }, 2 * animationTime);
}

document.onkeydown = (e) => {
  e.metaKey && e.ctrlKey && reqMessage(e);
};

document.onmouseup = (e) => {
  posX = e.clientX;
  posY = e.clientY;
};
