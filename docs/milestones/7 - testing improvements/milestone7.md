
## Storybook visual tests throw an error
```
Storybook Tests error details

Error

Failed to start test runner process

Aborting test runner process because it took longer than 30 seconds to start.

Error: Aborting test runner process because it took longer than 30 seconds to start.
    at file:///D:/StorytellerCards/UI/node_modules/@storybook/addon-vitest/dist/preset.js:405:7
    at new Promise (<anonymous>)
    at bootTestRunner (file:///D:/StorytellerCards/UI/node_modules/@storybook/addon-vitest/dist/preset.js:400:17)
    at runTestRunner (file:///D:/StorytellerCards/UI/node_modules/@storybook/addon-vitest/dist/preset.js:431:108)
    at file:///D:/StorytellerCards/UI/node_modules/@storybook/addon-vitest/dist/preset.js:473:10
    at file:///D:/StorytellerCards/UI/node_modules/storybook/dist/core-server/index.js:6848:21
    at Array.forEach (<anonymous>)
    at _UniversalStore.emitToListeners (file:///D:/StorytellerCards/UI/node_modules/storybook/dist/core-server/index.js:6847:69)
    at _UniversalStore.handleChannelEvents (file:///D:/StorytellerCards/UI/node_modules/storybook/dist/core-server/index.js:6910:10)
    at file:///D:/StorytellerCards/UI/node_modules/storybook/dist/channels/index.js:78:10
    at Array.forEach (<anonymous>)
    at Channel.handleEvent (file:///D:/StorytellerCards/UI/node_modules/storybook/dist/channels/index.js:77:48)
    at ServerChannelTransport.handler (file:///D:/StorytellerCards/UI/node_modules/storybook/dist/channels/index.js:26:36)
    at WebSocket.<anonymous> (file:///D:/StorytellerCards/UI/node_modules/storybook/dist/core-server/index.js:6948:23)
    at WebSocket.emit (node:events:508:28)
    at Receiver.receiverOnMessage (D:\StorytellerCards\UI\node_modules\ws\lib\websocket.js:1225:20)
    at Receiver.emit (node:events:508:28)
    at Receiver.dataMessage (D:\StorytellerCards\UI\node_modules\ws\lib\receiver.js:596:14)
    at Receiver.getData (D:\StorytellerCards\UI\node_modules\ws\lib\receiver.js:496:10)
    at Receiver.startLoop (D:\StorytellerCards\UI\node_modules\ws\lib\receiver.js:167:16)
    at Receiver._write (D:\StorytellerCards\UI\node_modules\ws\lib\receiver.js:94:10)
    at writeOrBuffer (node:internal/streams/writable:570:12)
    at _write (node:internal/streams/writable:499:10)
    at Writable.write (node:internal/streams/writable:508:10)
    at Socket.socketOnData (D:\StorytellerCards\UI\node_modules\ws\lib\websocket.js:1360:35)
    at Socket.emit (node:events:508:28)
    at addChunk (node:internal/streams/readable:559:12)
    at readableAddChunkPushByteMode (node:internal/streams/readable:510:3)
    at Readable.push (node:internal/streams/readable:390:5)
    at TCP.onStreamRead (node:internal/stream_base_commons:189:23)


Troubleshoot: https://storybook.js.org/docs/writing-tests/integrations/vitest-addon/?renderer=react&ref=ui#what-happens-if-vitest-itself-has-an-error
```