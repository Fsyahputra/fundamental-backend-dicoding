import { ServerError } from '../exception.js';
import type { IMsgService } from '../types/msg.js';
import amqp from 'amqplib';

class RabbitMqMsgImpl implements IMsgService {
  private readonly url: string;

  constructor(url: string) {
    this.url = url;
  }

  public async sendMsg(msg: Buffer | Object, queue: string): Promise<void> {
    try {
      const connection = await amqp.connect(this.url);
      const channel = await connection.createChannel();
      await channel.assertQueue(queue, { durable: true });
      channel.sendToQueue(
        queue,
        Buffer.isBuffer(msg) ? msg : Buffer.from(JSON.stringify(msg)),
        {
          persistent: true,
        }
      );
      setTimeout(() => {
        channel.close();
        connection.close();
      }, 500);
    } catch (error) {
      throw new ServerError(`Failed to send message ${error}`);
    }
  }
}

export default RabbitMqMsgImpl;
