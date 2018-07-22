import { Document, Model, model, Schema } from 'mongoose'

export interface ITaskModel extends ITask, Document {
}

export interface ITask {
  createdAt: Date
  ownerId: number
  chatId: number
  schedule: string
  text: string
  active: boolean,
}

const TaskSchema: Schema = new Schema({
  createdAt: Date,
  ownerId: Number,
  chatId: Number,
  schedule: String,
  text: String,
  active: { type: Boolean, default: true },
})

TaskSchema.pre('save', function(next: () => {}) {
  if (!this.createdAt) {
    this.createdAt = new Date()
  }
  next()
})

export const Task: Model<ITaskModel> = model<ITaskModel>('Task', TaskSchema)
