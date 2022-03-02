import { LightningElement, api } from 'lwc';

import LABEL_APPLY from '@salesforce/label/c.Apply';
import LABEL_CANCEL from '@salesforce/label/c.Cancel';
import LABEL_CLEAR from '@salesforce/label/c.Clear';

export default class BfFilterList extends LightningElement {
    labels = {
        apply: { label: LABEL_APPLY },
        cancel: { label: LABEL_CANCEL },
        clear: { label: LABEL_CLEAR }
    };

    @api 
    title;

    @api 
    filterConfigs;

    @api 
    refreshOnSelection;

    _filters = [];
    @api 
    get filters() {
        return this._filters;
    }
    set filters(value) {
        this._filters = value;
    }

    filterCount = 0;
    addFilter(event) {
        const key = this.filterCount;
        this.filterCount++;
        try {
            this.filters = [
                ...this._filters,
                {
                    key: key,
                    label: '',
                    name: '',
                    value: '',
                    type: 'text'                            
                }
            ];

            console.log('[bfFilterList.addFilter] filterConfigs', JSON.parse(JSON.stringify(this.filterConfigs)));
            console.log('[bfFilterList.addFilter] filters', this._filters);
        }catch(ex) {
            console.log('[bfFilterList.addFilter] exception', ex);
        }
    }

    clearFilters() {
        console.log('[bfFilterList.clearFilters]');
        const els = Array.from(this.template.querySelectorAll('c-bf-filter'));
        console.log('[bfFilterList.clearFilters] els',els);
        Array.from(
            this.template.querySelectorAll("c-bf-filter")
        ).forEach(filter => {
            console.log('[bfFilterList.clearFilters]',JSON.parse(JSON.stringify(filter)));
            filter.clear();
        });
    }
    removeFilterFromList(event) {
        try {
            console.log('[bfFilterList.removeFilterFromList] event.detail',JSON.parse(JSON.stringify(event.detail)));
            console.log('[bfFilterList.removeFilterFromList] filters',JSON.parse(JSON.stringify(this.filters)));
            const index = event.detail.key;
            console.log('[bfFilterList.removeFilterFromList] index', index);
            if (index != undefined && index >= 0) {
                this.filters = [...this.filters.filter(f => f.key != index)];
            }
            console.log('[bfFilterList.removeFilterFromList] filters',JSON.parse(JSON.stringify(this.filters)));
        }catch(ex) {
            console.log('[bfFilter.removeFilterFromList] exception', ex);
        }
    }

    cancelChanges() {
        this.clearFilters();
        this.dispatchEvent('bffilter_cancel');
    }

    applyFilters() {
        const values = [];
        try {
            Array.from(
                this.template.querySelectorAll("c-bf-filter")
            ).forEach(filter => {
                values.push(filter.getSelectedValue());
            });
            console.log('[bfFilterList.applyFilters] values',JSON.parse(JSON.stringify(values)));
            this.dispatchEvent(new CustomEvent('filter', { 
                detail: { filters: values }
            }));
        }catch(ex) {
            console.log('[bfFilterList.applyFilters] exception', ex);
        }
    }

    handleFilterValueUpdated(event) {
        console.log('[bfFilterList.handleFilterValueUpdated] detail',JSON.parse(JSON.stringify(event.detail)));
    }
}