// src/models/SynthesizedEvent.js (version 2.0)
import mongoose from 'mongoose';

const { Schema, model, models } = mongoose;

const SourceArticleSchema = new Schema({
  headline: { type: String, required: true },
  link: { type: String, required: true },
  newspaper: { type: String, required: true },
}, { _id: false });

const KeyIndividualSchema = new Schema({
    name: String,
    role_in_event: String,
    company: String,
    email_suggestion: { type: String, required: false },
}, { _id: false });

const SynthesizedEventSchema = new Schema(
  {
    event_key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
      description: "A unique key for the event, e.g., 'acquisition-visma-innovateai-2024-05-20'",
    },
    synthesized_headline: { type: String, required: true, trim: true },
    synthesized_summary: { type: String, required: true, trim: true },
    ai_assessment_reason: { type: String, required: false },
    country: { type: String, required: true, index: true },
    source_articles: { type: [SourceArticleSchema], required: true },
    highest_relevance_score: { type: Number, required: true },
    key_individuals: { type: [KeyIndividualSchema], required: true },
    event_date: { type: Date, default: Date.now },
    emailed: { type: Boolean, default: false },
    email_sent_at: { type: Date },
  },
  {
    timestamps: true,
    collection: 'synthesized_events',
  }
);

SynthesizedEventSchema.index({ event_date: -1 });
SynthesizedEventSchema.index({ country: 1, createdAt: -1 });

export default models.SynthesizedEvent || model('SynthesizedEvent', SynthesizedEventSchema);