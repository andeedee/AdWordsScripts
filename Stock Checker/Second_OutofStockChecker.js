/************************************
* Item Out Of Stock Checker
* Version x
***********************************/
var URL_LEVEL = 'Ad'; // or Keyword
var ONLY_ACTIVE = true; // set to false for all ads or keywords
var CAMPAIGN_LABEL = ''; // set this if you want to only check campaigns with this label
var STRIP_QUERY_STRING = true; // set this to false if the stuff that comes after the question mark is important
var WRAPPED_URLS = true; // set this to true if you use a 3rd party like Marin or Kenshoo for managing you account
// This is the specific text to search for 
// on the page that indicates the item 
// is out of stock.
var OUT_OF_STOCK_TEXT = 'The Text That Identifies An Out Of Stock Item Goes Here';
 
function main() {
  var alreadyCheckedUrls = {};
  var iter = buildSelector().get();
  while(iter.hasNext()) {
    var entity = iter.next();
    var url = cleanUrl(entity.getDestinationUrl());
    if(alreadyCheckedUrls[url]) {
      if(alreadyCheckedUrls[url] === 'out of stock') {
        entity.pause();
      } else {
        entity.enable();
      }
    } else {
      var htmlCode;
      try {
        htmlCode = UrlFetchApp.fetch(url).getContentText();
      } catch(e) {
        Logger.log('There was an issue checking:'+url+', Skipping.');
        continue;
      }
      if(htmlCode.indexOf(OUT_OF_STOCK_TEXT) >= 0) {
        alreadyCheckedUrls[url] = 'out of stock';
        entity.pause();
      } else {
        alreadyCheckedUrls[url] = 'in stock';
        entity.enable();
      }
    }
    Logger.log('Url: '+url+' is '+alreadyCheckedUrls[url]);
  }
}
 
function cleanUrl(url) {
  if(WRAPPED_URLS) {
    url = url.substr(url.lastIndexOf('http'));
    if(decodeURIComponent(url) !== url) {
      url = decodeURIComponent(url);
    }
  }
  if(STRIP_QUERY_STRING) {
    if(url.indexOf('?')>=0) {
      url = url.split('?')[0];
    }
  }
  if(url.indexOf('{') >= 0) {
    //Let's remove the value track parameters
    url = url.replace(/\{[0-9a-zA-Z]+\}/g,'');
  }
  return url;
}
 
function buildSelector() {
  var selector = (URL_LEVEL === 'Ad') ? AdWordsApp.ads() : AdWordsApp.keywords();
  if(ONLY_ACTIVE) {
    selector = selector.withCondition('CampaignStatus = ENABLED').withCondition('Status = ENABLED');
    if(URL_LEVEL !== 'Ad') {
      selector = selector.withCondition('AdGroupStatus = ENABLED');
    }
  }
  if(CAMPAIGN_LABEL) {
    var label = AdWordsApp.labels().withCondition("Name = '"+CAMPAIGN_LABEL+"'").get().next();
    var campIter = label.campaigns().get();
    var campaignNames = [];
    while(campIter.hasNext()) {
      campaignNames.push(campIter.next().getName());
    }
    selector = selector.withCondition("CampaignName IN ['"+campaignNames.join("','")+"']");
  }
  return selector;
}