// function on_load(type, form, request) {
//   nlapiLogExecution('DEBUG', 'on_load', type);
// }

// function before_submit(type) {
//   nlapiLogExecution('DEBUG', 'before_submit', type);
// }

function afterSubmit(type) {

  try {


    var currentContext = nlapiGetContext();
    if (currentContext.getExecutionContext() == 'userinterface') {
      nlapiLogExecution('DEBUG', 'afterSubmit:currentContext', currentContext);

      if (type == 'create') {
        onCreateShippingItem();
      }
      else if (type == 'edit') {
        onUpdateShippingItem();
      }
      else if (type == 'delete') {
        onDeleteShippingItem();
      }
    }
  } catch (error) {
    nlapiLogExecution('ERROR', 'afterSubmit:currentContext', error);
  }
}

function onCreateShippingItem() {
  nlapiLogExecution('DEBUG', 'onCreateShippingItem');
}

function onUpdateShippingItem() {
  nlapiLogExecution('DEBUG', 'onUpdateShippingItem');
}

function onDeleteShippingItem() {
  nlapiLogExecution('DEBUG', 'onDeleteShippingItem');
}
