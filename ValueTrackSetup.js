function main() {
    
  var URL_PARAMS_TO_ADD = { 
    "kw" : "{keyword}",
    "crid" : "{creative}",
    "mt" : "{matchtype}",
    "ntwk" : "{network}",
    "ap" : "{adposition}",
    "dv" : "{device}",
    "dvm" : "{devicemodel}",
    //"camp" : getCampaignName,  <----- This function is defined below
    //"ag" : getAdGroupName  <----- and so is this one
  };
    
  var kw_iter = AdWordsApp.keywords()
                  .withCondition("DestinationUrl != ''")
                  .get();
   
  while(kw_iter.hasNext()) {
    var kw = kw_iter.next();
    var destUrl = kw.getDestinationUrl();
    if(!destUrl || destUrl === '') { continue; }
    var toAppend = [];
    for(var key in URL_PARAMS_TO_ADD) {
      if(destUrl.indexOf(key) >= 0) { continue; }
      var value = URL_PARAMS_TO_ADD[key];
       
      //check to see if we should call a function
      if(typeof(value) === 'function') {
        value = encodeURI(value(kw));
      }
      toAppend.push(key+"="+value);
    }
    if(destUrl.indexOf('?') >= 0) {
      kw.setDestinationUrl(destUrl + "&"+toAppend.join('&'));
    } else {
      kw.setDestinationUrl(destUrl + "?"+toAppend.join('&'));
    }
    Logger.log(kw.getDestinationUrl());
  }
}
 
// As long as the function call is passed a kw object, you can insert
// whatever value you want into the url
function getCampaignName(kw) {
  return kw.getCampaign().getName();
}
 
function getAdGroupName(kw) {
  return kw.getAdGroup().getName();
}
