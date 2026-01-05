import { LightningElement, api, wire } from 'lwc';
import { registerListener, unregisterAllListeners } from 'c/pubsub';
import { CurrentPageReference } from 'lightning/navigation';

export default class BrandTile extends LightningElement {
    /* Private Properties */
    _brand;

    brandName;
    pictureUrl;
    isSelected = false;

    tileClass = 'tile';

    @wire(CurrentPageReference) pageRef;

    connectedCallback() {
        registerListener('clearSelection', this.handleClearSelection, this);
    }

    disconnectedCallback() {
        unregisterAllListeners(this);
    }

    /* Public Properties */
    @api 
    get brand() {
        return this._brand;
    }
    
    set brand(value) {
        this._brand = value;
        this.brandName = value.label;
        this.isSelected = value.isSelected;
        if (value.Primary_Logo__c) {
            //this.pictureUrl = BRAND_LOGOS + '/BrandLogos/'+value.Primary_Logo__c;
            this.pictureUrl = 'https://salesforce-static.b-fonline.com/images/brand_logos/' + value.Primary_Logo__c;
        }
        this.selectTile();
    }

    handleSelectTile(isSelected) {
        console.log('[brandtile] selectTile method called');
        this.isSelected = isSelected;
        this.selectTile();
    }
    handleClearSelection() {
        this.isSelected = false;
        this.selectTile();
    }

    handleClick(event) {
        event.preventDefault();

        console.log('[brandTile.handleClick] brand selected', this.brand);
        this.isSelected = !this.isSelected;
        this.selectTile();

        const eventName = this.isSelected ? 'selected' : 'deselected';
        const selectedEvent = new CustomEvent(eventName, {
            detail: this.brand.value
        });
        this.dispatchEvent(selectedEvent);
    }

    selectTile() {
        this.tileClass = this.isSelected ? 'tileSelected' : 'tile';
    }
}