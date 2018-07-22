import * as TelegramBot from 'node-telegram-bot-api'

import { DialogController } from '../controllers/DialogController'
import { IDialog } from '../models/dialog'

import { rangeInc } from '../utils'

export function bindTasksDialog(bot: TelegramBot, callback: (dialog: IDialog) => void) {
  const controller = new DialogController(bot, {
    onCompletedDialog: callback,
    startCommands: [ 'add' ],
    startData: {},
    reducers: {
      START: (dialog: IDialog, value: string) => {
        return {
          state: 'REPEAT_MODE',
          data: { ...dialog.data, text: value },
        }
      },
      REPEAT_MODE: (dialog: IDialog, value: string) => {
        switch (value) {
          case '1':
          case 'Каждый месяц':
            return { state: 'DAY_MONTH', data: dialog.data }
          case '2':
          case 'Каждую неделю':
            return { state: 'DAY_WEEK', data: dialog.data }
          case '3':
          case 'Каждый день':
            return { state: 'HOUR', data: dialog.data }
          default:
            throw new Error(`Illegal value ${value}`)
        }
      },
      DAY_WEEK: (dialog: IDialog, value: string) => ({
        state: 'HOUR',
        data: { ...dialog.data, dayOfWeek: parseInt(value, 10) },
      }),
      DAY_MONTH: (dialog: IDialog, value: string) => ({
        state: 'HOUR',
        data: { ...dialog.data, dayOfMonth: parseInt(value, 10) },
      }),
      HOUR: (dialog: IDialog, value: string) => ({
        state: 'MINUTE',
        data: { ...dialog.data, hour: parseInt(value, 10) },
      }),
      MINUTE: (dialog: IDialog, value: string) => ({
        state: 'DONE',
        data: { ...dialog.data, minute: parseInt(value, 10) },
      }),
    },
    renderers: {
      START: (dialog: IDialog) => ({
        text: 'Какой текст отправлять?',
      }),
      REPEAT_MODE: (dialog: IDialog) => ({
        text: 'Ок, как часто?',
        menu: {
          columns: 1,
          items: [
            { text: 'Каждый месяц', value: 1 },
            { text: 'Каждую неделю', value: 2 },
            { text: 'Каждый день', value: 3 },
          ],
        },
      }),
      DAY_WEEK: (dialog: IDialog) => ({
        text: 'Выбери день недели:',
        menu: {
          columns: 4,
          items: [
            { text: 'Пн.', value: 1 },
            { text: 'Вт.', value: 2 },
            { text: 'Ср.', value: 3 },
            { text: 'Чт.', value: 4 },
            { text: 'Пт.', value: 5 },
            { text: 'Сб.', value: 6 },
            { text: 'Вс.', value: 7 },
          ],
        },
      }),
      DAY_MONTH: (dialog: IDialog) => ({
        text: 'Выбери день:',
        menu: {
          columns: 7,
          items: rangeInc(1, 31).map((i) => ({
            text: `${i}`,
            value: i,
          })),
        },
      }),
      HOUR: (dialog: IDialog) => ({
        text: 'Выбери час:',
        menu: {
          columns: 6,
          items: rangeInc(0, 23).map((i) => ({
            text: `${i}:`,
            value: i,
          })),
        },
      }),
      MINUTE: (dialog: IDialog) => ({
        text: 'Выбери минуты:',
        menu: {
          columns: 4,
          items: rangeInc(0, 3).map((i) => ({
            text: `:${i * 15}`,
            value: i,
          })),
        },
      }),
      DONE: (dialog: IDialog) => ({
        text: 'Готово, текст будет отправляться по выбранному расписанию',
        final: true,
      }),
    },
  })
}
