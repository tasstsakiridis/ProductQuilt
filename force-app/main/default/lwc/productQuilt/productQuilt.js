import { LightningElement, api, track, wire } from 'lwc';
import { CurrentPageReference, NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { registerListener, unregisterAllListeners } from 'c/pubsub';

import CURRENCY from '@salesforce/i18n/currency';

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
import LABEL_PRODUCT_NAME from '@salesforce/label/c.Product_Name';
import LABEL_PRODUCT_NAME_FILTER from '@salesforce/label/c.Product_Name_Filter';
import LABEL_PRODUCT_TYPE from '@salesforce/label/c.Product_Type';
import LABEL_REMOVE from '@salesforce/label/c.Remove';
import LABEL_SAVE from '@salesforce/label/c.Save';
import LABEL_SUCCESS from '@salesforce/label/c.Success';
import LABEL_SPIRIT_TYPE from '@salesforce/label/c.Spirit_Type';
import LABEL_TOTAL from '@salesforce/label/c.Total';
import LABEL_UNIT_SIZE from '@salesforce/label/c.Unit_Size';

const SELECTED_PRODUCT_COLUMNS = [
    { label: LABEL_PRODUCT, fieldName: 'productName', type: 'text', wrapText: true }
];

const DISPLAY_TYPES = {
    'BOOLEAN'  : { fieldType: 'boolean' },
    'CURRENCY' : { fieldType: 'currency' },
    'DATE'     : { fieldType: 'date-local' },
    'DATETIME' : { fieldType: 'date-local' },
    'DOUBLE'   : { fieldType: 'number' },
    'EMAIL'    : { fieldType: 'email' },
    'INTEGER'  : { fieldType: 'number' },
    'LONG'     : { fieldType: 'number' },
    'PERCENT'  : { fieldType: 'percent' },
    'PHONE'    : { fieldType: 'phone' },
    'URL'      : { fieldType: 'url'}
};

export default class ProductQuilt extends LightningElement {
    labels = {
        addProduct:     { label: `${LABEL_ADD} ${LABEL_PRODUCT}` },
        clearList:      { label: LABEL_CLEAR_LIST },
        filters:        { label: LABEL_FILTERS },
        linkProducts:   { label: `${LABEL_LINK} ${LABEL_PRODUCTS}` },
        product:        { label: LABEL_PRODUCT, labelPlural: LABEL_PRODUCTS },
        productName:    { label: LABEL_PRODUCT_NAME, filterLabel: LABEL_PRODUCT_NAME_FILTER },
        productType:    { label: LABEL_PRODUCT_TYPE },
        removeProducts: { label: `${LABEL_REMOVE} ${LABEL_PRODUCTS}` },
        save:           { label: LABEL_SAVE },
        spiritType:     { label: LABEL_SPIRIT_TYPE },
        totals:         { label: LABEL_TOTAL },
        unitSize:       { label: LABEL_UNIT_SIZE }
    };

    @api 
    recordId;

    _type = 'Quilt';
    @api 
    get type() {
        return this._type;
    }
    set type(value) {
        this._type = value;
    }

    _linkToObject = '';
    @api 
    get linkToObject() {
        return this._linkToObject;
    }
    set linkToObject(value) {
        this._linkToObject = value;
    }

    _linkToObjectRecordType = '';
    @api 
    get linkToObjectRecordType() {
        return this._linkToObjectRecordType;
    }
    set linkToObjectRecordType(value) {
        this._linkToObjectRecordType = value;
    }

    _linkToObjectFieldName = '';
    @api 
    get linkToObjectFieldName() {
        return this._linkToObjectFieldName;
    }
    set linkToObjectFieldName(value) {
        this._linkToObjectFieldName = value;
    }

    _linkToObjectProductFieldName = '';
    @api 
    get linkToObjectProductFieldName() {
        return this._linkToObjectProductFieldName;
    }
    set linkToObjectProductFieldName(value) {
        this._linkToObjectProductFieldName = value;
    }

    _productUsedFor = '';
    @api 
    get productUsedFor() {
        return this._productUsedFor;
    }
    set productUsedFor(value) {
        this._productUsedFor = value;
    }

    _inputField1Name = '';
    @api 
    get inputField1Name() {
        return this._inputField1Name;
    }
    set inputField1Name(value) {
        this._inputField1Name = value;
    }

    _inputField1Label = '';
    @api 
    get inputField1Label() {
        return this._inputField1Label;
    }
    set inputField1Label(value) {
        this._inputField1Label = value;
    }

    _inputField2Name = '';
    @api 
    get inputField2Name() {
        return this._inputField2Name;
    }
    set inputField2Name(value) {
        this._inputField2Name = value;
    }

    _inputField2Label = '';
    @api 
    get inputField2Label() {
        return this._inputField2Label;
    }
    set inputField2Label(value) {
        this._inputField2Label = value;
    }

    _includeDryGoods = false;
    @api 
    get includeDryGoods() {
        return this._includeDryGoods;
    }
    set includeDryGoods(value) {
        this._includeDryGoods = value;
    }

    _showFilters = false;
    @api
    get showFilters() {
        return this._showFilters;
    }
    set showFilters(value) {
        this._showFilters = value;
    }

    _showTotals = false;
    @api
    get showTotals() {
        return this._showTotals;
    }
    set showTotals(value) {
        this._showTotals = value;
    }

    _defaultPriceFromProduct = false;
    @api 
    get defaultPriceFromProduct() {
        return this._defaultPriceFromProduct;
    }
    set defaultPriceFromProduct(value) {
        this._defaultPriceFromProduct = value;
    }

    _usePrice = false;
    @api
    get usePrice() {
        return this._usePrice;
    }
    set usePrice(value) {
        this._usePrice = value;
    }

    get isQuilt() {
        return this.type == 'Quilt';
    }
    get isList() {
        return this.type == 'List';
    }

    get isDoneLoading() {
        return this.products != undefined && this.isDoneLoadingWire != false;
    }
    
    pageRef;
    @wire(CurrentPageReference)
    setCurrentPageReference(currentPageReference) {
        this.pageRef = currentPageReference;
        this.currentPageReference = currentPageReference;
    }

    selectedProductsColumns = SELECTED_PRODUCT_COLUMNS;

    userCurrencyCode = CURRENCY;    

    isWorking = true;
    products = [];
    allProducts = [];
    rowsToDelete = [];
    selectedProducts;
    selectedProductRows;

    productTypeOptions;
    selectedProductTypes = [];
    spiritTypeOptions;
    selectedSpiritTypes = [];
    productNameFilter;

    unitSizeOptions = [];
    selectedUnitSizes = [];
    linkedRows = new Map();
    brands;
    brandsSelected = '';
    productsLoaded = false;
    showWetGoods = true;
    showDryGoods = this.includeDryGoods;    

    inputField1Type;
    inputField2Type;

    linkToObjectRecordTypeId;

    totalPrice = 0;

    isDoneLoadingWire = false;

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
        console.log('user currency code: ', this.userCurrencyCode);
        registerListener('brandsSelected', this.handleBrandsSelected, this);

        if (this.productsLoaded) {
            return;
        }

        this.productsLoaded = true;
        this.loadProducts();
        // this.getInputDataTypes();
    }

    renderedCallback() {
        console.log('[renderedCallback] linkedRows', this.linkedRows);
        this.linkedRows.forEach((value, key, map) => {
            Array.from(
                this.template.querySelectorAll("c-selectable-tile."+key)
            ).forEach(tile => {
                console.log('[loadProducts] tile', tile);
                if (this.inputField1Name && value.qty != undefined) {
                    tile.updateField(this.inputField1Name, value.qty);
                }
                if (this.inputField2Name && value.price != undefined) {
                    tile.updateField(this.inputField2Name, value.price);
                }
                tile.select();
            });    
        });
    }

    loadProducts() {
        this.isWorking = true;
        getProducts({ recordId: this.recordId, 
                         linkToObject: this.linkToObject, 
                         linkToObjectRecordType: this.linkToObjectRecordType,
                         linkToObjectFieldName: this.linkToObjectFieldName, 
                         linkToObjectProductFieldName: this.linkToObjectProductFieldName,
                         linkToObjectField1Name: this.inputField1Name,
                         linkToObjectField2Name: this.inputField2Name,
                         usedFor: this.productUsedFor,
                         includeDryGoods: this.includeDryGoods })
        .then(result => {
            console.log('[loadProducts] result', result);
            console.log('[loadProducts] includeDrygoods', this.includeDryGoods);
            this.error = undefined;            
            this.allProducts = [...result.products];
            this.selectedProductTypes = [];
            this.selectedUnitSizes = [];
            this.selectedSpiritTypes = [];
            this.channel = result.channel || '';
            const brands = new Map();
            const unitSizes = new Map();
            const productTypes = new Map();
            const spiritTypes = new Map();
            const productList = [];
            try {
                let columns = [...SELECTED_PRODUCT_COLUMNS];
        
                this.linkToObjectRecordTypeId = result.linkToObjectRecordTypeId == undefined ? '' : result.linkToObjectRecordTypeId;
                if (this.inputField1Name != undefined) {
                    this.inputField1Type = result.inputField1Type == undefined ? 'TEXT' : result.inputField1Type;
                    this.inputField1Label = result.inputField1Label == undefined ? this.inputField1Label : result.inputField1Label;
                    columns.push({
                        label: this.inputField1Label,
                        fieldName: this.inputField1Name,
                        type: DISPLAY_TYPES[result.inputField1Type] == undefined ? 'text' : DISPLAY_TYPES[result.inputField1Type].fieldType,
                        editable: false,
                        initialWidth: 125
                    });
                }
                if (this.inputField2Name != undefined) {
                    this.inputField2Type = result.inputField2Type == undefined ? 'TEXT' : result.inputField2Type;
                    this.inputField2Label = result.inputField2Label == undefined ? this.inputField2Label : result.inputField2Label;    
                    columns.push({
                        label: this.inputField2Label,
                        fieldName: this.inputField2Name,
                        type: DISPLAY_TYPES[result.inputField2Type] == undefined ? 'text' : DISPLAY_TYPES[result.inputField2Type].fieldType,
                        editable: false,
                        initialWidth: 125
                    });
                }

                columns.forEach(p => {
                    console.log(`[loadProducts.selectedProductColumns] label:${p.label}, name:${p.fieldName}, type:${p.type}`);
                });
                this.selectedProductsColumns = [...columns];

                console.log('[loadProducts] allProducts', this.allProducts.length, this.allProducts);
                if (this.allProducts) {
                    this.allProducts.forEach(p => {
                        const prod = {...p};
                        if (this.channel.toLowerCase().startsWith('on')) {
                            prod.price = p.Price__c || 0;
                        } else if (this.channel.toLowerCase().startsWith('off')) {
                            prod.price = p.Wholesale_Price__c || 0;
                        }

                        if (p.Brand__c != undefined && !brands.has(p.Brand__c)) {
                            brands.set(p.Brand__c, { label: p.Brand__r.Name, value: p.Brand__c});
                        }
                        if (p.Unit_Size__c != undefined && !unitSizes.has(p.Unit_Size__c)) {
                            unitSizes.set(p.Unit_Size__c, { label: p.Unit_Size__c.toString(), value: p.Unit_Size__c.toString()});
                        }
                        if (!productTypes.has(p.RecordTypeId)) {
                            productTypes.set(p.RecordTypeId, { label: p.RecordType.Name, value: p.RecordTypeId });
                            this.selectedProductTypes.push(p.RecordTypeId);
                        }
                        if (p.Brand__r != undefined && p.Brand__r.Spirit_Type__c != undefined && !spiritTypes.has(p.Brand__r.Spirit_Type__c)) {
                            spiritTypes.set(p.Brand__r.Spirit_Type__c, { label: p.Brand__r.Spirit_Type__c, value: p.Brand__r.Spirit_Type__c });
                        }
                    
                        console.log('[loadProducts] prod', prod);
                        productList.push(prod);
                    });    
                }

                console.log('[loadProducts] productList', productList.length, productList);
                //this.allProducts = [...productList];
                this.products = [...productList];
                console.log('[loadProducts] products', this.products.length, this.products);
                this.brands = [...brands.values()].sort((a,b) => {
                    if (a.label < b.label) { return -1; }
                    if (a.label > b.label) { return 1; }
                    return 0;
                });
                this.unitSizeOptions = [...unitSizes.values()].sort((a,b) => {
                    if (a.label < b.label) { return -1; }
                    if (a.label > b.label) { return 1; }
                    return 0;
                });
                console.log('[loadProducts] unitSizes', this.unitSizeOptions);
                this.productTypeOptions = [...productTypes.values()].sort((a,b) => {
                    if (a.label < b.label) { return -1; }
                    if (a.label > b.label) { return 1; }
                    return 0;                    
                });      
                console.log('[loadProducts] productTypeOptions', this.productTypeOptions);          
                this.spiritTypeOptions = [...spiritTypes.values()].sort((a,b) => {
                    if (a.label < b.label) { return -1; }
                    if (a.label > b.label) { return 1; }
                    return 0;                                        
                });
                console.log('[loadProducts] spiritTypeOptions', this.spiritTypeOptions);

                let fcBrand = this.filterConfigs.find(fc => fc.name == 'brand');
                fcBrand.options = this.brands;

                let fcUnitSizes = this.filterConfigs.find(fc => fc.name == 'unitsize');
                fcUnitSizes.options = this.unitSizes;
                console.log('[loadProducts] filterConfigs', JSON.parse(JSON.stringify(this.filterConfigs)));                

                this.linkedRows.clear();
                if (result.linkedProducts) {
                    result.linkedProducts.forEach(r => {
                        this.linkedRows.set(r.product, r);  
                    });

                    this.selectedProducts = [...result.linkedProducts];
    
                    this.updateTotalPrice();
                }

            }catch(ex) {
                console.log('[loadProducts] exception', ex.toString());
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
    filterProducts() {
        console.log('[filterProducts] brandsSelected', this.brandsSelected);
        console.log('[filterProducts] productTypesSelected', this.selectedProductTypes);
        console.log('[filterProducts] selectedUnitSizes', this.selectedUnitSizes);
        console.log('[filterProducts] selectedSpiritTypes', this.selectedSpiritTypes);
        console.log('[filterProducts] productName', this.productNameFilter);

        let newList = [...this.allProducts];
        if (this.brandsSelected.length > 0) {
            newList = newList.filter(p => this.brandsSelected.includes(p.Brand__c));
            console.log('[filterProducts.brands] newList', newList);
        }
        if (this.selectedProductTypes.length > 0) {
            newList = newList.filter(p => this.selectedProductTypes.includes(p.RecordTypeId));
            console.log('[filterProducts.productType] newList', newList);
        }
        if (this.selectedUnitSizes.length > 0) {
            newList = newList.filter(p => this.selectedUnitSizes.includes(p.Unit_Size__c.toString()));
            console.log('[filterProducts.unitSize] newList', newList);
        }
        if (this.selectedSpiritTypes.length > 0) {
            newList = newList.filter(p => p.Brand__r != undefined && this.selectedSpiritTypes.includes(p.Brand__r.Spirit_Type__c));
            console.log('[filterProducts.spiritType] newList', newList);
        }
        if (this.productNameFilter != undefined && this.productNameFilter.length > 0) {
            newList = newList.filter(p => p.Name.indexOf(this.productNameFilter) > -1 || (p.ProductCode__c != undefined && p.ProductCode__c.indexOf(this.productNameFilter) > -1));
            console.log('[filterProducts.productName] newList', newList);
        }

        this.products = [...newList];
    }

    handleBrandsSelected(brandsSelected) {
        console.log('[productQuilt.handleBrandsSelected] brands', brandsSelected);
        console.log('[productQuilt.handleBrandsSelected] allProducts', this.allProducts);
        try {
            this.brandsSelected = [...brandsSelected];
            if (brandsSelected.length == 0) {
                this.brandsSelected = '';
            }
            this.filterProducts();
            console.log('[productQuilt.handleBrandsSelected] products', this.products);
        }catch(ex) {
            console.log('[productQuilt.handleBrandsSelected] exception', ex);
        }
        
    }    
    handleProductTypeChange(e) {
        this.selectedProductTypes = e.detail.value;
        this.filterProducts();
    }
    handleUnitSizeChange(e) {
        this.selectedUnitSizes = e.detail.value;
        this.filterProducts();
    }
    handleSpiritTypeChange(e) {
        this.selectedSpiritTypes = e.detail.value;
        this.filterProducts();
    }
    handleProductNameFilterChange(e) {
        try {
            this.productNameFilter = e.detail.value;
            this.filterProducts();
        }catch(ex) {
            console.log('[handleProductNameFilterChange] exception', ex);
        }
    }

    handleProductSelected(event) {
        console.log('[productQuilt.handleProductSelected] id, name, field1Name, field1Value, field2Name, field2Value', event.detail.id, event.detail.name, event.detail.field1Name, event.detail.field1Value, event.detail.field2Name, event.detail.field2Value);
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
                          productName: event.detail.name 
                        };
            if (this.inputField1Name) {
                row[event.detail.field1Name] = event.detail.field1Value;
            }
            if (this.inputField2Name) {
                row[event.detail.field2Name] = event.detail.field2Value;
            }
            
            for(const [k, v] of Object.entries(row)) {
                console.log(`[productQuilt.handleProductSelected] ${k} : ${v}`);
            }

            this.linkedRows.set(event.detail.id, row);
        }

        this.updateTotalPrice();

        this.selectedProducts = [...this.linkedRows.values()];
        console.log('[productQuilt.handleProductSelected] selectedProducts', this.selectedProducts);
    }
    handleProductInputUpdate(event) {
        console.log('[productQuilt.handleProductInputUpdate] event', JSON.parse(JSON.stringify(event.detail)));
        console.log('[productQuilt.handleProductInputUpdate] linkedRows', this.linkedRows);
        console.log('[productQuilt.handleProductInputUpdate] quantityFieldName', this.quantityFieldName);
        console.log('[productQuilt.handleProductInputUpdate] priceFieldName', this.priceFieldName);
        try {
            if (this.linkedRows.has(event.detail.id)) {
                const row = {...this.linkedRows.get(event.detail.id)};
                row[this.inputField1Name] = event.detail.fieldValue == undefined || event.detail.fieldValue == '' ? 0 : event.detail.fieldValue;
                this.linkedRows.set(event.detail.id, row);

            }

            if (this.showTotals) {
                this.updateTotalPrice();
            }

            console.log('[productQuilt.handleProductInputUpdate] updated linkedRows', this.linkedRows);
            this.selectedProducts = [...this.linkedRows.values()];
        }catch(ex) {
            console.log('[productQuilt.handleProductInputUpdate] exception', ex);
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
                    this.totalPrice -= (row.qty * row.price);
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
    
    updateTotalPrice() {
        let total = 0;
        this.linkedRows.forEach(r => total += r.qty * r.price);
        this.totalPrice = total;
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