// TruthLayer v0.2 — conservative API scaffold. No live retrieval or factual verdicts yet.
module.exports = function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'POST') { res.setHeader('Allow','POST'); return res.status(405).json({error:'Method not allowed'}); }
  const claim = req.body && typeof req.body.claim === 'string' ? req.body.claim.trim() : '';
  if (!claim || claim.length > 1000) return res.status(400).json({error:'Enter a claim between 1 and 1000 characters.'});
  const risk = /pay|payment|fee|upi|bank|otp|aadhaar|₹|rs\.?\s?\d/i.test(claim);
  return res.status(200).json({
    schema_version:'0.2', claim, label:'Unverified', verification_status:'NOT_PERFORMED',
    explanation:'This endpoint has not retrieved or authenticated official evidence. The claim is neither confirmed nor disproved.',
    evidence:[], retrieval_performed:false, independently_reviewed:false,
    source_starting_points:[{name:'National Scholarship Portal',url:'https://scholarships.gov.in/'},{name:'Ministry of Education',url:'https://www.education.gov.in/'}],
    safety:risk?'Do not pay or disclose OTP, UPI PIN, Aadhaar or banking details based on this claim. Confirm through the official portal and your college scholarship office.':'Check the responsible authority’s official scheme page for eligibility, dates and scope.',
    disclaimer:'Research demo only. An empty evidence array does not mean the claim is false.'
  });
};