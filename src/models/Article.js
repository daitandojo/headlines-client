import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

const ArticleSchema = new Schema(
  {
    headline: { type: String, required: true },
    link: { type: String, required: true, unique: true },
    newspaper: { type: String, required: true },
    source: { type: String, required: true },
    relevance_headline: { type: Number, required: true },
    relevance_article: { type: Number },
    assessment_article: { type: String },
    articleContent: {
      contents: { type: [String], default: [] },
    },
    key_individuals: [{
        name: String,
        role_in_event: String,
        company: String,
    }],
  },
  {
    timestamps: true,
    collection: 'articles', // Ensure this matches your collection name
  }
);

// Use the existing model if it's already been compiled, otherwise compile it.
// This is crucial for Next.js's hot-reloading environment.
export default models.Article || model('Article', ArticleSchema);