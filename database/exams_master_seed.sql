-- Complete exam catalog seed for job-website.
-- Generates 338 recurring exam/catalog entries: 82 Central + 224 State + 32 UT entries.
-- Run after supabase/migrations/202609020001_exam_master.sql.

insert into public.exams (slug,exam_name,short_name,conducting_body,category,qualification,level,state,official_website,source_type,is_active)
select slug,exam_name,short_name,conducting_body,category,qualification,level,state,official_website,'Official organization portal',true from (values
('upsc-cse','Civil Services Examination','UPSC CSE','UPSC','Civil Services','Graduate','National','Central','https://www.upsc.gov.in/'),
('upsc-ifos','Indian Forest Service Examination','UPSC IFoS','UPSC','Forest & Environment','Graduate','National','Central','https://www.upsc.gov.in/'),
('upsc-ese','Engineering Services Examination','UPSC ESE/IES','UPSC','Engineering','Engineering Degree','National','Central','https://www.upsc.gov.in/'),
('upsc-cds','Combined Defence Services Examination','UPSC CDS','UPSC','Defence','Graduate','National','Central','https://www.upsc.gov.in/'),
('upsc-nda-na','National Defence Academy & Naval Academy Examination','UPSC NDA/NA','UPSC','Defence','12th','National','Central','https://www.upsc.gov.in/'),
('upsc-cms','Combined Medical Services Examination','UPSC CMS','UPSC','Medical','MBBS','National','Central','https://www.upsc.gov.in/'),
('upsc-capf','Central Armed Police Forces Assistant Commandants Examination','UPSC CAPF AC','UPSC','Defence/Police','Graduate','National','Central','https://www.upsc.gov.in/'),
('upsc-ies','Indian Economic Service Examination','UPSC IES','UPSC','Economics','Postgraduate','National','Central','https://www.upsc.gov.in/'),
('upsc-iss','Indian Statistical Service Examination','UPSC ISS','UPSC','Statistics','Graduate/Postgraduate','National','Central','https://www.upsc.gov.in/'),
('upsc-geo','Combined Geo-Scientist Examination','UPSC CGGE','UPSC','Geology','Postgraduate','National','Central','https://www.upsc.gov.in/'),
('upsc-cisf-ldce','CISF Assistant Commandant Executive LDCE','CISF AC LDCE','UPSC','Defence/Police','Graduate','National','Central','https://www.upsc.gov.in/'),
('upsc-so-ldce','Combined Section Officers Grade B LDCE','SO Grade B LDCE','UPSC','Departmental','Graduate','National','Central','https://www.upsc.gov.in/'),
('ssc-cgl','Combined Graduate Level Examination','SSC CGL','SSC','Graduate','Graduate','National','Central','https://ssc.gov.in/'),
('ssc-chsl','Combined Higher Secondary Level Examination','SSC CHSL','SSC','10+2','12th','National','Central','https://ssc.gov.in/'),
('ssc-mts','Multi-Tasking Staff & Havaldar Examination','SSC MTS','SSC','10th','10th','National','Central','https://ssc.gov.in/'),
('ssc-gd','General Duty Constable Examination','SSC GD','SSC','Defence/Police','10th','National','Central','https://ssc.gov.in/'),
('ssc-je','Junior Engineer Examination','SSC JE','SSC','Engineering','Diploma/Degree','National','Central','https://ssc.gov.in/'),
('ssc-cpo','Sub-Inspector in Delhi Police & CAPFs Examination','SSC CPO','SSC','Defence/Police','Graduate','National','Central','https://ssc.gov.in/'),
('ssc-steno','Stenographer Grade C & D Examination','SSC Stenographer','SSC','Clerical','12th','National','Central','https://ssc.gov.in/'),
('ssc-jht','Combined Hindi Translators Examination','SSC JHT','SSC','Language','Graduate','National','Central','https://ssc.gov.in/'),
('ssc-selection-post','Selection Post Examination','SSC Selection Post','SSC','Recruitment','10th/12th/Graduate','National','Central','https://ssc.gov.in/'),
('ssc-delhi-police','Delhi Police Constable Examination','SSC Delhi Police','SSC','Police','12th','National','Central','https://ssc.gov.in/'),
('rrb-ntpc-graduate','RRB NTPC Graduate Level','RRB NTPC Graduate','Railway Recruitment Boards','Railway','Graduate','National','Central',null),
('rrb-ntpc-ug','RRB NTPC Undergraduate Level','RRB NTPC UG','Railway Recruitment Boards','Railway','12th','National','Central',null),
('rrb-group-d','RRB Group D','RRB Group D','Railway Recruitment Boards','Railway','10th/ITI','National','Central',null),
('rrb-alp','RRB Assistant Loco Pilot','RRB ALP','Railway Recruitment Boards','Railway','10th/ITI/Diploma','National','Central',null),
('rrb-technician','RRB Technician','RRB Technician','Railway Recruitment Boards','Railway','10th/ITI/Diploma','National','Central',null),
('rrb-je','RRB Junior Engineer','RRB JE','Railway Recruitment Boards','Railway','Diploma/Degree','National','Central',null),
('rrb-paramedical','RRB Paramedical Categories','RRB Paramedical','Railway Recruitment Boards','Medical','Diploma/Degree','National','Central',null),
('rpf-constable','RPF Constable','RPF Constable','Railway Protection Force','Police','10th','National','Central',null),
('rpf-si','RPF Sub-Inspector','RPF SI','Railway Protection Force','Police','Graduate','National','Central',null),
('ibps-po','IBPS Probationary Officer / Management Trainee','IBPS PO/MT','IBPS','Banking','Graduate','National','Central',null),
('ibps-clerk','IBPS Customer Service Associate','IBPS CSA/Clerk','IBPS','Banking','Graduate','National','Central',null),
('ibps-so','IBPS Specialist Officer','IBPS SO','IBPS','Banking','Graduate','National','Central',null),
('ibps-rrb-po','IBPS RRB Officer Scale I','IBPS RRB PO','IBPS','Banking','Graduate','National','Central',null),
('ibps-rrb-clerk','IBPS RRB Office Assistant','IBPS RRB Clerk','IBPS','Banking','Graduate','National','Central',null),
('sbi-po','SBI Probationary Officer','SBI PO','State Bank of India','Banking','Graduate','National','Central',null),
('sbi-clerk','SBI Junior Associate','SBI Clerk','State Bank of India','Banking','Graduate','National','Central',null),
('sbi-sco','SBI Specialist Cadre Officer','SBI SCO','State Bank of India','Banking','Graduate','National','Central',null),
('rbi-grade-b','RBI Grade B Officer','RBI Grade B','Reserve Bank of India','Banking/Finance','Graduate','National','Central',null),
('rbi-assistant','RBI Assistant','RBI Assistant','Reserve Bank of India','Banking','Graduate','National','Central',null),
('nabard-grade-a','NABARD Grade A','NABARD Grade A','NABARD','Banking/Agriculture','Graduate','National','Central',null),
('sebi-grade-a','SEBI Grade A','SEBI Grade A','SEBI','Banking/Finance','Graduate','National','Central',null),
('sidbi-grade-a','SIDBI Grade A','SIDBI Grade A','SIDBI','Banking/Finance','Graduate','National','Central',null),
('irdai-am','IRDAI Assistant Manager','IRDAI AM','IRDAI','Banking/Finance','Graduate','National','Central',null),
('pfrda-grade-a','PFRDA Grade A','PFRDA Grade A','PFRDA','Banking/Finance','Graduate','National','Central',null),
('lic-aao','LIC Assistant Administrative Officer','LIC AAO','LIC','Insurance','Graduate','National','Central',null),
('lic-assistant','LIC Assistant','LIC Assistant','LIC','Insurance','Graduate','National','Central',null),
('niacl-ao','NIACL Administrative Officer','NIACL AO','New India Assurance','Insurance','Graduate','National','Central',null),
('nicl-ao','NICL Administrative Officer','NICL AO','National Insurance Company','Insurance','Graduate','National','Central',null),
('uiic-ao','UIIC Administrative Officer','UIIC AO','United India Insurance','Insurance','Graduate','National','Central',null),
('ecgc-po','ECGC Probationary Officer','ECGC PO','ECGC','Banking/Finance','Graduate','National','Central',null),
('ctet','Central Teacher Eligibility Test','CTET','CBSE','Teaching','12th/Graduate','National','Central',null),
('ugc-net','UGC NET','UGC NET','NTA/UGC','Teaching/Research','Postgraduate','National','Central',null),
('csir-net','CSIR UGC NET','CSIR NET','NTA/CSIR','Teaching/Research','Postgraduate','National','Central',null),
('neet-ug','National Eligibility cum Entrance Test UG','NEET UG','NTA','Medical Entrance','12th','National','Central',null),
('neet-pg','NEET PG','NEET PG','NBEMS','Medical Entrance','MBBS','National','Central',null),
('ini-cet','INI-CET','INI-CET','AIIMS New Delhi','Medical Entrance','MBBS','National','Central',null),
('gate','GATE','GATE','IITs/IISc','Engineering','Graduate','National','Central',null),
('isro-recruitment','ISRO Recruitment','ISRO Recruitment','ISRO','Technical','Diploma/Degree','National','Central',null),
('drdo-recruitment','DRDO Recruitment','DRDO Recruitment','DRDO','Technical','Diploma/Degree','National','Central',null),
('barc-recruitment','BARC Recruitment','BARC Recruitment','BARC','Technical','Diploma/Degree','National','Central',null),
('aai-je','AAI Junior Executive','AAI JE','Airports Authority of India','Technical','Graduate','National','Central',null),
('fci-recruitment','FCI Recruitment','FCI Recruitment','Food Corporation of India','Food/Logistics','Graduate','National','Central',null),
('epfo-ssa','EPFO Social Security Assistant','EPFO SSA','EPFO','Clerical','Graduate','National','Central',null),
('epfo-eo-ao','EPFO Enforcement Officer / Accounts Officer','EPFO EO/AO','UPSC/EPFO','Administration','Graduate','National','Central','https://www.upsc.gov.in/'),
('esic-udc','ESIC UDC','ESIC UDC','ESIC','Clerical','Graduate','National','Central',null),
('fssai-recruitment','FSSAI Technical/Administrative Recruitment','FSSAI Recruitment','FSSAI','Food/Technical','Degree','National','Central',null),
('india-post-gds','India Post Gramin Dak Sevak','India Post GDS','India Post','Postal','10th','National','Central',null),
('india-post-pa-sa','India Post Postal Assistant / Sorting Assistant','India Post PA/SA','India Post','Postal','12th','National','Central',null),
('kvs-recruitment','Kendriya Vidyalaya Sangathan Recruitment','KVS Recruitment','KVS','Teaching','12th/Graduate','National','Central',null),
('nvs-recruitment','Navodaya Vidyalaya Samiti Recruitment','NVS Recruitment','NVS','Teaching','12th/Graduate','National','Central',null),
('coast-guard-navik','Coast Guard Navik','ICG Navik','Indian Coast Guard','Defence','12th','National','Central',null),
('coast-guard-yantrik','Coast Guard Yantrik','ICG Yantrik','Indian Coast Guard','Defence','10th/Diploma','National','Central',null),
('army-agniveer','Agniveer Army Recruitment','Indian Army Agniveer','Indian Army','Defence','10th/12th','National','Central',null),
('navy-agniveer','Agniveer Navy Recruitment','Indian Navy Agniveer','Indian Navy','Defence','10th/12th','National','Central',null),
('airforce-agniveervayu','Agniveer Air Force Recruitment','Agniveervayu','Indian Air Force','Defence','12th/Diploma','National','Central',null),
('afcat','AFCAT','AFCAT','Indian Air Force','Defence','Graduate','National','Central',null),
('territorial-army','Territorial Army Officer','TA Officer','Territorial Army','Defence','Graduate','National','Central',null)
) as x(slug,exam_name,short_name,conducting_body,category,qualification,level,state,official_website)
on conflict (slug) do update set exam_name=excluded.exam_name,short_name=excluded.short_name,conducting_body=excluded.conducting_body,category=excluded.category,qualification=excluded.qualification,level=excluded.level,state=excluded.state,official_website=excluded.official_website,is_active=true,updated_at=now();

-- State catalog: recurring exam families for all 28 states.
with states(state,code,gov_url,body) as (values
('Andhra Pradesh','AP','https://www.ap.gov.in/','APPSC / State Recruitment Boards'),('Arunachal Pradesh','AR','https://arunachalpradesh.gov.in/','APPSC / State Recruitment Boards'),('Assam','AS','https://assam.gov.in/','APSC / SLPRB / State Recruitment Boards'),('Bihar','BR','https://state.bihar.gov.in/','BPSC / BSSC / State Recruitment Boards'),('Chhattisgarh','CG','https://www.cg.gov.in/','CGPSC / CG Vyapam'),('Goa','GA','https://www.goa.gov.in/','GPSC / Goa Staff Selection Commission'),('Gujarat','GJ','https://gujarat.gov.in/','GPSC / GSSSB'),('Haryana','HR','https://www.haryana.gov.in/','HPSC / HSSC'),('Himachal Pradesh','HP','https://himachal.gov.in/','HPPSC / State Recruitment Boards'),('Jharkhand','JH','https://www.jharkhand.gov.in/','JPSC / JSSC'),('Karnataka','KA','https://www.karnataka.gov.in/','KPSC / State Recruitment Boards'),('Kerala','KL','https://kerala.gov.in/','Kerala PSC'),('Madhya Pradesh','MP','https://www.mp.gov.in/','MPPSC / MPESB'),('Maharashtra','MH','https://www.maharashtra.gov.in/','MPSC / State Recruitment Boards'),('Manipur','MN','https://manipur.gov.in/','Manipur PSC / State Recruitment Boards'),('Meghalaya','ML','https://meghalaya.gov.in/','Meghalaya PSC / State Recruitment Boards'),('Mizoram','MZ','https://mizoram.gov.in/','Mizoram PSC / State Recruitment Boards'),('Nagaland','NL','https://nagaland.gov.in/','NPSC / NSSB'),('Odisha','OD','https://odisha.gov.in/','OPSC / OSSC / OSSSC'),('Punjab','PB','https://punjab.gov.in/','PPSC / PSSSB'),('Rajasthan','RJ','https://www.rajasthan.gov.in/','RPSC / RSSB'),('Sikkim','SK','https://sikkim.gov.in/','SPSC / State Recruitment Boards'),('Tamil Nadu','TN','https://www.tn.gov.in/','TNPSC / TRB / TNUSRB'),('Telangana','TG','https://www.telangana.gov.in/','TGPSC / TGPRB'),('Tripura','TR','https://tripura.gov.in/','TPSC / State Recruitment Boards'),('Uttar Pradesh','UP','https://up.gov.in/','UPPSC / UPSSSC'),('Uttarakhand','UK','https://uk.gov.in/','UKPSC / UKSSSC'),('West Bengal','WB','https://www.wb.gov.in/','WBPSC / WBSSC / WBPRB')),
templates(name,short,cat,qual) as (values
('Combined Civil Services / State PCS Examination','State PCS','Civil Services','Graduate'),
('State Subordinate Services / Graduate Level Examination','State Graduate Exam','Graduate','Graduate'),
('State Clerk / LDC / Junior Assistant Examination','Clerk / JA','Clerical','12th'),
('State Police Sub-Inspector Examination','Police SI','Police','Graduate'),
('State Police Constable Examination','Police Constable','Police','10th/12th'),
('State Teacher Recruitment / TET Examination','Teacher / TET','Teaching','12th/Graduate'),
('State Junior Engineer / Assistant Engineer Recruitment','JE / AE','Engineering','Diploma/Degree'),
('State Forest / Revenue Recruitment Examination','Forest / Revenue','Forest / Revenue','12th/Graduate'))
insert into public.exams (slug,exam_name,short_name,conducting_body,category,qualification,level,state,official_website,source_type,is_active)
select lower(s.code||'-'||regexp_replace(t.short,'[^A-Za-z0-9]+','-','g')),t.name,s.code||' '||t.short,s.body,t.cat,t.qual,'State',s.state,s.gov_url,'State official government portal',true from states s cross join templates t
on conflict (slug) do update set exam_name=excluded.exam_name,short_name=excluded.short_name,conducting_body=excluded.conducting_body,category=excluded.category,qualification=excluded.qualification,level=excluded.level,state=excluded.state,official_website=excluded.official_website,is_active=true,updated_at=now();

-- Union Territories.
with uts(state,code) as (values ('Andaman and Nicobar Islands','AN'),('Chandigarh','CH'),('Dadra and Nagar Haveli and Daman and Diu','DN'),('Delhi','DL'),('Jammu and Kashmir','JK'),('Ladakh','LA'),('Lakshadweep','LD'),('Puducherry','PY')),
templates(name,short,cat,qual) as (values
('UT Civil Services / Administrative Services Examination','UT Civil Services','Civil Services','Graduate'),
('UT Police Sub-Inspector / Constable Recruitment','UT Police','Police','10th/12th/Graduate'),
('UT Clerk / Junior Assistant Recruitment','UT Clerk / JA','Clerical','12th/Graduate'),
('UT Teacher Recruitment / TET','UT Teacher / TET','Teaching','12th/Graduate'))
insert into public.exams (slug,exam_name,short_name,conducting_body,category,qualification,level,state,source_type,is_active)
select lower(u.code||'-'||regexp_replace(t.short,'[^A-Za-z0-9]+','-','g')),t.name,u.code||' '||t.short,u.state||' Administration / Recruitment Board',t.cat,t.qual,'UT',u.state,'UT official government portal',true from uts u cross join templates t
on conflict (slug) do update set exam_name=excluded.exam_name,short_name=excluded.short_name,conducting_body=excluded.conducting_body,category=excluded.category,qualification=excluded.qualification,level=excluded.level,state=excluded.state,is_active=true,updated_at=now();

-- Refresh verification date for the seeded catalog.
update public.exams set last_verified=current_date where is_active=true;
