import { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { PollTicket } from "./poll_ticket";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip } from 'react-tooltip';

const PARTIES = [
  "Democratic Party",
  "Republican Party",
  "Libertarian Party",
  "Green Party",
  "U.S. Taxpayers Party",
  "Working Class Party",
  "Natural Law Party",
];

const PARTY_COLORS = {
  "Democratic Party": "#4B9CD3",
  "Republican Party": "#FF6B6B",
};

export default function MichiganMap() {
  const [hoveredCounty, setHoveredCounty] = useState(null);
  const [selectedCounty, setSelectedCounty] = useState(null);
  const [features, setFeatures] = useState([]);
  const [pollData, setPollData] = useState({});
  const [selectedTownship, setSelectedTownship] = useState(null);
  const [countyWinners, setCountyWinners] = useState({});

  useEffect(() => {
    fetch("/michigan_county_boundaries.geojson")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log(data);
        setFeatures(data.features);
      })
      .catch((error) => console.error("Error loading GeoJSON:", error));
  }, []);

  useEffect(() => {
    fetch("/api/poll-data", {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        setPollData(data);
      })
      .catch((error) => {
        console.error("Error loading poll data:", error);
        toast.error("Failed to load poll data");
      });
  }, []);

  useEffect(() => {
    const fetchWinners = async () => {
      const winners = {};
      for (const feature of features) {
        const countyName = feature.properties.name;
        // ONLY HERE FOR TESTING PURPOSES
        // FIX: Genesee and Oakland are the only counties that have presidential winner data
        if (countyName === "Genesee" || countyName === "Oakland") {
          try {
            const response = await fetch(
              `/api/county/${countyName}/presidential-winner`
            );
            if (response.ok) {
              const data = await response.json();
              winners[countyName] = data.winning_party;
            }
          } catch (error) {
            console.error(`Error fetching winner for ${countyName}:`, error);
          }
        }
      }
      setCountyWinners(winners);
    };

    if (features.length > 0) {
      fetchWinners();
    }
  }, [features]);

  function buildPath(coordinates) {
    if (!coordinates || coordinates.length === 0) return "";

    // Handle MultiPolygon and Polygon types
    const polygons = Array.isArray(coordinates[0][0][0])
      ? coordinates // MultiPolygon
      : [coordinates]; // Polygon

    return polygons
      .map((polygon) => {
        const points = polygon[0]
          .map(([lon, lat]) => {
            // Adjusted scaling and offset to better center Michigan
            const x = (lon + 89) * 100; // Increased longitude offset and scaling
            const y = (lat - 41.5) * 100; // Increased scaling factor
            return `${x},${y}`;
          })
          .join(" L ");
        return `M ${points} Z`;
      })
      .join(" ");
  }

  const handleCountyClick = (countyName: string) => {
    setSelectedCounty(countyName);
    setSelectedTownship(null);
    toast.dismiss();
    toast.success(`Selected county: ${countyName}`, {
      autoClose: 1000,
      hideProgressBar: true,
    });
  };

  const findPollData = (countyName) => {
    const countyData = pollData[countyName];
    if (!countyData) return null;

    return {
      county: countyName,
      townships: countyData,
    };
  };

  const handleTownshipSelect = (township) => {
    setSelectedTownship(township === "none" ? null : township);
    if (township && township !== "none") {
      toast.success(`Selected township: ${township}`, {
        autoClose: 1000,
        hideProgressBar: true,
      });
    }
  };

  return (
    <div className="flex gap-8 w-full items-center">
      <ToastContainer />

      <div className="w-1/2 fixed top-1/2 -translate-y-1/2 left-10">
        <svg
          viewBox="0 0 1000 800"
          className="w-full border border-gray-200 p-8 rounded-lg shadow-md"
          style={{ backgroundColor: "#f8fafc" }}
        >
          <g transform="translate(200, 750) scale(1, -1.1)">
            {features.map((feature) => {
              const countyName = feature.properties.name;
              const winningParty = countyWinners[countyName];
              const fillColor = PARTY_COLORS[winningParty] || "#E5E7EB";
              return (
                <path
                  key={countyName}
                  data-tooltip-id="county-tooltip"
                  data-tooltip-content={countyName}
                  d={buildPath(feature.geometry.coordinates)}
                  className={`transition-colors duration-200 ${
                    selectedCounty === countyName ? "brightness-75" : ""
                  } stroke-gray-700 hover:brightness-75`}
                  style={{ fill: fillColor }}
                  onMouseEnter={() => setHoveredCounty(countyName)}
                  onMouseLeave={() => setHoveredCounty(null)}
                  onClick={() => handleCountyClick(countyName)}
                />
              );
            })}
          </g>
        </svg>
        <Tooltip id="county-tooltip" />
      </div>

      <div className="w-1/2 ml-[50%] pl-8">
        <Card>
          {!selectedCounty ? (
            <CardContent className="pt-6">
              <div className="text-gray-500 text-lg text-center">
                Click on a county to view poll data
              </div>
            </CardContent>
          ) : (
            <>
              <CardContent>
                {findPollData(selectedCounty) ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-white rounded-lg shadow sticky top-2">
                      <h2 className="text-xl font-bold mb-1">
                        {selectedCounty} County
                      </h2>
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Select Township
                      </label>
                      <Select
                        onValueChange={handleTownshipSelect}
                        value={selectedTownship || ""}
                      >
                        <SelectTrigger className="w-full mt-2">
                          <SelectValue placeholder="Choose a township..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">
                            Please Select Township
                          </SelectItem>
                          {Object.keys(pollData[selectedCounty]).map(
                            (township) => (
                              <SelectItem key={township} value={township}>
                                {township}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedTownship && (
                      <PollTicket
                        data={{
                          county: selectedCounty,
                          township: selectedTownship,
                          ...pollData[selectedCounty][selectedTownship],
                        }}
                      />
                    )}
                  </div>
                ) : (
                  <>
                    <CardHeader className="text-center">
                      <CardTitle>{selectedCounty} County</CardTitle>
                    </CardHeader>
                    <div className="text-center text-gray-500">
                      <p>
                        No poll data has been added for {selectedCounty} County
                        yet.
                      </p>
                      <p className="text-sm mt-2">
                        Data files should be added to: Poll_tickets/
                        {selectedCounty}/
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
