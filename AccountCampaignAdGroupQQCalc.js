var SIG_FIGS = 10000; //this will give you 4 decimal places of accuracy
var APPEND = true; //set this to false to overwrite your data daily
  
function main() {
  var SPREADSHEET_URL = "PUT YOUR SPREADSHEET HERE";
  var date_str = Utilities.formatDate(new Date(),AdWordsApp.currentAccount().getTimeZone(),'yyyy-MM-dd');
  var account_id = AdWordsApp.currentAccount().getCustomerId();
    
  var kw_iter = AdWordsApp.keywords()
    .withCondition("Status = ENABLED")
    .forDateRange("LAST_30_DAYS")
    .withCondition("Impressions > 0")
    .orderBy("Impressions DESC")
    .withLimit(50000)
    .get();
   
  //This is where i am going to store all my data
  var account_score_map = {};
  var camp_score_map = {};
  var ag_score_map = {};
     
  while(kw_iter.hasNext()) {
    var kw = kw_iter.next();
    var kw_stats = kw.getStatsFor("LAST_30_DAYS");
    var imps = kw_stats.getImpressions();
    var qs = kw.getQualityScore();
    var camp_name = kw.getCampaign().getName();
    var ag_name = kw.getAdGroup().getName();
    var imps_weighted_qs = (qs*imps);
    _loadEntityMap(account_score_map,account_id,imps_weighted_qs,imps);
    _loadEntityMap(camp_score_map,camp_name,imps_weighted_qs,imps);
    _loadEntityMap(ag_score_map,camp_name + "~~!~~" + ag_name,imps_weighted_qs,imps);
  }
  
  //Make sure the spreadsheet has all the sheets
  _addSpreadsheetSheets(SPREADSHEET_URL,['Account','Campaign','AdGroup']);
   
  //Load Account level QS
  var sheet = SpreadsheetApp.openByUrl(SPREADSHEET_URL).getSheetByName('Account');
  _addHeadingsIfNeeded(sheet,['Date','Account','QS']);
  var e = account_score_map[account_id];
  sheet.appendRow([date_str,account_id,Math.round(e.imps_weighted_qs / e.tot_imps * SIG_FIGS)/SIG_FIGS]);
    
  //Load Campaign level QS
  sheet = SpreadsheetApp.openByUrl(SPREADSHEET_URL).getSheetByName('Campaign');
  _addHeadingsIfNeeded(sheet,['Date','Account','Campaign','QS']);
  var to_write = [];
  for(var i in camp_score_map) {
    var e = camp_score_map[i];
    to_write.push([date_str,
                   account_id,
                   i,
                   Math.round(e.imps_weighted_qs / e.tot_imps * SIG_FIGS)/SIG_FIGS]);
  }
  _writeDataToSheet(sheet,to_write);
    
  //Load Campaign + AdGroup level QS
  sheet = SpreadsheetApp.openByUrl(SPREADSHEET_URL).getSheetByName('AdGroup');
  _addHeadingsIfNeeded(sheet,['Date','Account','Campaign','AdGroup','QS']);
  to_write = [];
  for(var i in ag_score_map) {
    var e = ag_score_map[i];
    to_write.push([date_str,
                   account_id,
                   i.split('~~!~~')[0],
                   i.split('~~!~~')[1],
                   Math.round(e.imps_weighted_qs / e.tot_imps * SIG_FIGS)/SIG_FIGS]);
  }
  _writeDataToSheet(sheet,to_write);
}
 
// Super fast spreadsheet insertion
function _writeDataToSheet(sheet,to_write) {
  var last_row = sheet.getLastRow();
  var numRows = sheet.getMaxRows();
  if((numRows-last_row) < to_write.length) {
    sheet.insertRows(last_row+1,to_write.length-numRows+last_row); 
  }
  var range = sheet.getRange(last_row+1,1,to_write.length,to_write[0].length);
  range.setValues(to_write);
}
 
// Helper function to add the sheets  to the spreadsheet if needed
function _addSpreadsheetSheets(url,sheet_names) {
  var spreadsheet = SpreadsheetApp.openByUrl(url);
  var all_sheets = spreadsheet.getSheets();
  var all_sheet_names = [];
  for(var i in all_sheets) {
    all_sheet_names.push(all_sheets[i].getName());
  }
   
  for(var i in sheet_names) {
    var name = sheet_names[i];
    if(all_sheet_names.indexOf(name) == -1) {
      spreadsheet.insertSheet(name);
    } else {
      if(!APPEND) {
        spreadsheet.getSheetByName(name).clear();
      }
    }
  }
}
 
// Helper function to load the map for storing data
function _loadEntityMap(map,key,imps_weighted_qs,imps) {
  if(!map[key]) {
    map[key] = { imps_weighted_qs : imps_weighted_qs, tot_imps : imps };
  } else {
    map[key].imps_weighted_qs += imps_weighted_qs;
    map[key].tot_imps += imps;
  }
}
  
//Helper function to add headers to sheet if needed
function _addHeadingsIfNeeded(sheet,headings) {
  if(sheet.getRange('A1:A1').getValues()[0][0] == "") {
    sheet.clear();
    sheet.appendRow(headings);
  }
}
