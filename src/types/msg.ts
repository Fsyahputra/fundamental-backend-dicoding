export interface IMsgService {
  sendMsg: (msg: Buffer | string | Object, queue: string) => Promise<void>;
}
