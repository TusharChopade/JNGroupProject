/**
 * this file consolidates all the reusable functions used in different aura components
 */

/**
 * calculates savings
 * @param {Object} data
 * @param {Number} totalMonthly_PI_LoanPayment
 * @return {Object}
 */
function calculateSavings(data, totalMonthly_PI_LoanPayment) {
  if (
    validNumbersWithObject(
      ["totalMonthly_PI_LoanPayment", "months", "years"],
      data
    )
  ) {
    let tenure = calculateMonths(data.years, data.months);
    let monthlySavings = basicMonthlyCompulsorySavingsCalculator(
      totalMonthly_PI_LoanPayment,
      data.percentage,
      data.amount
    );
    let monthlySavingsOverRepaymentPeriod = basicTotalMonthlyCompulsorySavingsCalculator(
      monthlySavings,
      tenure
    );
    return {
      totalCompulsorySavingsBalance: parseFloat(
        monthlySavingsOverRepaymentPeriod
      ),
      monthlyCompulsorySavings: parseFloat(monthlySavings)
    };
  } else if (validNumbersWithObject(["amount"], data)) {
    let totalCompulsorySavings = data.amount * tenure;
    return {
      monthlyCompulsorySavings: data.amount,
      totalCompulsorySavingsBalance: totalCompulsorySavings
    };
  } else {
    return {
      totalCompulsorySavingsBalance: 0,
      monthlyCompulsorySavings: 0
    };
  }
}
/*
 * Updates child container attributes and its values.
 */
window.updateChildContainerWithValue = function (
  component,
  values,
  shouldSetComponentValue
) {
  let container = component.get("v.ChildContainer");
  values.forEach((element) => {
    container[element.key] = element.value;
    if (shouldSetComponentValue)
      component.set(`v.${element.key}`, element.value);
  });
  return container;
};
/*
 * Updates child container attributes and its values. then toggles when it should be notified
 */
window.updateChildContainerNoNotification = function (component, values) {
  let container = component.get("v.ChildContainer");
  values.forEach((element) => {
    container[element.key] = element.value;
  });
  component.set("v.notifyContainerChange", false);
  component.set("v.ChildContainer", container);
  console.log("After updatinf child");
  return container;
};

/**
 * Toggles cash investment flag.
 */
window.toggleCashInvestmentFlag = function (value) {
  if (value === "Cash/Investments") return true;
  return false;
};

/**
 * Toggles disability of account type.
 */
window.toggleAccountTypeDisability = function (value) {
  if (value !== null) return false;
  return true;
};

/**
 * Toggle option list values depending on institution selected
 */
window.updateAccountTypeOptionList = function (
  fundManagerAccountTypeOptions,
  jnBankAccountTypeOptions,
  selected
) {
  if (selected === "JN Bank Ltd.") return jnBankAccountTypeOptions;
  if (selected === "JN Fund Managers Ltd.")
    return fundManagerAccountTypeOptions;
};

/**
 * Toggle account number fields layout
 */
window.toggleAccountNumberComponent = function (selected, component) {
  if (selected === "JN Bank Ltd.") {
    component.set("v.bankSelectedFlag", true);
    component.set("v.fundManagerSelectedFlag", false);
  }
  if (selected === "JN Fund Managers Ltd.") {
    component.set("v.fundManagerSelectedFlag", true);
    component.set("v.bankSelectedFlag", false);
  }
};
/**
 * Toggle visibility of existing balance field
 */
window.toggleHypothecatedLoanFlag = function (selected, component) {
  if (selected === "Yes") {
    component.set("v.hypothecatedLoanFlag", true);
  }
  if (selected === "No") {
    component.set("v.hypothecatedLoanFlag", false);
  }
};

/**
 * Clears components with an identified aura id.
 */
window.resetComponentValue = function (auraId, component, value) {
  let cmp = component.find(auraId);
  if (cmp !== null) {
    cmp.set("v.value", value);
  }
};

/**
 * Calculates the monthly P&I Loan amount in the credit calculations table.
 */
window.monthlyPILoanAmountCalculation = function (container) {
  return basicPMTCalculator(
    ["years", "months", "loanAmount", "market"],
    container
  );
};
/**
 * contructs and fire the product details application event
 * @param {String} type - specifies the intent of the event
 * @param {Object} payload
 * @return {Void}
 */
window.fireProductDetailsEvent = function (type, payload, component) {
  let productDetailsEvent = $A.get("e.c:ProductDetailsEvent");
  productDetailsEvent.setParams({
    type: !type ? "calculation" : type,
    payload: payload
  });
  productDetailsEvent.fire();
  //indicate that the component wants notifications
  if (component) {
    component.get("v.notifyContainerChange", true);
  }
};
/**
 * calculates the requested credit limit
 * @param {*} requestedCreditLimit
 * @param {*} capLimit
 */
window.calculatRequestedCreditBalanceLimit = function (requestedCreditLimit) {
  console.log("requested card limit: ", requestedCreditLimit);
  //console.log("requested card limit: ", REQUESTED_CREDIT_LIMIT_PERCENTAGE);
  return requestedCreditLimit * REQUESTED_CREDIT_LIMIT_PERCENTAGE;
};

/**
 * Calculate ASL
 * @param {*} container
 * @param {*} jnDefaults
 * @return {Decimal}
 */
window.ASLCalculator = function (container, jnDefault) {
  let principalPayment = 0;
  let results = [];
  if (container.productFamily === "Credit Card") {
    principalPayment = jnDefault.creditCardPrincipalPayment;
  } else {
    principalPayment = jnDefault.lineOfCreditPrincipalPayment;
  }
  //Step 1:
  let annualGrossIncome = annualGrossIncomeCalculator(
    container.grossMonthlyIncome
  );
  results.add(annualGrossIncome);
  //Step 1.5:
  let maxCredilLimit = maximumCreditLimitCalculator(
    jnDefault.creditLimitMax,
    annualGrossIncome
  );
  results.add(maxCredilLimit);
  //Step 2:
  let maxDebtPayment = maximumAllowableForMonthlyDebtPaymentsCalculator(
    container.policyLimit,
    container.grossMonthlyIncome
  );
  results.add(maxDebtPayment);
  //Step 3:
  let maxMinimumPayment = maximumAllowableForMinimumPaymentCalculator(
    maxDebtPayment,
    container.existingDebt
  );
  results.add(maxMinimumPayment);
  //Step 4:
  let computedMinimumPayment = computedMinimumPaymentFromCreditLimitCalculator(
    maxMinimumPayment,
    container.interestRate,
    principalPayment
  );
  results.add(computedMinimumPayment);
  //Step 5:
  let lowerCreditLimit = lowerCreditLimitCalculator(
    computedMinimumPayment,
    maxCredilLimit
  );
  results.add(lowerCreditLimit);
  //Step 6:
  let creditLimitAfterRisk = creditLimitRiskCalculator(
    lowerCreditLimit,
    container.score
  );
  results.add(creditLimitAfterRisk);
  //Step 7:
  let startingLimit = startingCreditLimtCalculator(
    creditLimitAfterRisk,
    jnDefault.discountFactor
  );
  results.add(startingLimit);
  //Step 8:
  results.forEach((element) => {
    if (element === 0) return 0;
  });
  return approvedStartingLimitCalculator(
    startingLimit,
    container.requestedLimit
  );
};
