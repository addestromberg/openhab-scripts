# Setup TibberTomorrowImport

## Prerequisites
The script is written for my personal use in mind and only tested on my own Openhab setup, that is:
- Openhabian on Raspberry Pi 4, 4GB RAM
- Openhab 3.2.0 (At time of writing latest Openhabian)
- InfluxDB 1.8.10 (Installed from openhabian-config Influx+Grafana)
- Grafana 8.3.4   (Installed from openhabian-config Influx+Grafana)
- Active Tibber Subscription with API token generated
- You probably have installed the excellent official [Tibber Binding](https://www.openhab.org/addons/bindings/tibber/), otherwise you should.

## Step 1
An easy way to test that the script works is, copy all code into a new script in Openhab: Settings->Scripts->New ECMAScript.

## Step 2
Create a new Database and User with write permissions to said DB. Either from cli tool or if you are lazy like me install Chronograf. 
I guess you could use the openhab db, but I don't want to mess with it. And it doesn't matter much, the same functionality can be obtained in Grafana anyway. 

## Step 3
Give your grafana user in Influx READ permissions to the new DB.

## Step 4
Edit the script with the new Influx User and DB information. Also change the Tibber token. All in square brackets in the script. 
If you have multiple homes registred at Tibber, Choose the HOMEID to home located in the region you want the prices from.

## Step 5
If everything looks ok. Testrun the script. 
Haven't found any information but it seems that Tibber delays the publishing of prices for a while after market closes. At least the Nordic markets.
I found that if I run the script sometime after 2PM the new prices is served. It doesn't matter much anyway since after the first day you only have to run it sometime before midnight to get a continous flow.
Lets safe it and say 3PM. Basicly, if the time is before publishing the script won't do anything since there is no prices available. But you can test the connection.

## Step 6
When everything is verified working, Copy the script into a new Rule and set it to run once a day at specified time, say 3PM to be safe.

## Step 7
Make a nice graph in Grafana. Or/And edit the script to update items in Openhab, say for example, predict best times to wash/dry clothes and dishes, charge car etc. for the next day.
