public with sharing class ProductQuilt_Controller {
    @AuraEnabled(cacheable=true)
    public static Map<String, Object> getProducts(String recordId, String linkToObject, String linkToObjectFieldName, String linkToObjectProductFieldName, String usedFor, String linkToObjectQtyFieldName, String linkToObjectPriceFieldName){
        Id theId = Id.valueOf(recordId);
        Schema.SObjectType typeOfObj = theId.getSobjectType();
        Schema.DescribeSObjectResult dsr = typeOfObj.getDescribe();
        Map<String, Schema.SObjectField> fields = dsr.fields.getMap();
        Boolean hasMarketField = fields.containsKey('Market__c');

        String marketName = 'Australia';
        String marketId;
        String query;
        Map<String, Object> result = new Map<String, Object>();

        try {
            if (String.isEmpty(recordId) || hasMarketField == false) {
                User u = [SELECT Id, Market__c FROM User WHERE Id =:UserInfo.getUserId()];
                if (String.isNotEmpty(u.Market__c)) {
                    marketName = u.Market__c;
                }
                Market__c market = [SELECT Id FROM Market__c WHERE Name =:marketName LIMIT 1];
                marketId = market.Id;
            } else {
                query = 'SELECT Market__c FROM ' + dsr.name + ' WHERE Id=:recordId';
                List<SObject> theRecord = Database.query(query);
                marketId = String.valueOf(theRecord.get(0).get('Market__c'));
            }            

            Map<String, Schema.RecordTypeInfo> rtList = Product__c.SObjectType.getDescribe().getRecordTypeInfosByName();
            String rtId = rtList.get('Wet Goods').getRecordTypeId();

            query = 'SELECT Id, Name, Brand__c, Brand__r.Name, Image_Name__c, Unit_Size__c, Supplier__c, Classification__c';
            query += ' FROM Product__c ';
            query += ' WHERE Market__c =:marketId';
            query += ' AND IsActive__c=true';
            query += ' AND RecordTypeId=:rtId';
            if (String.isNotEmpty(usedFor)) {
                query += ' AND Used_For__c INCLUDES (:usedFor)';
            }
            query += ' ORDER BY Sort_Order__c, Name';
            System.debug('product query: ' + query);
            List<Product__c> products = Database.query(query);

            if (String.isNotEmpty(recordId) && String.isNotEmpty(linkToObject) && String.isNotEmpty(linkToObjectFieldName)) {
                String relatedFieldName = linkToObjectFieldName.replace('__c', '__r.Name');
                query = 'SELECT Id, '+linkToObjectProductFieldName +', Product_Name__c';
                if (String.isNotEmpty(linkToObjectQtyFieldName)) {
                    query += ','+linkToObjectQtyFieldName;
                }
                if (String.isNotEmpty(linkToObjectPriceFieldName)) {
                    query += ','+linkToObjectPriceFieldName;
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
                        if (String.isNotEmpty(linkToObjectQtyFieldName)) {
                            m.put('qty', o.get(linkToObjectQtyFieldName));
                        }
                        if (String.isNotEmpty(linkToObjectPriceFieldName)) {
                            m.put('price', o.get(linkToObjectPriceFieldName));
                        }

                        linkedProducts.add(m);

                    }
                }
                result.put('linkedProducts', linkedProducts);
                
            }


            result.put('products', products);
            result.put('status', 'SUCCESS');
        }catch(Exception ex) {
            result.put('error', ex.getMessage());
        }

        return result;
    }

    @AuraEnabled
    public static Map<String, Object> linkProducts(String recordId, String linkToObject, String linkToObjectFieldName, String linkToObjectProductFieldName, String linkToObjectQtyFieldName, String linkToObjectPriceFieldName, List<Map<String, Object>> selectedProducts){
        Map<String, Object> result = new Map<String, Object>();
        try {
            if (!selectedProducts.isEmpty()) {
                List<SObject> rows = new List<SObject>();
                for(Map<String,Object> o : selectedProducts) {
                    String linkedRowId = String.valueOf(o.get('id'));
                    String productId = String.valueOf(o.get('product'));
                    SObject newRow = Schema.getGlobalDescribe().get(linkToObject).newSObject();
                    if (String.isEmpty(linkedRowId)) {
                        newRow.put(linkToObjectFieldName, recordId);
                        newRow.put(linkToObjectProductFieldName, productId);

                    } else {
                        newRow.put('Id', linkedRowId);
                    }

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
            result.put('error', ex.getMessage());
        }

        return result;
    }
}
