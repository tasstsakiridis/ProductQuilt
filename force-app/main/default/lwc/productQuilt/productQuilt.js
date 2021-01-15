import { LightningElement, api, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import getProducts from '@salesforce/apex/ProductQuilt_Controller.getProducts';
import linkProducts from '@salesforce/apex/ProductQuilt_Controller.linkProducts';

import LABEL_ADD from '@salesforce/label/c.Add';
import LABEL_CLEAR_LIST from '@salesforce/label/c.ClearList';
import LABEL_ERROR from '@salesforce/label/c.Error';
import LABEL_FILTERS from '@salesforce/label/c.Filters';
import LABEL_LINK from '@salesforce/label/c.Link';
import LABEL_PRODUCT from '@salesforce/label/c.Product';
import LABEL_PRODUCTS from '@salesforce/label/c.Products';
import LABEL_REMOVE from '@salesforce/label/c.Remove';
import LABEL_SUCCESS from '@salesforce/label/c.Success';

const selectedProductsColumns = [
    { label: 'Product', fieldName: 'productName', type: 'text', wrapText: true }
];

export default class ProductQuilt extends LightningElement {
    labels = {
        addProduct:     { label: `${LABEL_ADD} ${LABEL_PRODUCT}` },
        clearList:      { label: LABEL_CLEAR_LIST },
        filters:        { label: LABEL_FILTERS },
        linkProducts:   { label: `${LABEL_LINK} ${LABEL_PRODUCTS}` },
        product:        { label: LABEL_PRODUCT, labelPlural: LABEL_PRODUCTS },
        removeProducts: { label: `${LABEL_REMOVE} ${LABEL_PRODUCTS}` }
    };

    @api 
    recordId;

    @api 
    type = 'Quilt';

    @api 
    linkToObject;

    @api 
    linkToObjectFieldName;

    @api 
    linkToObjectProductFieldName;

    @api 
    productUsedFor;

    @api 
    quantityFieldName;

    @api 
    quantityFieldLabel;

    @api 
    priceFieldName;

    @api 
    priceFieldLabel;

    get isQuilt() {
        return this.type == 'Quilt';
    }
    get isList() {
        return this.type == 'List';
    }
    
    selectedProductsColumns = selectedProductsColumns;

    isWorking = false;
    products = [];
    allProducts = [];
    selectedProducts;
    selectedProductRows;
    linkedRows = new Map();
    brands;
    unitSizes;
    productsLoaded = false;

    @track
    showingFilters = false;

    get hasSelectedRows() {
        const datatable = this.template.querySelector('lightning-datatable');
        if (datatable) {
            return datatable.getSelectedRows().length > 0;
        }

        return false;
    }

    filterConfigs = [
        { label: 'Show selected items', name: 'show_selected', type: 'boolean', value: 'false' },
        { label: 'Product Name', name: 'name', type: 'text', value: '' },
        { label: 'Brands', name: 'brand', type: 'list', options: this.brands, multiple: true },
        { label: 'Unit Sizes', name: 'unitsize', type: 'list', options: this.unitSizes, multiple: true }
    ];
    
    connectedCallback() {
        if (this.quantityFieldName != undefined) {
            this.selectedProductsColumns.push({label: this.quantityFieldLabel, fieldName: 'qty', type: 'number', editable: false, initialWidth: 125});
        }
        if (this.priceFieldName != undefined) {
            this.selectedProductsColumns.push({label: this.priceFieldLabel, fieldName: 'price', type: 'currency', editable: false, initialWidth: 125});
        }

        if (this.productsLoaded) {
            return;
        }

        this.productsLoaded = true;
        this.loadProducts();
    }

    renderedCallback() {
        console.log('[renderedCallback] linkedRows', this.linkedRows);
        this.linkedRows.forEach((value, key, map) => {
            Array.from(
                this.template.querySelectorAll("c-selectable-tile."+key)
            ).forEach(tile => {
                console.log('[loadProducts] tile', tile);
                tile.select();
            });    
        });

    }

    loadProducts() {
        this.isWorking = true;
        getProducts({ recordId: this.recordId, 
                         linkToObject: this.linkToObject, 
                         linkToObjectFieldName: this.linkToObjectFieldName, 
                         linkToObjectProductFieldName: this.linkToObjectProductFieldName,
                         linkToObjectQtyFieldName: this.quantityFieldName,
                         linkToObjectPriceFieldName: this.priceFieldName,
                         usedFor: this.productUsedFor })
        .then(result => {
            console.log('[getProducts] result', result);
            this.error = undefined;
            this.products = result.products;
            this.allProducts = result.products;
            const brands = new Map();
            const unitSizes = new Map();
            try {
                if (this.products) {
                    this.products.forEach(p => {
                        if (!brands.has(p.Brand__c)) {
                            brands.set(p.Brand__c, { label: p.Brand__r.Name, value: p.Brand__c});
                        }
                        if (!unitSizes.has(p.Unit_Size__c)) {
                            unitSizes.set(p.Unit_Size__c, { label: p.Unit_Size__c, value: p.Unit_Size__c});
                        }
                    });    
                }

                this.brands = [...brands.values()].sort((a,b) => {
                    if (a.label < b.label) { return -1; }
                    if (a.label > b.label) { return 1; }
                    return 0;
                });

                this.unitSizes = [...unitSizes.values()].sort((a,b) => {
                    if (a.label < b.label) { return -1; }
                    if (a.label > b.label) { return 1; }
                    return 0;
                });

                let fcBrand = this.filterConfigs.find(fc => fc.name == 'brand');
                fcBrand.options = this.brands;

                let fcUnitSizes = this.filterConfigs.find(fc => fc.name == 'unitsize');
                fcUnitSizes.options = this.unitSizes;
                console.log('[productquilt.loadProducts] filterConfigs', JSON.parse(JSON.stringify(this.filterConfigs)));                

                this.linkedRows.clear();
                if (result.linkedProducts) {
                    result.linkedProducts.forEach(r => {
                        this.linkedRows.set(r.product, r);                
                    });

                    this.selectedProducts = [...result.linkedProducts];
                }
            }catch(ex) {
                console.log('[loadProducts] exception', ex);
            }finally {
                this.isWorking = false;
            }
        })
        .catch(error => {
            this.isWorking = false;
            this.error = error;
            this.products = [];
            this.linkedRows.clear();
            this.selectedProducts = [];
        })
    }

    handleProductSelected(event) {
        console.log('[productQuilt.handleProductSelected] event.detail', JSON.parse(JSON.stringify(event.detail)));
        if (this.linkedRows.has(event.detail.id)) {
            const row = this.linkedRows.get(event.detail.id);
            if (row.id != null && row.id != '') {
                this.rowsToDelete.push(row.id);                    
            }

            this.linkedRows.delete(event.detail.id);
        } else {
            const row = { id: null, 
                          product: event.detail.id, 
                          productName: event.detail.name, 
                          qty: event.detail.field1Value || 0, 
                          price: event.detail.field2Value || 0
                        };
            this.linkedRows.set(event.detail.id, row);
        }
        this.selectedProducts = [...this.linkedRows.values()];
        console.log('[productQuilt.handleProductSelected] selectedProducts', this.selectedProducts);
    }
    handleProductValueUpdated(event) {
        if (this.quantityFieldName == event.detail.fieldName) {
            if (this.linkedRows.has(event.detail.id)) {
                const row = this.linkedRows.get(event.detail.id);
                row.qty = event.detail.fieldValue;
                this.linkedRows.set(event.detail.id, row);
            }
        } else if (this.priceFieldName == event.detail.fieldName) {
            if (this.linkedRows.has(event.detail.id)) {
                const row = this.linkedRows.get(event.detail.id);
                row.price = event.detail.fieldValue;
                this.linkedRows.set(event.detail.id, row);
            }
        }
    }
    handleProductQtyUpdated(event) {
        if (this.linkedRows.has(event.detail.productId)) {
            const row = this.linkedRows.get(event.detail.productId);
            row.qty = event.detail.qty;
            this.linkedRows.set(event.detail.productId, row);
        }
    }
    handleProductPriceUpdated(event) {
        if (this.linkedRows.has(event.detail.productId)) {
            const row = this.linkedRows.get(event.detail.productId);
            row.price = event.detail.price;
            this.linkedRows.set(event.detail.productId, row);
        }
    }
    
    removeSelectedProducts() {
        const self = this;
        try {
            this.selectedProductRows.forEach(row => {
                console.log('[productQuilt.removeSelectedProducts] row', row);
                self.template.querySelector('c-selectable-tile.'+row.Product__c).selectTile(false);
                const linkedRow = self.linkedRows.get(row.Product__c);
                if (linkedRow.Id != null && linkedRow.Id != '') {
                    this.rowsToDelete.push(linkedRow.Id);
                }
                self.linkedRows.delete(row.Product__c);
            });

            this.selectedProducts = [...this.linkedRows.values()];
            this.selectedProductRows = undefined;
        }catch(ex) {
            console.log('[productQuilt.removeSelectedProducts] exception', ex);
        }
    }
    clearSelectedProducts() {
        this.selectedProductRows = [...this.selectedProducts];
        this.removeSelectedProducts();
    }

    linkSelectedProducts() {
        console.log('[linkProducts] linkedRows', JSON.parse(JSON.stringify(this.linkedRows)));
        linkProducts({ recordId: this.recordId, 
                linkToObject: this.linkToObject, 
                linkToObjectFieldName: this.linkToObjectFieldName, 
                linkToObjectProductFieldName: this.linkToObjectProductFieldName,
                linkToObjectQtyFieldName: this.linkToObjectQtyFieldName,
                linkToObjectPriceFieldName: this.linkToObjectPriceFieldName,
                selectedProducts: this.selectedProducts,
        }).then(result => {
            console.log('[linkProducts] result', JSON.parse(JSON.stringify(result)));
            const rows = new Map();
            result.forEach(r => {
                rows.set(this.linkToObjectProductFieldName, r);
            });

            this.linkedRows = {...rows};
            const evt = new ShowToastEvent({
                title: LABEL_SUCCESS,
                message: 'Selected products linked to the activity',
                variant: 'success'
            });
            this.dispatchEvent(evt);

        }).catch(error => {
            console.log('[ProductQuilt.linkSelectedProducts] exception]',JSON.parse(JSON.stringify(error)));
            const evt = new ShowToastEvent({
                title: LABEL_ERROR,
                message: error.message,
                variant: 'error'
            });
            this.dispatchEvent(evt);

        });
    }
    
    showFilters() {
        this.showingFilters = true;
    }
    hideFilters() {
        this.showingFilters = false;
    }

    applyFilters(event) {
        const filters = event.detail.filters;
        console.log('[ProductQuilt.applyFilters] filters',JSON.parse(JSON.stringify(filters)));

        let data = this.allProducts;
        try {
            filters.forEach(f => {
                switch (f.filterName) {
                    case 'name':
                        data = data.filter(p => p.name.indexOf(f.value) > -1);
                        break;

                    case 'brand':
                        data = data.filter(p => f.value.indexOf(p.Brand__c) > -1);
                        console.log('[ProductQuilt.applyFilters] brand data',JSON.parse(JSON.stringify(data)));
                        break;

                    case 'unitsize':
                        data = data.filter(p => f.value.indexOf(p.Unit_Size__c.toString()) > -1);
                        break;

                    case 'show_selected':
                        if (f.value == "yes") {
                            data = data.filter(p => this.selectedProducts != undefined && this.selectedProducts.indexOf(p.Id) > -1);
                        } else if (f.value == 'no') {
                            data = data.filter(p => this.selectedProducts == undefined || this.selectedProducts.indexof(p.Id) < 0);
                        }
                        break;
                }
            });

            this.products = [...data];
            console.log('[ProductQuilt.applyFilters] products',JSON.parse(JSON.stringify(this.products)));
        }catch(ex) {
            console.log('[ProductQuilt.applyFilters] exception', ex);
        }
    }
}