/**
* Test Class:  ProductQuilt_Controller_Test
*/
public with sharing class ProductQuilt_Controller {
    @AuraEnabled(cacheable=true)
    public static Map<String, Object> getProducts(String recordId, String linkToObject, String linkToObjectRecordType, String linkToObjectFieldName, String linkToObjectProductFieldName, String linkToObjectField1Name, String linkToObjectField2Name, String usedFor, Boolean includeDryGoods){
        Id theId = Id.valueOf(recordId);
        Schema.SObjectType typeOfObj = theId.getSobjectType();
        Schema.DescribeSObjectResult dsr = typeOfObj.getDescribe();
        Map<String, Schema.SObjectField> fields = dsr.fields.getMap();
        Boolean hasMarketField = fields.containsKey('Market__c');
        
        if (includeDryGoods == null) { includeDryGoods = false; }

        String marketName = 'Australia';
        String marketId;
        String query;
        String channel = '';
        Map<String, Object> result = new Map<String, Object>();

        System.debug('[getProducts] recordId: ' + recordId);
        System.debug('[getProducts] linkToObject: ' + linkToObject);
        System.debug('[getProducts] linkToObjectFieldName: ' + linkToObjectFieldName);
        System.debug('[getProducts] linkToObjectProductFieldName: ' + linkToObjectProductFieldName);
        System.debug('[getProducts] linkToObjectField1Name: ' + linkToObjectField1Name);
        System.debug('[getProducts] linkToObjectField2Name: ' + linkToObjectField2Name);
        System.debug('[getProducts] usedFor: ' + usedFor);
        System.debug('[getProducts] includeDryGoods: ' + includeDryGoods);
        System.debug('[getProducts] hasMarketField: ' + hasMarketField);
        System.debug('[getProducts] dsr.name: ' + dsr.name);

        try {
            List<Schema.DescribeSObjectResult> dResult = Schema.describeSObjects(new String[]{linkToObject});
            if (dResult != null && dResult.size() > 0) {
                Schema.DescribeSObjectResult linkToObjectDSR = dResult[0];
                Map<String, Schema.SObjectField> linkToObjectFields = linkToObjectDSR.fields.getMap();

                result.put('linkToObjectLabel', linkToObjectDSR.label);

                Map<String, Schema.RecordTypeInfo> rtInfos = linkToObjectDSR.getRecordTypeInfosByDeveloperName();
                if (!String.isEmpty(linkToObjectRecordType) && rtInfos.containsKey(linkToObjectRecordType)) {
                    result.put('linkToObjectRecordTypeId', rtInfos.get(linkToObjectRecordType).getRecordTypeId());
                }

                Schema.DescribeFieldResult dfr;
                if (!String.isEmpty(linkToObjectField1Name) && linkToObjectFields.containsKey(linkToObjectField1Name)) {
                    dfr = linkToObjectFields.get(linkToObjectField1Name).getDescribe();
                    result.put('inputField1Type', dfr.getType().toString());
                    result.put('inputField1Label', dfr.getLabel());
                }
                if (!String.isEmpty(linkToObjectField2Name) && linkToObjectFields.containsKey(linkToObjectField2Name)) {
                    dfr = linkToObjectFields.get(linkToObjectField2Name).getDescribe();
                    result.put('inputField2Type', dfr.getType().toString());
                    result.put('inputField2Label', dfr.getLabel());
                }
            }

            if (String.isEmpty(recordId) || hasMarketField == false) {
                User u = [SELECT Id, Market__c FROM User WHERE Id =:UserInfo.getUserId()];
                if (String.isNotEmpty(u.Market__c)) {
                    marketName = u.Market__c;
                }
                Market__c market = [SELECT Id FROM Market__c WHERE Name =:marketName LIMIT 1];
                marketId = market.Id;
            } else {
                query = 'SELECT Market__c, Market_Name__c, Channel__c FROM ' + dsr.name + ' WHERE Id=:recordId';
                List<SObject> theRecord = Database.query(query);
                marketId = String.valueOf(theRecord.get(0).get('Market__c'));
                marketName = String.valueOf(theRecord.get(0).get('Market_Name__c'));
                channel = String.valueOf(theRecord.get(0).get('Channel__c'));
            } 
            System.debug('[getProducts] marketId: ' + marketId + ', marketName: ' + marketName); 
            System.debug('[getProducts] channel: ' + channel);          

            Map<String, Schema.RecordTypeInfo> rtList = Product__c.SObjectType.getDescribe().getRecordTypeInfosByName();
            String rtWetGoods = rtList.get('Wet Goods').getRecordTypeId();
            System.debug('[getProducts] rtWetGoods: ' + rtWetGoods);

            query = 'SELECT Id, Name, Brand__c, Brand__r.Name, Brand__r.Spirit_Type__c, Image_Name__c, Unit_Size__c, Supplier__c, Classification__c,';
            query += ' Price__c, Wholesale_Price__c, RecordTypeId, RecordType.Name, ProductCode__c';
            query += ' FROM Product__c ';
            query += ' WHERE Market__c =:marketId';
            query += ' AND IsActive__c=true';
            if (!includeDryGoods) {
                query += ' AND RecordTypeId=:rtWetGoods';
            }
            if (String.isNotEmpty(usedFor)) {
                query += ' AND Used_For__c INCLUDES (:usedFor)';
            }
            if (String.isNotEmpty(channel)) {
                query += ' AND (Channel__c =:channel OR Channel__c=\'Both\')';
            }
            query += ' ORDER BY Sort_Order__c, Name';
            System.debug('product query: ' + query);
            List<Product__c> products = Database.query(query);

            if (String.isNotEmpty(recordId) && String.isNotEmpty(linkToObject) && String.isNotEmpty(linkToObjectFieldName)) {
                String relatedFieldName = linkToObjectFieldName.replace('__c', '__r.Name');
                query = 'SELECT Id, '+linkToObjectProductFieldName +', Product_Name__c';
                if (String.isNotEmpty(linkToObjectField1Name)) {
                    query += ','+linkToObjectField1Name;
                }
                if (String.isNotEmpty(linkToObjectField2Name)) {
                    query += ','+linkToObjectField2Name;
                }
                query += ' FROM ' + linkToObject;
                query += ' WHERE ' + linkToObjectFieldName + ' =:recordId';
                System.debug('query: ' + query);
                
                List<SObject> linkedRows = Database.query(query);
                List<Map<String, Object>> linkedProducts = new List<Map<String, Object>>();
                if (!linkedRows.isEmpty()) {
                    for(SObject o : linkedRows) {
                        Map<String, Object> m = new Map<String, Object>{
                            'id'=>o.get('Id'),
                            'product'=>o.get(linkToObjectProductFieldName),
                            'productName'=>o.get('Product_Name__c')
                        };
                        if (String.isNotEmpty(linkToObjectField1Name)) {
                            m.put('qty', o.get(linkToObjectField1Name));
                        }
                        if (String.isNotEmpty(linkToObjectField2Name)) {
                            m.put('price', o.get(linkToObjectField2Name));
                        }

                        linkedProducts.add(m);

                    }
                }
                result.put('linkedProducts', linkedProducts);
                
            }

            result.put('channel', channel);
            result.put('products', products);
            result.put('status', 'SUCCESS');
        }catch(Exception ex) {
            result.put('error', ex.getMessage());
            System.debug('[getProducts] exception: ' + ex.getMessage());
        }

        return result;
    }

    @AuraEnabled
    public static Map<String, Object> linkProducts(String recordId, String linkToObject, String linkToObjectFieldName, String linkToObjectProductFieldName, String linkToObjectQtyFieldName, String linkToObjectPriceFieldName, List<Map<String, Object>> selectedProducts){
        Map<String, Object> result = new Map<String, Object>();
        try {
            System.debug('recordId: ' + recordId);
            System.debug('linkToObject: ' + linkToObject);
            System.debug('linkToObjectFieldName: ' + linkToObjectFieldName);
            System.debug('linkToObjectProductFieldName: ' + linkToObjectProductFieldName);
            System.debug('linkToObjectQuantityFieldName: ' + linkToObjectQtyFieldName);
            System.debug('linkToObjectPriceFieldName: ' + linkToObjectPriceFieldName);
            System.debug('selectedProducts: ' + selectedProducts);
            if (!selectedProducts.isEmpty()) {
                List<SObject> rows = new List<SObject>();
                for(Map<String,Object> o : selectedProducts) {
                    System.debug('product row: ' + o);
                    String linkedRowId = String.valueOf(o.get('id'));
                    String productId = String.valueOf(o.get('product'));
                    SObject newRow = Schema.getGlobalDescribe().get(linkToObject).newSObject();
                    if (String.isEmpty(linkedRowId)) {
                        newRow.put(linkToObjectFieldName, recordId);
                    } else {
                        newRow.put('Id', linkedRowId);
                    }

                    newRow.put(linkToObjectProductFieldName, productId);

                    System.debug('qty: ' + o.get('qty'));
                    System.debug('price: ' + o.get('price'));
                    if (String.isNotEmpty(linkToObjectQtyFieldName)) {
                        newRow.put(linkToObjectQtyFieldName, Double.valueOf(o.get('qty')));
                    }
                    if (String.isNotEmpty(linkToObjectPriceFieldName)) {
                        newRow.put(linkToObjectPriceFieldName, Double.valueOf(o.get('price')));
                    }                        

                    rows.add(newRow);
                }

                if (rows.size() > 0) {
                    upsert rows;
                }

                result.put('status','SUCCESS');
                result.put('rows', rows);
            }
        } catch (Exception ex) {
            result.put('status', 'ERROR');
            result.put('message', ex.getMessage());
        }

        return result;
    }

    @AuraEnabled 
    public static Map<String, Object> deleteLinkedProducts(String linkToObject, List<String> productsToDelete) {
        Map<String, Object> result = new Map<String, Object>();

        try {
            if (productsToDelete == null || productsToDelete.size() == 0) {
                throw new BF_Exception('No products selected to remove from activity');
            }

            String soql = 'SELECT Id FROM ' + linkToObject + ' WHERE Id =:productsToDelete';
            List<SObject> rows = Database.query(soql);
            Integer numberOfRows = rows.size();
            System.debug('# of rows: ' + numberOfRows);

            if (rows != null && rows.size() > 0) {
                delete rows;
            }
            result.put('status', 'SUCCESS');
            result.put('message', String.valueOf(numberOfRows) + ' product(s) removed from the activity');
        }catch(Exception ex) {
            result.put('status', 'ERROR');
            result.put('message', ex.getMessage());
        }

        return result;
    }
}