({
  /**
   * Ver  Ticket#      Date            Author                  Purpose
   * 1.0  JN1-3969     4/12/2020      Ishwari G.(thinqloud)  To calculate the annual fees for primary applicant
   **/
  /**
   * Retrieves product selection wrapper from apex.
   * @param {*} container
   */
  updateProductSelection: function (component) {
    let oppId = component.get("v.recordId");
    let action = component.get("c.getSingleProductFamilySelection");
    action.setParams({
      oppId: oppId
    });
    action.setCallback(this, function (response) {
      let state = response.getState(); //Checking response status
      let result = response.getReturnValue();
      if (state === "SUCCESS") {
        //update spinner status
        this.checkSpinnerStatus(component, "productSelection");
        component.set("v.productSelection", result);
        let data = copyInto(component.get("v.ChildContainer"), result);
        component.set("v.ChildContainer", data);
        this.updateProductSelectedFlag(component);
      }
    });

    $A.enqueueAction(action);
  },
  /**
   * Toggles the flags responsible for showing the different layouts depending on selected products.
   * @param {*} container
   */
  updateProductSelectedFlag: function (component) {
    let selectedFlag = component.get("v.productSelection.productFamily");
    const families = [
      { name: "Auto", variable: "autoFlag" },
      { name: "Unsecured", variable: "unsecuredFlag" },
      { name: "Credit Card", variable: "creditCardFlag" },
      { name: "Line Of Credit", variable: "lineOfCreditFlag" }
    ];
    const family = families.find((family) => {
      return selectedFlag.includes(family.name);
    });
    if (family) {
      component.set(`v.${family.variable}`, true);
    }
  },
  /**
   * Retrieves JNConfigurations from apex.
   * @param {*} container
   */
  getJNConfigurations: function (component) {
    let action = component.get("c.GetJNConfigs");
    action.setCallback(this, function (response) {
      let state = response.getState(); //Checking response status
      let result = response.getReturnValue();
      if (state === "SUCCESS") {
        //update spinner status
        this.checkSpinnerStatus(component, "jnConfigs");
        component.set("v.jnDefaultConfigs", result);
      }
    });
    $A.enqueueAction(action);
  },
  /**
   * Retrieves risk rating map from apex
   * @param {*} container
   */
  getRiskRatingFactorsMap: function (component) {
    let action = component.get("c.getRiskRatingMap");
    action.setCallback(this, function (response) {
      let state = response.getState(); //Checking response status
      let result = response.getReturnValue();
      if (state === "SUCCESS") {
        //update spinner status
        this.checkSpinnerStatus(component, "riskRatings");
        component.set("v.RiskRatings", result);
      }
    });
    $A.enqueueAction(action);
  },

  /**
   * Retrieves All applicants belonging to a particular opportunity.
   * @deprecated
   * @param {*} container
   */
  getApplicants: function (component, oppId, tenure) {
    let action = component.get("c.getApplicantsRating");
    action.setParams({
      oppId: oppId,
      tenure: tenure
    });
    action.setCallback(this, function (response) {
      let state = response.getState(); //Checking response status
      let result = response.getReturnValue();
      if (state === "SUCCESS") {
        component.set("v.applicants", result);
        if (applicants.length > 1) {
          component.set("v.multipleApplicantsFlag", true);
        }
      }
    });
    $A.enqueueAction(action);
  },
  /**
   * confirms whether current values are the same in the child even after recomputation
   * @deprecated
   * @param {*} container
   */
  redundancyRemover: function (component, container) {
    let childContainer = component.get("v.ChildContainer");
    container.forEach((element, index) => {
      if (childContainer.hasOwnProperty(element.key)) {
        if (element.value == childContainer[element.key]) {
          //remove element to update
          container.splice(index, 1);
        }
      }
    });
    return container;
  },
  /**
   * calculates processing fees
   */
  processingFeeCalculation: function (container, component) {
    const {
      processingFee,
      monthlyProcessingFee,
      processingFeeClosingCost
    } = basicProcessingFeesCalculator(
      ["years", "months", "loanAmount", "market"],
      container,
      ["years", "months", "loanAmount", "market", "includeInLoanAmountFlag"],
      component.get("v.jnDefaultConfigs.gct")
    );
    return [
      { key: "processingFeeClosingCost", value: processingFeeClosingCost },
      {
        key: "monthlyPrincipalInterestProcessingFee",
        value: monthlyProcessingFee
      },
      { key: "processingFeesGCT", value: processingFee }
    ];
  },

  /**
   * Gets Applicants Existing Debts.
   */
  getAssetsAndLiabilitiesForApplicant: function (component) {
    let oppId = component.get("v.recordId");
    let action = component.get("c.getApplicantsAssetsAndLiabilities");
    action.setParams({
      oppId: oppId
    });
    action.setCallback(this, function (response) {
      let state = response.getState(); //Checking response status
      let result = response.getReturnValue();
      if (state === "SUCCESS") {
        //update spinner status
        this.checkSpinnerStatus(component, "assetsAndLiabilitiesForApplicants");
        this.mergeWithChildContainer(component, result);
        this.existingDebtCalculator(component, result);
      }
    });
    $A.enqueueAction(action);
  },
  /**
   * Meges a list of object with child container
   * @param {*} component
   * @param {*} result
   */
  existingDebtCalculator: function (component, result) {
    let values = [];
    let totalDebt = 0;
    let totalDebtAfter = 0;
    const isAuto = this.checkProductFamily(component, "Auto");
    const isLineOfCredit = this.checkProductFamily(component, "Line Of Credit");
    const isUnsecured = this.checkProductFamily(component, "Unsecured");
    const isCreditCard = this.checkProductFamily(component, "Credit Card");
    if (isCreditCard || isLineOfCredit) {
      totalDebt = this.existingDebtCalculation(
        [
          "motorVehicleMonthlyRepayment",
          "otherAssetMonthlyPayment",
          "otherLoanMonthlyPayment",
          "realEstateMonthlyPayment",
          "rentStrataMaintenance"
        ],
        component,
        result
      );
      values = [
        {
          key: "existingDebt",
          value: totalDebt
        }
      ];
    } else if (isAuto || isUnsecured) {
      totalDebt = this.existingDebtCalculation(
        [
          "monthlyLoanPaymentPrior",
          "minimumPaymentPrior",
          "rentBoardMonthlyPrior",
          "rentStrataMaintenanceFromLongSummaryPrior"
        ],
        component,
        result
      );
      totalDebtAfter = this.existingDebtCalculation(
        [
          "monthlyLoanPaymentAfter",
          "minimumPaymentAfter",
          "rentBoardMonthlyAfter",
          "rentStrataMaintenanceFromLongSummaryAfter"
        ],
        component,
        result
      );
      values = [
        {
          key: "existingDebtAfter",
          value: totalDebtAfter
        },
        {
          key: "existingDebt",
          value: totalDebt
        }
      ];
    }
    let data = updateChildContainerWithValue(component, values, false);
    component.set("v.ChildContainer", data);
  },
  /**
   * Meges a list of object with child container
   * @param {*} component
   * @param {*} containerValues
   */
  mergeWithChildContainer: function (component, objectList) {
    const fieldsToMerge = {
      grossMonthlyIncome: true,
      grossMonthlyIncomeFromLongSummary: true
    };
    let data = component.get("v.ChildContainer");
    objectList.forEach((element) => {
      Object.keys(element).forEach((key) => {
        if (fieldsToMerge.hasOwnProperty(key)) {
          data[key] = element[key];
        }
      });
    });
    component.set("v.ChildContainer", data);
  },
  /**
   * Calculate existing debt.
   * @param {Array} fields
   * @param {*} component
   * @param {Array} containerValues
   */
  existingDebtCalculation: function (fields, component, containerValues) {
    let total = 0;
    const fieldsMap = {};
    fields.forEach((element) => (fieldsMap[element] = true));
    containerValues.forEach((element) => {
      Object.keys(element).forEach((key) => {
        if (fieldsMap.hasOwnProperty(key)) {
          total += element[key];
        }
      });
    });
    return total;
  },
  /**
   * calculates  TDSR before
   * @param {*} component
   * @param {Object} data
   * @return {Void}
   */
  TDSRCalculationBefore: function (component) {
    let tdsrBefore = 0;
    let values = [];
    let container = component.get("v.ChildContainer");
    const isAuto = this.checkProductFamily(component, "Auto");
    const isLineOfCredit = this.checkProductFamily(component, "Line Of Credit");
    const isUnsecured = this.checkProductFamily(component, "Unsecured");
    const isCreditCard = this.checkProductFamily(component, "Credit Card");
    if (isAuto || isUnsecured) {
      tdsrBefore = TDSRBeforeCalculator(
        container.grossMonthlyIncomeFromLongSummary,
        container.existingDebt
      );
      values = [
        {
          key: "TDSRBefore",
          value: tdsrBefore
        }
      ];
    } else if (isLineOfCredit || isCreditCard) {
      tdsrBefore = TDSRBeforeCalculator(
        container.grossMonthlyIncome,
        container.existingDebt
      );
      values = [
        {
          key: "TDSRBefore",
          value: tdsrBefore
        }
      ];
    }

    let data = updateChildContainerWithValue(component, values, false);
    component.set("v.ChildContainer", data);
    return values;
  },
  /**
   * calculates  TDSR After
   * @param {*} component
   * @return {Array<*>}
   */
  TDSRCalculationAfter: function (component) {
    let container = component.get("v.ChildContainer");
    let tdsrAfter = 0;
    const isAuto = this.checkProductFamily(component, "Auto");
    const isLineOfCredit = this.checkProductFamily(component, "Line Of Credit");
    const isUnsecured = this.checkProductFamily(component, "Unsecured");
    const isCreditCard = this.checkProductFamily(component, "Credit Card");
    if (isAuto || isUnsecured) {
      // Calculate TDSR After for non revolving loans
      tdsrAfter = nonRevolvingTDSRAfterCalculator(
        container.grossMonthlyIncomeFromLongSummary,
        container.existingDebt,
        container.monthly_PI_LoanAmount
      );
    } else if (isCreditCard || isLineOfCredit) {
      // Calculate TDSR After for revolving loans
      tdsrAfter = TDSRAfterCalculator(
        container.grossMonthlyIncome,
        container.existingDebt,
        container.minimumPayment
      );
    }

    let values = [
      {
        key: "TDSRAfter",
        value: tdsrAfter
      }
    ];
    let data = updateChildContainerWithValue(component, values, false);
    component.set("v.ChildContainer", data);
    return values;
  },

  /**
   * Passes LTV, TDSR After and Before as well as repayment method to the serverside
   * @param {*} component
   * @param {*} event
   * @param {*} helper
   */
  getCreditScoreRatings: function (component) {
    let container = component.get("v.ChildContainer");
    const { LTVValue, repaymentMethod, TDSRBefore, collateralType } = container;
    let action = component.get("c.getCreditRiskRating");
    if (
      !isEmpty(collateralType) &&
      validNumber(LTVValue) &&
      validNumber(TDSRBefore) &&
      !isEmpty(repaymentMethod)
    ) {
      //show spinner
      this.showSpinner(component);
      action.setParams({
        oppId: component.get("v.recordId"),
        ltv: this.LTVApplicableValue(component, container),
        repaymentMethod: repaymentMethod,
        tdsrBefore: roundedValue(TDSRBefore),
        collateral: collateralType
      });
      action.setCallback(this, function (response) {
        //hide spinner
        this.hideSpinner(component);
        let state = response.getState();
        let result = response.getReturnValue();
        if (state === "SUCCESS") {
          let values = [
            { key: "creditRiskScore", value: result.score },
            { key: "creditRiskRating", value: result.rating }
          ];
          updateChildContainerWithNotification(component, values);
        } else {
          console.info(JSON.stringify(response.getError()));
        }
      });
      $A.enqueueAction(action);
    }
  },
  /**
   * checks whether current product family is auto or line of credit
   * @param {*} component
   * @param {Objec} container
   * @return {Number} ltv
   */
  LTVApplicableValue: function (component, container) {
    let selectedFlag = component.get("v.productSelection.productFamily");
    const families = [{ name: "Auto" }, { name: "Line Of Credit" }];
    const family = families.find((family) => {
      return selectedFlag.includes(family.name);
    });
    if (family) {
      return roundedValue(container.LTVValue);
    }
    return 0;
  },
  /**
   * checks if the passed family is the selected product
   * @param {*} component
   * @param {String} family
   * @return {Boolean}
   */
  checkProductFamily: function (component, family) {
    let selectedFlag = component.get("v.productSelection.productFamily");
    return selectedFlag.includes(family);
  },
  /**
   * JN1-3969
   * Gets the supplementary card holders wrapper and sets the number of supplementary card holder in child container
   * @param {*} component
   */

  getSupplementaryCardHolders: function (component) {
    let numberOfSupplementaryCardHolders = 0;
    let action = component.get("c.getSupplementaryCardHolders");
    action.setParams({
      oppId: component.get("v.recordId")
    });
    component.set("v.isSupplementaryCountSet", true);
    //show spinner
    this.showSpinner(component);
    action.setCallback(this, function (response) {
      //show spinner
      this.hideSpinner(component);
      let state = response.getState();
      let result = response.getReturnValue();
      if (state === "SUCCESS") {
        if (!isEmpty(result) && result.length > 0) {
          numberOfSupplementaryCardHolders = result.length;
        } else {
          numberOfSupplementaryCardHolders = 0;
        }
        let values = [
          {
            key: "numberOfSupplementaryCardHolders",
            value: numberOfSupplementaryCardHolders
          }
        ];
        updateChildContainerWithNotification(component, values);
      } else {
        console.info(JSON.stringify(response.getError()));
      }
    });
    $A.enqueueAction(action);
  },
  /**
   * JN1-3969
   * Calculate the annual fees for the primary applicant and Supplementary card holders
   * @param {*} component
   */
  annualFeesCalcualtions: function (component) {
    const container = component.get("v.ChildContainer");
    const JNDefaults = component.get("v.jnDefaultConfigs");
    const creditFlag = component.get("v.creditCardFlag");
    const locFlag = component.get("v.lineOfCreditFlag");
    const { primaryAnnualFee, supplementaryAnnualFee } = annualFeesCalculator(
      JNDefaults,
      creditFlag,
      locFlag,
      container
    );
    let values = [
      { key: "primaryApplicantAnnualMembership", value: primaryAnnualFee },
      {
        key: "supplementaryApplicantAnnualMembership",
        value: supplementaryAnnualFee
      }
    ];
    const data = updateChildContainerWithValue(component, values, false);
    component.set("v.ChildContainer", data);
    return values;
  },
  /**
   * Selects appropriate risk rating factor
   * @param {*} component
   * @return {Number} risk factor
   */

  getRiskRatingFactor: function (component, riskRating) {
    let riskRatingMap = component.get("v.RiskRatings");
    if (riskRatingMap) {
      return riskRatingMap[riskRating];
    }
    return null;
  },
  /**
   * Calculate Approved Starting Limit
   * @param {*} component
   * @return {Number} asl
   */

  ASLCalculations: function (component) {
    let container = component.get("v.ChildContainer");
    let jnDefaults = component.get("v.jnDefaultConfigs");
    let riskFactor = this.getRiskRatingFactor(
      component,
      container.creditRiskRating
    );
    if (!container.cashInvestmentFlag && validNumber(riskFactor)) {
      console.log("Cash Investment is false");
      let values = [
        {
          key: "approvedStartingLimit",
          value: ASLCalculator(container, jnDefaults, riskFactor)
        }
      ];
      let data = updateChildContainerWithValue(component, values, false);
      component.set("v.ChildContainer", data);
      console.log("No collateral ASL", data.approvedStartingLimit);
      return values;
    } else if (container.cashInvestmentFlag) {
      console.log("Cash Investment is true");
      let values = [
        {
          key: "approvedStartingLimit",
          value: ASLCalculator(container, jnDefaults, undefined)
        }
      ];
      let data = updateChildContainerWithValue(component, values, false);
      component.set("v.ChildContainer", data);
      console.log("Cash collateral ASL", data.approvedStartingLimit);
      return values;
    }
    let values = [{ key: "approvedStartingLimit", value: 0 }];
    let data = updateChildContainerWithValue(component, values, false);
    component.set("v.ChildContainer", data);
    return values;
  },
  /**
   * Calculate minimum payment
   * @param {*} component
   * @return {Number} asl
   */
  minimumPaymentCalculations: function (component) {
    let container = component.get("v.ChildContainer");
    let defaults = component.get("v.jnDefaultConfigs");
    let minimumPayment = minimumPaymentCalculatorWithASL(
      container,
      defaults,
      container.approvedStartingLimit
    );
    let values = [{ key: "minimumPayment", value: minimumPayment }];
    let data = updateChildContainerWithValue(component, values, false);
    component.set("v.ChildContainer", data);
    return values;
  },
  /**
   * checks the credit type
   * @param {*} component
   * @param {Objec} container
   * @return {Number} credit type
   */
  setCardType: function (component) {
    //JN-4049 :: Kirti R. ::Added a method to set credit type
    let container = component.get("v.ChildContainer");
    let approvedStartingLimit = container.approvedStartingLimit;
    if (approvedStartingLimit === 0) {
      container.cardType = CREDIT_TYPE_NONE;
    } else if (
      approvedStartingLimit >
      component.get("v.jnDefaultConfigs.creditLimitValue")
    ) {
      container.cardType = CREDIT_TYPE_GOLD;
    } else {
      container.cardType = CREDIT_TYPE_CLASSIC;
    }
    let values = [{ key: "cardType", value: container.cardType }];
    updateChildContainerWithValue(component, values);
    return values;
  },
  /**
   * Initializes supplementary card holders
   * @param {*} component
   */
  supplementaryCardHolderInit: function (component) {
    const creditFlag = component.get("v.creditCardFlag");
    const supplementaryCountSet = component.get("v.isSupplementaryCountSet");
    if (creditFlag && !supplementaryCountSet) {
      this.getSupplementaryCardHolders(component);
    }
  },
  /**
   * Calculates CreditorLife rate
   * @param {Object} component
   * @return {Decimal}
   */
  calculateCreditorLife: function (component) {
    let container = component.get("v.ChildContainer");
    let jnDefaults = component.get("v.jnDefaultConfigs");
    if (container.interestedInCreditorLifeNonRevolving === YES) {
      let creditorLife = nonRevolvingCreditorLifeCalculator(
        jnDefaults,
        container
      );
      let values = [
        {
          key: "creditorLifePremiumForNonRevolvingLoan",
          value: creditorLife
        }
      ];
      if (container.productFamily === CREDIT_CARD) {
        values = values.concat([
          {
            key: "creditorLifeAnnualFee",
            value: jnDefaults.creditorLifeAnnualFee
          }
        ]);
      }
      let data = updateChildContainerWithValue(component, values, false);
      component.set("v.ChildContainer", data);
    } else if (container.interestedInCreditorLifeNonRevolving === NO) {
      let values = [
        {
          key: "creditorLifePremiumForNonRevolvingLoan",
          value: 0
        }
      ];
      if (container.productFamily === CREDIT_CARD) {
        values = values.concat([
          {
            key: "creditorLifeAnnualFee",
            value: 0
          }
        ]);
      }
      let data = updateChildContainerWithValue(component, values, false);
      component.set("v.ChildContainer", data);
    }
  },
  /**
   * Displays spinner component.
   * @param {*} component
   */
  showSpinner: function (component) {
    const spinner = component.find("spinner");
    $A.util.toggleClass(spinner, "slds-hide");
  },
  /**
   * Hides spinner component.
   * @param {*} component
   */
  hideSpinner: function (component) {
    const spinner = component.find("spinner");
    $A.util.addClass(spinner, "slds-hide");
  },
  /***
  decides whether to continue showing the spinner
  @param {*} component
  @param {String} current
 */
  checkSpinnerStatus: function (component, current) {
    let spinnerList = component.get("v.spinnerList");
    spinnerList[current] = false;
    const allFalse = Object.keys(spinnerList).every(function (key) {
      return spinnerList[key] === false;
    });
    if (allFalse) {
      this.hideSpinner(component);
    } else {
      component.set("v.spinnerList", spinnerList);
    }
  }
});
