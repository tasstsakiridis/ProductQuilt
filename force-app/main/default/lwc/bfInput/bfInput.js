import { LightningElement, api } from 'lwc';

export default class BfInput extends LightningElement {
    @api 
    fieldName;

    @api 
    fieldLabel;

    @api 
    fieldValue;

    @api 
    placeholderText;

    @api 
    fieldType = 'text';

    handleInputChange(event) {
        console.log('[bfInput.handleInputChange] value', event.detail.value);
        try {
            this.fieldValue = event.detail.value;
            this.dispatchEvent(new CustomEvent('valueupdated', {
                detail: { fieldName: this.fieldName, value: this.fieldValue }
            }));
        }catch(ex) {
            console.log('[bfInput.handleInputChange] exception', ex);
        }
    }
}