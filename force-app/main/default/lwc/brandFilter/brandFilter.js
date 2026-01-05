import { LightningElement, api, wire } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import { fireEvent } from 'c/pubsub';

import CLIENT_FORM_FACTOR from '@salesforce/client/formFactor';

import getBrands from '@salesforce/apex/ProductQuilt_Controller.getProducts';

import LABEL_BRAND from '@salesforce/label/c.Brand';
import LABEL_BRANDS from '@salesforce/label/c.Brands';
import LABEL_CLEAR from '@salesforce/label/c.Clear';
import LABEL_SEARCH from '@salesforce/label/c.Search';

export default class BrandFilter extends LightningElement {
    labels = {
        brand: { label: LABEL_BRAND, labelPlural: LABEL_BRANDS},
        clear: { label: LABEL_CLEAR },
        search: { label: LABEL_SEARCH },
    };

    @api recordId;
    @api usedFor;
    @api includeDryGoods;
    @api brands;
    @api queryForBrands = false

    isPhone = CLIENT_FORM_FACTOR === "Small";

    pageNumber = 1;
    brandsSelected = [];
    showSearchBar = false;

    @wire(CurrentPageReference) pageRef;

    /*
    @wire(getBrands, { pageNumber: '$pageNumber' })
    wiredGetBrands({error, data}) {
        console.log('[getBrands] data', data);
        console.log('[getBrands] error', error);
        if (data) {
            this.brands = data;
            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.brands = undefined;
        }
    }    
    */

    connectedCallback() {
        if (this.brandsLoaded) {
            return;
        }

        this.brandsLoaded = true;
        if (this.queryForBrands) {
            this.getMarketBrands();
        }
    }

    getMarketBrands() {
        getBrands({
            recordId: this.recordId,
            usedFor: this.usedFor,
            includeDryGoods: this.includeDryGoods
        }).then(result => {
            this.error = undefined;
            this.brands = result;
        }).catch(error => {
            this.error = error;
            this.brands = undefined;
        });
    }

    handlePreviousPage() {
        this.pageNumber = this.pageNumber - 1;
    }
    handleNextPage() {
        this.pageNumber = this.pageNumber + 1;
    }

    handleClearButtonClick() {
        fireEvent(this.pageRef, 'clearSelection', true);
        
        this.brandsSelected = [];
        fireEvent(this.pageRef, 'brandsSelected', this.brandsSelected);

    }
    handleSelected(event) {
        console.log('[brandFilter] handleSelected', event.detail);
        console.log('[brandFilter] handleSelected', this.brandsSelected);
        if (this.brandsSelected.indexOf(event.detail) < 0) {
            this.brandsSelected.push(event.detail);
            fireEvent(this.pageRef, 'brandsSelected', this.brandsSelected);
        }
    }
    handleDeSelected(event) {
        const index = this.brandsSelected.indexOf(event.detail);
        if (index > -1) {
            this.brandsSelected.splice(index, 1);
            fireEvent(this.pageRef, 'brandsSelected', this.brandsSelected);
        }
    }
}