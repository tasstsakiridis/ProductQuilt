import { LightningElement, api, track, wire } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';

import TEMPLATE_SELECTABLETILE_TOP from './selectableTile.html';
import TEMPLATE_SELECTABLETILE_LEFT from './selectableTileImageLeft.html';
import TEMPLATE_SELECTABLETILE_RIGHT from './selectableTileImageRight.html';
import TEMPLATE_SELECTABLETILE_BOTTOM from './selectableTileImageBottom.html';

export default class SelectableTile extends LightningElement {
    labels = {
        deselect: { label: 'deselect' },
        select: { label: 'select' }
    };

    tileClass = 'tile';

    @wire(CurrentPageReference) pageRef;

    connectedCallback() {
    }

    disconnectedCallback() {
    }

    @api 
    selectedEventName;

    @api 
    deSelectedEventName;

    @api
    objRecordId;

    @api 
    objRecord;

    @api 
    objRecordApiName;

    @api 
    imageFieldName;

    @api 
    imageUrl;

    @api 
    imagePosition;

    @api 
    title;

    @api 
    textLine1 = '';

    @api 
    textLine2 = '';

    @api 
    inputField1Name;

    @api 
    inputField1Label;

    @api 
    inputField1Value;

    @api 
    inputField2Name;

    @api 
    inputField2Label;

    @api 
    inputField2Value;
    
    /**
     * Public Methods
     */
    @api 
    select() {
        this.isSelected = true;
    }

    @api 
    deselect() {
        this.isSelected = false;
        this.inputField1Value = undefined;
        this.inputField2Value = undefined;
    }

    @api 
    updateField(fieldName, fieldValue) {
        if (fieldName == this.inputField1Name) {
            this.inputField1Value = fieldValue;
        } else if (fieldName == this.inputField2Name) {
            this.inputField2Value = fieldValue;
        }
    }

    _isSelected = false;
    @api 
    get isSelected() {
        return this._isSelected;
    }

    set isSelected(value) {
        this._isSelected = value;
        this.updateTileClass();
    }

    get isImageTop() {
        return this.imagePosition == undefined || this.imagePosition == 'top';
    }
    get isImageLeft() {
        return this.imagePosition == 'left';
    }
    get isImageRight() {
        return this.imagePosition == 'right';
    }
    get isImageBottom() {
        return this.imagePosition == 'bottom';

    }
    get titleSize() {
        var size = 12;
        
        if (this.imageUrl == undefined && this.objRecord != undefined && this.objRecord[this.imageFieldName] != undefined && this.objRecord[this.imageFieldName] !== '') {
            size = 8;
        }
        return size;
    }
    get pictureUrl() {
        var pictureUrl = this.imageUrl;
    
        if (this.imageUrl && this.imageUrl != '') {
            pictureUrl = this.imageUrl;
        } else if (this.objRecord && this.objRecord[this.imageFieldName]) {
            pictureUrl = 'https://salesforce-static.b-fonline.com/images/'+this.objRecord[this.imageFieldName];
        }

        return pictureUrl;
    }

    get titleDivSize() {
        return this.pictureUrl == undefined || this.pictureUrl == '' ? 12 : 8;
    }
    
    get hasInputFields() {
        //console.log('[selectableTile.hasInputFields] input1, input2', this.inputField1Name, this.inputField2Name);
        return this.inputField1Name != undefined || this.inputField2Name != undefined;
    }
    get selectButtonLabel() {
        return this._isSelected ? this.labels.deselect.label : this.labels.select.label;
    }

    render() {
        //console.log('[selectabletile.render] imageposition, input1, input2', this.imagePosition, this.inputField1Name, this.inputField2Name);
        if (this.imagePosition == undefined || this.imagePosition == 'top') {
            return TEMPLATE_SELECTABLETILE_TOP;
        } else if (this.imagePosition == 'left') {
            return TEMPLATE_SELECTABLETILE_LEFT;
        } else if (this.imagePosition == 'right') {
            return TEMPLATE_SELECTABLETILE_RIGHT;
        } else if (this.imagePosition == 'bottom') {
            return TEMPLATE_SELECTABLETILE_BOTTOM;
        }
    }
    
    handleSelectTile(isSelected) {
        this._isSelected = isSelected;
        this.updateTileClass();
    }

    handleClick(event) {
        event.preventDefault();
        if (this.hasInputFields) { return; }

        try {
            this.selectTile();
        }catch(ex) {
            console.log('[selectabletile.handleclick] exception', ex);
        }
    }
    handleSelectButtonClick(event) {
        event.preventDefault();

        try {
            this.selectTile();
        }catch(ex) {
            console.log('[selectabletile.handleselectbuttonclick] exception', ex);
        }
    }

    selectTile() {
        console.log('[selectabletile.selectTile] product', this.title);
        console.log('[selectabletile.selectTile] inputField1Value', this.inputField1Value);
        console.log('[selectabletile.selectTile] inputField2Value', this.inputField2Value);
        this.isSelected = !this.isSelected;
        //this.updateTileClass();
        
        let eventName = this.selectedEventName == undefined || this.selectedEventName == '' ? 'selected' : this.selectedEventName;
        console.log('[selectabletile.selectTile] eventname', eventName);
        const selectedEvent = new CustomEvent(eventName, {
            detail: {
                isSelected: this._isSelected,
                id: this.objRecordId,
                name: this.title,
                field1Value: this.inputField1Value,
                field2Value: this.inputField2Value
            }
        });
        console.log('[selectabletile.selectTile] selectedEvent', JSON.parse(JSON.stringify(selectedEvent)));
        this.dispatchEvent(selectedEvent);
    }

    updateTileClass() {
        this.tileClass = this._isSelected ? 'tileSelected' : 'tileDeSelected';
        console.log('[selectableTile.updateTileClass] tileclass', this.tileClass);
    }

    handleFieldValueUpdated(event) {
        console.log('[selectableTile.handleFieldValueUpdatd] event', JSON.parse(JSON.stringify(event)));
        if (this.inputField1Name == event.detail.fieldName) {
            this.inputField1Value = event.detail.value;
        } else if (this.inputField2Name == event.detail.fieldName) {
            this.inputField2Value = event.detail.value;
        }

        console.log('[selectableTile.handleFieldValueUpdatd] isSelected', this.isSelected);
        if (this.isSelected) {
            const ev = new CustomEvent('valueupdated', {
                detail: {
                    id: this.objRecordId,
                    fieldName: event.detail.fieldName,
                    fieldValue: event.detail.value
                }
            });
            console.log('[selectabletile.handleFieldValueUpdated] event', JSON.parse(JSON.stringify(ev)));
            this.dispatchEvent(ev);    
        }
    }

}