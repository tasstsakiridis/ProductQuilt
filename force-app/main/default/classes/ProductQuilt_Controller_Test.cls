@isTest
private class ProductQuilt_Controller_Test {
    static testMethod void unitTest1() {
        Map<String, RecordTypeInfo> paRecordTypes = Schema.SObjectType.Promotion_Activity__c.getRecordTypeInfosByName();
        Map<String, RecordTypeInfo> pRecordTypes = Schema.SObjectType.Product__c.getRecordTypeInfosByName();

        String rtCRMAustralia = paRecordTypes.get('CRM - Australia').getRecordTypeId();
        String rtWetGoods = pRecordTypes.get('Wet Goods').getRecordTypeId();

        String linkToObject = 'Activity_Product__c';
        String linkToObjectFieldName = 'Activity__c';
        String linkToObjectProductFieldName = 'Product_NoFilter__c';
        String usedFor = 'Promotion';
        String linkToObjectQtyFieldName = 'Quantity__c';
        String linkToObjectPriceFieldName = 'Price__c';

        Market__c mAU = new Market__c();
        mAU.Name = 'Australia';
        mAU.Vistex_Clearing_Account__c = '0123456789';
        mAU.Country_ISO_Code_2__c = 'AU';
        mAU.Country_ISO_Code_3__c = 'AUS';
        insert mAU;

        Promotion_Activity__c pa = new Promotion_Activity__c();
        pa.RecordTypeId = rtCRMAustralia;
        pa.Name = 'Test promotion activity';
        pa.Channel__c = 'On';
        pa.Begin_Date__c = Date.today();
        pa.End_Date__c = pa.Begin_Date__c.addDays(7);
        insert pa;

        Product__c p1 = new Product__c();
        p1.RecordTypeId = rtWetGoods;
        p1.Name = 'Product 1';
        p1.Channel__c = 'On';
        p1.Market__c = mAU.Id;

        Product__c p2 = new Product__c();
        p2.RecordTypeId = rtWetGoods;
        p2.Name = 'Product 2';
        p2.Channel__c = 'Both';
        p2.Market__c = mAU.Id;

        Product__c[] products = new Product__c[] {p1, p2};
        insert products;

        List<Map<String, Object>> selectedProducts = new List<Map<String, Object>>();
        Map<String, Object> sp1 = new Map<String, Object>{
                                        'id'=>'',
                                        'product'=>p1.Id,
                                        'productName'=>p1.Name
                                    };
        
        selectedProducts.add(sp1);

        Map<String, Object> result = ProductQuilt_Controller.linkProducts(pa.Id, linkToObject, linkToObjectFieldName, linkToObjectProductFieldName, linkToObjectQtyFieldName, linkToObjectPriceFieldName, selectedProducts);
        System.assertEquals('SUCCESS', result.get('status'));
        System.assertNotEquals(null, result.get('rows'));

        List<SObject> rows = (List<SObject>)result.get('rows');        
        List<String> productsToDelete = new List<String>();
        for(SObject s : rows) {
            productsToDelete.add(String.valueOf(s.get('Id')));
        }

        result = ProductQuilt_Controller.getProducts(pa.Id, linkToObject, linkToObjectFieldName, linkToObjectProductFieldName, usedFor, linkToObjectQtyFieldName, linkToObjectPriceFieldName);
        System.assertEquals('SUCCESS', result.get('status'));
        System.assertNotEquals(null, result.get('products'));

        result = ProductQuilt_Controller.deleteLinkedProducts(linkToObject, productsToDelete);
        System.assertEquals('SUCCESS', result.get('status'));
    }
}