# Backend

## Route Calculation

The optimal routes are calculated using Dijkstras algorithm. For this there is a graph stored in `route-calculation/graph.js` that has all the possible direct routes using different transportation methods between the predefined locations. These direct routes are calculated by `route-calculation/build-graph` by going through all of the locations and making routes to all other locations that support the same transportation method. The direct routes for the specific transportation methods are formed using the functions in `route-calculation/find-routes.js`.

The locations are defined in `data/locations.geojson`. These are some of the biggest transportation hubs around the world.

If the start or the end point of the requested route is not one of the predefined locations, new truck routes are added to the graph between that location and the predefined locations. The same `findTruckRoutes` function used in generating the graph is used for calculating these routes. The function only makes an api call to get routes for locations that are within the distance specified by the `maxDistance` parameter to make the route calculation faster.

![Route Calculation](./images/route-calculation.jpg)

### Locations



### How to Generate the Graph

If you make modifications to the code (`build-graph.js` or `find-routes.js`) or the location files in the `data/`, you need to run the script to repopulate the database. It may take a long time.

If you added new locations run this in the backend root to add the locations:
```
node route-calculation/build-graph.js
```
If you want to remove locations and connections from the database that have been removed from the geojson files and add new locations, you can run:
```
node route-calculation/build-graph.js --replace
```
If you made modifications to the code or changed all of the run the script with the `--clear` flag (DON'T DO THIS UNNECESSARILY, this will completely reset the database and take a very long time):
```
node route-calculation/build-graph.js --clear
```

If you are want to rebuild graph.json, you can run:
```
node route-calculation/build-graph-json.js
```
Note that this will result in a very large file unless you reduce the number of locations in the geojson files.

## Setup & Run the Project

### 1. Install Dependencies

Make sure you have [Node.js](https://nodejs.org/en) installed. Then, run:
```
npm install
```
Install `searoute` python library.
```
pip install searoute
```

### 2. Add Local Environment Variables

Make a new file called `.env` in the `backend` directory. This file will be ignored by git. Then add the following:

```
MAPBOX_API_TOKEN=yourapitoken
DATABASE_URL=databaseurl
DATABASE_KEY=databasekey
```

### 3. Start the Development Server

Run the following command to start the server locally:
```
npm run dev
```
By default, the server runs on http://localhost:3000.
