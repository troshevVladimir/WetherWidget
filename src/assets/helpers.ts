export function tsFetch<T>(url: string): Promise<T> {
  return fetch(url).then((response) => {
    if (!response.ok) {
      throw new Error(response.statusText);
    }

    return response.json();
  });
}

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface ApiResp {
  [key: string]: any;
  feels_like: number;
  temp: number;
  temp_max: number;
  temp_min: number;
}

export function getWether(crd: Coordinates) {
  const url: URL = new URL("https://api.openweathermap.org/data/2.5/weather");
  url.searchParams.append("lat", String(crd.latitude));
  url.searchParams.append("lon", String(crd.longitude));
  url.searchParams.append("units", "metric");
  url.searchParams.append("appid", process.env.VUE_APP_WETHER_API_KEY);

  return tsFetch<ApiResp>(url.toString()).then((response) => {
    return {
      title: response.name,
      data: response.main,
      id: response.id,
    };
  });
}
