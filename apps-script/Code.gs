const CONFIG = {
  sheetName: 'records',
  headerRow: ['__backendId', 'type', 'timestamp', 'businessId', 'payload', 'updatedBy'],
  authToken: 'REPLACE_WITH_SHARED_SECRET'
};

function doPost(e) {
  if (!isAuthorized_(e)) {
    return jsonResponse_({ success: false, message: 'Unauthorized' });
  }

  const record = parseJson_(e);
  if (!record) {
    return jsonResponse_({ success: false, message: 'Invalid JSON payload' });
  }

  const sheet = getOrCreateSheet_();
  const recordId = record.__backendId || Utilities.getUuid();
  const rowIndex = findRowIndex_(sheet, recordId);
  const timestamp = record.timestamp || Date.now();
  const payload = normalizePayload_(record.payload);
  const rowValues = [
    recordId,
    record.type || '',
    timestamp,
    record.businessId || '',
    payload,
    record.updatedBy || ''
  ];

  if (rowIndex) {
    sheet.getRange(rowIndex, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }

  return jsonResponse_({ success: true, message: 'Record saved', id: recordId });
}

function doGet(e) {
  if (!isAuthorized_(e)) {
    return jsonResponse_({ success: false, message: 'Unauthorized' });
  }

  const businessId = e && e.parameter ? e.parameter.businessId : '';
  const since = e && e.parameter ? e.parameter.since : '';
  const sinceTimestamp = since ? parseTimestamp_(since) : null;

  const sheet = getOrCreateSheet_();
  const data = sheet.getDataRange().getValues();
  const rows = data.slice(1);

  const records = rows
    .map(row => ({
      __backendId: row[0],
      type: row[1],
      timestamp: row[2],
      businessId: row[3],
      payload: row[4],
      updatedBy: row[5]
    }))
    .filter(record => !!record.__backendId)
    .filter(record => !businessId || record.businessId === businessId)
    .filter(record => {
      if (!sinceTimestamp) return true;
      const recordTimestamp = parseTimestamp_(record.timestamp || 0);
      return recordTimestamp >= sinceTimestamp;
    });

  return jsonResponse_(records);
}

function getOrCreateSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(CONFIG.sheetName);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(CONFIG.sheetName);
    sheet.appendRow(CONFIG.headerRow);
  }

  return sheet;
}

function findRowIndex_(sheet, backendId) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === backendId) {
      return i + 1;
    }
  }
  return null;
}

function parseJson_(e) {
  if (!e || !e.postData || !e.postData.contents) return null;
  try {
    return JSON.parse(e.postData.contents);
  } catch (error) {
    return null;
  }
}

function parseTimestamp_(value) {
  if (value instanceof Date) return value.getTime();
  const numeric = Number(value);
  if (!Number.isNaN(numeric) && numeric > 0) return numeric;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function normalizePayload_(payload) {
  if (payload === undefined || payload === null) {
    return '';
  }
  if (typeof payload === 'string') {
    return payload;
  }
  try {
    return JSON.stringify(payload);
  } catch (error) {
    return '';
  }
}

function isAuthorized_(e) {
  if (!CONFIG.authToken) return true;
  const headers = e && e.headers ? e.headers : {};
  const tokenFromHeader = headers['X-Api-Token'] || headers['x-api-token'] || headers['Authorization'];
  const tokenFromQuery = e && e.parameter ? e.parameter.token : '';
  const token = tokenFromHeader || tokenFromQuery || '';
  return token === CONFIG.authToken;
}

function jsonResponse_(payload) {
  const output = ContentService.createTextOutput(JSON.stringify(payload));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
