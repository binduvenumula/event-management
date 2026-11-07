const mongoose = require('mongoose');

const VOLUNTEER_ROLES = ['Logistics', 'Registration Desk', 'Publicity', 'Stage', 'Tech Support', 'Hospitality', 'Other'];

const registrationSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['participation', 'volunteer'], required: true },
    // participation: registered | cancelled      volunteer: pending | approved | rejected | withdrawn
    status: {
      type: String,
      enum: ['registered', 'cancelled', 'pending', 'approved', 'rejected', 'withdrawn'],
      required: true,
    },

    // participation form
    teamName: { type: String, trim: true },
    phone: { type: String, trim: true },
    additionalInfo: { type: String, trim: true },

    // volunteer form
    preferredRole: { type: String, enum: VOLUNTEER_ROLES },
    availability: { type: String, trim: true },
    experience: { type: String, trim: true },
    whyVolunteer: { type: String, trim: true },
    reviewNote: { type: String, trim: true },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

// One participation record and one volunteer record per student per event - never duplicates.
registrationSchema.index({ event: 1, student: 1, type: 1 }, { unique: true });
registrationSchema.index({ student: 1, type: 1 });

module.exports = mongoose.model('Registration', registrationSchema);
module.exports.VOLUNTEER_ROLES = VOLUNTEER_ROLES;
