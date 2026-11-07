const mongoose = require('mongoose');

const EVENT_CATEGORIES = [
  'Technical', 'Cultural', 'Sports', 'Literary', 'Social Service',
  'Workshop', 'Competition', 'Entrepreneurship', 'Other',
];

const eventSchema = new mongoose.Schema(
  {
    club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, enum: EVENT_CATEGORIES, default: 'Other' },
    poster: { type: String, default: '' }, // "/uploads/xyz.jpg" or a full URL
    // `date` is stored as UTC midnight of the event day; times are plain "HH:MM" strings.
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    venue: { type: String, required: true, trim: true },
    registrationDeadline: { type: Date, required: true },
    participantCapacity: { type: Number, required: true, min: 1 },
    volunteerCapacity: { type: Number, default: 0, min: 0 }, // 0 = volunteering not needed
    isVolunteerNeeded: { type: Boolean, default: false },
    status: { type: String, enum: ['draft', 'pending', 'approved', 'rejected'], default: 'draft' },
    rejectionReason: { type: String, default: '' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    tags: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

eventSchema.index({ status: 1, date: 1 });

module.exports = mongoose.model('Event', eventSchema);
module.exports.EVENT_CATEGORIES = EVENT_CATEGORIES;
