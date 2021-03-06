({
	getPickListValues : function(component) {
		const action = component.get("c.getPickListValuesList");
        action.setParams({
            'objectApiName': 'Lead',
            'fieldApiNames' : ['Preferred_Location__c','Loan_Purpose__c']
        });
        action.setCallback(this, function(response) {
            const state = response.getState();
            if (state === "SUCCESS") {
                const mappedList = response.getReturnValue();
               	component.set("v.loanPurposes", mappedList['Loan_Purpose__c']);
                component.set("v.preferredLocations", mappedList['Preferred_Location__c']);
                
            } else {
                
            }
        });
        $A.enqueueAction(action);
	}
})