import { Document, Model, model, Schema } from 'mongoose'

interface IHeartbeatModel extends IHeartbeat, Document {
}

interface IHeartbeat {
  reportedAt: Date,
  ip: string
}

const HeartbeatSchema: Schema = new Schema({
  reportedAt: Date,
  ip: String,
})

export const Heartbeat: Model<IHeartbeatModel> = model<IHeartbeatModel>('Heartbeat', HeartbeatSchema)
