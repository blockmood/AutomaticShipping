chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    // console.log(request, sender, sendResponse)
    // console.log("Message from content script:", request.message);
    // 在这里可以执行一些操作，也可以回复消息给 content script
    // sendResponse({ reply: "Hello from background script!" });

    if (request.type == 'getCookie') {
      chrome.cookies.get({
        name: 'token',
        url: 'https://www.kuzhenghua.com/'
      }, (e) => {
        sendResponse(e.value)
      })
    }

    return true;
  }
);