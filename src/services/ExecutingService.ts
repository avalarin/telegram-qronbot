import { DateTime } from 'luxon'
import * as TelegramBot from 'node-telegram-bot-api'
import { Message } from 'node-telegram-bot-api'

import { Instance, IInstance, Task, ITask } from '../models'
import { HeartbeatService } from '../services'

interface IExecutionResult {
  status: number,
  message: string,
  nextTryAt?: Date
}

export class ExecutingService {
  private bot: TelegramBot

  constructor(bot: TelegramBot) {
    this.bot = bot
  }

  public start() {
    setInterval(
      () => this.executeInstances(),
      5000,
    )
  }

  private async executeInstances() {
    const instance = await Instance.findOneAndUpdate(
      { status: { $lt: 2 }, nextTryAt: { $lt: new Date() }, locked: false },
      { $set: { locked: true, lockedBy: HeartbeatService.applicationId, lockedAt: new Date() } },
    )

    if (instance == null) {
      return
    }

    console.debug(`Begin executing instance ${instance.id}`)

    instance.startedAt = new Date()

    let result: IExecutionResult
    try {
      const task = await Task.findById(instance.task)
      result = await this.processInstance(task, instance)
      Object.assign(instance, result)
    } catch (e) {
      console.log(`Error occurred while task ${instance.id} processing, ${e}`)
      result = {
        message: `${e}`,
        nextTryAt: DateTime.local().plus({ seconds: 10 }).toJSDate(),
        status: 1,
      }
    }

    try {
      await Instance.findByIdAndUpdate(instance.id, {
        $set: {
          locked: false,
          updatedAt: new Date(),
          ...result,
        },
      })
    } catch (e) {
      console.error(`Cannot save task status ${e}`)
    }
  }

  private async processInstance(task: ITask, instance: IInstance): Promise<IExecutionResult> {
    await this.bot.sendMessage(task.chatId, task.text)
    return { status: 2, message: 'ok' }
  }
}
