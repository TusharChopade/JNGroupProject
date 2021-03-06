({
  doInit: function(component, event, helper) {
    const allTabIds = [
      "Getting_Started_Tab",
      "Application_Information_Tab",
      "General_Details_Tab",
      "Identification_Details_Tab",
      "Contact_Details_Tab",
      "Emergency_Contact_Tab",
      "Employment_Details_Tab",
      "Affiliations_Tab",
      "Extensions_Tab",
      "Document_Upload_Tab"
    ];
    component.set("v.SiteLead", {});
    component.set("v.allTabs", allTabIds);
    component.set("v.tabId", "Getting_Started_Tab");
  },

  openModal: function(component, event, helper) {
    console.log("modal got clicked");
    var childCmp = component.find("JNModal");
    var header = "Here is the header I assign";
    var body = "Here is content for the body";
    childCmp.showModal(header, body);
  },
  navigateBack: function(component, event, helper) {
    const navEvent = component.getEvent("jnEvent");
    navEvent.setParam("action", "showHomePage");
    navEvent.setParam("component", "JNHomePage");
    navEvent.fire();
  },
  handleTabChange: function(component, event, helper) {
    const tabName = helper.getTabName(component.get("v.tabId"));
    if (tabName === "Document_Upload") {
      component.set("v.formBtnText", "Finish");
    } else {
      component.set("v.formBtnText", "Next");
    }
  },
  tabNext: function(component, event, helper) {
    const tabName = helper.getTabName(component.get("v.tabId"));
    const currentCmp = component.find(tabName);
    if (component.get("v.formBtnText") === "Finish") {
      helper.showModal(component);
    } else {
      if (typeof currentCmp.validateTabFields === "function") {
        if (currentCmp.validateTabFields() === true) {
          helper.setSiteLeadInfo(component, currentCmp);
          switch (tabName) {
            case "General_Details": {
              //create lead
              currentCmp.createLead();
              break;
            }
            case "Contact_Details": {
              if (!currentCmp.get("v.shouldShow")) {
                currentCmp.setMailingAddress();
                helper.setSiteLeadInfo(component, currentCmp);
                console.log(
                  "Current Lead",
                  JSON.parse(JSON.stringify(component.get("v.SiteLead")))
                );
              } else {
                console.log(
                  "Current Lead",
                  JSON.parse(JSON.stringify(component.get("v.SiteLead")))
                );
              }
              helper.navigateNext(component);
              break;
            }
            case "Affiliations": {
              currentCmp.createAffiliates();
              break;
            }
            case "Extensions": {
              console.log("creating the Extensions");
              currentCmp.createExtensions();
              break;
            }
            default: {
              helper.setSiteLeadInfo(component, currentCmp);
              console.log(
                "Current Lead",
                JSON.parse(JSON.stringify(component.get("v.SiteLead")))
              );
              helper.navigateNext(component);
            }
          }
        }
      } else {
        helper.navigateNext(component);
      }
    }
  },
  tabPrevious: function(component, event, helper) {
    const allTabs = component.get("v.allTabs");
    const index = allTabs.indexOf(component.get("v.tabId"));
    //can go next
    if (index - 1 >= 0) {
      const tab = allTabs[index - 1];
      component.set("v.tabId", tab);
    }
  },
  handleEvent: function(component, event, helper) {
    const eventAction = event.getParam("action");
    const eventComponent = event.getParam("component");
    const eventData = event.getParam("data");
    if (eventComponent === "JNApplicationForm") {
      if (Array.isArray(eventAction)) {
        eventAction.forEach(function(action) {
          switch (action) {
            case "showLoading": {
              component.set("v.showLoading", true);
              break;
            }
            case "disableShowLoading": {
              component.set("v.showLoading", false);
              break;
            }
            case "navigateNext": {
              helper.navigateNext(component);
              break;
            }
            case "setLeadInfo": {
              let siteLead = component.get("v.SiteLead");
              Object.assign(siteLead, eventData);
              component.set("v.SiteLead", siteLead);
            }
          }
        });
      }
    }
  },
  postiveBtnClick: function(component, event, helper) {
    helper.closeModal(component);
      const siteLead = component.get("v.SiteLead");
      if(!siteLead.hasOwnProperty("Id")) {
          //user must complete step 2 and 3 first
          alert("must complete step 2 and 3 first");
      } else {
          helper.updateApplicationInformation(component);
      }    
  },
});