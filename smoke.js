// API smoke test.  Start the server, run `npm run seed`, then `npm run smoke`.
// Exercises the main business rules from the acceptance checklist. Re-seed afterwards.
const BASE = process.env.API_URL || 'http://localhost:5000/api';
let passed = 0, failed = 0;

async function call(method, path, { token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* csv etc. */ }
  return { status: res.status, json, data: json?.data };
}
const check = (name, cond, extra = '') => {
  cond ? passed++ : failed++;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : '  ' + extra}`);
};
const login = async (email, password) => (await call('POST', '/auth/login', { body: { email, password } })).data.token;
const future = (days) => new Date(Date.now() + days * 864e5).toISOString().slice(0, 10);
const eventBody = (over = {}) => ({
  title: 'Smoke Test Event', description: 'Created by smoke test', category: 'Technical', date: future(20),
  startTime: '10:00', endTime: '12:00', venue: 'Room 1', registrationDeadline: new Date(Date.now() + 10 * 864e5).toISOString(),
  participantCapacity: 2, isVolunteerNeeded: true, volunteerCapacity: 1, ...over,
});

(async () => {
  const P = await login('president@vfstr.edu', 'President@123');
  const coding = await login('coding-club@vfstr.edu', 'Club@123');
  const robotics = await login('robotics-club@vfstr.edu', 'Club@123');
  const s1 = await login('student1@vfstr.edu', 'Student@123');
  const s2 = await login('student2@vfstr.edu', 'Student@123');
  const s9 = await login('student9@vfstr.edu', 'Student@123');

  // --- auth
  check('bad password -> 401', (await call('POST', '/auth/login', { body: { email: 'student1@vfstr.edu', password: 'nope123' } })).status === 401);
  const su = await call('POST', '/auth/signup', { body: { name: 'New Kid', email: `kid${Date.now()}@vfstr.edu`, password: 'secret12', rollNumber: '1', branch: 'CSE', year: 2, phone: '9876543210', role: 'president' } });
  check('signup always creates student (role ignored)', su.status === 201 && su.data.user.role === 'student' && !su.data.user.password);
  check('no token -> 401', (await call('GET', '/auth/me')).status === 401);

  // --- president creates a club + head login, head logs in immediately
  const stamp = Date.now();
  const mk = await call('POST', '/clubs', { token: P, body: { name: `Smoke Club ${stamp}`, description: 'Test club', category: 'Technical', contactEmail: 'smoke@vfstr.edu', head: { name: 'Smoke Head', email: `smoke${stamp}@vfstr.edu`, password: 'Smoke@123' } } });
  check('president creates club + head', mk.status === 201, JSON.stringify(mk.json));
  const newHead = await call('POST', '/auth/login', { body: { email: `smoke${stamp}@vfstr.edu`, password: 'Smoke@123' } });
  check('new head can log in right away', newHead.status === 200 && newHead.data.user.role === 'club');
  check('club head cannot create clubs (403)', (await call('POST', '/clubs', { token: coding, body: {} })).status === 403);
  await call('PATCH', `/clubs/${mk.data._id}/status`, { token: P });
  check('deactivated club head cannot log in', (await call('POST', '/auth/login', { body: { email: `smoke${stamp}@vfstr.edu`, password: 'Smoke@123' } })).status === 403);
  check('deactivated club hidden from public list', !(await call('GET', '/clubs')).data.some((c) => c._id === mk.data._id));
  check('president deletes club', (await call('DELETE', `/clubs/${mk.data._id}`, { token: P })).status === 200);

  // --- event lifecycle
  check('past date rejected on create', (await call('POST', '/events', { token: coding, body: eventBody({ date: '2020-01-01' }) })).status === 400);
  check('deadline after event rejected', (await call('POST', '/events', { token: coding, body: eventBody({ registrationDeadline: new Date(Date.now() + 40 * 864e5).toISOString() }) })).status === 400);
  check('end before start rejected', (await call('POST', '/events', { token: coding, body: eventBody({ endTime: '09:00' }) })).status === 400);
  const created = await call('POST', '/events', { token: coding, body: eventBody() });
  check('club creates draft event', created.status === 201 && created.data.status === 'draft', JSON.stringify(created.json));
  const evId = created.data._id;
  check('draft hidden from student by id (404)', (await call('GET', `/events/${evId}`, { token: s1 })).status === 404);
  check('draft hidden from anonymous (404)', (await call('GET', `/events/${evId}`)).status === 404);
  check('owner can fetch own draft', (await call('GET', `/events/${evId}`, { token: coding })).status === 200);
  check('draft not in feed', !(await call('GET', '/events?limit=50')).data.events.some((e) => e._id === evId));

  // ownership: Robotics head vs Coding event
  check('other club head edit -> 403', (await call('PUT', `/events/${evId}`, { token: robotics, body: eventBody() })).status === 403);
  check('other club head delete -> 403', (await call('DELETE', `/events/${evId}`, { token: robotics })).status === 403);
  check('other club head view participants -> 403', (await call('GET', `/events/${evId}/participants`, { token: robotics })).status === 403);
  check('other club head view volunteers -> 403', (await call('GET', `/events/${evId}/volunteers`, { token: robotics })).status === 403);
  check('other club head announce -> 403', (await call('POST', `/events/${evId}/announcements`, { token: robotics, body: { title: 'x', message: 'y' } })).status === 403);

  check('submit event', (await call('PATCH', `/events/${evId}/submit`, { token: coding })).status === 200);
  check('pending event hidden from student', (await call('GET', `/events/${evId}`, { token: s1 })).status === 404);
  const queue = await call('GET', '/events/admin/all?status=pending', { token: P });
  check('event appears in president queue', queue.data.some((e) => e._id === evId));
  check('president notified of submission', (await call('GET', '/notifications', { token: P })).data.items.some((n) => n.type === 'event_submitted'));
  check('reject needs a reason', (await call('PATCH', `/events/${evId}/reject`, { token: P, body: {} })).status === 400);
  check('reject with reason', (await call('PATCH', `/events/${evId}/reject`, { token: P, body: { reason: 'Needs a bigger venue' } })).status === 200);
  const rej = await call('GET', `/events/${evId}`, { token: coding });
  check('club head sees rejection reason', rej.data.status === 'rejected' && rej.data.rejectionReason === 'Needs a bigger venue');
  check('rejected event hidden from student', (await call('GET', `/events/${evId}`, { token: s1 })).status === 404);
  check('resubmit rejected event', (await call('PATCH', `/events/${evId}/submit`, { token: coding })).status === 200);
  check('student cannot approve (403)', (await call('PATCH', `/events/${evId}/approve`, { token: s1 })).status === 403);
  check('approve event', (await call('PATCH', `/events/${evId}/approve`, { token: P })).status === 200);
  check('head notified of approval', (await call('GET', '/notifications', { token: coding })).data.items.some((n) => n.type === 'event_approved' && n.message.includes('Smoke Test')));
  check('approved event in public feed', (await call('GET', '/events?limit=50&q=Smoke')).data.events.some((e) => e._id === evId));
  check('approved event visible to student by id', (await call('GET', `/events/${evId}`, { token: s1 })).status === 200);

  // --- registrations
  const form = { phone: '9876543210', teamName: 'T1' };
  check('student participates', (await call('POST', `/events/${evId}/participate`, { token: s1, body: form })).status === 201);
  check('duplicate participation -> 409', (await call('POST', `/events/${evId}/participate`, { token: s1, body: form })).status === 409);
  const vol = { preferredRole: 'Logistics', availability: 'Evenings', whyVolunteer: 'Want to help' };
  check('same student volunteers too', (await call('POST', `/events/${evId}/volunteer`, { token: s1, body: vol })).status === 201);
  check('duplicate volunteer -> 409', (await call('POST', `/events/${evId}/volunteer`, { token: s1, body: vol })).status === 409);
  check('second participant ok', (await call('POST', `/events/${evId}/participate`, { token: s2, body: form })).status === 201);
  const full = await call('POST', `/events/${evId}/participate`, { token: s9, body: form });
  check('capacity full -> blocked "Event full"', full.status === 409 && /full/i.test(full.json.message), JSON.stringify(full.json));
  check('club cannot participate (403)', (await call('POST', `/events/${evId}/participate`, { token: coding, body: form })).status === 403);

  const seeded = (await call('GET', '/events?scope=all&limit=50')).data.events;
  const cricket = seeded.find((e) => e.title.startsWith('Inter-Department Cricket'));
  const closed = await call('POST', `/events/${cricket._id}/participate`, { token: s1, body: form });
  check('deadline passed -> blocked', closed.status === 400 && /deadline/i.test(closed.json.message), JSON.stringify(closed.json));
  const noVol = seeded.find((e) => e.title.startsWith('Book Reading'));
  check('volunteering blocked when not needed', (await call('POST', `/events/${noVol._id}/volunteer`, { token: s9, body: vol })).status === 400);
  const robo = seeded.find((e) => e.title.startsWith('Robotics Workshop'));
  check('seeded low-capacity event is full', (await call('POST', `/events/${robo._id}/participate`, { token: s9, body: form })).status === 409);

  // --- volunteer review
  const vols = await call('GET', `/events/${evId}/volunteers`, { token: coding });
  const volReg = vols.data.registrations[0];
  check('club sees volunteer application', vols.data.registrations.length === 1);
  check('other club cannot review (403)', (await call('PATCH', `/registrations/${volReg._id}/review`, { token: robotics, body: { status: 'approved' } })).status === 403);
  check('approve volunteer', (await call('PATCH', `/registrations/${volReg._id}/review`, { token: coding, body: { status: 'approved', reviewNote: 'Welcome!' } })).status === 200);
  check('student notified of approval', (await call('GET', '/notifications', { token: s1 })).data.items.some((n) => n.type === 'volunteer_approved' && n.message.includes('Smoke')));
  const mine = await call('GET', '/registrations/mine?type=volunteer', { token: s1 });
  check('student sees approved status', mine.data.some((r) => r.event._id === evId && r.status === 'approved'));
  check('student cannot withdraw approved', (await call('DELETE', `/events/${evId}/volunteer`, { token: s1 })).status === 400);

  // --- announcements -> notifications
  const ann = await call('POST', `/events/${evId}/announcements`, { token: coding, body: { title: 'Venue update', message: 'Moved to Room 2' } });
  check('announcement posted, 2 notified', ann.status === 201 && ann.data.notified === 2, JSON.stringify(ann.json));
  check('student gets announcement notification', (await call('GET', '/notifications', { token: s2 })).data.items.some((n) => n.type === 'announcement' && n.title.includes('Venue update')));
  check('non-registered student not notified', !(await call('GET', '/notifications', { token: s9 })).data.items.some((n) => n.title.includes('Venue update')));
  check('announcements public', (await call('GET', `/events/${evId}/announcements`)).data.length === 1);

  // --- cancel + csv + export
  check('student cancels participation', (await call('DELETE', `/events/${evId}/participate`, { token: s2 })).status === 200);
  const csv = await fetch(`${BASE}/events/${evId}/participants/export`, { headers: { Authorization: `Bearer ${coding}` } });
  check('CSV export works', csv.status === 200 && (await csv.text()).includes('Roll Number'));
  check('CSV export forbidden for other club', (await fetch(`${BASE}/events/${evId}/participants/export`, { headers: { Authorization: `Bearer ${robotics}` } })).status === 403);

  // --- editing approved event -> pending
  const edit = await call('PUT', `/events/${evId}`, { token: coding, body: eventBody({ title: 'Smoke Test Event v2' }) });
  check('editing approved event sends it back to pending', edit.status === 200 && (await call('GET', `/events/${evId}`, { token: coding })).data.status === 'pending');
  check('edited event leaves public feed', (await call('GET', `/events/${evId}`, { token: s1 })).status === 404);

  // --- filters + stats
  const f = await call('GET', '/events?category=Cultural&open=true');
  check('category + open filters combine', f.data.events.every((e) => e.category === 'Cultural' && !e.registrationClosed));
  check('search by keyword', (await call('GET', '/events?q=hackathon')).data.events.length >= 1);
  check('invalid id -> 400', (await call('GET', '/events/not-an-id')).status === 400);
  const ps = (await call('GET', '/stats/president', { token: P })).data;
  check('president stats', ps.totalClubs === 6 && ps.pendingApprovals >= 3 && ps.registrationsPerClub.length === 6);
  check('club stats', (await call('GET', '/stats/club', { token: coding })).data.totalEvents >= 3);
  check('student stats', (await call('GET', '/stats/student', { token: s1 })).data.registeredCount >= 1);
  check('students cannot see president stats (403)', (await call('GET', '/stats/president', { token: s1 })).status === 403);
  check('mark all notifications read', (await call('PATCH', '/notifications/read-all', { token: s1 })).status === 200 && (await call('GET', '/notifications', { token: s1 })).data.unread === 0);
  check('unknown route -> 404 JSON', (await call('GET', '/nope')).status === 404);

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error('Smoke test crashed:', e); process.exit(1); });
