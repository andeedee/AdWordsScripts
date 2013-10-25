function main() {
  var spreadsheet_url = "Your Spreadsheet Url Goes Here";
  var date_range = 'YESTERDAY';
  var columns = ['Date',
                 'AccountCurrencyCode',
                 'AccountDescriptiveName',
                 'AccountId',
                 'AccountTimeZoneId',
                 'CustomerDescriptiveName',
                 'ExternalCustomerId',
                 'PrimaryCompanyName',
                 'PrimaryUserLogin',
                 'Device',
                 'AverageCpc',
                 'AverageCpm',
                 'AveragePosition',
                 'Clicks',
                 'ConversionRate',
                 'ConversionRateManyPerClick',
                 'Conversions',
                 'ConversionsManyPerClick',
                 'ConversionValue',
                 'Cost',
                 'CostPerConversion',
                 'CostPerConversionManyPerClick',
                 'Ctr',
                 'Impressions',
                 'SearchBudgetLostImpressionShare',
                 'SearchExactMatchImpressionShare',
                 'SearchImpressionShare',
                 'SearchRankLostImpressionShare',
                 'ValuePerConversion',
                 'ValuePerConversionManyPerClick',
                 'ViewThroughConversions'];
  var columns_str = columns.join(',') + " ";
   
  var sheet = getSpreadsheet(spreadsheet_url).getActiveSheet();
  if(sheet.getRange('A1:A1').getValues()[0][0] == "") {
    sheet.clear();
    sheet.appendRow(columns);
  }
   
  var report_iter = AdWordsApp.report(
    'SELECT ' + columns_str +
    'FROM ACCOUNT_PERFORMANCE_REPORT ' +
    'DURING ' +date_range, {
      apiVersion: 'v201302'
    }).rows();
   
  while(report_iter.hasNext()) {
    var row = report_iter.next();
    var row_array = [];
    for(var i in columns) {
       row_array.push(row[columns[i]]);
    }
    sheet.appendRow(row_array); 
  }
}
 
function getSpreadsheet(spreadsheetUrl) {
  var matches = new RegExp('key=([^&#]*)').exec(spreadsheetUrl);
  if (!matches || !matches[1]) {
    throw 'Invalid spreadsheet URL: ' + spreadsheetUrl;
  }
  var spreadsheetId = matches[1];
  return SpreadsheetApp.openById(spreadsheetId);
}
