// Script for weather data
import "./styles.css";
import { format, parse } from "date-fns";
import clearDay from "./images/clear-day.png";
import cloudyDay from "./images/cloudy.png";
import partlyCloudyDay from "./images/partly-cloudy-day.png";
import clearNight from "./images/clear-night.png";
import partlyCloudyNight from "./images/partly-cloudy-night.png";
import rainy from "./images/rain.png";
import snowy from "./images/snow.png"

const iconMap = {
  "clear-day": clearDay,
  "cloudy": cloudyDay,
  "partly-cloudy-day": partlyCloudyDay,
  "clear-night": clearNight,
  "partly-cloudy-night": partlyCloudyNight,
  "rain": rainy,
  "snow": snowy
};

// Date Formatting
const dateToday = new Date();
const dateYesterday = new Date(dateToday);
dateYesterday.setDate(dateToday.getDate() - 1);
const formattedDate = format(dateYesterday, "EEEE, MMM dd, yyyy");

// Helper function for building card elements
function elementBuilder(tag, cls, text) {
  const el = document.createElement(tag);
  if (cls) el.classList.add(cls);
  if (text != null) {
    el.textContent = text;
  }
  return el;
}

// Conversion Formulae
function fahrenToCel(temperature) {
  return (parseFloat(temperature) - 32) * (5 / 9);
}

function celToFahren(temperature) {
  return parseFloat(temperature) * (9 / 5) + 32;
}

// Search
const search = document.querySelector("#search");
search.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
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

  const temps = document.querySelectorAll(".dayTemp");
  const currentFeel = document.querySelector(".currentFeel span");

  if (convertBtn.textContent === "°F") {
    temps.forEach((temp) => {
      const conversion = celToFahren(temp.textContent);
      temp.textContent = conversion.toFixed(1) + convertBtn.textContent;
    });
    const conversion = celToFahren(currentFeel.textContent);
    currentFeel.textContent = conversion.toFixed(1) + convertBtn.textContent;
  } else {
    temps.forEach((temp) => {
      const conversion = fahrenToCel(temp.textContent);
      temp.textContent = conversion.toFixed(1) + convertBtn.textContent;
    });
    const conversion = fahrenToCel(currentFeel.textContent);
    currentFeel.textContent = conversion.toFixed(1) + convertBtn.textContent;
  }
});

// VisualCrossing fetch API
async function weatherData(searchParams = "London") {
  const response = await fetch(
    `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${searchParams}/?key=55LZSZT52Q234J8HC6T6YCQU6`
  );
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
  currentIcon.src = iconMap[dataToday.icon];
  const currentCond = document.querySelector(".currentCond");
  currentCond.textContent = dataToday.conditions;
  const currentDate = document.querySelector(".currentDate");
  currentDate.textContent = formattedDate;

  const currentTemp = document.querySelector(".currentTemp");
  const currentTempConv = fahrenToCel(dataToday.temp);
  currentTemp.textContent = currentTempConv.toFixed(1) + convertBtn.textContent;

  const currentFeel = document.querySelector(".currentFeel span");
  const currentFeelConv = fahrenToCel(dataToday.feelslike);
  currentFeel.textContent = currentFeelConv.toFixed(1) + convertBtn.textContent;
  const currentHumid = document.querySelector(".currentHumid");
  currentHumid.textContent = "Humidity: " + dataToday.humidity;

  // 7 days of weather
  const week = document.querySelector(".week");

  responseData.days.slice(0, 7).forEach((day, i) => {
    const dayContain = elementBuilder("div", "dayContain");
    const dayIcon = elementBuilder("img", "dayIcon");
    dayIcon.src = iconMap[day.icon];

    const dayCond = elementBuilder("p", "dayCond", day.conditions);
    const dayTempConv = fahrenToCel(day.temp);
    const dayTemp = elementBuilder(
      "h1",
      "dayTemp",
      dayTempConv.toFixed(1) + convertBtn.textContent
    );
    const dayDate = elementBuilder(
      "p",
      "dayDate",
      format(day.datetime, "EEEE, MMM dd, yyyy")
    );
    dayContain.append(dayIcon, dayCond, dayTemp, dayDate);
    week.append(dayContain);
    console.log(day.temp + " " + day.icon + ` index: ${i}`);
  });

  console.log(dataToday.temp + " " + dataToday.icon);
  console.log(responseData);
}

weatherData();
