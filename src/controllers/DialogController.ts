import * as _ from 'lodash'
import * as TelegramBot from 'node-telegram-bot-api'
import {
  Message,
  InlineKeyboardMarkup,
  ReplyKeyboardMarkup,
  ReplyKeyboardRemove,
  ForceReply,
} from 'node-telegram-bot-api'

import { Dialog, IDialog, IDialogMessage, IDialogReduceResult, IDialogModel } from '../models/dialog'

type CompletedDialogCallback = (dialog: IDialog) => void

type ReducerFunc = (dialog: IDialog, value: any) => IDialogReduceResult
type RendererFunc = (dialog: IDialog) => IDialogMessage

export interface IDialogControllerOptions {
  startCommands?: string[]
  startData?: any
  onCompletedDialog?: CompletedDialogCallback
  reducers?: any
  renderers?: any
}

function objectToMap<V>(obj: any): Map<string, V> {
  const map = new Map<string, V>()
  Object.keys(obj).forEach((key) => {
    map.set(key, obj[key])
  })
  return map
}

export class DialogController {
  private bot: TelegramBot
  private subscribers: CompletedDialogCallback[]
  private reducers: Map<string, ReducerFunc>
  private renderers: Map<string, RendererFunc>

  constructor(bot: TelegramBot, options: IDialogControllerOptions = {}) {
    this.bot = bot
    this.subscribers = []

    if (options.onCompletedDialog != null) {
      this.subscribers.push(options.onCompletedDialog)
    }

    if (options.startCommands != null) {
      options.startCommands.forEach((cmd) => this.bindStartCommand(cmd, options.startData || {}))
    }

    if (options.reducers != null) {
      this.reducers = objectToMap(options.reducers)
    } else {
      this.reducers = new Map()
    }

    if (options.renderers != null) {
      this.renderers = objectToMap(options.renderers)
    } else {
      this.renderers = new Map()
    }

    this.bot.on('callback_query', (query: TelegramBot.CallbackQuery) => {
      const match = /dialog-(.*)/.exec(query.data)
      if (!match) {
        return
      }
      const value = match[1]

      // TODO try catch
      this.process(query.message.chat.id, query.from.id, query.message.message_id, value)
    })

    this.bot.on('message', (msg: Message) => {
      if (msg.reply_to_message == null) {
        return
      }
      console.log(`Reply received from chat ${msg.chat.id}:${msg.from.id}, message ${msg.reply_to_message.message_id}`)
      // TODO try catch
      this.process(msg.chat.id, msg.from.id, msg.reply_to_message.message_id, msg.text, msg)
    })
  }

  private bindStartCommand(command: string, startData: any) {
    this.bot.onText(new RegExp(`\/${command}`), (msg: Message, match: RegExpExecArray) => {
      // TODO try catch
      this.start(msg.chat.id, msg.from.id, startData, msg)
    })
  }

  private async start(chatId: number, ownerId: number, data: any, msg: Message) {
    const dialog = await new Dialog({
      state: 'START',
      messageId: null,
      chatId,
      ownerId,
      data,
    }).save()

    const message = this.getMessage(dialog)
    await this.sendMessage(dialog, message, msg.from.username)
  }

  private async process(chatId: number, senderId: number, messageId: number, value: string, msg?: Message) {
    const dialog = await Dialog.findOne({ chatId, ownerId: senderId, messageId })
    if (dialog == null) {
      throw new Error('Dialog not found')
    }

    const lastMessage = this.getMessage(dialog)

    const updatedDialog = this.reduce(dialog, value)
    Object.assign(dialog, updatedDialog)
    await dialog.save()

    const message = this.getMessage(dialog)
    this.sendMessage(dialog, message, msg && msg.from.username)

    if (lastMessage.menu != null) {
      this.updateMessage(dialog, lastMessage, value)
    }

    if (dialog.state === 'DONE') {
      this.subscribers.forEach((subscriber) => subscriber(dialog))
    }
  }

  private reduce(dialog: IDialog, value: string): IDialogReduceResult {
    const reducer = this.reducers.get(dialog.state)
    if (reducer == null) {
      throw new Error(`Invalid state ${dialog.state}`)
    }
    return reducer(dialog, value)
  }

  private getMessage(dialog: IDialog): IDialogMessage {
    const renderer = this.renderers.get(dialog.state)
    if (renderer == null) {
      throw new Error(`Invalid state ${dialog.state}`)
    }
    return renderer(dialog)
  }

  private async sendMessage(dialog: IDialogModel, message: IDialogMessage, userName?: string) {
    let text = message.text
    if (userName != null) {
      text = `@${userName}, ` + text[0].toLowerCase() + text.substr(1)
    }

    const sentMessage = await this.bot.sendMessage(dialog.chatId, text, {
      reply_markup: this.renderReplyMarkup(dialog, message),
    }) as Message

    if (sentMessage.message_id) {
      dialog.messageId = sentMessage.message_id
      await dialog.save()
    }
  }

  private async updateMessage(dialog: IDialogModel, message: IDialogMessage, value: string) {
    this.bot.editMessageText(`${message.text} <b>${value}</b>`, {
      chat_id: dialog.chatId,
      message_id: dialog.messageId,
      parse_mode: 'HTML',
    })
  }

  private renderReplyMarkup(dialog: IDialogModel, message: IDialogMessage)
  : ReplyKeyboardMarkup | InlineKeyboardMarkup | ForceReply | ReplyKeyboardRemove {
    if (message.final) {
      return {
        remove_keyboard: true,
      }
    }
    if (message.menu != null) {
      const items = message.menu.items.map((item) => ({
        text: item.text,
        callback_data: `dialog-${item.value}`,
      }))
      return {
        inline_keyboard: _.chunk(items, message.menu.columns),
      }
      // const items = message.menu.items.map((item) => ({
      //   text: item.text,
      // }))
      // return {
      //   force_reply: true,
      //   selective: true,
      //   keyboard: _.chunk(items, message.menu.columns),
      // }
    }

    return {
      force_reply: true,
      selective: true,
    }
  }

}
