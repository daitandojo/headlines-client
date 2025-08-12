// src/models/Article.js (version 2.1)
import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

const ArticleSchema = new Schema(
  {
    headline: { type: String, required: true },
    headline_en: { type: String }, // For English translation
    link: { type: String, required: true, unique: true },
    newspaper: { type: String, required: true },
    source: { type: String, required: true },
    country: { type: String },
    relevance_headline: { type: Number, required: true },
    relevance_article: { type: Number },
    assessment_article: { type: String },
    key_individuals: [{
        name: String,
        role_in_event: String,
        company: String,
        email_suggestion: { type: String },
    }],
  },
  {
    timestamps: true, // Enable createdAt and updatedAt fields
    collection: 'articles',
  }
);

export default models.Article || model('Article', ArticleSchema);