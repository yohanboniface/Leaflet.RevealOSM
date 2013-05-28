# Leaflet.RevealOSM

Very simple but extendable plugin to get OSM POIs data on map click.

Check out the [demo](http://yohanboniface.github.io/Leaflet.RevealOSM/).

Here is a (WIP) more tuned example: http://fluv.io (click on harbours, locks or piers). Code is [here](https://github.com/yohanboniface/carte-fluviale/blob/master/carte_fluviale/static/carte_fluviale/CustomRevealOSM.js).

# Customization

## Using options (quicker)

As every Leaflet plugin, you can customize the behaviour in passing options at init.

Available options:

* `apiUrl` (default: http://overpass-api.de/api/interpreter?data=')
* `queryTemplate` (default: '[out:json];node(around:{radius},{lat},{lng})[name];out body qt 1;')
* `helpText`
* `radius`: radius used to search around the click position
* `excludeKeys`: Array of regex to tests for excluding some keys
* `translateKeys`: translate some keys for more human friendly display

## Extending the class (more powerfull)

Every behaviour has been packed in a method to make the plugin more extendable.
For example:

* `getRadius`: use it for example to define a different radius for each zoom level
* `getQueryTemplate`: same thing, if you want to retrieve more objects with higher zoom levels, do it here!
* `formatContent`: you want to use this for formating your own popup content
* `formatKey`: you want to display an image instead of text? 

Look at the code for more methods and details!