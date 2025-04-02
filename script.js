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

function setStartWithView(coords, boundingbox) {
  marker.setPosition(ol.proj.fromLonLat(coords));

  if (boundingbox) {
    const minLat = parseFloat(boundingbox[0]);
    const maxLat = parseFloat(boundingbox[1]);
    const minLon = parseFloat(boundingbox[2]);
    const maxLon = parseFloat(boundingbox[3]);

    const bottomLeft = ol.proj.fromLonLat([minLon, minLat]);
    const topRight = ol.proj.fromLonLat([maxLon, maxLat]);
    const extent = [bottomLeft[0], bottomLeft[1], topRight[0], topRight[1]];

    map.getView().fit(extent, { padding: [40, 40, 40, 40], duration: 1000 });
  } else {
    map.getView().setCenter(ol.proj.fromLonLat(coords));
    map.getView().setZoom(19);
  }

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
    search.style.display = "none";
    main.style.display = "flex";
  } else {
    search.style.display = "flex";
    main.style.display = "none";
  }
}

async function nominatimSearch(query) {
  const response = await fetch(
    "https://nominatim.openstreetmap.org/search.php?q={}&format=json".format(query)
  );
  const places = await response.json();
  return places;
}

function createResults(results) {
  searchResults.innerHTML = "";

  results.forEach((result) => {
    let element = document.createElement("div");
    element.innerHTML =
      '<span class="w-full h-full whitespace-normal inline-block">{}</span>'.format(
        result.display_name
      );
    element.className =
      "sugestion border-b-2 border-gray-300 py-2.5 px-4 duration-100 hover:bg-gray-200 active:bg-gray-300";
      
    element.addEventListener("click", function () {
      setStartWithView(result.coordinates, result.boundingbox);
      TogglePopup();
    });

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
        places.forEach(function (item) {
          var result = {
            display_name: item["display_name"],
            coordinates: [parseFloat(item["lon"]), parseFloat(item["lat"])],
            boundingbox: item["boundingbox"],
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
    setStartWithView(words_to_coord(URLwords), null);
  } else {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function (position) {
        setStartWithView(
          [position.coords.longitude, position.coords.latitude],
          null
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
    new ol.layer.Tile({ source: new ol.source.OSM({ preload: Infinity }) })
  ],
  view: new ol.View({
    center: ol.proj.fromLonLat(coords),
    zoom: 16,
    maxZoom: 20,
    constrainResolution: true,
    smoothExtentChange: true
  }),
  loadTilesWhileAnimating: true,
  loadTilesWhileInteracting: true
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
