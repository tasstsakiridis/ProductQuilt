import { LightningElement, api, wire } from 'lwc';

import getProducts from '@salesforce/apex/ProductQuilt_Controller.getProducts';

import LABEL_ADD from '@salesforce/label/c.Add';
import LABEL_CLEAR_LIST from '@salesforce/label/c.ClearList';
import LABEL_LINK_PRODUCTS from '@salesforce/label/c.LinkProducts';
import LABEL_PRODUCT from '@salesforce/label/c.Product';
import LABEL_PRODUCTS from '@salesforce/label/c.Products';
import LABEL_REMOVE_PRODUCTS from '@salesforce/label/c.RemoveProducts';

const selectedProductsColumns = [
    { label: 'Product', fieldName: 'Product_Name__c' }
];

export default class ProductQuilt extends LightningElement {
    labels = {
        addProduct:     { label: `${LABEL_ADD} ${LABEL_PRODUCT}` },
        clearList:      { label: LABEL_CLEAR_LIST },
        linkProducts:   { label: LABEL_LINK_PRODUCTS },
        product:        { label: LABEL_PRODUCT, labelPlural: LABEL_PRODUCTS },
        removeProducts: { label: LABEL_REMOVE_PRODUCTS }
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

    get isQuilt() {
        return this.type == 'Quilt';
    }
    get isList() {
        return this.type == 'List';
    }
    
    selectedProductsColumns = selectedProductsColumns;

    isWorking = false;
    products = [];
    selectedProducts;
    selectedProductRows;
    linkedRows = new Map();
    brands;
    productsLoaded = false;

    connectedCallback() {
        if (this.productsLoaded) {
            return;
        }

        this.productsLoaded = true;
        this.loadProducts();
    }

    loadProducts() {
        this.isWorking = true;
        getProducts({ recordId: this.recordId, 
                         linkToObject: this.linkToObject, 
                         linkToObjectFieldName: this.linkToObjectFieldName, 
                         linkToObjectProductFieldName: this.linkToObjectProductFieldName,
                         usedFor: this.productUsedFor })
        .then(result => {
            console.log('[getProoducts] result', result);
            this.error = undefined;
            this.products = result.products;
            const brands = new Map();
            if (this.products) {
                this.products.forEach(p => {
                    if (!brands.has(p.Brand__c)) {
                        brands.set(p.Brand__c, { label: p.Brand__r.Name, value: p.Brand__c});
                    }
                });    
            }
            this.brands = [...brands.values()];

            this.linkedRows.clear();
            if (result.linkedRows) {
                result.linkedRows.forEach(r => {
                    this.linkedRows.set(r.Product__c, r);
                });

                this.selectedProducts = [...result.linkedRows];
            }
            this.isWorking = false;
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
        if (this.linkedRows.has(event.detail.productId)) {
            const row = this.linkedRows.get(event.detail.productId);
            if (row.Id != null && row.Id != '') {
                this.rowsToDelete.push(row.Id);                    
            }

            this.linkedRows.delete(event.detail.productId);
        } else {
            const row = { Id: null, Product__c: event.detail.productId, Product_Name__c: event.detail.productName};
            this.linkedRows.set(event.detail.productId, row);
        }
        this.selectedProducts = [...this.linkedRows.values()];
        console.log('[productQuilt.handleProductSelected] selectedProducts', this.selectedProducts);
    }
    
    handleSelectedProductRowSelection(event) {
        this.selectedProductRows = [...event.detail.selectedRows];   
        console.log('[productQuilt.handleSelectedProductRows] selectedProductRowos', this.selectedProductRows);     
    }
    removeSelectedProducts() {
        const self = this;
        try {
            this.selectedProductRows.forEach(row => {
                console.log('[productQuilt.removeSelectedProducts] row', row);
                self.template.querySelector('c-product-tile.'+row.Product__c).selectTile(false);
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

    linkProducts() {

    }
    
}