export interface Embassy {
  country: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
}

export const EMBASSIES: Embassy[] = [
  {
    country: "India",
    address: "2107 Massachusetts Ave NW, Washington, DC 20008",
    phone: "+1 202-939-7000",
    lat: 38.9138,
    lng: -77.0462,
  },
  {
    country: "Ukraine",
    address: "3350 M St NW, Washington, DC 20007",
    phone: "+1 202-349-2920",
    lat: 38.9056,
    lng: -77.0669,
  },
  {
    country: "Canada",
    address: "501 Pennsylvania Ave NW, Washington, DC 20001",
    phone: "+1 202-682-1740",
    lat: 38.8926,
    lng: -77.0202,
  },
  {
    country: "Mexico",
    address: "1911 Pennsylvania Ave NW, Washington, DC 20006",
    phone: "+1 202-728-1600",
    lat: 38.9008,
    lng: -77.0434,
  },
  {
    country: "Germany",
    address: "4645 Reservoir Rd NW, Washington, DC 20007",
    phone: "+1 202-298-4000",
    lat: 38.9124,
    lng: -77.091,
  },
];
