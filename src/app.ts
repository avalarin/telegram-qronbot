import * as config from 'config'
import * as TelegramBot from 'node-telegram-bot-api'
import * as mongoose from 'mongoose'
import * as express from 'express'

import { ITelegramConfig, IMongoConfig, ISchedulerConfig, IHeartbeatConfig, IServerConfig } from './config'
import { TasksController } from './controllers/TasksController'
import { SchedulerService, HeartbeatService, ExecutingService } from './services'

const telegramConfig = config.get<ITelegramConfig>('telegram')
const mongoConfig = config.get<IMongoConfig>('mongo')
const schedulerConfig = config.get<ISchedulerConfig>('scheduler')
const heartbeatConfig = config.get<IHeartbeatConfig>('heartbeat')
const serverConfig = config.get<IServerConfig>('server')

async function start() {
  await mongoose.connect(mongoConfig.host)
  await new HeartbeatService(heartbeatConfig).start()

  const server = express()
  server.get('/health', (req, res) => {
    res.send('{ "ok": true }')
  })

  server.listen(serverConfig.port, serverConfig.host, () => {
    console.log(`App listening on port ${serverConfig.port}`)
  })

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
