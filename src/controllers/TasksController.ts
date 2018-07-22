import * as TelegramBot from 'node-telegram-bot-api'

import { bindTasksDialog } from '../dialogs/addTask'
import { IDialog } from '../models/dialog'
import { Task } from '../models'

export class TasksController {
  private bot: TelegramBot

  constructor(bot: TelegramBot) {
    this.bot = bot

    bindTasksDialog(bot, (dialog) => this.onTaskDialogCompleted(dialog))

    bot.onText(/\/list/, async (msg: TelegramBot.Message, match: RegExpExecArray) => {
      const tasks = await Task.find({ chat: msg.chat.id })
      const text = tasks.map((task) => task.text).join('\n\n')
      bot.sendMessage(msg.chat.id, text)
    })
  }

  private async onTaskDialogCompleted(dialog: IDialog) {
    const schedule = this.buildCronSchedule(dialog.data)
    const task = await new Task({
      ownerId: dialog.ownerId,
      chatId: dialog.chatId,
      schedule,
      text: dialog.data.text,
    }).save()
    console.log(`Task ${task.id} created, cron ${schedule}`)
  }

  private buildCronSchedule(data: any): string {
    return [
      '0',
      data.minute || 0,
      data.hour || 0,
      data.dayOfMonth || '*',
      '*',
      data.dayOfWeek || '*',
    ].join(' ')
  }
}
