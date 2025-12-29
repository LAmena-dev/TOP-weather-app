// Script for weather data
import "./styles.css";
import { format, parse } from "date-fns";
import {
  elementBuilder,
  renderTemp,
  toggleTempUnit,
  getWeatherIcon,
} from "./utils";

// Date Formatting
const dateToday = new Date();
const dateYesterday = new Date(dateToday);
dateYesterday.setDate(dateToday.getDate() - 1);
const formattedDate = format(dateYesterday, "EEEE, MMM dd, yyyy");

// Search
const search = document.querySelector("#search");
search.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const query = search.value.trim();
    if (!query) return;

    const week = document.querySelector(".week");
    convertBtn.textContent = "°C";
    isCelsius = true;
    week.innerHTML = "";
    weatherData(search.value);
  }
});

// Conversion Button
const convertBtn = document.querySelector("#convert");
convertBtn.textContent = "°C";
let isCelsius = true;

convertBtn.addEventListener("click", () => {
  isCelsius = !isCelsius;
  convertBtn.textContent = isCelsius ? "°C" : "°F";
  toggleTempUnit(isCelsius);
});

// VisualCrossing fetch API
async function weatherData(searchParams = "London") {
  try {
    const response = await fetch(
      `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${searchParams}/?key=55LZSZT52Q234J8HC6T6YCQU6`
    );

    if (!response.ok) {
      throw new Error(`Location not found: ${searchParams}`);
    }

    const responseData = await response.json();

    // Header details
    const location = document.querySelector("#locationName");
    location.textContent = responseData.address;

    const currentTime = document.querySelector(".currentTime");
    const timeString = responseData.currentConditions.datetime;
    const parsedTime = parse(timeString, "HH:mm:ss", dateYesterday);
    const formattedTime = format(parsedTime, "hh:mm a");
    currentTime.textContent = formattedTime;

    // Current Day Weather Statistics
    const dataToday = responseData.currentConditions;

    const currentIcon = document.querySelector(".currentIcon");
    currentIcon.src = getWeatherIcon(dataToday.icon);
    const currentCond = document.querySelector(".currentCond");
    currentCond.textContent = dataToday.conditions;
    const currentDate = document.querySelector(".currentDate");
    currentDate.textContent = formattedDate;

    const currentTemp = document.querySelector(".currentTemp");
    renderTemp(currentTemp, dataToday.temp);

    const currentFeel = document.querySelector(".currentFeel span");
    renderTemp(currentFeel, dataToday.feelslike);

    const currentHumid = document.querySelector(".currentHumid");
    currentHumid.textContent = "Humidity: " + dataToday.humidity;

    // 7 days of weather
    const week = document.querySelector(".week");

    responseData.days.slice(0, 7).forEach((day, i) => {
      const dayContain = elementBuilder("div", "dayContain");
      const dayIcon = elementBuilder("img", "dayIcon");
      dayIcon.src = getWeatherIcon(day.icon);

      const dayCond = elementBuilder("p", "dayCond", day.conditions);
      const dayTemp = elementBuilder("h1", "dayTemp");
      renderTemp(dayTemp, day.temp);

      const dayDate = elementBuilder(
        "p",
        "dayDate",
        format(day.datetime, "EEEE, MMM dd, yyyy")
      );
      dayContain.append(dayIcon, dayCond, dayTemp, dayDate);
      week.append(dayContain);
    });
  } catch (error) {
    console.error(error);

    const week = document.querySelector(".week");
    week.innerHTML = "";
    week.textContent = `No weather data found for "${searchParams}".`;
  }
}

weatherData();
