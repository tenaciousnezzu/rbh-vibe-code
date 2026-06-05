export interface NasaData {
  solarIrradiance: number;
  windSpeed: number;
  source: "live" | "estimated";
}

export async function fetchNASAData(lat: number, lng: number): Promise<NasaData> {
  try {
    const url = `https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=ALLSKY_SFC_SW_DWN,WS10M&community=RE&longitude=${lng}&latitude=${lat}&format=JSON`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    const data = await res.json();
    const solar = data.properties.parameter.ALLSKY_SFC_SW_DWN.ANN;
    const wind = data.properties.parameter.WS10M.ANN;
    return { solarIrradiance: solar, windSpeed: wind, source: "live" };
  } catch {
    return { solarIrradiance: 5.0, windSpeed: 4.0, source: "estimated" };
  }
}
