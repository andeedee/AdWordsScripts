function main() {
  // Add more error codes if required: http://www.w3schools.com/tags/ref_httpmessages.asp
  var BAD_CODES = [301,400,403,404,408,410,500];
  var TO = ['enter_email_here'/*,'your_email@example.com'*/];
  var SUBJECT = 'Broken Url Report - ' + _getDateString();
  var HTTP_OPTIONS = {
    muteHttpExceptions:true
  };
    
  //Checking occurs on Ad and Keyword level
  var iters = [
    //Ad level URLs
    AdWordsApp.ads()
      .withCondition("Status = 'ENABLED'")
  // Un-comment the next two lines to have only enabled Ads reported on.
//      .withCondition("AdGroupStatus = 'ENABLED'")
//      .withCondition("CampaignStatus = 'ENABLED'")
      .withCondition("Type = 'TEXT_AD'")
      .get(),
    //Keyword Level URLs
    AdWordsApp.keywords()
      .withCondition("Status = 'ENABLED'")
      .withCondition("DestinationUrl != ''")
  // Un-comment the next two lines to have only enabled Ads reported on.
//      .withCondition("AdGroupStatus = 'ENABLED'")
//      .withCondition("CampaignStatus = 'ENABLED'")
      .get()
    ];
   
  var already_checked = {}; 
  var bad_entities = [];
  for(var x in iters) {
    var iter = iters[x];
    while(iter.hasNext()) {
      var entity = iter.next();
      if(entity.getDestinationUrl() == null) { continue; }
      var url = entity.getDestinationUrl();
      if(url.indexOf('{') >= 0) {
        url = url.replace(/\{[0-9a-zA-Z]+\}/g,'');
      }
      if(already_checked[url]) { continue; }
      var response_code;
      try {
        Logger.log("Testing url: "+url);
        response_code = UrlFetchApp.fetch(url, HTTP_OPTIONS).getResponseCode();
      } catch(e) {
        bad_entities.push({e : entity, code : -1});
      }
      if(BAD_CODES.indexOf(response_code) >= 0) { 
        bad_entities.push({e : entity, code : response_code});
      }
      already_checked[url] = true;
    }
  }
  var column_names = ['Type','CampaignName','CampaignStatus','AdGroupName','AdGroupStatus','Id','Headline/KeywordText','ResponseCode','DestUrl'];
  var attachment = column_names.join(",")+"\n";
  for(var i in bad_entities) {
    attachment += _formatResults(bad_entities[i],",");
  }
  if(bad_entities.length > 0) {
    var options = { attachments: [Utilities.newBlob(attachment, 'text/csv', 'bad_urls_'+_getDateString()+'.csv')] };
    var email_body = "There are " + bad_entities.length + " urls that are broken. See attachment for details.";
      
    for(var i in TO) {
      MailApp.sendEmail(TO[i], SUBJECT, email_body, options);
    }
  }  
}
  
//Result Formatting
function _formatResults(entity,SEP) {
  var e = entity.e;
  if(typeof(e['getHeadline']) != "undefined") {
    //Entity Entry
    return ["Ad",
            e.getCampaign().getName(),
            (e.getCampaign().isPaused()) ? 'Paused' : 'Enabled',
            e.getAdGroup().getName(),
            (e.getAdGroup().isPaused()) ? 'Paused' : 'Enabled',
            e.getId(),
            e.getHeadline(),
            entity.code,
            e.getDestinationUrl()
           ].join(SEP)+"\n";
  } else {
    //Keyword Entry
    return ["Keyword",
            e.getCampaign().getName(),(e.getCampaign().isPaused()) ? 'Paused' : 'Enabled',
            e.getAdGroup().getName(),(e.getAdGroup().isPaused()) ? 'Paused' : 'Enabled',
            e.getId(),
            e.getText(),
            entity.code,
            e.getDestinationUrl()
           ].join(SEP)+"\n";
  }
}
  
//Date Formatting
function _getDateString() {
  return Utilities.formatDate((new Date()), AdWordsApp.currentAccount().getTimeZone(), "yyyy-MM-dd");
}
