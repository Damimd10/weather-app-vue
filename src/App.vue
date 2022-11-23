<script setup lang="ts">
import { computed, ref } from "vue";
import { format, formatDistanceToNow, fromUnixTime } from "date-fns";

import CardItem from "./components/CardItem.vue";

import barometerIcon from "./assets/fill/all/barometer.svg";
import humidityIcon from "./assets/fill/all/humidity.svg";
import sunrisetIcon from "./assets/fill/all/sunrise.svg";
import sunsetIcon from "./assets/fill/all/sunset.svg";
import windIcon from "./assets/fill/all/dust-wind.svg";

interface Temperature {
  day: number;
}

interface ForecastCurrent {
  sunrise: number;
  sunset: number;
  uvi: number;
}

interface ForecastDaily {
  dt: number;
  temp: Temperature;
  weather: WeatherConditions[];
}

interface Forecast {
  current: ForecastCurrent;
  daily: ForecastDaily[];
  timezone: string;
}

interface WeatherCoords {
  lat: number;
  lon: number;
}

interface WeatherMain {
  feels_like: number;
  humidity: number;
  pressure: number;
  temp: number;
  temp_max: number;
  temp_min: number;
}

interface WeatherSystem {
  country: string;
  id: number;
  sunrise: number;
  sunset: number;
  type: number;
}

interface WeatherWind {
  speed: number;
  deg: number;
  gust: number;
}

interface WeatherConditions {
  id: number;
  description: string;
  icon: string;
  main: string;
}

interface Weather {
  coord: WeatherCoords;
  main: WeatherMain;
  name: string;
  sys: WeatherSystem;
  weather: WeatherConditions[];
  wind: WeatherWind;
}

const API_KEY = import.meta.env.VITE_API_KEY;
const API_URL = `https://api.openweathermap.org/data/2.5`;
const API_URL_ONE_CALL = "https://api.openweathermap.org/data/2.5/onecall";

const query = ref("");
const forecast = ref<Forecast>({} as Forecast);
const weather = ref<Weather>({} as Weather);

const capitalize = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1);

const fetchWeather = async (event: KeyboardEvent) => {
  if (event.key !== "Enter") return;

  const weatherUrl = `${API_URL}/weather?q=${query.value}&units=metric&appid=${API_KEY}`;
  weather.value = await (await fetch(weatherUrl)).json();

  const forecastUrl = `${API_URL_ONE_CALL}?lat=${weather.value.coord.lat}&lon=${weather.value.coord.lon}&exclude=minutely,hourly&units=metric&APPID=${API_KEY}`;

  forecast.value = await (await fetch(forecastUrl)).json();
};

const roundedUvIndex = computed(() => Math.ceil(forecast.value.current.uvi));

const sunrise = computed(() => {
  if (!forecast.value.current) return "";

  const parsedUnixTime = fromUnixTime(forecast.value.current.sunrise);

  return format(parsedUnixTime, "H:mm b");
});

const sunset = computed(() => {
  if (!forecast.value.current) return "";

  const parsedUnixTime = fromUnixTime(forecast.value.current.sunset);

  return format(parsedUnixTime, "H:mm b");
});

const uvIcon = computed(() => {
  if (!forecast.value.current) return "";

  if (roundedUvIndex.value === 0) {
    return new URL(`./assets/fill/all/uv-index.svg`, import.meta.url).href;
  }

  return new URL(
    `./assets/fill/all/uv-index-${roundedUvIndex.value}.svg`,
    import.meta.url
  ).href;
});

const weatherIcon = computed(() => {
  if (!weather.value.weather) return "";

  return new URL(
    `./assets/fill/openweathermap/${weather.value.weather[0].icon}.svg`,
    import.meta.url
  ).href;
});

const chartOptions = computed(() => {
  if (!forecast.value.daily) return;

  return {
    chart: {
      type: "spline",
      useUTC: false,
    },
    title: {
      text: null,
    },
    xAxis: {
      type: "datetime",
    },
    yAxis: {
      title: { text: "Temperature °C" },
    },
    series: [
      {
        name: "Weather",
        data: forecast.value.daily.map(({ dt, temp, weather }) => ({
          x: dt * 1000,
          y: temp.day,
          marker: {
            height: 60,
            symbol: `url(${
              new URL(
                `./assets/fill/openweathermap/${weather[0].icon}.svg`,
                import.meta.url
              ).href
            })`,
            width: 60,
          },
        })),
      },
    ],
  };
});
</script>

<template>
  <div id="app">
    <main>
      <section class="content">
        <header>
          <div class="header-date">
            <h1 class="date-title">{{ format(new Date(), "MMMM yyyy") }}</h1>
            <h6 class="date-subtitle">
              {{ format(new Date(), "EEEE, MMM d, yyyy") }}
            </h6>
          </div>
          <div class="header-search">
            <input
              class="search-text"
              type="text"
              placeholder="Search location here"
              @keypress="fetchWeather"
              v-model="query"
            />
          </div>
        </header>
        <hr />
        <div
          class="overview"
          v-if="Boolean(weather.main) && Boolean(forecast.timezone)"
        >
          <h1 class="overview-title">Today overview</h1>
          <div class="card-list">
            <card-item
              :icon="windIcon"
              :content="`${weather.wind.speed}km/h`"
              title="Wind Speed"
            />
            <card-item
              :icon="humidityIcon"
              :content="`${weather.main.humidity}%`"
              title="Humidity"
            />
            <card-item
              :icon="barometerIcon"
              :content="`${weather.main.pressure} HPA`"
              title="Pressure"
            />
            <card-item
              :icon="uvIcon"
              :content="String(forecast.current.uvi)"
              title="UV Index"
            />
          </div>
        </div>
        <div v-if="Boolean(forecast.daily)">
          <highcharts
            class="hc"
            :options="chartOptions"
            ref="chart"
          ></highcharts>
        </div>
      </section>
      <section class="sidebar">
        <div
          class="sidebar-meta"
          v-if="Boolean(weather.main) && Boolean(forecast.timezone)"
        >
          <div class="sidebar-location">
            <h1 class="location-title">
              {{ weather.name }}, {{ weather.sys.country }}
            </h1>
          </div>
          <span class="sidebar-date">08:54 AM</span>
        </div>
        <div
          class="sidebar-weather"
          v-if="Boolean(weather.main) && Boolean(forecast.timezone)"
        >
          <div class="weather-icon">
            <img class="icon" :src="weatherIcon" />
          </div>
          <div class="weather-wrap">
            <span class="weather-number">{{ weather.main.temp }}° C</span>
            <span class="weather-info">{{
              capitalize(weather.weather[0].description)
            }}</span>
          </div>
        </div>
        <div class="sunrise-sunset-wrap" v-if="Boolean(forecast.current)">
          <h1 class="sunrise-sunset-title">Sunrise & Sunset</h1>
          <div class="sunrise-sunset">
            <div><img class="icon-small" :src="sunrisetIcon" /></div>
            <div class="sunrise-sunset-info">
              <div class="sunrise-sunset-info-title">Sunrise</div>
              <div class="sunrise-sunset-info-date">{{ sunrise }}</div>
            </div>
            <div class="sunrise-sunset-date">4 hours ago</div>
          </div>
          <div class="sunrise-sunset">
            <div><img class="icon-small" :src="sunsetIcon" /></div>
            <div class="sunrise-sunset-info">
              <div class="sunrise-sunset-info-title">Sunset</div>
              <div class="sunrise-sunset-info-date">{{ sunset }}</div>
            </div>
            <div class="sunrise-sunset-date">4 hours ago</div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style>
@import url("https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap");

body {
  margin: 0 !important;
  padding: 0 !important;
  box-sizing: border-box;
}

#app {
  background-color: #fff;
  font-family: "Montserrat", sans-serif;
}

main {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 2.5fr 1fr;
  grid-template-rows: 1fr;
  grid-column-gap: 0px;
  grid-row-gap: 0px;
}

hr {
  border: 0.2px solid rgba(150, 150, 150, 0.25);
}

.overview {
  padding: 10px 0px;
}

.overview-title {
  font-size: 28px;
  font-weight: 500;
  margin: 0;
}

.card-list {
  display: grid;
  grid-gap: 20px;
  grid-template-columns: repeat(auto-fit, 350px);
  justify-content: center;
  margin-top: 30px;
}

.content {
  padding: 0px 15px;
}

.content header {
  display: flex;
  align-items: center;
  padding: 10px 0px;
}

.content header .header-date h1,
h6 {
  display: inline-block;
}

.content header .date-title {
  margin: 5px 0;
}

.content header .date-subtitle {
  font-size: 14px;
  font-weight: lighter;
  margin: 5px 0;
}

.content header .header-search {
  margin-left: auto;
  width: 100%;
}

.sidebar {
  background: rgb(39, 60, 89);
  background: linear-gradient(
    180deg,
    rgba(39, 60, 89, 1) 60%,
    rgba(24, 59, 125, 1) 100%
  );
  color: #f8fdff;
  padding: 10px 40px;
}

.sidebar-weather {
  margin-top: 30px;
}

.sidebar-weather .weather-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.weather-wrap .weather-number {
  font-size: 32px;
  font-weight: bolder;
}

.weather-wrap .weather-info {
  font-size: 20px;
}

.sidebar .sidebar-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.location-title,
.location-subtitle {
  margin: 0;
}

.location-title {
  font-size: 22px;
  font-weight: 400;
  margin: 5px 0px;
}

.location-subtitle {
  font-size: 14px;
  font-weight: lighter;
  margin: 5px 0px;
}

.sidebar-date {
  font-size: 28px;
}

.weather-icon {
  display: flex;
  justify-content: center;
}

.icon {
  width: 200px;
}

.icon-small {
  width: 100px;
}

.sunrise-sunset-wrap {
  margin-top: 40px;
}

.sunrise-sunset-title {
  font-size: 32px;
  font-weight: 500;
}

.sunrise-sunset {
  background: rgb(43, 73, 125);
  background: linear-gradient(
    248deg,
    rgba(43, 73, 125, 0.5) 0%,
    rgba(43, 67, 111, 0.5) 100%
  );
  box-sizing: border-box;
  border-radius: 16px;
  border: 1px solid rgba(146, 176, 244, 0.8);
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 10px 0px;
  padding: 10px 15px;
  width: 100%;
}

.sunrise-sunset-date {
  margin-left: auto;
}

.sunrise-sunset-info-title {
  font-size: 18px;
  font-weight: lighter;
  margin-bottom: 10px;
}

.sunrise-sunset-info-date {
  font-size: 28px;
  font-weight: bolder;
}

input {
  appearance: none;
  background: #fbfbfb;
  border: 0;
  box-sizing: border-box;
  font-family: "Montserrat", sans-serif;
  outline: none;
  padding-block: 15px;
  padding-inline: 15px;
  width: 100%;
}
</style>
