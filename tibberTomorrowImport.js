/**
 *  GET TOMORROW ELECTRICAL PRICES FROM TIBBER
 *  Gets tomorrow electrical prices for your specified Home from Tibber API and saves it to a separate DB in InfluxDB to be used in Grafana or similar applikation.
 *  Feel free to modify or do anything you would like with it.
 *  @author Adde Stromberg. 2022
 */

// Load librarys from Openhab
var logger = Java.type('org.slf4j.LoggerFactory').getLogger('org.openhab.rule.TomorrowEnergyPrice');
var newHashMap = Java.type("java.util.HashMap");

// Declare Tibber constants
var TIBBER_API_URL = "https://api.tibber.com/v1-beta/gql";
var TIBBER_TOKEN = "[TIBBER_API_TOKEN]";
var TIBBER_HOMEID = 0;

// Declare Influx constants
var INFLUX_URL ="http://localhost:8086";
var INFLUX_DB_NAME = "[INFLUX_DB_NAME]";
var INFLUX_DB_USER = "[INFLUX_USER_NAME]";
var INFLUX_DB_PASSWORD = "[INFLUX_USER_PASSWORD]";

// Various declarations
var HEADERS_TIBBER = new newHashMap();
var HEADERS_INFLUX = new newHashMap();
var TIMEOUT = 5000; //ms
var HTTP = Java.type("org.openhab.core.model.script.actions.HTTP");

// Tibber API query. Tibber uses GraphQL. Wrap as a JSON string for Req.body
var query = '{ "query": "{viewer {homes {currentSubscription {priceInfo {today {total energy tax startsAt } tomorrow {total energy tax startsAt }}}}}}" }';

// Define Tibber Headers
HEADERS_TIBBER.put("Authorization", "Bearer " + TIBBER_TOKEN);
//headers.put("Content-Type", "application/json")
//logger.info("Headers: " + headers);


var success = false;
// Send request to Tibber. Expect JSON response.  
try {
  var res = HTTP.sendHttpPostRequest(TIBBER_API_URL, "application/json", query, HEADERS_TIBBER, TIMEOUT);
  // Check if tomorrow list contains data
  if(res.data.viewer.homes[TIBBER_HOMEID].currentSubscription.priceInfo.tomorrow.length < 24) {
    // Cast error
    throw "It seems that Tibber not yet have released the tomorrow prices. Try delaying the CRON job";
  }
  success = true; //Quick and dirty way to stop injecting data to influx on data retrievel error.
} catch (error) {
  logger.info("An error occured: " + error.message);
  success = false;
}

// If data seems ok. Inject into Influx DB.
if (success) {
  res = JSON.parse(res);
  res = res.data.viewer.homes[TIBBER_HOMEID].currentSubscription.priceInfo;
  //logger.info(JSON.stringify(res));
  // Iterera svaret, konvertera tid till ms och inserta i Influx
  var body = "";
  for (var i=0; i < res.tomorrow.length; i++) {
    var timestamp = new Date(res.tomorrow[i].startsAt);
    body += "future_price,home=" + TIBBER_HOMEID + ",type=total value=" + res.tomorrow[i].total + " " + timestamp.getTime().toString() + '000000\n';
    body += "future_price,home=" + TIBBER_HOMEID + ",type=energy value=" + res.tomorrow[i].energy + " " + timestamp.getTime().toString() + '000000\n';
    body += "future_price,home=" + TIBBER_HOMEID + ",type=tax value=" + res.tomorrow[i].tax + " " + timestamp.getTime().toString() + '000000\n';
    
    // DEBUG LOG DATA
    //logger.info("Getting total price: " + 
    //             res.today[i].total + " @ " +
    //             timestamp.getTime().toString() + '000000') // Quick hack för ns. Spelar ingen roll då det alltid är jämna timmar.
  }
  //logger.info("\n== DEBUG OUTPUT ===\n"+body);
  
  // Prepare influx api URI
  var INFLUX_REQ_URL = INFLUX_URL + '/api/v2/write?bucket=' + INFLUX_DB_NAME + '&precision=ns'
  HEADERS_INFLUX.put("Authorization", "Token " + INFLUX_DB_USER + ":" + INFLUX_DB_PASSWORD)
  
  // Call Influx API
  try {
    res = HTTP.sendHttpPostRequest(INFLUX_REQ_URL, "data/raw", body, HEADERS_INFLUX, TIMEOUT);
  } catch (error) {
    // Influx error occured. Maybe add a push notification here. Well, being lazy.
    logger.info("INFLUX ERROR: " + error.message)
  }
  
  // Congrats the data should be available.
  logger.info("INFLUX RESULT: OK\n" + JSON.stringify(res));
  
  
  //logger.info("Getting total price for first hour tomorrow: " + req.data.viewer.homes[HOMEID].currentSubscription.priceInfo.tomorrow[0].total)
  //logger.info("Testing responsetree: " + JSON.stringify(JSON.parse(req)));
}
