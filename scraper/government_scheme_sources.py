"""Official government scheme source catalogue.

The collector uses these sources as discovery pages. Scheme records are only
created from links hosted on an official government domain/subdomain.
"""

STATES_AND_UTS = {
    "Andhra Pradesh": "AP", "Arunachal Pradesh": "AR", "Assam": "AS", "Bihar": "BR",
    "Chhattisgarh": "CG", "Goa": "GA", "Gujarat": "GJ", "Haryana": "HR",
    "Himachal Pradesh": "HP", "Jharkhand": "JH", "Karnataka": "KA", "Kerala": "KL",
    "Madhya Pradesh": "MP", "Maharashtra": "MH", "Manipur": "MN", "Meghalaya": "ML",
    "Mizoram": "MZ", "Nagaland": "NL", "Odisha": "OD", "Punjab": "PB",
    "Rajasthan": "RJ", "Sikkim": "SK", "Tamil Nadu": "TN", "Telangana": "TS",
    "Tripura": "TR", "Uttar Pradesh": "UP", "Uttarakhand": "UK", "West Bengal": "WB",
    "Andaman and Nicobar Islands": "AN", "Chandigarh": "CH", "Dadra and Nagar Haveli and Daman and Diu": "DH",
    "Delhi": "DL", "Jammu and Kashmir": "JK", "Ladakh": "LA", "Lakshadweep": "LD",
    "Puducherry": "PY",
}

OFFICIAL_SOURCES = [
    {"state": "All India", "state_code": "IN", "name": "India.gov.in Schemes", "url": "https://www.india.gov.in/my-government/schemes"},
    {"state": "All India", "state_code": "IN", "name": "myScheme", "url": "https://www.myscheme.gov.in/"},
    {"state": "All India", "state_code": "IN", "name": "National Single Window System - Government Schemes", "url": "https://www.nsws.gov.in/government-schemes"},
    {"state": "Andhra Pradesh", "state_code": "AP", "name": "Andhra Pradesh Government", "url": "https://www.ap.gov.in/"},
    {"state": "Arunachal Pradesh", "state_code": "AR", "name": "Arunachal Pradesh Government", "url": "https://arunachalpradesh.gov.in/"},
    {"state": "Assam", "state_code": "AS", "name": "Assam Government", "url": "https://assam.gov.in/"},
    {"state": "Bihar", "state_code": "BR", "name": "Bihar Government", "url": "https://state.bihar.gov.in/"},
    {"state": "Chhattisgarh", "state_code": "CG", "name": "Chhattisgarh Government", "url": "https://www.cgstate.gov.in/"},
    {"state": "Goa", "state_code": "GA", "name": "Goa Government", "url": "https://www.goa.gov.in/"},
    {"state": "Gujarat", "state_code": "GJ", "name": "Gujarat Government", "url": "https://gujaratindia.gov.in/"},
    {"state": "Haryana", "state_code": "HR", "name": "Haryana Government", "url": "https://www.haryana.gov.in/"},
    {"state": "Himachal Pradesh", "state_code": "HP", "name": "Himachal Pradesh Government", "url": "https://himachal.nic.in/"},
    {"state": "Jharkhand", "state_code": "JH", "name": "Jharkhand Government", "url": "https://www.jharkhand.gov.in/"},
    {"state": "Karnataka", "state_code": "KA", "name": "Karnataka Government", "url": "https://www.karnataka.gov.in/"},
    {"state": "Kerala", "state_code": "KL", "name": "Kerala Government", "url": "https://kerala.gov.in/"},
    {"state": "Madhya Pradesh", "state_code": "MP", "name": "Madhya Pradesh Government", "url": "https://mp.gov.in/"},
    {"state": "Maharashtra", "state_code": "MH", "name": "Maharashtra Government", "url": "https://www.maharashtra.gov.in/"},
    {"state": "Manipur", "state_code": "MN", "name": "Manipur Government", "url": "https://manipur.gov.in/"},
    {"state": "Meghalaya", "state_code": "ML", "name": "Meghalaya Government", "url": "https://meghalaya.gov.in/"},
    {"state": "Mizoram", "state_code": "MZ", "name": "Mizoram Government", "url": "https://mizoram.gov.in/"},
    {"state": "Nagaland", "state_code": "NL", "name": "Nagaland Government", "url": "https://www.nagaland.gov.in/"},
    {"state": "Odisha", "state_code": "OD", "name": "Odisha Government", "url": "https://odisha.gov.in/"},
    {"state": "Punjab", "state_code": "PB", "name": "Punjab Government", "url": "https://punjab.gov.in/"},
    {"state": "Rajasthan", "state_code": "RJ", "name": "Rajasthan Government", "url": "https://rajasthan.gov.in/"},
    {"state": "Sikkim", "state_code": "SK", "name": "Sikkim Government", "url": "https://sikkim.gov.in/"},
    {"state": "Tamil Nadu", "state_code": "TN", "name": "Tamil Nadu Government", "url": "https://www.tn.gov.in/"},
    {"state": "Telangana", "state_code": "TS", "name": "Telangana Government", "url": "https://www.telangana.gov.in/"},
    {"state": "Tripura", "state_code": "TR", "name": "Tripura Government", "url": "https://tripura.gov.in/"},
    {"state": "Uttar Pradesh", "state_code": "UP", "name": "Uttar Pradesh Government", "url": "https://up.gov.in/"},
    {"state": "Uttarakhand", "state_code": "UK", "name": "Uttarakhand Government", "url": "https://uk.gov.in/"},
    # Uttarakhand departments with rich scheme catalogues.
    {"state": "Uttarakhand", "state_code": "UK", "name": "Uttarakhand Agriculture Department", "url": "https://agriculture.uk.gov.in/schemes-programmes/"},
    {"state": "Uttarakhand", "state_code": "UK", "name": "Uttarakhand Horticulture Department", "url": "https://shm.uk.gov.in/dbt-scheme/"},
    {"state": "Uttarakhand", "state_code": "UK", "name": "Uttarakhand Renewable Energy Development Agency", "url": "https://ureda.uk.gov.in/solar-energy-schemes/"},
    {"state": "West Bengal", "state_code": "WB", "name": "West Bengal Government", "url": "https://wb.gov.in/"},
    {"state": "Andaman and Nicobar Islands", "state_code": "AN", "name": "Andaman and Nicobar Administration", "url": "https://andaman.gov.in/"},
    {"state": "Chandigarh", "state_code": "CH", "name": "Chandigarh Administration", "url": "https://chandigarh.gov.in/"},
    {"state": "Delhi", "state_code": "DL", "name": "Delhi Government", "url": "https://delhi.gov.in/"},
    {"state": "Jammu and Kashmir", "state_code": "JK", "name": "Jammu and Kashmir Government", "url": "https://jk.gov.in/"},
    {"state": "Ladakh", "state_code": "LA", "name": "Ladakh Administration", "url": "https://ladakh.gov.in/"},
    {"state": "Lakshadweep", "state_code": "LD", "name": "Lakshadweep Administration", "url": "https://lakshadweep.gov.in/"},
    {"state": "Puducherry", "state_code": "PY", "name": "Puducherry Government", "url": "https://py.gov.in/"},
]
