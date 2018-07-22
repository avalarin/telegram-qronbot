import * as config from 'config'
import * as TelegramBot from 'node-telegram-bot-api'
import * as mongoose from 'mongoose'

import { ITelegramConfig, IMongoConfig, ISchedulerConfig, IHeartbeatConfig } from './config'
import { TasksController } from './controllers/TasksController'
import { SchedulerService, HeartbeatService, ExecutingService } from './services'

const telegramConfig = config.get<ITelegramConfig>('telegram')
const mongoConfig = config.get<IMongoConfig>('mongo')
const schedulerConfig = config.get<ISchedulerConfig>('scheduler')
const heartbeatConfig = config.get<IHeartbeatConfig>('heartbeat')

async function start() {
  await mongoose.connect(mongoConfig.host)
  await new HeartbeatService(heartbeatConfig).start()

  const bot = new TelegramBot(telegramConfig.token, {polling: true})

  bot.onText(/\/start/, (msg: TelegramBot.Message, match: RegExpExecArray) => {
    const chatId = msg.chat.id
    bot.sendMessage(chatId, 'hello')
  })

  const _ = new TasksController(bot)

  new ExecutingService(bot).start()
  new SchedulerService(schedulerConfig).start()

  console.log('Application started')
}

start()
