// custom record name that is used to store operations for NiDeckers
var CUSTOM_RECORD_TYPE = "customrecord_f3_nd_records";

// list of operations
var OPERATIONS = {
    "create":1,
    "edit":2,
    "delete":3
};

// list of record type
var RECORDTYPE = {
    "salestaxitem":{
        "id":1,
        "name":"itemid",
        "rate":"rate",
    },
    "shipitem":{
        "id":2,
        "name":"itemid",
        "rate":"rate",
    }
};

// var taxcodeFields = {
//     "name":"name",
//     "rate":"rate",
//     "externalid":"custrecord_taxcode_externalid"
// };

// function for after submit record
function afterSubmit(type){

    var id = nlapiGetRecordId();
    var operation = OPERATIONS[type];
    var recordType = RECORDTYPE[nlapiGetRecordType()].id;

    // if its create operations then add entry in custom record
	if(operation == OPERATIONS.create){
        createRecord(id, operation, recordType);
    }else{
	    // if its edit / delete case

        var custRecords = getCustomRecordOperations(recordType, id);
        if(custRecords.length == 0){
            createRecord(id, operation, recordType);
        }else{

            var name = "";
            var rate = "";

            var record = nlapiLoadRecord(CUSTOM_RECORD_TYPE, custRecords[0].getId());

            // operation is delete than we have no record found, because its deleted
            if(operation == OPERATIONS.edit) {
                var obj = getCurrentRecord();
                name = obj.name;
                rate = obj.rate;

                if(record.getFieldValue("custrecord_f3_operation") == OPERATIONS.create &&
                    record.getFieldValue("custrecord_f3_status_") == 1){
                    operation = OPERATIONS.create;
                }

                record.setFieldValue('custrecord_f3_status_', 1);
                record.setFieldValue('custrecord_f3_operation', operation);
                record.setFieldValue('custrecord_f3_name', name);
                record.setFieldValue('custrecord_f3_rate', rate);

                nlapiSubmitRecord(record, true);

            }else{

                if(record.getFieldValue("custrecord_f3_operation") == OPERATIONS.create &&
                    record.getFieldValue("custrecord_f3_status_") == 1){

                    nlapiDeleteRecord(CUSTOM_RECORD_TYPE, record.getId());

                }else{
                    record.setFieldValue('custrecord_f3_status_', 1);
                    record.setFieldValue('custrecord_f3_operation', operation);
                    nlapiSubmitRecord(record, true);
                }

            }

        }

    }

}

// function to create custom reocrd
function createRecord(id, operation, recordType){

    var name = "";
    var rate = "";
    if(operation != OPERATIONS.delete) {
        var obj = getCurrentRecord();
        name = obj.name;
        rate = obj.rate;
    }

    var record = nlapiCreateRecord(CUSTOM_RECORD_TYPE);

    record.setFieldValue('custrecord_f3_nsid', id);
    record.setFieldValue('custrecord_f3_operation', operation);
    record.setFieldValue('custrecord_f3_status_', 1);
    record.setFieldValue('custrecord_f3_recordtype', recordType);

    record.setFieldValue('custrecord_f3_name', name);
    record.setFieldValue('custrecord_f3_rate', rate);

    var nid = nlapiSubmitRecord(record, true);
}

// function to ge result on the base of given values
function getCustomRecordOperations(recType, nsId){

    var filters = [];
    var returncols = [];

    // filters
    filters.push(new nlobjSearchFilter('custrecord_f3_recordtype',null,"anyof",recType));
    filters.push(new nlobjSearchFilter('custrecord_f3_nsid',null,"equalto",nsId));

    // columns
    returncols.push(new nlobjSearchColumn("custrecord_f3_nsid"));
    returncols.push(new nlobjSearchColumn("custrecord_f3_externalid"));
    returncols.push(new nlobjSearchColumn("custrecord_f3_status_"));
    returncols.push(new nlobjSearchColumn("custrecord_f3_operation"));
    returncols.push(new nlobjSearchColumn("custrecord_f3_syncdate"));
    returncols.push(new nlobjSearchColumn("custrecord_f3_recordtype"));
    returncols.push(new nlobjSearchColumn("custrecord_f3_name"));
    returncols.push(new nlobjSearchColumn("custrecord_f3_rate"));

    var customrecords = nlapiSearchRecord(CUSTOM_RECORD_TYPE,null,filters,returncols);

    return customrecords?customrecords:[];
}



function getCurrentRecord(){
    var currRec = nlapiLoadRecord(nlapiGetRecordType(), nlapiGetRecordId());
    var name = currRec.getFieldValue(RECORDTYPE[nlapiGetRecordType()].name);
    var rate = currRec.getFieldValue(RECORDTYPE[nlapiGetRecordType()].rate);

    var obj =  {
        name:name,
        rate:rate,
    };

    return obj;

    // for tax code
    //itemid
    //rate

    // for shipping
    //itemid
    //rate
}