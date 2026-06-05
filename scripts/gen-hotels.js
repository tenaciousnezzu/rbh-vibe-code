const fs = require("fs");

const tariffs = {
  "Delhi": 10.2, "Maharashtra": 9.8, "Karnataka": 9.2, "Assam": 8.2,
  "Rajasthan": 9.3, "Telangana": 9.1, "Punjab": 8.8, "Tamil Nadu": 9.5,
  "Haryana": 9.4, "Uttar Pradesh": 9.0, "Madhya Pradesh": 8.7,
  "Jharkhand": 8.5, "Andhra Pradesh": 9.0
};

const cityCodeMap = {};
function getId(city) {
  const abbr = {
    "New Delhi": "DEL", "Mysore": "MYS", "Mumbai": "MUM", "Karjat": "KAR",
    "Guwahati": "GUW", "Udaipur": "UDR", "Hyderabad": "HYD", "Nagpur": "NGP",
    "Amritsar": "ATQ", "Chennai": "MAA", "Indore": "IDR", "Visakhapatnam": "VTZ",
    "Ghaziabad": "GZB", "Gurgaon": "GGN", "Mamallapuram": "MAM",
    "Pune": "PNQ", "Varanasi": "VNS", "Coimbatore": "CBE",
    "Bengaluru": "BLR", "Ranchi": "RNC", "Noida": "NOI"
  };
  const code = abbr[city] || city.substring(0, 3).toUpperCase();
  cityCodeMap[code] = (cityCodeMap[code] || 0) + 1;
  return "RB-" + code + "-" + String(cityCodeMap[code]).padStart(2, "0");
}

const raw = [
  { name: "Hotel A", ownership: "Franchised", city: "New Delhi", state: "Delhi", address: "Near Mahipalpur Extension NH 8, New Delhi", rooms: 261, area: 35314, roomNights: 92056, emissions: 6885638.692, lng: 77.101464, lat: 28.556162 },
  { name: "Hotel B", ownership: "Managed", city: "Mysore", state: "Karnataka", address: "1 MG Road, Mysore, Karnataka", rooms: 141, area: 35420.02, roomNights: 45583, emissions: 5555035.471, lng: 76.6393, lat: 12.2979 },
  { name: "Hotel C", ownership: "Franchised", city: "Mumbai", state: "Maharashtra", address: "CTS 624 & 626, Marol Maroshi Road, Andheri East, Mumbai", rooms: 190, area: 8600, roomNights: 63635, emissions: 4759794.236, lng: 72.8716, lat: 19.0956 },
  { name: "Hotel D", ownership: "Managed", city: "Karjat", state: "Maharashtra", address: "Survey No 12/6-7, Village Khandpe Taluka Karjat", rooms: 228, area: 15784, roomNights: 56798, emissions: 4714733.311, lng: 73.3234, lat: 18.9104 },
  { name: "Hotel E", ownership: "Managed", city: "Guwahati", state: "Assam", address: "National Highway 37, Gotanagar, Guwahati", rooms: 196, area: 22317, roomNights: 57654, emissions: 4436871.267, lng: 91.7716, lat: 26.1061 },
  { name: "Hotel F", ownership: "Franchised", city: "Udaipur", state: "Rajasthan", address: "B-1 Ambamata Scheme, Opp. Aravali Hospital, Udaipur", rooms: 200, area: 16994, roomNights: 58460, emissions: 4372712.674, lng: 73.7125, lat: 24.5854 },
  { name: "Hotel G", ownership: "Managed", city: "New Delhi", state: "Delhi", address: "Plot No. D, District Centre, Outer Ring Road, Paschim Vihar, New Delhi", rooms: 178, area: 70284, roomNights: 51487, emissions: 4347372.58, lng: 77.0953, lat: 28.6683 },
  { name: "Hotel H", ownership: "Managed", city: "New Delhi", state: "Delhi", address: "Plot 4, Dwarka City Centre, Sector 13, Dwarka, New Delhi", rooms: 268, area: 18014, roomNights: 75838, emissions: 4210657.049, lng: 77.0377, lat: 28.5921 },
  { name: "Hotel I", ownership: "Franchised", city: "Hyderabad", state: "Telangana", address: "Gachibowli, Miyapur Road, Hyderabad", rooms: 209, area: 11570, roomNights: 64954, emissions: 4141642.085, lng: 78.3772, lat: 17.4435 },
  { name: "Hotel J", ownership: "Franchised", city: "Nagpur", state: "Maharashtra", address: "7 Wardha Road, Nagpur", rooms: 214, area: 9013.76, roomNights: 55234, emissions: 4131413.135, lng: 79.0456, lat: 21.101 },
  { name: "Hotel K", ownership: "Managed", city: "Amritsar", state: "Punjab", address: "Ajnala Road (Airport Road), 8th Mile Stone, Amritsar", rooms: 140, area: 18796.72, roomNights: 24284, emissions: 4066233.003, lng: 74.7973, lat: 31.7072 },
  { name: "Hotel L", ownership: "Franchised", city: "Chennai", state: "Tamil Nadu", address: "Commander In Chief Road, Egmore, Chennai", rooms: 162, area: 9355, roomNights: 54360, emissions: 4066039.36, lng: 80.2605, lat: 13.0785 },
  { name: "Hotel M", ownership: "Franchised", city: "Indore", state: "Madhya Pradesh", address: "12, Scheme No 94C, Ring Road, Indore", rooms: 200, area: 24972, roomNights: 54106, emissions: 4047040.574, lng: 75.8937, lat: 22.7536 },
  { name: "Hotel N", ownership: "Franchised", city: "Chennai", state: "Tamil Nadu", address: "531 GST Road, St. Thomas Mount, Chennai", rooms: 179, area: 13758.79, roomNights: 51763, emissions: 3871787.995, lng: 80.2208, lat: 13.0104 },
  { name: "Hotel O", ownership: "Franchised", city: "Bengaluru", state: "Karnataka", address: "90/4 Outer Ring Road, Marathahalli, Bengaluru", rooms: 218, area: 18599, roomNights: 50578, emissions: 3783151.927, lng: 77.6953, lat: 12.938 },
  { name: "Hotel P", ownership: "Franchised", city: "Noida", state: "Uttar Pradesh", address: "L-2, Sector 18, Noida", rooms: 131, area: 21145, roomNights: 31401, emissions: 3736982.544, lng: 77.3219, lat: 28.5672 },
  { name: "Hotel Q", ownership: "Managed", city: "Ranchi", state: "Jharkhand", address: "Main Road, Kadru Diversion, Ranchi", rooms: 116, area: 1017.29, roomNights: 34290, emissions: 3503419.272, lng: 85.3096, lat: 23.3441 },
  { name: "Hotel R", ownership: "Managed", city: "Visakhapatnam", state: "Andhra Pradesh", address: "Karthikavanam, Rushikonda Beach Road, Visakhapatnam", rooms: 99, area: 6296, roomNights: 25199, emissions: 3367980.569, lng: 83.3427, lat: 17.7416 },
  { name: "Hotel S", ownership: "Franchised", city: "Ghaziabad", state: "Uttar Pradesh", address: "64/6 Site-IV, Sahibabad, Ghaziabad", rooms: 216, area: 23871.83, roomNights: 62899, emissions: 3296641.526, lng: 77.369, lat: 28.6657 },
  { name: "Hotel T", ownership: "Franchised", city: "Ghaziabad", state: "Uttar Pradesh", address: "H-3, Madan Mohan Malviya Marg, Kaushambi, Ghaziabad", rooms: 147, area: 18302, roomNights: 43841, emissions: 3279235.312, lng: 77.3749, lat: 28.6538 },
  { name: "Hotel U", ownership: "Managed", city: "Gurgaon", state: "Haryana", address: "Adjacent to Plot No. 406, Phase 3, Udyog Vihar, Gurgaon", rooms: 200, area: 14870, roomNights: 64572, emissions: 3251353.242, lng: 77.083, lat: 28.507 },
  { name: "Hotel V", ownership: "Franchised", city: "Mamallapuram", state: "Tamil Nadu", address: "57 Covelong Road, Kanchipuram Dist, Mamallapuram", rooms: 148, area: 18223, roomNights: 41318, emissions: 3090519.026, lng: 80.1975, lat: 12.6269 },
  { name: "Hotel X", ownership: "Franchised", city: "Pune", state: "Maharashtra", address: "Plot No. 136/1, Phase I, Hinjewadi, Pune", rooms: 152, area: 11175, roomNights: 39743, emissions: 2972711.595, lng: 73.738, lat: 18.5995 },
  { name: "Hotel Y", ownership: "Franchised", city: "Varanasi", state: "Uttar Pradesh", address: "The Mall, Cantonment, Varanasi", rooms: 116, area: 10683, roomNights: 38310, emissions: 2866767.432, lng: 82.9739, lat: 25.3176 },
  { name: "Hotel Z", ownership: "Managed", city: "Coimbatore", state: "Tamil Nadu", address: "No. 164-165, Avinashi Road, Coimbatore", rooms: 135, area: 7190, roomNights: 45683, emissions: 2827602.385, lng: 76.9558, lat: 11.0168 },
];

const hotels = raw.map(h => {
  const tariff = tariffs[h.state] || 9.0;
  const annualElectricityKwh = Math.round(h.emissions / 0.82);
  const monthlyElectricityBillINR = Math.round((annualElectricityKwh * tariff) / 12);
  return {
    id: getId(h.city),
    name: h.name,
    ownership: h.ownership,
    city: h.city,
    state: h.state,
    address: h.address,
    rooms: h.rooms,
    floorAreaSqm: Math.round(h.area),
    roomNights: h.roomNights,
    emissionsKgCO2e: Math.round(h.emissions),
    lat: h.lat,
    lng: h.lng,
    monthlyElectricityBillINR,
    annualElectricityKwh,
    billEstimated: true
  };
});

fs.mkdirSync("public/data", { recursive: true });
fs.writeFileSync("public/data/hotels.json", JSON.stringify(hotels, null, 2));
console.log("Written", hotels.length, "hotels to public/data/hotels.json");
