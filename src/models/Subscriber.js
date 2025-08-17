// src/models/Subscriber.js (version 1.2)
import mongoose from 'mongoose'

const { Schema, model, models } = mongoose

const SubscriberSchema = new Schema(
  {
    // START: EXPLICITLY DEFINE _id TO ENSURE CORRECT TYPE
    _id: {
      type: Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(),
    },
    // END: EXPLICITLY DEFINE _id
    email: {
      type: String,
      required: [true, 'Email is required.'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, 'is invalid'],
    },
    password: {
      type: String,
      required: [true, 'Password is required.'],
      select: false, // Do not return password by default on general queries
    },
    firstName: {
      type: String,
      required: [true, 'First name is required.'],
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    countries: {
      type: [String],
      default: [],
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    emailNotificationsEnabled: {
      type: Boolean,
      default: true,
    },
    pushNotificationsEnabled: {
      type: Boolean,
      default: true,
    },
    subscriptionTier: {
      type: String,
      default: 'free',
    },
    isLifetimeFree: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'subscribers',
    _id: false, // <-- Important: Prevent Mongoose from creating a second _id
  }
)

export default models.Subscriber || model('Subscriber', SubscriberSchema)
