import { ticketsService, userService } from "services";
import { Doughnut, Chart, Pie, PolarArea } from "react-chartjs-2";
import { useEffect, useState, useMemo } from "react";
import React from "react";
import {
  Chart as ChartJS,
  LinearScale,
  CategoryScale,
  BarElement,
  PointElement,
  LineElement,
  Legend,
  Tooltip,
  LineController,
  BarController,
  ArcElement,
  TimeScale,
  Title,
  RadialLinearScale,
} from "chart.js";
import { formatDate } from "../services";
import dynamic from "next/dynamic";

ChartJS.register(
  LinearScale,
  CategoryScale,
  BarElement,
  PointElement,
  LineElement,
  Legend,
  TimeScale,
  Title,
  Legend,
  Tooltip,
  LineController,
  BarController,
  RadialLinearScale,
  ArcElement
);

export default Home;

function Home() {
  const ForecastChart = dynamic(() => import("../components/ForecastChart"), { ssr: false });

  const [profit, setProfit] = useState({});
  const [bookings, setBookings] = useState([]);
  const [amounts, setAmounts] = useState({});
  const [methods, setMethods] = useState({});
  const [methodsP, setMethodsP] = useState({});
  const [agents, setAgents] = useState({});
  const [agentsP, setAgentsP] = useState({});
  const [agentsA, setAgentsA] = useState({});
  const [methodsA, setMethodsA] = useState({});
  const [airlines, setAirlines] = useState({});
  const [airlinesList, setAirlinesList] = useState({});
  const [airlinesC, setAirlinesC] = useState({});
  const [total, setTotal] = useState(0);
  const [totalC, setTotalC] = useState(0);
  const [dates, setDates] = useState({});
  const [searchedDates, setSearchedDates] = useState({});
  const [loading, setLoading] = useState(true);
  const colors = [
    "rgba(255, 99, 132, 0.5)",
    "rgba(54, 162, 235, 0.5)",
    "rgba(255, 206, 86, 0.5)",
    "rgba(75, 192, 192, 0.5)",
    "rgba(153, 102, 255, 0.5)",
    "rgba(255, 159, 64, 0.5)",
    "rgba(214, 51, 132, 0.5)",
    "rgba(63, 81, 181, 0.5)",
    "rgba(121, 85, 72, 0.5)",
    "rgba(158, 158, 158, 0.5)",
  ];

  const leadTimeData = useMemo(() => {
    if (bookings.length === 0 || !searchedDates.start || !searchedDates.end) {
      return {};
    }
    const leadTimeBuckets = {
      "0-7 Days": 0,
      "8-30 Days": 0,
      "31-90 Days": 0,
      "91+ Days": 0,
    };

    const startDate = new Date(searchedDates.start);
    const endDate = new Date(searchedDates.end);

    const filteredBookings = bookings.filter((booking) => {
      if (!booking.bookedOn) return false;
      const bookingDate = new Date(booking.bookedOn);
      return bookingDate >= startDate && bookingDate <= endDate;
    });

    const parseTravelDate = (dateString) => {
      if (!dateString) return null;
      const firstDateStr = dateString.split(" - ")[0];
      const parts = firstDateStr.split("/");
      if (parts.length !== 3) return null;
      const [day, month, year] = parts;
      const travelDate = new Date(year, month - 1, day);
      return isNaN(travelDate.getTime()) ? null : travelDate;
    };

    filteredBookings.forEach((booking) => {
      if (booking.dates && booking.bookedOn) {
        const travelDate = parseTravelDate(booking.dates);
        const bookedOnDate = new Date(booking.bookedOn);
        if (travelDate && !isNaN(bookedOnDate.getTime())) {
          const leadTime = (travelDate.getTime() - bookedOnDate.getTime()) / (1000 * 60 * 60 * 24);
          if (leadTime < 0) return;
          if (leadTime <= 7) leadTimeBuckets["0-7 Days"]++;
          else if (leadTime <= 30) leadTimeBuckets["8-30 Days"]++;
          else if (leadTime <= 90) leadTimeBuckets["31-90 Days"]++;
          else leadTimeBuckets["91+ Days"]++;
        }
      }
    });
    return leadTimeBuckets;
  }, [bookings, searchedDates]);

  const avgTicketData = useMemo(() => {
    if (Object.keys(amounts).length === 0 || Object.keys(profit).length === 0) {
      return {};
    }
    const labels = Object.keys(amounts);
    const avgValueData = [];
    const avgProfitData = [];

    for (const period of labels) {
      const periodAmount = amounts[period];
      const periodProfit = profit[period];

      if (periodAmount && periodProfit && periodAmount.bookings > 0) {
        const avgValue = periodAmount.totalReceivingAmount / periodAmount.bookings;
        const avgProfit = periodProfit.profit / periodAmount.bookings;
        avgValueData.push(avgValue);
        avgProfitData.push(avgProfit);
      } else {
        avgValueData.push(0);
        avgProfitData.push(0);
      }
    }
    return {
      labels: labels,
      avgValue: avgValueData,
      avgProfit: avgProfitData,
    };
  }, [amounts, profit]);

  const profitMarginData = useMemo(() => {
    if (Object.keys(amounts).length === 0 || Object.keys(profit).length === 0) {
      return {};
    }
    const labels = Object.keys(amounts);
    const marginData = [];

    for (const period of labels) {
      const periodAmount = amounts[period];
      const periodProfit = profit[period];

      if (periodAmount && periodProfit && periodAmount.totalReceivingAmount > 0) {
        const margin = (periodProfit.profit / periodAmount.totalReceivingAmount) * 100;
        marginData.push(margin);
      } else {
        marginData.push(0);
      }
    }
    return { labels, margins: marginData };
  }, [amounts, profit]);

  const pieChart4 =
    Object.keys(agentsA).length > 0 ? (
      <Doughnut
        data={{
          labels: Object.keys(agentsA),
          datasets: [
            {
              data: Object.values(agentsA),
              label: "Agents",
              backgroundColor: colors.slice(),
              borderColor: colors.slice(),
            },
          ],
        }}
      />
    ) : (
      <div className="text-center">No Data to show</div>
    );

  const pieChart5 =
    Object.keys(methodsA).length > 0 ? (
      <Doughnut
        data={{
          labels: Object.keys(methodsA),
          datasets: [
            {
              data: Object.values(methodsA),
              label: "Methods",
              backgroundColor: colors.slice(),
              borderColor: colors.slice(),
            },
          ],
        }}
      />
    ) : (
      <div className="text-center">No Data to show</div>
    );

  const pieChart6 =
    Object.keys(airlines).length > 0 ? (
      <PolarArea
        data={{
          labels: Object.keys(airlines),
          datasets: [
            {
              data: Object.values(airlines),
              label: "Tickets",
              backgroundColor: colors.slice(),
              borderColor: colors.slice(),
            },
          ],
        }}
      />
    ) : (
      <div className="text-center">No Data to show</div>
    );

  const pieChart =
    Object.keys(agents).length > 0 ? (
      <Doughnut
        data={{
          labels: Object.keys(agents),
          datasets: [
            {
              data: Object.values(agents),
              label: "Agents",
              backgroundColor: colors.slice(),
              borderColor: colors.slice(),
            },
          ],
        }}
      />
    ) : (
      <div className="text-center">No Data to show</div>
    );

  const pieChart1 =
    Object.keys(agentsP).length > 0 ? (
      <Doughnut
        data={{
          labels: Object.keys(agentsP),
          datasets: [
            {
              data: Object.values(agentsP),
              label: "Profit",
              backgroundColor: colors.slice(),
              borderColor: colors.slice(),
            },
          ],
        }}
      />
    ) : (
      <div className="text-center">No Data to show</div>
    );

  const pieChart2 =
    Object.keys(methods).length > 0 ? (
      <Doughnut
        data={{
          labels: Object.keys(methods),
          datasets: [
            {
              data: Object.values(methods),
              label: "Method",
              backgroundColor: colors.slice(),
              borderColor: colors.slice(),
            },
          ],
        }}
      />
    ) : (
      <div className="text-center">No Data to show</div>
    );

  const pieChart3 =
    Object.keys(methodsP).length > 0 ? (
      <Doughnut
        data={{
          labels: Object.keys(methodsP),
          datasets: [
            {
              data: Object.values(methodsP),
              label: "Profit",
              backgroundColor: colors.slice(),
              borderColor: colors.slice(),
            },
          ],
        }}
      />
    ) : (
      <div className="text-center">No Data to show</div>
    );

  const barChart =
    Object.keys(amounts).length > 0 ? (
      <Chart
        type="bar"
        data={{
          labels: Object.keys(amounts),
          datasets: [
            {
              type: "bar",
              label: "Received",
              data: Object.values(amounts).map((a) => a.totalReceivingAmount),
              backgroundColor: colors[0],
              yAxisID: "y",
            },
            {
              type: "bar",
              label: "Paid",
              data: Object.values(amounts).map(
                (a) => a.paidAmount
              ),
              backgroundColor: colors[1],
              yAxisID: "y",
            },
            {
              type: "line",
              label: "Bookings",
              data: Object.values(amounts).map((a) => a.bookings),
              borderColor: colors[3],
              backgroundColor: colors[3],
              yAxisID: "y1",
            },
          ],
        }}
        options={{
          scales: {
            y: {
              type: "linear",
              display: true,
              position: "left",
              title: {
                display: true,
                text: "Amount (€)",
              },
            },
            y1: {
              type: "linear",
              display: true,
              position: "right",
              title: {
                display: true,
                text: "Number of Bookings",
              },
              grid: {
                drawOnChartArea: false,
              },
            },
          },
        }}
      />
    ) : (
      <div className="text-center">No Data to show</div>
    );

  const barChart2 =
    Object.keys(amounts).length > 0 ? (
      <Chart
        type="bar"
        data={{
          labels: Object.keys(amounts),
          datasets: [
            {
              type: "line",
              data: Object.values(profit).map((a) => a.profit),
              label: "Profit",
              borderColor: colors[1],
              backgroundColor: colors[1],
              yAxisID: "y",
            },
            {
              type: "line",
              label: "Bookings",
              data: Object.values(amounts).map((a) => a.bookings),
              borderColor: colors[3],
              backgroundColor: colors[3],
              yAxisID: "y1",
            },
          ],
        }}
        options={{
          scales: {
            y: {
              type: "linear",
              display: true,
              position: "left",
              title: {
                display: true,
                text: "Profit (€)",
              },
            },
            y1: {
              type: "linear",
              display: true,
              position: "right",
              title: {
                display: true,
                text: "Number of Bookings",
              },
              grid: {
                drawOnChartArea: false,
              },
            },
          },
        }}
      />
    ) : (
      <div className="text-center">No Data to show</div>
    );

  const leadTimeChart =
    Object.values(leadTimeData).some((v) => v > 0) ? (
      <Doughnut
        data={{
          labels: Object.keys(leadTimeData),
          datasets: [
            {
              label: "Number of Bookings",
              data: Object.values(leadTimeData),
              backgroundColor: colors.slice(),
              borderColor: colors.slice(),
            },
          ],
        }}
        options={{
          plugins: {
            legend: {
              display: true,
              position: "top",
            },
          },
        }}
      />
    ) : (
      <div className="text-center">No Data to show</div>
    );

  const avgTicketValueChart =
    avgTicketData.labels &&
    avgTicketData.labels.length > 0 &&
    profitMarginData.margins
      ? (
      <Chart
        type="line"
        data={{
          labels: avgTicketData.labels,
          datasets: [
            {
              label: "Avg. Ticket Value (€)",
              data: avgTicketData.avgValue,
              borderColor: colors[1],
              backgroundColor: colors[1],
              yAxisID: "y",
            },
            {
              label: "Avg. Profit per Ticket (€)",
              data: avgTicketData.avgProfit,
              borderColor: colors[0],
              backgroundColor: colors[0],
              yAxisID: "y1",
            },
            {
              type: "line",
              label: "Profit Margin (%)",
              data: profitMarginData.margins,
              borderColor: colors[3],
              backgroundColor: colors[3],
              yAxisID: "y2",
            },
          ],
        }}
        options={{
          scales: {
            y: {
              type: "linear",
              display: true,
              position: "left",
              title: {
                display: true,
                text: "Avg. Ticket Value (€)",
              },
            },
            y1: {
              type: "linear",
              display: true,
              position: "right",
              title: {
                display: true,
                text: "Avg. Profit per Ticket (€)",
              },
              grid: {
                drawOnChartArea: false,
              },
            },
            y2: {
              type: "linear",
              display: true,
              position: "right",
              title: {
                display: true,
                text: "Profit Margin (%)",
              },
              grid: {
                drawOnChartArea: false, // Important to avoid clutter
              },
              ticks: {
                callback: function (value) {
                  return value.toFixed(2) + "%";
                },
              },
            },
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: function (context) {
                  let label = context.dataset.label || "";
                  if (label) {
                    label += ": ";
                  }
                  if (context.parsed.y !== null) {
                    // Add '%' for profit margin dataset
                    if (context.dataset.yAxisID === "y2") {
                      label += context.parsed.y.toFixed(2) + "%";
                    } else {
                      // Format other values as currency
                      label += new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "EUR",
                      }).format(context.parsed.y);
                    }
                  }
                  return label;
                },
              },
            },
          },
        }}
      />
    ) : (
      <div className="text-center">No Data to show</div>
    );

  useEffect(() => {
    const start = new Date();
    start.setDate(1);
    const defaultDates = {
      start: formatDate(start),
      end: formatDate(new Date()),
      type: "bookedOn",
    };
    setDates(defaultDates);
    setSearchedDates(defaultDates);
    getProfit(defaultDates);
  }, []);

  const getProfit = (datesToFetch) => {
    setLoading(true);
    Promise.all([
      ticketsService.getProfit(datesToFetch),
      ticketsService.getBookings(),
    ])
      .then(([profitData, bookingsData]) => {
        setProfit(profitData.ticketsP);
        setAmounts(profitData.ticketsP);
        setMethods(profitData.methods);
        setMethodsP(profitData.methodsP);
        setAgents(profitData.agents);
        setAgentsP(profitData.agentsP);
        setAgentsA(profitData.agentsA);
        setMethodsA(profitData.methodsA);
        setAirlines(profitData.airlines);
        setAirlinesList(profitData.airlinesList);
        setAirlinesC(profitData.airlinesC);
        setTotal(profitData.total);
        setTotalC(profitData.totalC);
        setBookings(bookingsData);
      })
      .catch((error) => console.error("Failed to fetch dashboard data:", error))
      .finally(() => setLoading(false));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchedDates(dates);
    getProfit(dates);
  };

  return (
    <>
      <div className="container">
        <form className="row" onSubmit={handleSearch}>
          <div className="col-sm-2">
            <label htmlFor="type">Type:</label>
            <div className="input-group">
              <select id="type" className="form-select" value={dates.type} onChange={(e) => setDates((d) => ({ ...d, type: e.target.value }))}>
                <option defaultValue value="bookedOn">
                  Issue Date
                </option>
                <option value="receivingAllDates">All Amounts Dates</option>
                <option value="receivingAmount1Date">Amount 1 Date</option>
                <option value="receivingAmount2Date">Amount 2 Date</option>
                <option value="receivingAmount3Date">Amount 3 Date</option>
              </select>
            </div>
          </div>
          <div className="col-sm-4">
            <label htmlFor="start">From Date:</label>
            <div className="input-group">
              <input
                type="date"
                className="form-control"
                id="start"
                value={dates.start || ''}
                onChange={(e) => setDates((d) => ({ ...d, start: e.target.value }))}
                placeholder="From"
              />
            </div>
          </div>
          <div className="col-sm-4">
            <label htmlFor="end">To Date:</label>
            <div className="input-group">
              <input
                type="date"
                className="form-control"
                id="end"
                value={dates.end || ''}
                onChange={(e) => setDates((d) => ({ ...d, end: e.target.value }))}
                placeholder="To"
              />
            </div>
          </div>
          <div className="col-sm-2">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-block btn-primary width-search"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </form>
      </div>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <div className="spinner-border text-primary" role="status" style={{ width: '4rem', height: '4rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <h4 style={{ marginTop: '20px', color: '#0d6efd' }}>Loading Dashboard...</h4>
        </div>
      ) : (
        <div className="p-4">
          <div className="container">
            <br />
            <br />
            <br />
            <div className="row">
              <div className="col-md-6">
                <h4 className="drag-text">Paid vs Received Amount</h4>
                {barChart}
              </div>
              <div className="col-md-6">
                <h4 className="drag-text">Profit</h4>
                {barChart2}
              </div>
            </div>
            <div className="row">
              <div className="col-6 col-xs-12 col-xl-3">
                <br />
                <h4 className="drag-text">Agents</h4>
                {pieChart}
              </div>
              <div className="col-6 col-xs-12 col-xl-3">
                <br />
                <h4 className="drag-text">Payment Methods</h4>
                {pieChart2}
              </div>
              <div className="col-6 col-xs-12 col-xl-3">
                <br />
                <h4 className="drag-text">Profit by Agents</h4>
                {pieChart1}
              </div>
              <div className="col-6 col-xs-12 col-xl-3">
                <br />
                <h4 className="drag-text">Profit by Methods</h4>
                {pieChart3}
              </div>
              <div className="col-6 col-xs-12 col-xl-3">
                <br />
                <h4 className="drag-text">Payments by Agents</h4>
                {pieChart4}
              </div>
              <div className="col-6 col-xs-12 col-xl-3">
                <br />
                <h4 className="drag-text">Pay. by Methods</h4>
                {pieChart5}
              </div>
              <div className="col-6 col-xs-12 col-xl-3">
                <br />
                <h4 className="drag-text">Booking Lead Time</h4>
                {leadTimeChart}
              </div>
              <div className="col-md-6">
                <br />
                <h4 className="drag-text">
                  Average Ticket Value, Profit & Margin
                </h4>
                {avgTicketValueChart}
              </div>
              <div className="col-md-12 col-sm-12 col-xs-12 col-lg-12 col-xl-6">
                <br />
                <h4 className="drag-text">Bookings forecast</h4>
                {bookings && bookings.length > 0 ? (
                  <ForecastChart
                    bookings={bookings}
                    colors={colors}
                    monthsBack={24}
                    forecastMonths={6}
                    alpha={0.3}
                    beta={0.05}
                    gamma={0.2}
                    model="additive"
                  />
                ) : (
                  <div className="text-center">No Forecast data found</div>
                )}
              </div>
              <div className="col-12 col-xs-12 col-xl-12">
                <br />
                <h4 className="drag-text">Bookings</h4>
                {pieChart6}
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th style={{ width: "40%" }}>Name</th>
                        <th style={{ width: "20%" }}>Bookings</th>
                        <th style={{ width: "20%" }}>Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <b>Total</b>
                        </td>
                        <td>
                          <b>{total}</b>
                        </td>
                        <td>
                          <b>{totalC.toFixed(2)}</b>
                        </td>
                      </tr>
                      {Object.keys(airlinesList) &&
                        Object.keys(airlinesList).map((airline, i) => (
                          <tr key={i}>
                            <td>{airline}</td>
                            <td>
                              {airlinesList[airline]} (
                              {(
                                (parseInt(airlinesList[airline]) * 100) /
                                parseInt(total)
                              ).toFixed(2)}
                              %)
                            </td>
                            <td>
                              {airlinesC[airline].toFixed(2)} (
                              {(
                                (parseFloat(airlinesC[airline]) * 100) /
                                parseFloat(totalC)
                              ).toFixed(2)}
                              %)
                            </td>
                          </tr>
                        ))}
                      <tr>
                        <td>
                          <b>Total</b>
                        </td>
                        <td>
                          <b>{total}</b>
                        </td>
                        <td>
                          <b>{totalC.toFixed(2)}</b>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
