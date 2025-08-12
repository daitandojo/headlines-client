// src/models/SynthesizedEvent.js (version 1.1)
import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

const SourceArticleSchema = new Schema({
  article_id: { type: Schema.Types.ObjectId, ref: 'Article' },
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
    },
    synthesized_headline: { type: String, required: true },
    synthesized_summary: { type: String, required: true },
    ai_assessment_reason: { type: String, required: false },
    country: { type: String, required: true, index: true },
    source_articles: { type: [SourceArticleSchema], required: true },
    highest_relevance_score: { type: Number, required: true },
    key_individuals: { type: [KeyIndividualSchema], required: true },
    event_date: { type: Date, default: Date.now },
  },
  {
    timestamps: true, // Enable createdAt and updatedAt fields
    collection: 'synthesized_events',
  }
);

export default models.SynthesizedEvent || model('SynthesizedEvent', SynthesizedEventSchema);