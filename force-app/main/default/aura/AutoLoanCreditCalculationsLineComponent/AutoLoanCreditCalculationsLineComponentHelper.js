({
  calculateMonthlyP_ILoanAmount: function (component) {
    const result = basicPMTCalculator(
      ["years", "months", "loanAmount", "market"],
      component.get("v.PersonalAutoLoan")
    );
    if (!result) {
      component.set("v.monthly_PI_LoanAmount", 0);
    } else {
      component.set("v.monthly_PI_LoanAmount", result);
    }
  },
  setDeductRepaymentFlag: function (component) {
    console.log("Repayment deducted");
    let creditRepayment = component.get("v.CreditRepayment");
    if (creditRepayment.deductRepayment == "Yes") {
      component.set("v.deductRepaymentFlag", true);
    } else {
      component.set("v.deductRepaymentFlag", false);
    }
  },
<<<<<<< HEAD

  calcualateFirstYearPremium: function (premium) {
    if (premium != null) {
      return premium * 12;
    }
  },

  calculateJNGIPMT: function (component) {
    let jngiPremium = component.get("v.JNGIPremium");
    let personalAutoLoan = component.get("v.PersonalAutoLoan");
    const pmtData = {
      years: personalAutoLoan.years,
      months: personalAutoLoan.months,
      loanAmount: component.get("v.jngiMotorPremium"),
      market: personalAutoLoan.market
    };
    console.table("PMT DATA: ", JSON.stringify(pmtData));
    console.table("JNGI DATA: ", JSON.stringify(jngiPremium));
    if (jngiPremium.interested == "Yes" && jngiPremium.includeInLoan == "Yes") {
      console.log("SUCCESS");
      const result = basicPMTCalculator(
        ["years", "months", "loanAmount", "market"],
        pmtData
      );
      if (!result) {
        component.set("v.monthlyPIJNGIMotorPremium", 0);
      } else {
        component.set("v.monthlyPIJNGIMotorPremium", result);
      }
    } else if (jngiPremium.interested === "No") {
      component.set("v.monthlyPIJNGIMotorPremium", 0);
      component.set("v.jngiMotorPremium", 0);
    }
=======
  calculateProcessingFee: function (component) {
    console.log("Credit Repayment", JSON.parse(JSON.stringify(component.get("v.CreditRepayment"))), "Auto Loan", JSON.parse(JSON.stringify(component.get("v.PersonalAutoLoan"))));
    //TODO: CHANGE LATER TO CHILDCONTAINER, call in the personal auto loan change
    const combinedFields = Object.assign({}, component.get("v.CreditRepayment"), component.get("v.PersonalAutoLoan"));
    const { processingFee, monthlyProcessingFee, processingFeeClosingCost } = basicProcessingFeesCalculator(
      ["years", "months", "loanAmount", "market"],
      combinedFields,
      ["years", "months", "loanAmount", "market", "includeInLoanAmountFlag"],
      component.get("v.jnDefaultConfigs.gct"));

    component.set("v.processingFeesGCT", processingFee);
    component.set("v.monthlyPrincipalInterestProcessingFee", monthlyProcessingFee);
    component.set("v.processingFeeClosingCost", processingFeeClosingCost);
>>>>>>> e99cc447e8b53864784a4d50fae8fe8856638f0c
  }
})
