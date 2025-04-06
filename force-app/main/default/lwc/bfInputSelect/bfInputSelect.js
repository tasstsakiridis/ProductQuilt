import { LightningElement, api, wire } from 'lwc';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';

export default class bfInputSelect extends LightningElement {
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

    options = [];

    cssClass = this.fieldApiName;

    get fieldApiName() {
        return `${this.objectApiName}.${this.fieldName}`;
    }

    @wire(getPicklistValues, { recordTypeId: '$recordTypeId' , fieldApiName: '$fieldApiName' })
    picklistResults({ error, data }) {
        console.log('[bfInputSelect.getPicklistValues] objectApiName, fieldName, recordTypeId  ', this.objectApiName, this.fieldName, this.recordTypeId);
        console.log('[bfInputSelect.getPicklistValues] data', data);
        console.log('[bfInputSelect.getPicklistValues] error', error);

        if (data) {
            const picklistValues = data.values.map(d => {
                return { label: d.label, value: d.value, validFor: d.validFor, selected: d.value == this.fieldValue };
            });
            this.options = picklistValues;
        } else {
            console.log('[bfInputSelect.getPicklistValues] error', error);
        }
    }

    handleInputBlur(event) {
        this.cssClass = this.fieldApiName;
    }
    handleInputFocus(event) {
        this.cssClass = `topOfStack ${this.fieldApiName}`;
    }

    handleInputChange(event) {
        console.log('[bfInputSelect.handleInputChange] value', event.detail.value);
        try {
            this.fieldValue = event.detail.value;
            this.dispatchEvent(new CustomEvent('valueupdated', {
                detail: { fieldName: this.fieldName, value: this.fieldValue }
            }));
        }catch(ex) {
            console.log('[bfInputSelect.handleInputChange] exception', ex);
        }
    }
}