import React, { useMemo, useState } from "react";
import "chart.js/auto"; // auto-registers Chart.js components
import { Chart } from "react-chartjs-2";

/**
 * addMonths: get first day of month after adding months
 */
const addMonths = (d, months) => {
  const dt = new Date(d);
  dt.setMonth(dt.getMonth() + months);
  dt.setDate(1);
  dt.setHours(0, 0, 0, 0);
  return dt;
};

/**
 * Holt-Winters (triple exponential smoothing)
 * series: array of numbers
 * seasonLen: integer (12 for monthly)
 * params: { alpha, beta, gamma }
 * nPred: number of periods to forecast
 * model: "additive" | "multiplicative"
 */
function holtWinters(
  series,
  seasonLen,
  { alpha = 0.3, beta = 0.05, gamma = 0.2 } = {},
  nPred = 6,
  model = "additive"
) {
  if (!Array.isArray(series) || series.length === 0 || seasonLen < 1) return null;
  const n = series.length;
  // initialize seasonals using seasonal averages
  const seasons = Math.max(1, Math.floor(n / seasonLen));
  const seasonAverages = [];
  for (let s = 0; s < seasons; s++) {
    let sum = 0;
    for (let i = 0; i < seasonLen; i++) sum += series[s * seasonLen + i] || 0;
    seasonAverages.push(sum / seasonLen);
  }

  const seasonals = new Array(seasonLen).fill(0);
  if (model === "additive") {
    for (let i = 0; i < seasonLen; i++) {
      let sum = 0;
      for (let s = 0; s < seasons; s++) {
        sum += (series[s * seasonLen + i] || 0) - (seasonAverages[s] || 0);
      }
      seasonals[i] = sum / seasons;
    }
  } else {
    for (let i = 0; i < seasonLen; i++) {
      let sumRatio = 0;
      for (let s = 0; s < seasons; s++) {
        const idx = s * seasonLen + i;
        const avg = seasonAverages[s] || 1;
        sumRatio += (series[idx] || 0) / avg;
      }
      seasonals[i] = sumRatio / seasons;
    }
  }

  // initial level and trend
  const initialLevel = model === "additive" ? series[0] - seasonals[0] : series[0] / (seasonals[0] || 1);
  let level = initialLevel;
  let trend = 0;
  if (n >= seasonLen * 2) {
    let sum = 0;
    for (let i = 0; i < seasonLen; i++) {
      const v1 = series[i] || 0;
      const v2 = series[i + seasonLen] || 0;
      sum += (v2 - v1) / seasonLen;
    }
    trend = sum / seasonLen;
  } else {
    trend = (series[n - 1] - series[0]) / Math.max(1, n - 1);
  }

  const fitted = new Array(n).fill(null);
  const S = seasonals.slice();

  for (let t = 0; t < n; t++) {
    const value = series[t] || 0;
    const si = t % seasonLen;
    const lastLevel = level;
    if (model === "additive") {
      level = alpha * (value - S[si]) + (1 - alpha) * (level + trend);
      trend = beta * (level - lastLevel) + (1 - beta) * trend;
      S[si] = gamma * (value - level) + (1 - gamma) * S[si];
      fitted[t] = level + trend + S[si];
    } else {
      level = alpha * (value / (S[si] || 1)) + (1 - alpha) * (level + trend);
      trend = beta * (level - lastLevel) + (1 - beta) * trend;
      S[si] = gamma * (value / (level || 1)) + (1 - gamma) * S[si];
      fitted[t] = (level + trend) * S[si];
    }
  }

  const forecast = [];
  for (let m = 1; m <= nPred; m++) {
    const idx = n + m - 1;
    const si = idx % seasonLen;
    if (model === "additive") forecast.push(Math.max(0, level + m * trend + S[si]));
    else forecast.push(Math.max(0, (level + m * trend) * S[si]));
  }

  return { fitted, forecast, seasonal: S.slice(), level, trend };
}

/**
 * Simplified Prophet-like model.
 * This is a demonstration model that captures the spirit of Prophet by
 * decomposing the time series into a linear trend and additive seasonality.
 * It is NOT a full implementation of Facebook's Prophet.
 * series: array of numbers
 * seasonLen: integer (12 for monthly)
 * nPred: number of periods to forecast
 */
function simpleProphet(series, seasonLen, nPred) {
  if (!Array.isArray(series) || series.length < seasonLen) return null;
  const n = series.length;

  // 1. Fit a linear trend g(t) = a + b*t using linear regression
  let sum_t = 0, sum_y = 0, sum_t2 = 0, sum_ty = 0;
  for (let t = 0; t < n; t++) {
    const y = series[t] || 0;
    sum_t += t;
    sum_y += y;
    sum_t2 += t * t;
    sum_ty += t * y;
  }
  const b = (n * sum_ty - sum_t * sum_y) / (n * sum_t2 - sum_t * sum_t); // slope
  const a = (sum_y - b * sum_t) / n; // intercept
  const trend = series.map((_, t) => a + b * t);

  // 2. Calculate seasonal components s(t) by averaging detrended values
  const detrended = series.map((y, t) => (y || 0) - trend[t]);
  const seasonals = new Array(seasonLen).fill(0);
  const seasonalCounts = new Array(seasonLen).fill(0);
  for (let t = 0; t < n; t++) {
    const si = t % seasonLen;
    seasonals[si] += detrended[t];
    seasonalCounts[si]++;
  }
  for (let i = 0; i < seasonLen; i++) seasonals[i] /= (seasonalCounts[i] || 1);

  // 3. Make forecast by projecting trend and adding seasonal component
  const forecast = [];
  for (let i = 0; i < nPred; i++) {
    const t = n + i;
    forecast.push(Math.max(0, (a + b * t) + seasonals[t % seasonLen]));
  }
  return { forecast };
}
/**
 * Simplified SARIMA model (specifically, a seasonal AR(1) model on differenced data).
 * This is a demonstration and not a full, robust SARIMA implementation, which
 * would require complex parameter estimation (e.g., MLE).
 * This model performs one seasonal differencing and then fits a simple AR(1) model.
 * series: array of numbers
 * seasonLen: integer (12 for monthly)
 * nPred: number of periods to forecast
 */
function simpleSarima(series, seasonLen, nPred) {
  if (!Array.isArray(series) || series.length < 2 * seasonLen) return null;

  // 1. Seasonal Differencing (D=1)
  const diffSeries = [];
  for (let i = seasonLen; i < series.length; i++) {
    diffSeries.push((series[i] || 0) - (series[i - seasonLen] || 0));
  }

  // 2. Fit a seasonal AR(1) model on the differenced series.
  // We estimate the AR(1) coefficient (phi) using the lag-1 autocorrelation of the differenced series.
  let phi = 0;
  if (diffSeries.length > 1) {
    const mean = diffSeries.reduce((a, b) => a + b, 0) / diffSeries.length;
    let numerator = 0;
    let denominator = 0;
    for (let t = 1; t < diffSeries.length; t++) {
      numerator += (diffSeries[t] - mean) * (diffSeries[t - 1] - mean);
    }
    for (let t = 0; t < diffSeries.length; t++) {
      denominator += Math.pow(diffSeries[t] - mean, 2);
    }
    phi = denominator !== 0 ? numerator / denominator : 0;
  }

  // 3. Forecast the differenced series
  const forecastDiff = [];
  let lastVal = diffSeries.length > 0 ? diffSeries[diffSeries.length - 1] : 0;
  for (let i = 0; i < nPred; i++) {
    // The forecast is phi * last_value.
    lastVal = lastVal * phi;
    forecastDiff.push(lastVal);
  }

  // 4. Inverse the differencing to get the final forecast
  const forecast = [];
  for (let i = 0; i < nPred; i++) {
    // Get the corresponding historical value from the last seasonal cycle
    const historicalIndex = series.length - seasonLen + i;
    const historicalVal = series[historicalIndex] || 0;
    forecast.push(Math.max(0, (forecastDiff[i] || 0) + historicalVal));
  }

  return { forecast };
}

/**
 * Aggregate bookings by booking month and run Holt-Winters forecast.
 * bookings: array of objects with bookedOn (ISO date string)
 * monthsBack: number of months to include for training
 * forecastMonths: number of months to forecast
 */
export default function ForecastChart({
  bookings = [],
  colors = {},
  monthsBack = 36,
  forecastMonths = 6,
  alpha = 0.3,
  beta = 0.05,
  gamma = 0.2,
  model = "additive",
}) {
  const chart = useMemo(() => {
    if (!Array.isArray(bookings) || bookings.length === 0) return null;

    // build counts map by booking month
    const toKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const countsMap = {};
    let maxDate = new Date(0);
    bookings.forEach((b) => {
      const dt = b && b.bookedOn ? new Date(b.bookedOn) : null;
      if (!dt || isNaN(dt)) return;
      const key = toKey(dt);
      countsMap[key] = (countsMap[key] || 0) + 1;
      if (dt > maxDate) maxDate = dt;
    });
    if (maxDate.getTime() === new Date(0).getTime()) return null;

    const endMonth = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
    const startMonth = addMonths(endMonth, -(monthsBack - 1));
    const labels = [];
    const history = [];
    for (let i = 0; i < monthsBack; i++) {
      const m = addMonths(startMonth, i);
      labels.push(m.toLocaleString(undefined, { month: "short", year: "numeric" }));
      const key = toKey(m);
      history.push(countsMap[key] || 0);
    }

    const hw = holtWinters(history, 12, { alpha, beta, gamma }, forecastMonths, model);
    if (!hw) return null;

    // Run the simplified SARIMA model
    const sarima = simpleSarima(history, 12, forecastMonths);
    
    // Run the simplified Prophet-like model
    const prophet = simpleProphet(history, 12, forecastMonths);

    const forecastLabels = Array.from({ length: forecastMonths }).map((_, i) =>
      addMonths(endMonth, i + 1).toLocaleString(undefined, { month: "short", year: "numeric" })
    );
    const combinedLabels = labels.concat(forecastLabels);

    const forecastSeries = Array(history.length).fill(null).concat(hw.forecast.map((v) => Math.round(v)));
    const forecastSeriesProphet =
      prophet ? Array(history.length).fill(null).concat(prophet.forecast.map((v) => Math.round(v))) : [];
    const forecastSeriesSarima =
      sarima ? Array(history.length).fill(null).concat(sarima.forecast.map((v) => Math.round(v))) : [];

    const data = {
      labels: combinedLabels,
      datasets: [
        {
          type: "bar",
          label: "Historical bookings",
          data: history.concat(Array(forecastMonths).fill(null)),
          backgroundColor: colors[0],
          borderColor: colors[0],
          borderWidth: 3,
        },
        {
          type: "line",
          label: `Holt Winter forecast`,
          data: forecastSeries,
          borderColor: colors[1],
          borderWidth: 3,
          fill: false,
          tension: 0.2,
          pointRadius: 4,
          backgroundColor: colors[1],
        },
        ...(sarima
          ? [{
              type: "line",
              label: `SARIMA forecast`,
              data: forecastSeriesSarima,
              borderColor: colors[2],
              borderWidth: 3,
              fill: false,
              tension: 0.2,
              pointRadius: 4,
              backgroundColor: colors[2],
            },
          ]
          : []),
        ...(prophet
          ? [{
              type: "line",
              label: `Prophet forecast`,
              data: forecastSeriesProphet,
              borderColor: colors[3],
              borderWidth: 3,
              fill: false,
              tension: 0.2,
              pointRadius: 4,
              backgroundColor: colors[3],
            },
          ]
          : []),
      ],
    };

    const options = {
      responsive: true,
      plugins: {
        legend: { position: "top" },
        tooltip: { mode: "index", intersect: false },
        title: {
          display: true,
          text: "Forecast Model Comparison",
        },
      },
      scales: {
        x: { stacked: false },
        y: {
          beginAtZero: true,
          title: { display: true, text: "Bookings" },
          ticks: { precision: 0 },
        },
      },
    };

    return { data, options };
  }, [bookings, monthsBack, forecastMonths, alpha, beta, gamma, model]);

  if (!chart) return <div className="text-center">No data to show</div>;

  return (
    <div>
      <Chart type="bar" data={chart.data} options={chart.options} />
    </div>
  );
}