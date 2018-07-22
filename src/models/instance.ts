import { Document, Model, model, Schema } from 'mongoose'

export interface IInstanceModel extends IInstance, Document {
}

export interface IInstance {
  createdAt: Date
  task: string
  date: Date
  startedAt: Date
  updatedAt: Date
  nextTryAt: Date
  status: number
  message: string
  locked: boolean
  lockedBy: string
  lockedAt: Date
}

const InstanceSchema: Schema = new Schema({
  createdAt: Date,
  task: { type: Schema.Types.ObjectId, ref: 'Task' },
  date: Date,
  startedAt: Date,
  updatedAt: Date,
  nextTryAt: Date,
  status: Number,
  message: String,
  locked: { type: Boolean, default: false },
  lockedBy: { type: Schema.Types.ObjectId, ref: 'Heartbeat' },
  lockedAt: Date,
})

InstanceSchema.pre('save', function(next: () => {}) {
  if (!this.createdAt) {
    this.createdAt = new Date()
  }
  next()
})

export const Instance: Model<IInstanceModel> = model<IInstanceModel>('Instance', InstanceSchema)
