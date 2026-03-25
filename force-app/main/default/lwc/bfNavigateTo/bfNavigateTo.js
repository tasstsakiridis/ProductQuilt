import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class BfNavigateTo extends NavigationMixin(LightningElement) {
    @api recordId;
    @api objectApiName;
    @api navigateTo;

    @api invoke(){
        let navigationType = "standard__recordPage";
        let attributes = {
            objectApiName: this.objectApiName
        };
        let states = {};
        console.log('navigateTo', this.navigateTo);
        console.log('recordId', this.recordId);
        console.log('objectApiName', this.objectApiName);
        if (this.navigateTo.toLowerCase() == 'object') {
            navigationType = "standard__objectPage";
            attributes.actionName = "list";
            states.filterName = "Recent";
        } else if (this.navigateTo.toLowerCase() == 'record') {
            navigationType = "standard__recordPage";
            attributes.actionName = "view";
            attributes.recordId = this.recordId;
        }

        console.log('attributes', attributes.recordId, attributes.objectApiName, attributes.actionName, navigationType);
        this[NavigationMixin.Navigate]({    
            type: "standard__recordPage",
            attribute: {
                recordId: this.recordId,
                objectApiName: "Promotion_Activity__c",
                actionName: "view"
            }
        });
    }
}