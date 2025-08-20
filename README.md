# Tamed Chat Client

Tamed Chat Client is a TypeScript/JavaScript library for building real-time chat applications with text and audio/video (WebRTC) support. It uses [Socket.IO](https://socket.io/) for signaling and messaging, and provides helpers for WebRTC peer connections and media stream management.

## Features

- Real-time text messaging
- Audio/Video calls using WebRTC
- ICE candidate management for NAT traversal
- Privacy and call context support
- Simple API with callback hooks for UI integration
- Works in modern browsers

## Installation

```sh
npm install tamed-chat-client
```

## Usage

```typescript
import {
  TamedChatClient,
  WEB_RTC_PROVIDER,
  WEB_LOCAL_STREAM_BINDER,
  WEB_REMOTE_STREAM_BINDER,
  WEB_CLEANUP
} from 'tamed-chat-client';

// Define your callback functions for UI and logic
function onConnect() { /* ... */ }
function onDisconnect() { /* ... */ }
function onTextMessage(msg) { /* ... */ }
function onIncomingAVCall(from, callId, privacy) { /* ... */ }
function onAVCallEstablished(to, callId, privacy) { /* ... */ }
function onHangup(callId) { /* ... */ }
function onError(error) { /* ... */ }

// Create the chat client instance
const chatClient = new TamedChatClient(
  'ws://localhost:5001/', // Socket.IO server URL
  onConnect,
  onDisconnect,
  onTextMessage,
  onIncomingAVCall,
  onAVCallEstablished,
  onHangup,
  onError,
  WEB_RTC_PROVIDER,
  WEB_LOCAL_STREAM_BINDER,
  WEB_REMOTE_STREAM_BINDER,
  WEB_CLEANUP
);

// Example: Login a user
chatClient.loginUser({ username: 'alice', password: 'secret' });

// Example: Send a message
chatClient.sendMessage('bob', 'Hello Bob!', {});

// Example: Start an AV call
chatClient.makeAVCall('bob', { callId: 'unique-call-id', privacy: 'public' });

// Example: Accept an incoming call
chatClient.acceptCall({ privacy: 'public' });

// Example: Hang up a call
chatClient.hangup({ privacy: 'public' });
```

## API

### TamedChatClient

#### Constructor

```typescript
new TamedChatClient(
  socketURL: string,
  socketConnectCallBack: Function,
  socketDisconnectCallBack: Function,
  textMessageCallback: Function,
  incomingAVCallCallback: Function,
  AVCallEstablishedCallback: Function,
  hangupCallback: Function,
  errorCallback: Function,
  rtcProvider: Function,
  localStreamBinder: Function,
  remoteStreamBinder: Function,
  cleanUp: Function,
)
```

#### Methods

- `loginUser(data)`
- `sendMessage(to, msg, privacy)`
- `makeAVCall(to, privacy)`
- `acceptCall(privacy)`
- `hangup(privacy)`
- `getPastMessages(to)`
- `isInCall()`

### WebRTC Helpers

- `WEB_RTC_PROVIDER`
- `WEB_LOCAL_STREAM_BINDER`
- `WEB_REMOTE_STREAM_BINDER`
- `WEB_CLEANUP`

## Change Log

### 0.0.18
- Tamed Push Service

### 0.0.17
- Privacy data provided for callbacks

### 0.0.15 and 0.0.16
- Hangup CallId Fix

### 0.0.14
- Hangup Fix

### 0.0.12
- Call Id introduced

### 0.0.11
- Privacy context added

### 0.0.10
- Ice Candidate option added

## License