({
  doinit: function (component, event) {
    let auraList = [
      "primaryIncomeSource",
      "grossSalaryAllowances",
      "otherIncome",
      "netBusinessIncomeSoleTrader",
      "directorEmoluments",
      "netBusinessIncomePartnership",
      "netBusinessIncomeCompanyShareholding",
      "pension",
      "propertyRental",
      "totalOtherIncome",
      "totalMonthlyIncome"
    ];
    component.set("v.auraIdList", auraList);
    let verifiedMonthlyIncome = {
      primarySourceOfIncome: null,
      grossSalaryAllowances: null,
      otherIncome: null,
      netBusinessIncomeSoleTrader: null,
      netBusinessIncomePartnership: null,
      netBusinessIncomeCompanyShareholding: null,
      directorEmoluments: null,
      pensionIncome: null,
      propertyRental: null,
      totalOtherIncome: null,
      totalMonthlyIncome: null
    };
    component.set("v.verifiedMonthlyIncomeMap", verifiedMonthlyIncome);
  },
  onToggleCheckAlChange: function (component, event, helper) {
    let checkBoxCmp = component.find("verificationToggle");
    checkBoxCmp.forEach((element) => {
      element.set("v.checked", component.get("v.toggleCheckAll"));
      if (component.get("v.toggleCheckAll")) {
        //set all verified fields to disabled
        let inputCmpIdList = component.get("v.auraIdList");
        inputCmpIdList.forEach((element) => {
          let inputCmp = component.find(element);
          inputCmp.set("v.disabled", true);
          let unverifiedCmp = component.find(element.concat("Unverified"));
          inputCmp.set("v.value", unverifiedCmp.get("v.value"));
        });
      } else {
        //set all verified fields to undisabled
        let inputCmpIdList = component.get("v.auraIdList");
        inputCmpIdList.forEach((element) => {
          let inputCmp = component.find(element);
          inputCmp.set("v.disabled", false);
          inputCmp.set("v.value", null);
        });
      }
    });
  },

  fireComponentEvent: function (cmp, event) {
    let cmpEvent = cmp.getEvent("MonthlyIncomeEvent");
    let checkBoxCmpName = event.getSource().get("v.name");
    let checkBoxValue = event.getSource().get("v.checked");
    cmpEvent.setParams({
      componentName: checkBoxCmpName,
      checkedVar: checkBoxValue
    });
    cmpEvent.fire();
  },

  handleComponentEvent: function (component, event) {
    let componentName = event.getParam("componentName");
    let checkedValue = event.getParam("checkedVar");
    let inputCmp = component.find(componentName);
    let unverifiedInputCmp = component.find(componentName.concat("Unverified"));
    if (checkedValue) {
      inputCmp.set("v.disabled", true);
      //set value to the value of related unverified amount
      //add verified to component string as aura id
      //reference the aura id and reverence the attribute value
      //set the value of inputCmp  as that of the unverified amount
      inputCmp.set("v.value", unverifiedInputCmp.get("v.value"));
    } else {
      inputCmp.set("v.disabled", false);
      inputCmp.set("v.value", null);
    }
  },

  onVerifiedMonthlyIncomeMapChange: function (component, event) {
    let verifiedMonthlyIncomeData = component.get("v.verifiedMonthlyIncomeMap");
    let verifiedData = component.get("v.verifiedDataMap");
    let data = Object.assign(verifiedData, verifiedMonthlyIncomeData);
    component.set("v.verifiedDataMap", data);
  }
});
