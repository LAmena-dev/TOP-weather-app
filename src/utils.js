// Helper function for building card elements
export function elementBuilder(tag, cls, text) {
  const el = document.createElement(tag);
  if (cls) el.classList.add(cls);
  if (text != null) {
    el.textContent = text;
  }
  return el;
}

// Fahrenheit to Celsius
export function fahrenToCel(temperature) {
  return (parseFloat(temperature) - 32) * (5 / 9);
}

export function renderTemp(el, tempValue) {
  const celsiusConv = fahrenToCel(tempValue);
  el.dataset.celsius = celsiusConv;
  return (el.textContent = `${celsiusConv.toFixed(1)}°C`);
}

// Temperature Converter for toggle button
export function toggleTempUnit(isCelsius) {
  const temps = document.querySelectorAll("[data-celsius]");

  temps.forEach((el) => {
    const celsius = parseFloat(el.dataset.celsius);

    el.textContent = isCelsius
      ? `${celsius.toFixed(1)}°C`
      : `${((celsius * 9) / 5 + 32).toFixed(1)}°F`;
  });
}

// To get weather Icon
export function getWeatherIcon(iconName) {
  try {
    return require(`./images/${iconName}.png`);
  } catch {
    console.warn(`⚠️ Missing weather icon: "${iconName}"`);
    alert(`Weather condition not supported yet: "${iconName}"`);
    return require(`./images/clear-day.png`);
  }
}
