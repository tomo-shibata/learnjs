onmessage = function (e) {
    try {
        // 入力された回答を評価
        postMessage(eval(e.data));
    } catch (e) {
        console.log('### Error occurred on eval test.' + e)
        postMessage(false);
    }
}