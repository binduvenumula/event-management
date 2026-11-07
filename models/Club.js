const mongoose = require('mongoose');

const CLUB_CATEGORIES = ['Technical', 'Cultural', 'Sports', 'Literary', 'Social Service', 'Entrepreneurship', 'Other'];

const clubSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, enum: CLUB_CATEGORIES, default: 'Other' },
    logo: { type: String, default: '' },
    banner: { type: String, default: '' },
    contactEmail: { type: String, trim: true, lowercase: true },
    socialLinks: {
      instagram: { type: String, default: '' },
      linkedin: { type: String, default: '' },
    },
    head: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Club', clubSchema);
module.exports.CLUB_CATEGORIES = CLUB_CATEGORIES;
