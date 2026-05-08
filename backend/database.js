// In-memory data store (no SQLite native compilation needed)
const requests = [];

function initializeDB() {
  if (requests.length > 0) return;
  const ago = d => new Date(Date.now() - d * 86400000).toISOString();
  const seeds = [
    ['REQ-001','Sarah Johnson','EMP-1042','NOPO','Procurement','Emergency procurement of network infrastructure equipment for data center upgrade. Vendor has been pre-approved by IT committee.',78500,'nopo_approval_form.pdf','Under Review','High','Request from Sarah Johnson (Procurement) for NOPO - NOPO routing. Amount: $78500. Risk: High. AI recommends: Review Further.','Review Further','NOPO',[],2,ago(2)],
    ['REQ-002','Michael Chen','EMP-2071','Rush','IT','URGENT: Production server is down. Need immediate purchase of replacement hardware to restore service. This is a critical blocker for all operations.',15200,'incident_report.pdf','Approved','Medium','Request from Michael Chen (IT) for Rush - Rush routing. Amount: $15200. Risk: Medium. Urgency indicators detected in description. AI recommends: Review Further.','Review Further','Rush',[],2,ago(1)],
    ['REQ-003','Emily Rodriguez','EMP-3018','Standard','Marketing','Annual subscription renewal for marketing analytics platform. Budget approved in Q1 planning.',4800,'vendor_quote.pdf','Approved','Low','Request from Emily Rodriguez (Marketing) for Standard - Standard routing. Amount: $4800. Risk: Low. AI recommends: Approve.','Approve','Standard',[],1,ago(3)],
    ['REQ-004','James Wilson','EMP-4055','PERN','Finance','Purchase of enterprise resource planning software license for finance department automation and compliance reporting.',32000,null,'Pending','High','Request from James Wilson (Finance) for PERN - PERN routing. Amount: $32000. Risk: High. AI recommends: Review Further.','Review Further','PERN',['⚠️ Mandatory policy attachment missing.'],1,ago(4)],
    ['REQ-005','Lisa Park','EMP-5033','Rush','Operations','Asap replacement of critical manufacturing equipment that failed inspection. Production line is at risk.',28900,'maintenance_report.pdf','Pending','High','Request from Lisa Park (Operations) for Rush - Rush routing. Amount: $28900. Risk: High. Urgency indicators detected in description. AI recommends: Review Further.','Review Further','Rush',[],1,ago(5)],
    ['REQ-006','David Thompson','EMP-6022','Standard','HR','Office furniture and equipment for new employee onboarding batch of 10 staff members joining next month.',7500,'furniture_quote.pdf','Pending','Low','Request from David Thompson (HR) for Standard - Standard routing. Amount: $7500. Risk: Low. AI recommends: Approve.','Approve','Standard',[],1,ago(6)],
    ['REQ-007','Amanda Foster','EMP-7091','NOPO','Legal','Outside counsel fees for ongoing contract negotiation with strategic partner. Requires immediate approval.',55000,'legal_engagement_letter.pdf','Rejected','High','Request from Amanda Foster (Legal) for NOPO - NOPO routing. Amount: $55000. Risk: High. Urgency indicators detected in description. AI recommends: Review Further.','Review Further','NOPO',[],3,ago(7)],
    ['REQ-008','Robert Kim','EMP-8044','Standard','IT','Software development tools and IDE licenses for the engineering team annual renewal.',2400,'renewal_invoice.pdf','Approved','Low','Request from Robert Kim (IT) for Standard - Standard routing. Amount: $2400. Risk: Low. AI recommends: Approve.','Approve','Standard',[],1,ago(8)],
  ];
  const cols = ['id','employee_name','employee_id','request_type','department','description','amount','attachment_name','status','risk_level','ai_summary','ai_recommendation','ai_category','missing_warnings','current_level','created_at'];
  for (const s of seeds) {
    const obj = {};
    cols.forEach((c, i) => obj[c] = s[i]);
    requests.push(obj);
  }
  console.log('In-memory store seeded with 8 mock requests');
}

const db = {
  all: () => [...requests].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
  findById: id => requests.find(r => r.id === id),
  insert: req => { requests.unshift(req); return req; },
  updateStatus: (id, status) => {
    const r = requests.find(x => x.id === id);
    if (r) { r.status = status; return r; }
    return null;
  },
  count: () => requests.length,
  countWhere: pred => requests.filter(pred).length,
};

module.exports = { db, initializeDB };

