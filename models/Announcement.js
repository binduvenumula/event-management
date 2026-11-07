const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Announcement', announcementSchema);
