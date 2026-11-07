// Clears the database and fills it with demo data:  npm run seed
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Club = require('./models/Club');
const Event = require('./models/Event');
const Registration = require('./models/Registration');
const Announcement = require('./models/Announcement');
const Notification = require('./models/Notification');

// UTC-midnight date N days from today (matches how the API stores event dates)
const day = (n) => {
  const t = new Date();
  return new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate() + n));
};
// Registration deadline: N days from today at 17:00 local time
const deadline = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(17, 0, 0, 0);
  return d;
};
const ago = (hours) => new Date(Date.now() - hours * 3600 * 1000);

const unsplash = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=70`;

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([User, Club, Event, Registration, Announcement, Notification].map((m) => m.deleteMany({})));
  // make sure indexes (incl. the unique compound one) exist
  await Promise.all([User, Club, Event, Registration].map((m) => m.syncIndexes()));

  const hash = (p) => bcrypt.hashSync(p, 10);
  const pwStudent = hash('Student@123');

  /* ---- President ---- */
  const president = await User.create({ name: 'Dr. R. Venkateswarlu (President)', email: 'president@vfstr.edu', password: 'President@123', role: 'president', phone: '9000000000' });

  /* ---- Clubs + heads ---- */
  const clubDefs = [
    { slug: 'coding-club', name: 'Coding Club', category: 'Technical', head: 'Ravi Teja', description: 'The home of competitive programmers, open-source contributors and hackathon enthusiasts at VFSTR. We run weekly contests, bootcamps and the annual CodeStorm hackathon.', instagram: 'https://instagram.com/vfstr.codingclub', linkedin: 'https://linkedin.com/company/vfstr-coding-club', banner: unsplash('photo-1517694712202-14dd9538aa97') },
    { slug: 'robotics-club', name: 'Robotics Club', category: 'Technical', head: 'Sneha Reddy', description: 'Build, program and race robots. From line followers to drones, the Robotics Club gives hands-on experience with electronics, embedded systems and automation.', instagram: 'https://instagram.com/vfstr.robotics', linkedin: '', banner: unsplash('photo-1485827404703-89b55fcc595e') },
    { slug: 'cultural-club', name: 'Cultural Club', category: 'Cultural', head: 'Anusha Devi', description: 'Music, dance, drama and fine arts. The Cultural Club organises Vignan Utsav, freshers talent shows and inter-college cultural competitions throughout the year.', instagram: 'https://instagram.com/vfstr.cultural', linkedin: '', banner: unsplash('photo-1514525253161-7a46d19cd819') },
    { slug: 'sports-club', name: 'Sports Club', category: 'Sports', head: 'Kiran Kumar', description: 'Cricket, football, volleyball, athletics and more. We organise inter-department tournaments and prepare teams for university-level championships.', instagram: 'https://instagram.com/vfstr.sports', linkedin: '', banner: unsplash('photo-1461896836934-ffe607ba8211') },
    { slug: 'literary-club', name: 'Literary Club', category: 'Literary', head: 'Meghana Rao', description: 'For readers, writers and debaters. Book readings, poetry slams, quizzes and debates that keep the spirit of literature alive on campus.', instagram: 'https://instagram.com/vfstr.literary', linkedin: '', banner: unsplash('photo-1481627834876-b7833e8f5570') },
    { slug: 'nss-club', name: 'NSS / Social Service Club', category: 'Social Service', head: 'Praveen Chandra', description: 'Serving society through blood donation camps, tree plantation drives, rural outreach and awareness programmes under the National Service Scheme.', instagram: 'https://instagram.com/vfstr.nss', linkedin: '', banner: unsplash('photo-1559027615-cd4628902d4a') },
  ];
  const clubs = {};
  for (const d of clubDefs) {
    const club = await Club.create({
      name: d.name, slug: d.slug, category: d.category, description: d.description, banner: d.banner,
      contactEmail: `${d.slug}@vfstr.edu`, socialLinks: { instagram: d.instagram, linkedin: d.linkedin },
    });
    const head = await User.create({ name: d.head, email: `${d.slug}@vfstr.edu`, password: 'Club@123', role: 'club', club: club._id, phone: '9111111111' });
    club.head = head._id;
    await club.save();
    clubs[d.slug] = { club, head };
  }

  /* ---- Students ---- */
  const branches = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'CSE', 'AI&DS', 'ECE', 'CSE'];
  const names = ['Aarav Sharma', 'Priya Nair', 'Rohit Varma', 'Sai Keerthi', 'Harsha Vardhan', 'Divya Teja', 'Manoj Kumar', 'Lakshmi Prasanna', 'Tarun Reddy', 'Bhavana Chowdary'];
  const students = [];
  for (let i = 0; i < 10; i++) {
    students.push({
      name: names[i], email: `student${i + 1}@vfstr.edu`, password: pwStudent, role: 'student',
      rollNumber: `22PA1A05${String(i + 1).padStart(2, '0')}`, branch: branches[i], year: (i % 4) + 1, phone: `98${String(48000000 + i * 1111).slice(0, 8)}`,
    });
  }
  // insertMany skips the pre-save hook, so we pass already-hashed passwords
  const S = await User.insertMany(students);
  const stu = (n) => S[n - 1]._id;

  /* ---- Events ---- */
  const common = { registrationDeadline: deadline(5) };
  const evDefs = [
    // ---- approved ----
    { key: 'hack', club: 'coding-club', status: 'approved', title: 'CodeStorm 2026 - 24 Hour Hackathon', category: 'Technical', date: day(20), startTime: '09:00', endTime: '18:00', venue: 'Innovation Hub, Block C', registrationDeadline: deadline(15), participantCapacity: 120, volunteerCapacity: 10, isVolunteerNeeded: true, tags: ['hackathon', 'coding', 'teams'], poster: unsplash('photo-1504384308090-c894fdcc538d'), description: 'VFSTR\'s flagship 24-hour hackathon. Form teams of up to four, pick a problem statement in web, mobile or AI, and build a working prototype overnight. Mentors from industry will guide you, and there are cash prizes plus internship offers for the top teams.' },
    { key: 'git', club: 'coding-club', status: 'approved', title: 'Git & GitHub Workshop for Beginners', category: 'Workshop', date: day(-25), startTime: '14:00', endTime: '16:30', venue: 'CS Seminar Hall', registrationDeadline: deadline(-28), participantCapacity: 60, volunteerCapacity: 0, isVolunteerNeeded: false, tags: ['git', 'workshop'], poster: unsplash('photo-1556075798-4825dfaaf498'), description: 'A hands-on introduction to version control: commits, branches, pull requests and collaborating on open-source projects.' },
    { key: 'robo', club: 'robotics-club', status: 'approved', title: 'Robotics Workshop: Build Your First Line Follower', category: 'Workshop', date: day(6), startTime: '10:00', endTime: '16:00', venue: 'Robotics Lab, ECE Block', registrationDeadline: deadline(3), participantCapacity: 5, volunteerCapacity: 3, isVolunteerNeeded: true, tags: ['robotics', 'arduino', 'workshop'], poster: '', description: 'Assemble and program a line-following robot using Arduino, IR sensors and motor drivers. Kits are provided. Seats are very limited so that every participant gets hands-on time.' },
    { key: 'utsav', club: 'cultural-club', status: 'approved', title: 'Vignan Utsav - Cultural Fest Night', category: 'Cultural', date: day(14), startTime: '17:00', endTime: '22:30', venue: 'Open Air Auditorium', registrationDeadline: deadline(10), participantCapacity: 500, volunteerCapacity: 25, isVolunteerNeeded: true, tags: ['fest', 'music', 'dance'], poster: unsplash('photo-1470229722913-7c0e2dbbafd3'), description: 'An evening of music, dance, drama and fashion. Showcase your talent on stage or enjoy performances from your friends, followed by a DJ night under the stars.' },
    { key: 'fresh', club: 'cultural-club', status: 'approved', title: 'Freshers Talent Show', category: 'Cultural', date: day(-12), startTime: '16:00', endTime: '19:00', venue: 'Main Auditorium', registrationDeadline: deadline(-15), participantCapacity: 200, volunteerCapacity: 8, isVolunteerNeeded: true, tags: ['freshers', 'talent'], poster: unsplash('photo-1501386761578-eac5c94b800a'), description: 'A welcome stage for first-year students to show their singing, dancing, mimicry and stand-up skills.' },
    { key: 'cricket', club: 'sports-club', status: 'approved', title: 'Inter-Department Cricket Tournament', category: 'Sports', date: day(3), startTime: '08:00', endTime: '17:00', venue: 'VFSTR Cricket Ground', registrationDeadline: deadline(-1), participantCapacity: 64, volunteerCapacity: 6, isVolunteerNeeded: true, tags: ['cricket', 'tournament'], poster: unsplash('photo-1531415074968-036ba1b575da'), description: 'Knockout T10 tournament between departments. Registrations are closed - the fixtures will be shared on the notice board.' },
    { key: 'book', club: 'literary-club', status: 'approved', title: 'Book Reading Session: Wings of Fire', category: 'Literary', date: day(5), startTime: '15:30', endTime: '17:30', venue: 'Central Library, Reading Room', registrationDeadline: deadline(4), participantCapacity: 40, volunteerCapacity: 0, isVolunteerNeeded: false, tags: ['books', 'reading'], poster: unsplash('photo-1512820790803-83ca734da794'), description: 'Join us for a guided reading and discussion of Dr. A.P.J. Abdul Kalam\'s autobiography. Bring your own copy or borrow one from the library.' },
    { key: 'blood', club: 'nss-club', status: 'approved', title: 'Blood Donation Camp', category: 'Social Service', date: day(9), startTime: '09:30', endTime: '15:00', venue: 'Health Centre, VFSTR Campus', registrationDeadline: deadline(7), participantCapacity: 150, volunteerCapacity: 12, isVolunteerNeeded: true, tags: ['nss', 'donation', 'health'], poster: '', description: 'Organised with the district blood bank. Every donor receives a certificate and refreshments. Volunteers are needed for registration, donor guidance and refreshments.' },
    // ---- pending ----
    { key: 'cloud', club: 'coding-club', status: 'pending', title: 'Cloud & Web3 Workshop', category: 'Workshop', date: day(30), startTime: '10:00', endTime: '16:00', venue: 'CS Lab 2', registrationDeadline: deadline(25), participantCapacity: 50, volunteerCapacity: 4, isVolunteerNeeded: true, tags: ['cloud', 'web3'], poster: unsplash('photo-1451187580459-43490279c0fa'), description: 'Deploy your first app on the cloud and understand smart contracts with hands-on labs.' },
    { key: 'robowars', club: 'robotics-club', status: 'pending', title: 'RoboWars 2026', category: 'Competition', date: day(40), startTime: '09:00', endTime: '17:00', venue: 'Sports Arena', registrationDeadline: deadline(33), participantCapacity: 32, volunteerCapacity: 10, isVolunteerNeeded: true, tags: ['robotics', 'competition'], poster: unsplash('photo-1561144257-e32e8efc6c4f'), description: 'Combat robots battle it out in the arena. Weight limit 8 kg. Rules will be shared after approval.' },
    { key: 'poetry', club: 'literary-club', status: 'pending', title: 'Open Mic & Poetry Slam', category: 'Literary', date: day(22), startTime: '17:00', endTime: '19:30', venue: 'Amphitheatre', registrationDeadline: deadline(18), participantCapacity: 60, volunteerCapacity: 0, isVolunteerNeeded: false, tags: ['poetry', 'open mic'], poster: '', description: 'Perform an original poem or story in Telugu, Hindi or English. Three minutes per participant.' },
    // ---- rejected ----
    { key: 'drone', club: 'robotics-club', status: 'rejected', rejectionReason: 'Venue permission has not been confirmed. Please attach the ground-clearance approval from the Dean and resubmit.', title: 'Drone Basics & Flying Demo', category: 'Workshop', date: day(25), startTime: '10:00', endTime: '15:00', venue: 'Main Ground', registrationDeadline: deadline(20), participantCapacity: 40, volunteerCapacity: 5, isVolunteerNeeded: true, tags: ['drone'], poster: unsplash('photo-1473968512647-3e447244af8f'), description: 'Learn the basics of quadcopter flight and watch a live demo by certified pilots.' },
    { key: 'kabaddi', club: 'sports-club', status: 'rejected', rejectionReason: 'The proposed date clashes with the mid-semester examinations. Please choose a date after exams.', title: 'Inter-College Kabaddi Cup', category: 'Sports', date: day(18), startTime: '09:00', endTime: '18:00', venue: 'Indoor Stadium', registrationDeadline: deadline(12), participantCapacity: 96, volunteerCapacity: 8, isVolunteerNeeded: true, tags: ['kabaddi'], poster: '', description: 'Eight college teams compete for the Vignan Kabaddi Cup.' },
    // ---- draft ----
    { key: 'plant', club: 'nss-club', status: 'draft', title: 'Tree Plantation Drive', category: 'Social Service', date: day(45), startTime: '07:30', endTime: '11:00', venue: 'Campus Green Belt', registrationDeadline: deadline(40), participantCapacity: 200, volunteerCapacity: 15, isVolunteerNeeded: true, tags: ['green', 'nss'], poster: '', description: 'Plant 500 saplings across the campus green belt and adopt one for the year.' },
  ];

  const ev = {};
  for (const d of evDefs) {
    const { key, club, ...rest } = d;
    const doc = { ...common, ...rest, club: clubs[club].club._id };
    if (doc.status === 'approved') { doc.approvedBy = president._id; doc.approvedAt = ago(24 * 10); }
    ev[key] = await Event.create(doc);
  }

  /* ---- Registrations ---- */
  const regs = [];
  const part = (event, students_, extra = {}) => students_.forEach((n) =>
    regs.push({ event: ev[event]._id, student: stu(n), type: 'participation', status: 'registered', phone: S[n - 1].phone, ...extra }));
  const vol = (event, n, status, role, why, note = '') =>
    regs.push({ event: ev[event]._id, student: stu(n), type: 'volunteer', status, preferredRole: role,
      availability: 'Weekdays after 4 PM and weekends', experience: n % 2 ? 'Volunteered at college fest last year' : '', whyVolunteer: why, reviewNote: note, reviewedAt: status === 'pending' ? undefined : ago(20) });

  part('hack', [1, 2, 3, 4, 5, 6, 7, 8], { teamName: 'Team Alpha' });
  vol('hack', 2, 'pending', 'Registration Desk', 'I want to help the hackathon run smoothly and meet mentors.');
  vol('hack', 3, 'approved', 'Tech Support', 'I enjoy helping teams debug their setups.', 'Great, please report at 8:00 AM.');
  vol('hack', 4, 'rejected', 'Stage', 'Would love to anchor the opening ceremony.', 'Stage team is already full, thank you for applying.');
  vol('hack', 9, 'approved', 'Logistics', 'Interested in event management.');

  part('git', [1, 2, 3]);
  part('robo', [1, 2, 3, 4, 5], { teamName: '' }); // capacity 5 -> Full
  vol('robo', 6, 'pending', 'Tech Support', 'I own an Arduino kit and can help beginners.');
  part('utsav', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  vol('utsav', 1, 'approved', 'Stage', 'I have anchored events in school.');
  vol('utsav', 5, 'pending', 'Publicity', 'I can design posters and manage social media.');
  vol('utsav', 7, 'approved', 'Hospitality', 'Happy to help with guests.');
  part('fresh', [4, 5, 6, 7]);
  vol('fresh', 8, 'approved', 'Registration Desk', 'Help new students feel welcome.');
  part('cricket', [3, 6, 9]);
  part('book', [2, 5, 10]);
  regs.push({ event: ev.book._id, student: stu(7), type: 'participation', status: 'cancelled', phone: S[6].phone });
  part('blood', [1, 2, 3, 4]);
  vol('blood', 5, 'approved', 'Registration Desk', 'I donate regularly and want to encourage others.');
  vol('blood', 6, 'pending', 'Logistics', 'Available all day.');
  await Registration.insertMany(regs);

  /* ---- Announcements ---- */
  const anns = await Announcement.insertMany([
    { event: ev.hack._id, club: clubs['coding-club'].club._id, createdBy: clubs['coding-club'].head._id, title: 'Problem statements released', message: 'Problem statements are now available on the Coding Club notice board. Teams must finalise their choice by midnight before the event.' },
    { event: ev.utsav._id, club: clubs['cultural-club'].club._id, createdBy: clubs['cultural-club'].head._id, title: 'Reporting time and dress code', message: 'Performers must report by 3:30 PM at the green room. Festive ethnic wear is encouraged for everyone.' },
    { event: ev.robo._id, club: clubs['robotics-club'].club._id, createdBy: clubs['robotics-club'].head._id, title: 'Bring your laptop', message: 'Please bring a laptop with Arduino IDE installed. Kits and sensors will be provided at the lab.' },
    { event: ev.blood._id, club: clubs['nss-club'].club._id, createdBy: clubs['nss-club'].head._id, title: 'Eat well before donating', message: 'Please have a proper breakfast and carry your college ID card. Donors must be 18 or older and weigh at least 50 kg.' },
  ]);

  /* ---- Notifications ---- */
  const notes = [];
  const push = (user, title, message, link, type, hoursAgo, isRead = false) =>
    notes.push({ user, title, message, link, type, isRead, createdAt: ago(hoursAgo), updatedAt: ago(hoursAgo) });
  [1, 2, 3, 4, 5, 6, 7, 8].forEach((n) => push(stu(n), `${ev.hack.title}: ${anns[0].title}`, anns[0].message, `/events/${ev.hack._id}`, 'announcement', 5 + n));
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach((n) => push(stu(n), `${ev.utsav.title}: ${anns[1].title}`, anns[1].message, `/events/${ev.utsav._id}`, 'announcement', 3, n > 6));
  [1, 2, 3, 4, 5].forEach((n) => push(stu(n), `${ev.robo.title}: ${anns[2].title}`, anns[2].message, `/events/${ev.robo._id}`, 'announcement', 8));
  push(stu(3), 'Volunteer application approved', `Your application for "${ev.hack.title}" was approved. Note: Great, please report at 8:00 AM.`, '/student/registrations?tab=volunteer', 'volunteer_approved', 30);
  push(stu(4), 'Volunteer application rejected', `Your application for "${ev.hack.title}" was rejected. Note: Stage team is already full, thank you for applying.`, '/student/registrations?tab=volunteer', 'volunteer_rejected', 30);
  push(stu(1), 'Volunteer application approved', `Your application for "${ev.utsav.title}" was approved.`, '/student/registrations?tab=volunteer', 'volunteer_approved', 40);
  push(stu(5), 'Volunteer application approved', `Your application for "${ev.blood.title}" was approved.`, '/student/registrations?tab=volunteer', 'volunteer_approved', 12);
  // club heads: approvals / rejections
  for (const [k, c, t, ty, m] of [
    ['hack', 'coding-club', 'Event approved', 'event_approved', 'is now live in the public events feed.'],
    ['robo', 'robotics-club', 'Event approved', 'event_approved', 'is now live in the public events feed.'],
    ['drone', 'robotics-club', 'Event rejected', 'event_rejected', `: ${ev.drone.rejectionReason}`],
    ['kabaddi', 'sports-club', 'Event rejected', 'event_rejected', `: ${ev.kabaddi.rejectionReason}`],
  ]) {
    push(clubs[c].head._id, t, `"${ev[k].title}"${ty === 'event_approved' ? ' ' : ''}${m}`, '/club/events', ty, 48);
  }
  // president: pending queue
  for (const k of ['cloud', 'robowars', 'poetry']) {
    push(president._id, 'New event awaiting approval', `"${ev[k].title}" was submitted for review.`, '/president/approvals', 'event_submitted', 6);
  }
  await Notification.insertMany(notes);

  console.log('\nSeed complete.');
  console.log(`  ${await User.countDocuments()} users, ${await Club.countDocuments()} clubs, ${await Event.countDocuments()} events, ${await Registration.countDocuments()} registrations`);
  console.log('  President: president@vfstr.edu / President@123');
  console.log('  Club heads: <slug>@vfstr.edu / Club@123   (e.g. coding-club@vfstr.edu)');
  console.log('  Students: student1@vfstr.edu ... student10@vfstr.edu / Student@123\n');
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
