public with sharing class ProductQuilt_Controller {
    @AuraEnabled(cacheable=true)
    public static Map<String, Object> getProducts(String recordId, String linkToObject, String linkToObjectFieldName, String linkToObjectProductFieldName, String usedFor){
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

            query = 'SELECT Id, Name, Brand__c, Brand__r.Name, Image_Name__c';
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
                query = 'SELECT Id, '+linkToObjectProductFieldName +', Product_Name__c,'+relatedFieldName;
                query += ' FROM ' + linkToObject;
                query += ' WHERE ' + linkToObjectFieldName + ' =:recordId';
                result.put('linkedProducts', Database.query(query));
            }


            result.put('products', products);
            result.put('status', 'SUCCESS');
        }catch(Exception ex) {
            result.put('error', ex.getMessage());
        }

        return result;
    }
}
