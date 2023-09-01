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
      const { status, body } = res;
      handleDisplayContents(status, body, target);
    });
  });
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const { status, body } = request;
  handleDisplayContents(status, body, target);
});

document.onkeydown = (e) => {
  e.metaKey && e.ctrlKey && reqMessage(e);
};

document.onmouseup = (e) => {
  posX = e.clientX;
  posY = e.clientY;
};

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

    div.style.zIndex = "9999999999999999999";
    div.style.position = "absolute";
    div.style.backgroundColor = "#eee";
    div.style.padding = "5px";

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
