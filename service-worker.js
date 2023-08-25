import { handleConsoleLog } from "./test.js";

chrome.commands.onCommand.addListener((command) => {
  handleConsoleLog();
});
