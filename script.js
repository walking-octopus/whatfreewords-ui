String.prototype.format = function () {
  var i = 0,
    args = arguments;
  return this.replace(/{}/g, function () {
    return typeof args[i] != "undefined" ? args[i++] : "";
  });
};

function updateWords(coords) {
  words = coord_to_words(coords);

  document.getElementById("words").textContent = words;
  console.log(words);
  console.log(coords);
}

function setStart(coords, map, marker) {
  map.setView(
    new ol.View({
      center: ol.proj.fromLonLat(coords),
      zoom: 19,
      maxZoom: 20,
    })
  );

  marker.setPosition(ol.proj.fromLonLat(coords));

  updateWords(coords);
}

async function copyToClipboard(textToCopy) {
  try {
    await navigator.clipboard.writeText(textToCopy);
    console.log("Link copied to clipboard");
  } catch (err) {
    console.error("Failed to copy: ", err);
  }
}

function shareWords() {
  words = document.getElementById("words").textContent;

  let ourURL = window.location.href;
  let host = ourURL.split("?")[0];

  parameters = "?words=" + words;
  link = host + parameters;

  copyToClipboard(link);
}

function TogglePopup() {
  searchInput.value = null;

  searchPlaceholder.style.display = "flex";
  searchResults.style.display = "none";

  if (main.style.display === "none") {
    // Back
    search.style.display = "none";
    main.style.display = "flex";
  } else {
    // Show
    search.style.display = "flex";
    main.style.display = "none";
  }
}

async function nominatimSearch(query) {
  const response = await fetch(
    "https://nominatim.openstreetmap.org/search.php?q={}&format=json".format(
      query
    )
  );
  const places = await response.json();
  return places;
}

function createResults(results) {
  console.log(results);

  results.forEach((result) => {
    console.log(result.display_name, result.coordinates);

    let element = document.createElement("div");
    element.innerHTML =
      '<span class="w-full h-full whitespace-normal inline-block">{}</span>'.format(
        result.display_name
      );
    element.setAttribute(
      "class",
      "sugestion border-b-2 border-gray-300 py-2.5 px-4 duration-100 hover:bg-gray-200 active:bg-gray-300"
    );
    element.setAttribute(
      "onclick",
      "setStart([{}, {}], map, marker); TogglePopup();".format(
        result.coordinates
      )
    );
    searchResults.appendChild(element);
  });
}

function Search() {
  if (searchInput.value) {
    searchResults.innerHTML = "";
    let results = [];

    ifWordsAddress = searchInput.value.includes("/|/");
    if (ifWordsAddress) {
      words = searchInput.value.replaceAll(" ", "").replace("/|/", "");

      coordinates = words_to_coord(words);

      var result = {
        display_name: words,
        coordinates: coordinates,
      };
      results.push(result);

      createResults(results);
    } else {
      nominatimSearch(searchInput.value).then((places) => {
        places.forEach(function (item, index) {
          var result = {
            display_name: item["display_name"],
            coordinates: [item["lon"], item["lat"]],
          };
          results.push(result);
        });

        createResults(results);
      });
    }

    searchResults.style.display = "block";
    searchPlaceholder.style.display = "none";
  }
}

function parseParams() {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const textParam = urlParams.get("words");

  if (queryString) {
    return textParam;
  } else {
    return null;
  }
}

onload = function () {
  URLwords = parseParams();

  if (URLwords != null) {
    setStart(words_to_coord(URLwords), map, marker);
  } else {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function (position) {
        setStart(
          [position.coords.longitude, position.coords.latitude],
          map,
          marker
        );
      });
    }
  }
};

const search = document.getElementById("searchBox");
const main = document.getElementById("infoBox");
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");
const searchPlaceholder = document.getElementById("searchPlaceholder");

coords = [-0.116708278, 51.50844113];
var map = new ol.Map({
  target: "map",
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM(),
    }),
  ],
  view: new ol.View({
    center: ol.proj.fromLonLat(coords),
    zoom: 16,
    maxZoom: 20,
  }),
});

var marker = new ol.Overlay({
  position: ol.proj.fromLonLat(coords),
  positioning: "center-center",
  element: document.getElementById("marker"),
  stopEvent: false,
});
map.addOverlay(marker);

updateWords(coords);

map.on("click", function (evt) {
  coords = ol.proj.transform(evt.coordinate, "EPSG:3857", "EPSG:4326");
  marker.setPosition(ol.proj.fromLonLat(coords));

  updateWords(coords);
});
