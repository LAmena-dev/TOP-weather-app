// Script for weather data

const temp = document.querySelector("h1");

async function weatherData(searchParams = "London") {
  const response = await fetch(
    `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${searchParams}/?key=55LZSZT52Q234J8HC6T6YCQU6`
  );
  const responseData = await response.json();
  const currentTemp = responseData.currentConditions.temp;

  temp.textContent = currentTemp;
  console.log(responseData);
}

weatherData();
