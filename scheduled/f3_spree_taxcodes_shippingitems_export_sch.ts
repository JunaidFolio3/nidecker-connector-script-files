/**
 * Created by Junaid on 7/17/2018.
 *
 *
 */
/// <reference path="../logs_plugin/backend/helper/f3_execution_logs_helper.ts" />
class TaxCodesShippingItemsExportSch extends BaseScheduled {

  public startTime = (new Date()).getTime();
  // protected _instantNotification: SendErrorEmail;
  // private currentChunkGuid;

  // start
  // DECLARE CONSTANTS
  public CONSTANTS: any = {
    CUSTOM_RECORD_TYPE: 'customrecord_f3_nd_records', // custom record name that is used to store data for NiDeckers
    SCRIPT_DEPLOYMENT: 'scriptdeployment',
    DEPLOYMENT_ID: 'isdeployed',
    TRUE: 'T',
    FALSE: 'F',
    ROUTE_TAXCODES: 'taxcodes', // API route for tax codes
    ROUTE_SHIPPINGITEMS: 'shippingitems', // API route for shipping items
    SUCCESS: 'SUCCESS',
    FAILED: 'FAILED',
    URL: 'https://e0520828.ngrok.io/api/v1/', // API URL
    CONTENT_TYPE: 'application/json',

    // list of operations
    OPERATIONS: {
      CREATE: 1,
      EDIT: 2,
      DELETE: 3
    },
    // list of status
    STATUS: {
      PENDING: 1,
      PROCESSED: 2,
      FAILED: 3
    },
    // list of record types
    RECORD_TYPE: {
      TAX_CODE: 1,
      SHIPPING_METHOD: 2
    },
    // custom fields ID of custom record
    CUSTOM_RECORD: {
      NS_ID: 'custrecord_f3_nsid',
      NAME: 'custrecord_f3_name',
      RATE: 'custrecord_f3_rate',
      EXTERNAL_ID: 'custrecord_f3_externalid',
      STATUS: 'custrecord_f3_status_',
      OPERATION: 'custrecord_f3_operation',
      SYNC_DATE: 'custrecord_f3_syncdate',
      RECORD_TYPE: 'custrecord_f3_recordtype',
      ANY_OF: 'anyof'
    },
    // custom fields name of custom record
    CUSTOM_RECORD_FIELDS: {
      NS_ID: 'nsid',
      NAME: 'name',
      RATE: 'rate',
      EXTERNAL_ID: 'externalid',
      STATUS: 'status',
      OPERATION: 'operation',
      SYNC_DATE: 'syncdate',
      RECORD_TYPE: 'recordtype'
    }
  };
  // end

  constructor() {
    super();
    this.usageLimit = 5000;
    // this._instantNotification = new SendErrorEmail();
  }

  public scheduled(type: ScheduleScriptType): boolean {
    let systemType = "SPREE";

    if (!super.scheduled(type)) {
      return false;
    }

    try {
      // start error logging 
      LogsHelper.Instance.logScriptStart(Features.EXPORT_TAXCODE_SHIPPINGITEM_TO_EXTERNAL_SYSTEM,
        UtilizingDependency.ExecutionModes.getMode(type, nlapiGetContext().getDeploymentId()));

      Utility.logDebug("TaxCodesShippingItemsExportSpreeCommerce.scheduled", "Start");

      LogsHelper.Instance.logExecutionStepStart({
        title: "Initializing Pre-Processed Data",
        details: "Load Connector Constants, Stores, Script Prams, ",
        externalSystemId: "",
        logType: "DEBUG",
        recordType: "1", //Item
        recordId: ""
      } as ExecutionStepObject);

      LogsHelper.Instance.logExecutionStepDetails({
        phaseTitle: "Initialized Constants // Configuration",
        phaseDetails: "Before invoking Constants // Configuration"
      } as StepExecutionDetails);

      ConnectorCommon.initiateEmailNotificationConfig();
      this.iterateOverStoresWithPermittedFeature(
        Features.EXPORT_TAXCODE_SHIPPINGITEM_TO_EXTERNAL_SYSTEM, null, this.startTaxCodesShippingItemsExport.bind(this), null, systemType);

      Utility.logDebug("TaxCodesShippingItemsExportSpreeCommerce.scheduled", "End");

    } catch (e) {

      // this._instantNotification.sendErrorNotificationToUsers(null, JSON.stringify(e), this._instantNotification.operations.taxcodeShippingItemExport);

      Utility.logException("TaxCodesShippingItemsExportSpreeCommerce.scheduled", e);
      return false;
    }
    LogsHelper.Instance.logScriptEnd();
    return true;
  }

  public startTaxCodesShippingItemsExport(store, externalSystemWrapper: WrapperInterface) {

    LogsHelper.Instance.logExecutionStepDetails({
      phaseTitle: "Successfully initialized Constants // Configuration",
      phaseDetails: "After invoking Constants // Configuration"
    } as StepExecutionDetails);
    Utility.logDebug('Debug', 'StartTaxCodesShippingItemsExport Started...');

    let ctx = nlapiGetContext();
    // let syncCount = parseInt(store.entitySyncInfo.walmart.itemSyncCount);

    // this.currentChunkGuid = Utility.guid();

    let deploymentId: string = nlapiGetContext().getDeploymentId();

    if (nlapiLookupField(this.CONSTANTS.SCRIPT_DEPLOYMENT, deploymentId, this.CONSTANTS.DEPLOYMENT_ID) == this.CONSTANTS.TRUE) {


      let customRecFils: Array<any> = this.filterCriteria();
      let customRecCols: Array<any> = this.columnCriteria();
      let customRecordData = nlapiSearchRecord(this.CONSTANTS.CUSTOM_RECORD_TYPE, null, customRecFils, customRecCols);

      LogsHelper.Instance.logExecutionStepDetails({
        phaseTitle: "Deployment Type",
        phaseDetails: "Deployment :: " + ctx.getDeploymentId()
      } as StepExecutionDetails);

      ctx.setPercentComplete(10.00);

      Utility.logDebug('Fetched taxcodes & shipping items count', (!!customRecordData ? customRecordData.length : '0').toString());

      LogsHelper.Instance.logExecutionStepDetails({
        phaseTitle: "Taxcodes & Shipping Items Count",
        phaseDetails: "Count :: " + (!!customRecordData ? customRecordData.length : '0').toString()
      } as StepExecutionDetails);


      Utility.logAudit("COnnectorConstants.CurrentStore", ConnectorConstants.CurrentStore.systemId);

      LogsHelper.Instance.logExecutionStepEnd();

      if (!!customRecordData && customRecordData.length > 0) {

        Utility.logDebug('startTaxCodesShippingItemsExport:customRecordData', JSON.stringify(customRecordData)); //OK
        Utility.logDebug('startTaxCodesShippingItemsExport:store', JSON.stringify(store)); //OK

        this.processRecords(store, customRecordData, externalSystemWrapper);



      } else {
        Utility.logDebug('startTaxCodesShippingItemsExport:Else', 'No records found to process');
      }
    }
  }

  public processRecords(store, customRecordData, externalSystemWrapper) {

    let context = nlapiGetContext();
    try {
      let convertedRecord: Array<object> = [];
      let taxCodes: Array<object> = [];
      let shippingItems: Array<object> = [];
      let taxCodesResponse: object = {};
      let shippingItemsResponse: object = {};
      let RECORD_TYPE = this.CONSTANTS.RECORD_TYPE;

      var shippingMethodsDefaults = ConnectorConstants.CurrentStore.entitySyncInfo.shippingMethodsDefaults;
      var taxCodesDefaults = ConnectorConstants.CurrentStore.entitySyncInfo.taxCodesDefaults;

      Utility.logDebug('inside processRecord', 'processRecords');

      // START
      convertedRecord = this.onConversionToFlattenObject(customRecordData);

      convertedRecord.forEach((recEl: any) => {
        if (recEl.recordtype_id == RECORD_TYPE.TAX_CODE) {
          // appending other fields (columns) default values defined in entitySyncInfo
          // recEl.store_id = ConnectorConstants.CurrentStore.systemId || '';
          recEl.store_id = taxCodesDefaults.store_id || '2';
          recEl.tax_category_id = taxCodesDefaults.tax_category_id || '4';
          recEl.included_in_price = taxCodesDefaults.included_in_price || false;
          recEl.show_rate_in_label = taxCodesDefaults.show_rate_in_label || true;
          recEl.zone_id = taxCodesDefaults.zone_id || '38';
          taxCodes.push(recEl);
        }
        else if (recEl.recordtype_id == RECORD_TYPE.SHIPPING_METHOD) {
          // appending other fields (columns) default values defined in entitySyncInfo
          var tempCode = recEl.name.toLowerCase();
          tempCode = tempCode.trim();
          recEl.code = tempCode.replace(/ /g, '_') || '';
          // recEl.store_id = ConnectorConstants.CurrentStore.systemId || '';
          recEl.store_id = shippingMethodsDefaults.store_id || '2';
          recEl.admin_name = recEl.name;
          recEl.display_on = shippingMethodsDefaults.display_on || '';
          recEl.tracking_url = shippingMethodsDefaults.tracking_url || '';
          recEl.tax_category_id = shippingMethodsDefaults.tax_category_id || '4';
          shippingItems.push(recEl);
        }
      });
      Utility.logDebug('processRecords:taxCodes', JSON.stringify(taxCodes));
      Utility.logDebug('processRecords:shippingItems', JSON.stringify(shippingItems));


      if (taxCodes) {
        let apiRoute = this.CONSTANTS.ROUTE_TAXCODES;
        let postdata = JSON.stringify(taxCodes);
        let response = this.apiPostRequest(apiRoute, postdata);

        taxCodesResponse = response.getBody();
        Utility.logDebug('taxCodes:response', JSON.stringify(taxCodesResponse));
      }

      if (shippingItems) {
        let apiRoute = this.CONSTANTS.ROUTE_SHIPPINGITEMS;
        let postdata = JSON.stringify(shippingItems);
        let response = this.apiPostRequest(apiRoute, postdata);

        shippingItemsResponse = response.getBody();
        Utility.logDebug('shippingItems:response', JSON.stringify(shippingItemsResponse));
      }

      this.updateValuesOnCustomRecord(taxCodesResponse);
      this.updateValuesOnCustomRecord(shippingItemsResponse);

    } catch (e) {
      // this._instantNotification.sendErrorNotificationToUsers(store, JSON.stringify(e), this._instantNotification.operations.taxcodeShippingItemExport);

      Utility.logException('Critical Error during processRecords', JSON.stringify(e));
      LogsHelper.Instance.logExecutionStepError(e);

      if (e.type == 'Throttling') {
        throw new ThrotlingLimitReachedException();
      }
    }

    context.setPercentComplete(90.00);
    this.rescheduleIfNeeded();
    context.setPercentComplete(100.00);
  }

  private updateValuesOnCustomRecord(httpResponseObject): void {
    let CUSTOM_RECORD = this.CONSTANTS.CUSTOM_RECORD;
    httpResponseObject = httpResponseObject? JSON.parse(httpResponseObject) : [];

    let httpResponseData = httpResponseObject.data ? httpResponseObject.data : [];
    Utility.logDebug('updateValuesOnCustomRecord:httpResponseObject', JSON.stringify(httpResponseObject));
    Utility.logDebug('updateValuesOnCustomRecord:httpResponseData', JSON.stringify(httpResponseData));

    httpResponseData.forEach((resData) => {
      if (resData.status == this.CONSTANTS.SUCCESS) {
        Utility.logDebug('updateValuesOnCustomRecord:if', JSON.stringify(resData));

        let newCustomRecordData = resData.data;
        nlapiSubmitField(this.CONSTANTS.CUSTOM_RECORD_TYPE, newCustomRecordData.internalid, CUSTOM_RECORD.EXTERNAL_ID, newCustomRecordData.id);
        nlapiSubmitField(this.CONSTANTS.CUSTOM_RECORD_TYPE, newCustomRecordData.internalid, CUSTOM_RECORD.STATUS, newCustomRecordData.status_id);
        nlapiSubmitField(this.CONSTANTS.CUSTOM_RECORD_TYPE, newCustomRecordData.internalid, CUSTOM_RECORD.SYNC_DATE, newCustomRecordData.updated_at);

      } else {
        Utility.logDebug('updateValuesOnCustomRecord:else', JSON.stringify(resData));
        let newCustomRecordData = resData.data;
        nlapiSubmitField(this.CONSTANTS.CUSTOM_RECORD_TYPE, newCustomRecordData.internalid, CUSTOM_RECORD.STATUS, newCustomRecordData.status_id);
      }
    });
  }

  private apiPostRequest(apiRoute, postdata): any {
    let URL = this.CONSTANTS.URL + apiRoute;
    // let postdata = JSON.stringify(taxCodes);
    let header = { 'Content-Type': this.CONSTANTS.CONTENT_TYPE };
    let response = nlapiRequestURL(URL, postdata, header);

    // Utility.logDebug('response', response.getBody());
    return response;
  }

  private filterCriteria(): Array<any> {
    let CUSTOM_RECORD = this.CONSTANTS.CUSTOM_RECORD;
    let STATUS = this.CONSTANTS.STATUS;

    return [
      [CUSTOM_RECORD.STATUS, CUSTOM_RECORD.ANY_OF, STATUS.PENDING]
    ]
  }

  private columnCriteria(): Array<any> {
    let CUSTOM_RECORD = this.CONSTANTS.CUSTOM_RECORD;

    return [
      new nlobjSearchColumn(CUSTOM_RECORD.NS_ID),
      new nlobjSearchColumn(CUSTOM_RECORD.NAME),
      new nlobjSearchColumn(CUSTOM_RECORD.RATE),
      new nlobjSearchColumn(CUSTOM_RECORD.EXTERNAL_ID),
      new nlobjSearchColumn(CUSTOM_RECORD.STATUS),
      new nlobjSearchColumn(CUSTOM_RECORD.OPERATION),
      new nlobjSearchColumn(CUSTOM_RECORD.SYNC_DATE),
      new nlobjSearchColumn(CUSTOM_RECORD.RECORD_TYPE)
    ]
  }

  private getColumnData(): Array<object> {
    let CUSTOM_RECORD = this.CONSTANTS.CUSTOM_RECORD;
    let CUSTOM_RECORD_FIELDS = this.CONSTANTS.CUSTOM_RECORD_FIELDS;

    return [
      {
        id: CUSTOM_RECORD.NS_ID,
        name: CUSTOM_RECORD_FIELDS.NS_ID
      },
      {
        id: CUSTOM_RECORD.NAME,
        name: CUSTOM_RECORD_FIELDS.NAME
      },
      {
        id: CUSTOM_RECORD.RATE,
        name: CUSTOM_RECORD_FIELDS.RATE
      },
      {
        id: CUSTOM_RECORD.EXTERNAL_ID,
        name: CUSTOM_RECORD_FIELDS.EXTERNAL_ID
      },
      {
        id: CUSTOM_RECORD.STATUS,
        name: CUSTOM_RECORD_FIELDS.STATUS
      },
      {
        id: CUSTOM_RECORD.OPERATION,
        name: CUSTOM_RECORD_FIELDS.OPERATION
      },
      {
        id: CUSTOM_RECORD.SYNC_DATE,
        name: CUSTOM_RECORD_FIELDS.SYNC_DATE
      },
      {
        id: CUSTOM_RECORD.RECORD_TYPE,
        name: CUSTOM_RECORD_FIELDS.RECORD_TYPE
      }
    ];
  }

  private onConversionToFlattenObject(customRecordData) {
    let convertedRecord = [];
    let cols = this.getColumnData();

    for (let key in customRecordData) {
      let row = customRecordData[key];
      let obj: any = {};

      // obj.recordtype = row.recordType;
      obj.internalid = row.id;

      cols.forEach((colEl: any) => {
        let text = row.getText(colEl.id);

        if (text) {
          obj[colEl.name + '_text'] = text;
          obj[colEl.name + '_id'] = row.getValue(colEl.id);
        }
        else {
          obj[colEl.name] = row.getValue(colEl.id);
        }
      });

      convertedRecord.push(obj);
    }
    Utility.logDebug('onConversionToFlattenObject:convertedRecord', JSON.stringify(convertedRecord));

    return convertedRecord;
  }

  /**
   * Main Function
   * @param args
   */
  static main(args) {

    let success = (new TaxCodesShippingItemsExportSch()).scheduled(args);

    if (success) {

      Utility.logDebug("TaxCodesShippingItemsExportSpreeCommerce.main", "SUCCESSFUL");
    } else {

      Utility.logDebug("TaxCodesShippingItemsExportSpreeCommerce.main", "FAILED");
    }
  }
}
