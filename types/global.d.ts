// types/global.d.ts
export {};

declare global {
  var __LIVECHAT_SESSIONS__: Map<string, any> | undefined;
  var __LIVECHAT_MSGMAP__: Map<string, string> | undefined;
  var __broadcastSessionUpdate__: ((sessionId: string, payload: any) => void) | undefined;
}