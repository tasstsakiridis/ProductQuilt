import { LightningElement, api, track, wire } from 'lwc';
import { CurrentPageReference, NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { registerListener, unregisterAllListeners } from 'c/pubsub';

import getProducts from '@salesforce/apex/ProductQuilt_Controller.getProducts';
import linkProducts from '@salesforce/apex/ProductQuilt_Controller.linkProducts';
import deleteLinkedProducts from '@salesforce/apex/ProductQuilt_Controller.deleteLinkedProducts';

import LABEL_ADD from '@salesforce/label/c.Add';
import LABEL_CLEAR_LIST from '@salesforce/label/c.ClearList';
import LABEL_ERROR from '@salesforce/label/c.Error';
import LABEL_FILTERS from '@salesforce/label/c.Filters';
import LABEL_LINK from '@salesforce/label/c.Link';
import LABEL_PRODUCT from '@salesforce/label/c.Product';
import LABEL_PRODUCTS from '@salesforce/label/c.Products';
import LABEL_REMOVE from '@salesforce/label/c.Remove';
import LABEL_SAVE from '@salesforce/label/c.Save';
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
        removeProducts: { label: `${LABEL_REMOVE} ${LABEL_PRODUCTS}` },
        save:           { label: LABEL_SAVE }
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

    @api 
    showFilters;

    get isQuilt() {
        return this.type == 'Quilt';
    }
    get isList() {
        return this.type == 'List';
    }
    
    pageRef;
    @wire(CurrentPageReference)
    setCurrentPageReference(currentPageReference) {
        this.pageRef = currentPageReference;
        this.currentPageReference = currentPageReference;
    }

    selectedProductsColumns = selectedProductsColumns;

    isWorking = false;
    products = [];
    allProducts = [];
    rowsToDelete = [];
    selectedProducts;
    selectedProductRows;
    linkedRows = new Map();
    brands;
    brandsSelected = '';
    unitSizes;
    productsLoaded = false;

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
    
    /** 
     * Constructor
     */

    disconnectedCallback() {
        unregisterAllListeners(this);
    }

    connectedCallback() {
        registerListener('brandsSelected', this.handleBrandsSelected, this);

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
                if (this.quantityFieldName && value.qty != undefined) {
                    tile.updateField(this.quantityFieldName, value.qty);
                }
                if (this.priceFieldName && value.price != undefined) {
                    tile.updateField(this.priceFieldName, value.price);
                }
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

    toggleFilterView() {
        this.showFilters = !this.showFilters;
    }
    handleBrandsSelected(brandsSelected) {
        console.log('[productQuilt.handleBrandsSelected] brands', brandsSelected);
        console.log('[productQuilt.handleBrandsSelected] wiredProducts', this.allProducts);
        try {
            if (brandsSelected.length == 0) {
                this.brandsSelected = '';
                this.products = [...this.allProducts];
            } else {
                this.brandsSelected = brandsSelected.join(',');
                this.products = this.allProducts.filter(p => brandsSelected.indexOf(p.Brand__c) > -1);
            }
            console.log('[productQuilt.handleBrandsSelected] selectedproducts', this.products);
        }catch(ex) {
            console.log('[productQuilt.handleBrandsSelected] exception', ex);
        }
        
    }

    handleProductSelected(event) {
        console.log('[productQuilt.handleProductSelected] event.detail', JSON.parse(JSON.stringify(event.detail)));
        if (this.linkedRows.has(event.detail.id)) {
            this.isWorking = true;
            const row = this.linkedRows.get(event.detail.id);
            if (row.id != null && row.id != '') {
                this.rowsToDelete.push(row.id);                    
            }

            this.linkedRows.delete(event.detail.id);
            this.deleteProducts();
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
    handleProductInputUpdate(event) {
        console.log('[productQuilt.handleProductInputUpdate] event', JSON.parse(JSON.stringify(event.detail)));
        console.log('[productQuilt.handleProductInputUpdate] linkedRows', this.linkedRows);
        console.log('[productQuilt.handleProductInputUpdate] quantityFieldName', this.quantityFieldName);
        console.log('[productQuilt.handleProductInputUpdate] priceFieldName', this.priceFieldName);
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
        console.log('[productQuilt.handleProductInputUpdate] updated linkedRows', this.linkedRows);
        this.selectedProducts = [...this.linkedRows.values()];
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
            const datatable = this.template.querySelector('lightning-datatable');
            if (datatable) {
                const selectedRows = datatable.getSelectedRows();
                selectedRows.forEach(row => {
                    console.log('[productQuilt.removeSelectedProducts] row', row);
                    Array.from(
                        this.template.querySelectorAll("c-selectable-tile."+row.product)
                    ).forEach(tile => {
                        console.log('[loadProducts] tile', tile);
                        tile.deselect();
                    });    
        
                    const linkedRow = self.linkedRows.get(row.product);
                    if (this.linkedRows != null && linkedRow.id != null && linkedRow.id != '') {
                        this.rowsToDelete.push(linkedRow.id);
                    }
                    self.linkedRows.delete(row.product);
                });
                }
    

            this.selectedProducts = [...this.linkedRows.values()];
            if (this.rowsToDelete && this.rowsToDelete.length > 0) {
                this.deleteProducts();
            }
        }catch(ex) {
            console.log('[productQuilt.removeSelectedProducts] exception', ex);
        }
    }
    clearSelectedProducts() {
        this.selectedProductRows = [...this.selectedProducts];
        this.removeSelectedProducts();
    }
    deleteProducts() {
        deleteLinkedProducts({
            linkToObject: this.linkToObject,
            productsToDelete: this.rowsToDelete
        }).then(result => {
            this.rowsToDelete = [];
            this.isWorking = false;
            const evt = new ShowToastEvent({
                title: LABEL_SUCCESS,
                message: result.message,
                variant: 'success'
            });
            this.dispatchEvent(evt);

        }).catch(error => {
            console.log('[productQuilt.removeSelectedProducts] error', error);
            this.isWorking = false;
        });    
    }
    linkSelectedProducts() {
        console.log('[linkProducts] linkedRows', JSON.parse(JSON.stringify(this.linkedRows)));
        console.log('[linkProducts] selectedProducts', this.selectedProducts);
        this.isWorking = true;
        linkProducts({ recordId: this.recordId, 
                linkToObject: this.linkToObject, 
                linkToObjectFieldName: this.linkToObjectFieldName, 
                linkToObjectProductFieldName: this.linkToObjectProductFieldName,
                linkToObjectQtyFieldName: this.quantityFieldName,
                linkToObjectPriceFieldName: this.priceFieldName,
                selectedProducts: this.selectedProducts,
        }).then(result => {
            console.log('[linkProducts] result', JSON.parse(JSON.stringify(result)));
            result.rows.forEach(r => {
                let lr = {...this.linkedRows.get(r[this.linkToObjectProductFieldName])};
                lr.id = r.Id;                
                this.linkedRows.set(r[this.linkToObjectProductFieldName], lr);
            });
            this.isWorking = false;
            const evt = new ShowToastEvent({
                title: LABEL_SUCCESS,
                message: 'Updates saved successfully',
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
            this.isWorking = false;

        });
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