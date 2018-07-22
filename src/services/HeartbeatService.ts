import { networkInterfaces } from 'os'
import * as _ from 'lodash'
import { DateTime } from 'luxon'

import { Heartbeat } from '../models'
import { IHeartbeatConfig } from '../config'

export class HeartbeatService {
  public static applicationId: string

  private id?: string
  private config: IHeartbeatConfig

  constructor(config: IHeartbeatConfig) {
    this.config = config
  }

  public async start() {
    await this.register()

    setInterval(
      () => this.heartbeat(),
      this.config.periodSeconds * 1000,
    )

    setInterval(
      () => this.killZombies(),
      this.config.killPeriodSeconds * 1000,
    )
  }

  private async killZombies() {
    const minPossibleReportedAt = DateTime.local().minus({ seconds: this.config.maxUnreportedSeconds }).toJSDate()
    await Heartbeat.deleteMany({ reportedAt: { $lt: minPossibleReportedAt } })
  }

  private async heartbeat() {
    const minPossibleReportedAt = DateTime.local().minus({ seconds: this.config.maxUnreportedSeconds }).toJSDate()
    const updated = await Heartbeat.findOneAndUpdate(
      { _id: this.id, reportedAt: { $gt: minPossibleReportedAt } },
      { $set: { reportedAt: new Date() }},
    )
    if (updated == null) {
      console.error('Application unregistered, shutdowning...')
      process.exit(1)
    }
  }

  private async register() {
    const heartbeat = await new Heartbeat({
      reportedAt: new Date(),
      ip: this.getIp(),
    }).save()
    this.id = heartbeat.id
    HeartbeatService.applicationId = this.id
    console.log(`Application registered with id ${heartbeat.id} and ip ${heartbeat.ip}`)
  }

  private getIp(): string {
    return _.chain(networkInterfaces())
      .values().flatten()
      .filter((iface) => 'IPv4' === iface.family && !iface.internal)
      .map((iface) => iface.address)
      .join(',')
      .value()
  }
}
