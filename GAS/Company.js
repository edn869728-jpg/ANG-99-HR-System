/***** ANG HR SYSTEMS｜Company.gs
 * 新增檔案：公司建立 / 總表分流 / 公司試算表複製
 *****/

function handleCompanyAction_(req) {
  var action = String((req && req.action) || '').trim();

  try {
    if (action === 'setupMaster') {
      return angCompanyJson_(angSetupMasterSpreadsheet(), req);
    }

    if (action === 'setupCompanyTemplateCurrent') {
      return angCompanyJson_(angSetupCompanyTemplateCurrent_(req), req);
    }

    if (action === 'createCompany') {
      return angCompanyJson_(angCreateCompany_(req), req);
    }

    if (action === 'getCompany') {
      return angCompanyJson_(angGetCompanyInfo_(req), req);
    }

    if (action === 'listCompanies') {
      return angCompanyJson_(angListCompanies_(req), req);
    }

    if (action === 'getCompanySettings') {
      return angCompanyJson_(angGetCompanySettings_(req), req);
    }

    if (action === 'createActivationCode') {
      return angCompanyJson_(angCreateActivationCode_(req), req);
    }

    return angCompanyJson_({
      ok: false,
      message: 'Company.gs 未知 action',
      action: action
    }, req);
  } catch (err) {
    return angCompanyJson_({
      ok: false,
      message: err && err.message ? err.message : String(err),
      action: action
    }, req);
  }
}

function angCompanyJson_(obj, req) {
  if (typeof angAuthJson_ === 'function') return angAuthJson_(obj, req);
  return angJson_(obj);
}

function angCreateCompany_(req) {
  req = req || {};

  var lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    angSetupMasterSpreadsheet();

    var verifyToken = String(req.verify_token || '').trim();
    var authFound = null;
    var authData = null;

    if (verifyToken) {
      authFound = angFindVerifiedAuthByToken_(verifyToken);
      if (!authFound || authFound.row <= 0) {
        throw new Error('verify_token 無效或已使用');
      }
      authData = authFound.data || {};
    }

    var companyId = angNormalizeCompanyId_(req.company_id || req.company || '');
    if (!companyId) {
      companyId = angGenerateCompanyId_();
    }

    var companyName = String(req.company_name || req.name || '').trim();
    var companySubName = String(req.company_sub_name || req.sub_name || '').trim();

    var ownerEmail = angNormalizeEmail_(req.owner_email || req.email || (authData ? authData.email : ''));
    var ownerName = String(req.owner_name || req.name || '').trim();
    var ownerPhone = String(req.owner_phone || req.phone || '').trim();

    var plan = angNormalizePlan_(req.plan || (authData ? authData.plan : '') || angGetMasterSetting_('default_plan', 'basic'));
    var status = String(req.status || 'active').trim();
    var paymentStatus = String(req.payment_status || 'first_month_free').trim();

    if (!companyName) throw new Error('缺少 company_name');
    if (!ownerEmail) throw new Error('缺少 owner_email');

    var master = angGetMasterSpreadsheet_();
    var companySheet = angEnsureSheet_(master, ANG_MASTER_SHEET_COMPANIES);
    angEnsureHeader_(companySheet, ANG_MASTER_COMPANY_HEADERS);

    var duplicate = angFindRowByHeaderValue_(companySheet, 'company_id', companyId);
    if (duplicate && duplicate.row > 0) {
      throw new Error('公司代碼已存在：' + companyId);
    }

    var trialDays = Number(angGetMasterSetting_('default_trial_days', '30')) || 30;
    var now = angNowText_();
    var trialEnd = angDateAfterDaysText_(trialDays);

    var companyBook = angCreateCompanySpreadsheetFromTemplate_({
      company_id: companyId,
      company_name: companyName,
      company_sub_name: companySubName,
      plan: plan
    });

    var companyPayload = {
      company_id: companyId,
      company_name: companyName,
      company_sub_name: companySubName,
      plan: plan,
      status: status,
      payment_status: paymentStatus,
      is_paid: 'FALSE',
      trial_started_at: now,
      trial_ends_at: trialEnd,
      spreadsheet_id: companyBook.getId(),
      spreadsheet_url: companyBook.getUrl(),
      frontend_url: String(req.frontend_url || angGetEntryIndexUrl_()).trim(),
      gas_api_url: String(req.gas_api_url || angGetGasWebAppUrl_()).trim(),
      owner_email: ownerEmail,
      owner_name: ownerName,
      owner_phone: ownerPhone,
      auth_provider: authData ? String(authData.provider || '') : String(req.auth_provider || ''),
      google_user_id: authData ? String(authData.google_user_id || '') : String(req.google_user_id || ''),
      line_user_id: authData ? String(authData.line_user_id || '') : String(req.line_user_id || ''),
      created_at: now,
      updated_at: now
    };

    angSetupCompanySpreadsheet(companyBook, companyPayload);

    companySheet.appendRow(angObjectToRow_(ANG_MASTER_COMPANY_HEADERS, companyPayload));

    angAppendPaymentRecord_({
      created_at: now,
      company_id: companyId,
      plan: plan,
      payment_status: paymentStatus,
      is_paid: 'FALSE',
      amount: '',
      currency: 'TWD',
      start_at: now,
      end_at: trialEnd,
      method: 'first_month_free',
      transaction_id: '',
      note: '新公司建立，自動產生免費試用期',
      updated_at: now
    });

    angAppendCompanyCreateRecord_({
      created_at: now,
      company_id: companyId,
      company_name: companyName,
      plan: plan,
      template_file_id: angGetCompanyTemplateFileId_(),
      new_spreadsheet_id: companyBook.getId(),
      new_spreadsheet_url: companyBook.getUrl(),
      created_by: ownerEmail,
      note: ''
    });

    if (verifyToken) {
      angMarkAuthTokenUsed_(verifyToken, companyId);
    }

    return {
      ok: true,
      message: '公司已建立',
      company_id: companyId,
      company_name: companyName,
      company_sub_name: companySubName,
      plan: plan,
      payment_status: paymentStatus,
      spreadsheet_id: companyBook.getId(),
      spreadsheet_url: companyBook.getUrl(),
      trial_started_at: now,
      trial_ends_at: trialEnd
    };

  } finally {
    lock.releaseLock();
  }
}

function angCreateCompanySpreadsheetFromTemplate_(company) {
  company = company || {};

  var templateId = angGetCompanyTemplateFileId_();
  var fileName = 'ANG HR｜' + company.company_id + '｜' + company.company_name;

  if (templateId) {
    var templateFile = DriveApp.getFileById(templateId);
    var newFile = templateFile.makeCopy(fileName);
    return SpreadsheetApp.openById(newFile.getId());
  }

  return SpreadsheetApp.create(fileName);
}

function angGetCompanyTemplateFileId_() {
  return String(
    angGetMasterSetting_('company_template_file_id', '') ||
    angGetScriptProp_('COMPANY_TEMPLATE_FILE_ID', '') ||
    ''
  ).trim();
}

function angGetCompanyContext_(companyId) {
  companyId = angNormalizeCompanyId_(companyId);

  if (!companyId) {
    throw new Error('缺少 company_id');
  }

  var master = angGetMasterSpreadsheet_();
  var sheet = angEnsureSheet_(master, ANG_MASTER_SHEET_COMPANIES);
  angEnsureHeader_(sheet, ANG_MASTER_COMPANY_HEADERS);

  var found = angFindRowByHeaderValue_(sheet, 'company_id', companyId);
  if (!found || found.row <= 0) {
    throw new Error('找不到公司代碼：' + companyId);
  }

  var company = found.data || {};
  var spreadsheetId = String(company.spreadsheet_id || '').trim();

  if (!spreadsheetId) {
    throw new Error('公司缺少 spreadsheet_id：' + companyId);
  }

  var status = String(company.status || '').trim().toLowerCase();
  if (status && status !== 'active' && status !== 'trial' && status !== 'free' && status !== 'first_month_free') {
    throw new Error('公司狀態不可用：' + status);
  }

  return {
    company: company,
    spreadsheet: SpreadsheetApp.openById(spreadsheetId)
  };
}

function angGetCompanyInfo_(req) {
  req = req || {};
  var companyId = angNormalizeCompanyId_(req.company_id || req.company || '');

  var ctx = angGetCompanyContext_(companyId);

  return {
    ok: true,
    company: ctx.company,
    spreadsheet_id: ctx.spreadsheet.getId(),
    spreadsheet_url: ctx.spreadsheet.getUrl()
  };
}

function angListCompanies_(req) {
  req = req || {};

  var master = angGetMasterSpreadsheet_();
  var sheet = angEnsureSheet_(master, ANG_MASTER_SHEET_COMPANIES);
  angEnsureHeader_(sheet, ANG_MASTER_COMPANY_HEADERS);

  var values = sheet.getDataRange().getValues();
  var rows = [];

  if (values.length > 1) {
    var headers = values[0];

    for (var i = 1; i < values.length; i++) {
      if (angIsEmptyRow_(values[i])) continue;
      rows.push(angRowToObject_(headers, values[i]));
    }
  }

  return {
    ok: true,
    count: rows.length,
    companies: rows
  };
}

function angGetCompanySettings_(req) {
  req = req || {};
  var companyId = angNormalizeCompanyId_(req.company_id || req.company || '');
  var ctx = angGetCompanyContext_(companyId);

  var sheet = angEnsureSheet_(ctx.spreadsheet, ANG_COMPANY_SHEET_COMPANY_SETTINGS);
  var settings = angReadKeyValueSheet_(sheet);

  return {
    ok: true,
    company_id: companyId,
    settings: settings
  };
}

function angSetupCompanyTemplateCurrent_(req) {
  req = req || {};

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error('請在公司範本試算表綁定的 Apps Script 內執行，或改用指定 spreadsheet_id');
  }

  angSetupCompanySpreadsheet(ss, {
    company_id: String(req.company_id || 'TEMPLATE').trim(),
    company_name: String(req.company_name || 'ANG HR 公司資料範本').trim(),
    company_sub_name: String(req.company_sub_name || '').trim(),
    plan: angNormalizePlan_(req.plan || 'premium'),
    status: 'template',
    payment_status: '',
    spreadsheet_id: ss.getId(),
    spreadsheet_url: ss.getUrl(),
    frontend_url: '',
    gas_api_url: '',
    owner_email: '',
    owner_name: '',
    owner_phone: '',
    created_at: angNowText_(),
    updated_at: angNowText_()
  });

  return {
    ok: true,
    message: '目前試算表已整理為公司資料範本',
    spreadsheet_id: ss.getId(),
    spreadsheet_url: ss.getUrl()
  };
}

function angCreateActivationCode_(req) {
  req = req || {};

  var companyId = angNormalizeCompanyId_(req.company_id || req.company || '');
  var employeeId = String(req.employee_id || '').trim().toUpperCase();
  var employeeName = String(req.employee_name || req.name || '').trim();
  var createdBy = String(req.created_by || '').trim();

  if (!companyId) throw new Error('缺少 company_id');
  if (!employeeId) throw new Error('缺少 employee_id');

  var code = String(req.activation_code || angGenerateActivationCode_()).trim().toUpperCase();
  var expiredAt = req.expired_at || angDateAfterDaysText_(7);

  var master = angGetMasterSpreadsheet_();
  var codeSheet = angEnsureSheet_(master, ANG_MASTER_SHEET_ACTIVATION);
  angEnsureHeader_(codeSheet, ANG_MASTER_ACTIVATION_HEADERS);

  codeSheet.appendRow(angObjectToRow_(ANG_MASTER_ACTIVATION_HEADERS, {
    created_at: angNowText_(),
    company_id: companyId,
    employee_id: employeeId,
    employee_name: employeeName,
    activation_code: code,
    device_id: '',
    status: 'active',
    expired_at: expiredAt,
    used_at: '',
    created_by: createdBy,
    note: ''
  }));

  return {
    ok: true,
    company_id: companyId,
    employee_id: employeeId,
    employee_name: employeeName,
    activation_code: code,
    expired_at: expiredAt
  };
}

function angAppendPaymentRecord_(record) {
  var master = angGetMasterSpreadsheet_();
  var sheet = angEnsureSheet_(master, ANG_MASTER_SHEET_PAYMENTS);
  angEnsureHeader_(sheet, ANG_MASTER_PAYMENT_HEADERS);
  sheet.appendRow(angObjectToRow_(ANG_MASTER_PAYMENT_HEADERS, record || {}));
}

function angAppendCompanyCreateRecord_(record) {
  var master = angGetMasterSpreadsheet_();
  var sheet = angEnsureSheet_(master, ANG_MASTER_SHEET_COMPANY_CREATE);
  angEnsureHeader_(sheet, ANG_MASTER_COMPANY_CREATE_HEADERS);
  sheet.appendRow(angObjectToRow_(ANG_MASTER_COMPANY_CREATE_HEADERS, record || {}));
}