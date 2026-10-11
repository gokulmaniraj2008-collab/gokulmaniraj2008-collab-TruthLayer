// TruthLayer v0.3: allowlisted official-source availability checks, not claim verification.
// Only fixed government HTTPS URLs are fetched. Their page titles are discovery metadata,
// NEVER supporting passages or evidence for the user's claim.
const SOURCES = Object.freeze([
  {name:'National Scholarship Portal',url:'https://scholarships.gov.in/'},
  {name:'Ministry of Education',url:'https://www.education.gov.in/'}
]);
async function inspectSource(source) {
  const controller = new AbortController();
  const timer = setTimeout(()=>controller.abort(),3500);
  try {
    const response = await fetch(source.url,{
      method:'GET',redirect:'manual',signal:controller.signal,
      headers:{'Accept':'text/html','User-Agent':'TruthLayer-Research-Demo/0.3'}
    });
    const contentType=response.headers.get('content-type')||'';
    if (!response.ok || !contentType.toLowerCase().includes('text/html'))
      return {...source,status:'UNAVAILABLE',http_status:response.status,metadata_only:true};
    const reader=response.body && response.body.getReader();
    let text='';
    if(reader){
      const decoder=new TextDecoder();
      while(text.length<24000){
        const part=await reader.read();if(part.done)break;
        text+=decoder.decode(part.value,{stream:true});
      }
      await reader.cancel().catch(()=>{});
    }
    const match=text.match(/<title[^>]*>([^<]{1,200})<\/title>/i);
    const title=match?match[1].replace(/\s+/g,' ').trim():null;
    return {...source,status:'REACHABLE',http_status:response.status,page_title:title,metadata_only:true};
  } catch {
    return {...source,status:'UNAVAILABLE',metadata_only:true};
  } finally {clearTimeout(timer);}
}
module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Method not allowed'});}
  const claim=req.body && typeof req.body.claim==='string'?req.body.claim.trim():'';
  if(!claim || claim.length>1000)return res.status(400).json({error:'Enter a claim between 1 and 1000 characters.'});
  const risk=/pay|payment|fee|upi|bank|otp|aadhaar|₹|rs\.?\s?\d/i.test(claim);
  const sources=await Promise.all(SOURCES.map(inspectSource));
  return res.status(200).json({
    schema_version:'0.3',claim,label:'Unverified',verification_status:'NOT_PERFORMED',
    explanation:'Official source landing pages were checked for availability only. No claim-specific document or passage has been retrieved, authenticated, or independently reviewed.',
    evidence:[],retrieval_performed:false,source_discovery_performed:true,
    independently_reviewed:false,source_starting_points:sources,
    safety:risk?'Do not pay or disclose OTP, UPI PIN, Aadhaar or banking details based on this claim. Confirm through the official portal and your college scholarship office.':'Check the responsible authority’s official scheme page for eligibility, dates and scope.',
    disclaimer:'Page availability or title is NOT evidence for the claim. Unavailable does not mean false. Research demo only.'
  });
};