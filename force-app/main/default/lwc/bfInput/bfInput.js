import { LightningElement, api, wire } from 'lwc';

export default class BfInput extends LightningElement {
    _fieldName = '';
    @api 
    get fieldName() {
        return this._fieldName;
    }
    set fieldName(value) {
        this._fieldName = value;
    }

    @api 
    fieldLabel = '';

    @api 
    fieldValue = '';

    @api 
    placeholderText = '';

    @api 
    fieldType = 'text';

    _objectApiName = '';
    @api
    get objectApiName() {
        return this._objectApiName;
    }
    set objectApiName(value) {
        this._objectApiName = value;
    }

    @api 
    recordTypeId = '';

    get fieldApiName() {
        return `${this.objectApiName}.${this.fieldName}`;
    }
    get isPicklist() {
        return this.fieldType == 'PICKLIST';
    }

    cssClass = this.fieldApiName;

    connectedCallback(){
        console.log('[bfInput.connectedCallback] objectApiName, recordTypeId  ', this.objectApiName, this.recordTypeId);
        console.log('[bfInput.connectedCallback] fieldName, fieldLabel  ', this.fieldName, this.fieldLabel);
        console.log('[bfInput.connectedCallback] fieldApiName', this.fieldApiName);
    }
    
    handleInputBlur(event) {
        this.cssClass = this.fieldApiName;
    }
    handleInputFocus(event) {
        this.cssClass = `topOfStack ${this.fieldApiName}`;
    }
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