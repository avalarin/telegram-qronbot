import { DateTime } from 'luxon'
import * as later from 'later'

import { Instance, Task, ITaskModel } from '../models'
import { ISchedulerConfig } from '../config'

export class SchedulerService {
  private config: ISchedulerConfig

  constructor(config: ISchedulerConfig) {
    this.config = config
  }

  public start() {
    setInterval(() => {
      this.rescheduleAll()
    }, this.config.periodSeconds * 1000)
  }

  public async rescheduleAll() {
    try {
      const tasks = await Task.find({ active: true }).exec()
      await Promise.all(tasks.map(async (task) => {
        await this.rescheduleTask(task)
      }))
    } catch (e) {
      console.error('Scheduling failed', e)
    }
  }

  private async rescheduleTask(task: ITaskModel) {
    const lastDate = DateTime.fromJSDate(await this.getLastDate(task)).plus({ seconds: 1 })
    const maxDate = DateTime.local().plus({ days: this.config.schedulingRangeDays })
    if (lastDate >= maxDate) {
      return
    }

    const schedule = later.parse.cron(task.schedule, true)
    const occurences = later.schedule(schedule).next(
      this.config.schedulingMaxInstances,
      lastDate.toJSDate(),
      maxDate.toJSDate(),
    )

    if (!occurences) {
      return
    }

    const tasks = occurences.map(async (occurence) => {
      await new Instance({
        task: task.id,
        date: occurence,
        nextTryAt: occurence,
        status: 0,
      }).save()
      console.log(`Instance for task ${task.id} created, ${occurence}`)
    })

    await Promise.all(tasks)
  }

  private async getLastDate(task: ITaskModel): Promise<Date> {
    const lastInstance = (await Instance
      .find({ status: 0, task: task.id })
      .sort('-date')
      .limit(1)
      .exec())[0]

    return lastInstance && lastInstance.date || new Date()
  }

}
