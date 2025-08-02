-- Complete inventory import for 135 items
-- Generated on 2025-08-02T19:02:03.541Z

BEGIN;


INSERT INTO inventory (
    aliexpress_product_id,
    aliexpress_sku_id,
    aliexpress_order_id,
    aliexpress_order_line_id,
    title,
    image_url,
    price_usd,
    original_price,
    price_info,
    currency,
    quantity,
    attributes,
    tags,
    store_name,
    store_page_url,
    product_url,
    order_date,
    order_date_iso,
    import_timestamp,
    ignore_export,
    status,
    is_active,
    category,
    subcategory
) VALUES 
    ('1005008810789814', '12000046765928526', '8202111804408847', '8202111804418847', 'Extra large and small Solid brass wire wrap run course oval Screw Lock Carabiner Key ring Keychain DIY EDC housewarm gift', 'https://ae01.alicdn.com/kf/Sb1704298152346b191e41b1326214cbaD.jpg_220x220.jpg', 2.91, '$2.91', '$2.91|2|91', 'USD', 2, '{"Color":"C","Ships From":"CHINA"}'::jsonb, ARRAY[]::TEXT[]::TEXT[], 'findingbeauty2008 Store', 'https://www.aliexpress.com/store/1101754819', 'https://www.aliexpress.com/item/3256808624475062.html', '2025-06-19', '2025-06-19', 1754157154402, false, 'in_stock', true, 'findings', 'carabiners'),
    ('1005006947192408', '12000038819625840', '8202111804428847', '8202111804438847', 'Bag Extender Chain Purse Strap Extenders Purse Extender Chain Replacement Accessories For Handbag Purse Shoulder Bag Crossbody', 'https://ae01.alicdn.com/kf/S26787b66696d447894837ee4194e85866.jpg_220x220.jpg', 3.32, '$3.32', '$3.32|3|32', 'USD', 3, '{"Size":"Total 12cm","Color":"LightGold"}'::jsonb, ARRAY[]::TEXT[], 'BICM Global Store', 'https://www.aliexpress.com/store/1103482142', 'https://www.aliexpress.com/item/3256806760877656.html', '2025-06-19', '2025-06-19', 1754157154402, false, 'in_stock', true, 'accessories', 'bag_accessories'),
    ('1005006947192408', '12000038819625836', '8202111804428847', '8202111804448847', 'Bag Extender Chain Purse Strap Extenders Purse Extender Chain Replacement Accessories For Handbag Purse Shoulder Bag Crossbody', 'https://ae01.alicdn.com/kf/S85b8fa39993744bb8c9c26092d142af9f.jpg_220x220.jpg', 3.2, '$3.20', '$3.20|3|20', 'USD', 5, '{"Size":"Total 12cm","Color":"KGold"}'::jsonb, ARRAY[]::TEXT[], 'BICM Global Store', 'https://www.aliexpress.com/store/1103482142', 'https://www.aliexpress.com/item/3256806760877656.html', '2025-06-19', '2025-06-19', 1754157154402, false, 'in_stock', true, 'accessories', 'bag_accessories'),
    ('1005006947192408', '12000038819625838', '8202111804428847', '8202111804458847', 'Bag Extender Chain Purse Strap Extenders Purse Extender Chain Replacement Accessories For Handbag Purse Shoulder Bag Crossbody', 'https://ae01.alicdn.com/kf/S6bf6242ff5b343ddb594927d3a9ad28dJ.jpg_220x220.jpg', 3.27, '$3.27', '$3.27|3|27', 'USD', 3, '{"Size":"Total 12cm","Color":"Silver"}'::jsonb, ARRAY[]::TEXT[], 'BICM Global Store', 'https://www.aliexpress.com/store/1103482142', 'https://www.aliexpress.com/item/3256806760877656.html', '2025-06-19', '2025-06-19', 1754157154402, false, 'in_stock', true, 'accessories', 'bag_accessories'),
    ('1005008791089134', '12000046675995869', '8202111804568847', '8202111804578847', '2pcs Gold Color Ring Real Natural Pearl Charm Pendants For Jewelry Making Earrings Necklace Stainless Steel Findings Accessories', 'https://ae01.alicdn.com/kf/S2d16475df83a46f7b30dd84c7729c4c0W.jpg_220x220.jpg', 3.6, '$3.60', '$3.60|3|60', 'USD', 1, '{"Metal color":"S2254-G"}'::jsonb, ARRAY[]::TEXT[], 'Beads Cage77 Store', 'https://www.aliexpress.com/store/1101414959', 'https://www.aliexpress.com/item/3256808604774382.html', '2025-06-19', '2025-06-19', 1754157136642, false, 'in_stock', true, 'earrings', 'earring_components'),
    ('1005008791089134', '12000046675995866', '8202111804568847', '8202111804588847', '2pcs Gold Color Ring Real Natural Pearl Charm Pendants For Jewelry Making Earrings Necklace Stainless Steel Findings Accessories', 'https://ae01.alicdn.com/kf/S56a4d8cb99984d0385ee87a948a0b88eG.jpg_220x220.jpg', 4.13, '$4.13', '$4.13|4|13', 'USD', 1, '{"Metal color":"S2251-G"}'::jsonb, ARRAY[]::TEXT[], 'Beads Cage77 Store', 'https://www.aliexpress.com/store/1101414959', 'https://www.aliexpress.com/item/3256808604774382.html', '2025-06-19', '2025-06-19', 1754157136642, false, 'in_stock', true, 'earrings', 'earring_components'),
    ('1005008791089134', '12000046675995872', '8202111804568847', '8202111804598847', '2pcs Gold Color Ring Real Natural Pearl Charm Pendants For Jewelry Making Earrings Necklace Stainless Steel Findings Accessories', 'https://ae01.alicdn.com/kf/S101a0e5b63a54e16a9054617c7b7a102p.jpg_220x220.jpg', 3.54, '$3.54', '$3.54|3|54', 'USD', 1, '{"Metal color":"S2257-G"}'::jsonb, ARRAY[]::TEXT[], 'Beads Cage77 Store', 'https://www.aliexpress.com/store/1101414959', 'https://www.aliexpress.com/item/3256808604774382.html', '2025-06-19', '2025-06-19', 1754157136642, false, 'in_stock', true, 'earrings', 'earring_components'),
    ('1005008791089134', '12000046675995874', '8202111804568847', '8202111804608847', '2pcs Gold Color Ring Real Natural Pearl Charm Pendants For Jewelry Making Earrings Necklace Stainless Steel Findings Accessories', 'https://ae01.alicdn.com/kf/S2b7e82e948f149058de0be6a1f277d2bA.jpg_220x220.jpg', 3.57, '$3.57', '$3.57|3|57', 'USD', 1, '{"Metal color":"S2259-G"}'::jsonb, ARRAY[]::TEXT[], 'Beads Cage77 Store', 'https://www.aliexpress.com/store/1101414959', 'https://www.aliexpress.com/item/3256808604774382.html', '2025-06-19', '2025-06-19', 1754157136642, false, 'in_stock', true, 'earrings', 'earring_components'),
    ('1005008791089134', '12000046675995870', '8202111804568847', '8202111804618847', '2pcs Gold Color Ring Real Natural Pearl Charm Pendants For Jewelry Making Earrings Necklace Stainless Steel Findings Accessories', 'https://ae01.alicdn.com/kf/S69cc8b7d93e84b5d8fbf23e12727f0dfj.jpg_220x220.jpg', 3.15, '$3.15', '$3.15|3|15', 'USD', 1, '{"Metal color":"S2255-G"}'::jsonb, ARRAY[]::TEXT[], 'Beads Cage77 Store', 'https://www.aliexpress.com/store/1101414959', 'https://www.aliexpress.com/item/3256808604774382.html', '2025-06-19', '2025-06-19', 1754157136642, false, 'in_stock', true, 'earrings', 'earring_components'),
    ('1005006331564625', '12000036788508955', '8202111804628847', '8202111804638847', '10pcs Split Key Ring Swivel Connector Carabiner for Jewelry Finding Making Gold Silver Plated Lobster Clasp Hooks DIY Keychains', 'https://ae01.alicdn.com/kf/Sa47f3bed155c4c9aa82278c1ff1b8aaac.jpg_220x220.jpg', 1.39, '$1.39', '$1.39|1|39', 'USD', 2, '{"Color":"Gold","Size":"23mm"}'::jsonb, ARRAY[]::TEXT[], 'Louleur Official Store', 'https://www.aliexpress.com/store/1101235019', 'https://www.aliexpress.com/item/3256806145249873.html', '2025-06-19', '2025-06-19', 1754157136642, false, 'in_stock', true, 'findings', 'connectors');



INSERT INTO inventory (
    aliexpress_product_id,
    aliexpress_sku_id,
    aliexpress_order_id,
    aliexpress_order_line_id,
    title,
    image_url,
    price_usd,
    original_price,
    price_info,
    currency,
    quantity,
    attributes,
    tags,
    store_name,
    store_page_url,
    product_url,
    order_date,
    order_date_iso,
    import_timestamp,
    ignore_export,
    status,
    is_active,
    category,
    subcategory
) VALUES 
    ('1005007514024777', '12000041086351971', '8202111804648847', '8202111804658847', 'Aluminum Metal Purse Handle Bag Chains Charms Straps Replacement Handbag Accessories Decoration', 'https://ae01.alicdn.com/kf/S9894ffcd4cb84c679fe30026130ccfa9l.jpg_220x220.jpg', 1.37, '$1.37', '$1.37|1|37', 'USD', 4, '{"Color":"Old Gold","Size":"15cm"}'::jsonb, ARRAY[]::TEXT[], 'MELORDY Store', 'https://www.aliexpress.com/store/1103205140', 'https://www.aliexpress.com/item/3256807327710025.html', '2025-06-19', '2025-06-19', 1754157136642, false, 'in_stock', true, 'charms', 'pendants'),
    ('1005008771454914', '12000046604491064', '8202111804668847', '8202111804678847', 'Extended Chain for Handbag Metal Extension Chain Armpit Shoulder Bag Transformation Crossbody Bags Extend Chain Bag Accessories', 'https://ae01.alicdn.com/kf/S163576e0ff8e41a09e6965edcb445ef2p.jpg_220x220.jpg', 3.41, '$3.41', '$3.41|3|41', 'USD', 5, '{"Color":"Gilded Gold 11.8cm","Size":"bag not include"}'::jsonb, ARRAY[]::TEXT[], 'SU7 BAG ACCESSORIES Store', 'https://www.aliexpress.com/store/1104671765', 'https://www.aliexpress.com/item/3256808585140162.html', '2025-06-19', '2025-06-19', 1754157136642, false, 'in_stock', true, 'accessories', 'bag_accessories'),
    ('1005008572147983', '12000045777462383', '8202111804688847', '8202111804698847', '10pcs 15mm*15mm Gothic 3D Spiky Ball Pendant DIY Jewelry Finding Spike Morning Star Flail Dangle Charms Jewelry Making', 'https://ae01.alicdn.com/kf/S283d2ac891b1490290ec5e933a79db090.jpg_220x220.jpg', 4.9, '$4.90', '$4.90|4|90', 'USD', 1, '{"Metal color":"Silver"}'::jsonb, ARRAY[]::TEXT[], 'ANIFANS Store', 'https://www.aliexpress.com/store/1101851931', 'https://www.aliexpress.com/item/3256808385833231.html', '2025-06-19', '2025-06-19', 1754157154402, false, 'in_stock', true, 'charms', 'pendants'),
    ('1005008696583018', '12000046284817929', '8202111804708847', '8202111804718847', '12 pieces of alloy animal rabbit jewelry cartoon pendant DIY earrings necklace jewelry making crafts accessories', 'https://ae01.alicdn.com/kf/S312de1eb64f441d0976ed08135299d435.jpg_220x220.jpg', 3.13, '$3.13', '$3.13|3|13', 'USD', 1, '{"Metal color":"1"}'::jsonb, ARRAY[]::TEXT[], 'Shop1103184834 Store', 'https://www.aliexpress.com/store/1103187818', 'https://www.aliexpress.com/item/3256808510268266.html', '2025-06-19', '2025-06-19', 1754157154402, false, 'in_stock', true, 'earrings', 'earring_components'),
    ('1005007617876714', '12000041524423723', '8201173151938847', '8201173151948847', '1Pcs Cute Animal Pendant 5mm Hole Alloy Charms Pendants for DIY Bracelet Necklace Keychain Craft Making Jewelry Findings', 'https://ae01.alicdn.com/kf/S88c39adc3f0743edbbc23b2502357bf4T.jpg_220x220.jpg', 1.95, '$1.95', '$1.95|1|95', 'USD', 3, '{"Color":"14x19mm","Ships From":"CHINA"}'::jsonb, ARRAY[]::TEXT[], 'Zone Beads', 'https://www.aliexpress.com/store/1100967644', 'https://www.aliexpress.com/item/3256807431561962.html', '2025-05-31', '2025-05-31', 1754157154402, false, 'in_stock', true, 'chains', 'necklace_chains'),
    ('1005007617876714', '12000041524423725', '8201173151938847', '8201173151958847', '1Pcs Cute Animal Pendant 5mm Hole Alloy Charms Pendants for DIY Bracelet Necklace Keychain Craft Making Jewelry Findings', 'https://ae01.alicdn.com/kf/S4d4987aa8a7c4d32a002bd60707aa091J.jpg_220x220.jpg', 1.95, '$1.95', '$1.95|1|95', 'USD', 3, '{"Color":"17x12mm","Ships From":"CHINA"}'::jsonb, ARRAY[]::TEXT[], 'Zone Beads', 'https://www.aliexpress.com/store/1100967644', 'https://www.aliexpress.com/item/3256807431561962.html', '2025-05-31', '2025-05-31', 1754157154402, false, 'in_stock', true, 'chains', 'necklace_chains'),
    ('1005007464744948', '12000040865279464', '8201173151968847', '8201173151978847', 'Lot cartoon 10 PCS  Metal Enamel Charm  Earrings  DIY  Key chain Necklace Pendant Bracelet Jewelry Handmade Findings Gift', 'https://ae01.alicdn.com/kf/S1a12b6565c6d48719048db5353711715C.jpg_220x220.jpg', 5.19, '$5.19', '$5.19|5|19', 'USD', 1, '{}'::jsonb, ARRAY[]::TEXT[], 'pop 1732005 Store', 'https://www.aliexpress.com/store/1101036389', 'https://www.aliexpress.com/item/3256807278430196.html', '2025-05-31', '2025-05-31', 1754157154402, false, 'in_stock', true, 'chains', 'necklace_chains'),
    ('1005003475857166', '12000025956920969', '8201173151988847', '8201173151998847', 'Zinc Alloy Spray Paint Colourful Bow Knot Shape Base Earrings Connector 10pcs/lot For Fashion Jewelry Bulk Items Wholesale Lots', 'https://ae01.alicdn.com/kf/H49e1631d11864a0ea75a97f4c86fc418M.jpg_220x220.jpg', 3.43, '$3.43', '$3.43|3|43', 'USD', 1, '{"Metal Color":"4"}'::jsonb, ARRAY[]::TEXT[], 'MIZUKAGAMI Official Store', 'https://www.aliexpress.com/store/1101192136', 'https://www.aliexpress.com/item/3256803289542414.html', '2025-05-31', '2025-05-31', 1754157154402, false, 'in_stock', true, 'earrings', 'earring_components'),
    ('1005007544102366', '12000041231174765', '8201173152128847', '8201173152138847', '5/15pcs/Lot Cute Girl Pendant Enamel Cherry Rabbit Star Charms For Jewelry Making Supplies 3D Charm In Bulk DIY Earring Keychain', 'https://ae01.alicdn.com/kf/Sfbb03f8fbd9d4da094effb020755bdccO.jpg_220x220.jpg', 5.28, '$5.28', '$5.28|5|28', 'USD', 1, '{"Metal color":"M536-6"}'::jsonb, ARRAY[]::TEXT[], 'Beads Cage77 Store', 'https://www.aliexpress.com/store/1101414959', 'https://www.aliexpress.com/item/3256807357787614.html', '2025-05-31', '2025-05-31', 1754157163006, false, 'in_stock', true, 'earrings', 'earring_components'),
    ('1005008771454914', '12000046604491067', '8201173152148847', '8201173152158847', 'Extended Chain for Handbag Metal Extension Chain Armpit Shoulder Bag Transformation Crossbody Bags Extend Chain Bag Accessories', 'https://ae01.alicdn.com/kf/S766aaaae64b6440f9afad76dc660e133Y.jpg_220x220.jpg', 4.11, '$4.11', '$4.11|4|11', 'USD', 1, '{"Color":"Light Gold 16.8cm","Size":"bag not include"}'::jsonb, ARRAY[]::TEXT[], 'SU7 BAG ACCESSORIES Store', 'https://www.aliexpress.com/store/1104671765', 'https://www.aliexpress.com/item/3256808585140162.html', '2025-05-31', '2025-05-31', 1754157154402, false, 'in_stock', true, 'accessories', 'bag_accessories');



INSERT INTO inventory (
    aliexpress_product_id,
    aliexpress_sku_id,
    aliexpress_order_id,
    aliexpress_order_line_id,
    title,
    image_url,
    price_usd,
    original_price,
    price_info,
    currency,
    quantity,
    attributes,
    tags,
    store_name,
    store_page_url,
    product_url,
    order_date,
    order_date_iso,
    import_timestamp,
    ignore_export,
    status,
    is_active,
    category,
    subcategory
) VALUES 
    ('1005008771454914', '12000046604491068', '8201173152148847', '8201173152168847', 'Extended Chain for Handbag Metal Extension Chain Armpit Shoulder Bag Transformation Crossbody Bags Extend Chain Bag Accessories', 'https://ae01.alicdn.com/kf/S471a81edaed2455cb00c22e05fa3c33bv.jpg_220x220.jpg', 3.18, '$3.18', '$3.18|3|18', 'USD', 1, '{"Color":"Gun Black 11.8cm","Size":"bag not include"}'::jsonb, ARRAY[]::TEXT[], 'SU7 BAG ACCESSORIES Store', 'https://www.aliexpress.com/store/1104671765', 'https://www.aliexpress.com/item/3256808585140162.html', '2025-05-31', '2025-05-31', 1754157154402, false, 'in_stock', true, 'accessories', 'bag_accessories'),
    ('1005008771454914', '12000046604491066', '8201173152148847', '8201173152178847', 'Extended Chain for Handbag Metal Extension Chain Armpit Shoulder Bag Transformation Crossbody Bags Extend Chain Bag Accessories', 'https://ae01.alicdn.com/kf/S4459f46b10d04d9cb3c37ae0445c2974M.jpg_220x220.jpg', 3.42, '$3.42', '$3.42|3|42', 'USD', 1, '{"Color":"Light Gold 11.8cm","Size":"bag not include"}'::jsonb, ARRAY[]::TEXT[], 'SU7 BAG ACCESSORIES Store', 'https://www.aliexpress.com/store/1104671765', 'https://www.aliexpress.com/item/3256808585140162.html', '2025-05-31', '2025-05-31', 1754157154402, false, 'in_stock', true, 'accessories', 'bag_accessories'),
    ('1005008771454914', '12000046604491071', '8201173152148847', '8201173152188847', 'Extended Chain for Handbag Metal Extension Chain Armpit Shoulder Bag Transformation Crossbody Bags Extend Chain Bag Accessories', 'https://ae01.alicdn.com/kf/S18a2fd837fc04e418e2968e9e01c79d07.jpg_220x220.jpg', 4.11, '$4.11', '$4.11|4|11', 'USD', 1, '{"Color":"Silver 16.8cm","Size":"bag not include"}'::jsonb, ARRAY[]::TEXT[], 'SU7 BAG ACCESSORIES Store', 'https://www.aliexpress.com/store/1104671765', 'https://www.aliexpress.com/item/3256808585140162.html', '2025-05-31', '2025-05-31', 1754157154402, false, 'in_stock', true, 'accessories', 'bag_accessories'),
    ('1005008771454914', '12000046604491064', '8201173152148847', '8201173152198847', 'Extended Chain for Handbag Metal Extension Chain Armpit Shoulder Bag Transformation Crossbody Bags Extend Chain Bag Accessories', 'https://ae01.alicdn.com/kf/S163576e0ff8e41a09e6965edcb445ef2p.jpg_220x220.jpg', 3.56, '$3.56', '$3.56|3|56', 'USD', 1, '{"Color":"Gilded Gold 11.8cm","Size":"bag not include"}'::jsonb, ARRAY[]::TEXT[], 'SU7 BAG ACCESSORIES Store', 'https://www.aliexpress.com/store/1104671765', 'https://www.aliexpress.com/item/3256808585140162.html', '2025-05-31', '2025-05-31', 1754157154402, false, 'in_stock', true, 'accessories', 'bag_accessories'),
    ('1005008771454914', '12000046604491069', '8201173152148847', '8201173152208847', 'Extended Chain for Handbag Metal Extension Chain Armpit Shoulder Bag Transformation Crossbody Bags Extend Chain Bag Accessories', 'https://ae01.alicdn.com/kf/Seed76f48c52a4550b5aeed050464cc58e.jpg_220x220.jpg', 3.76, '$3.76', '$3.76|3|76', 'USD', 1, '{"Color":"Gun Black 16.8cm","Size":"bag not include"}'::jsonb, ARRAY[]::TEXT[], 'SU7 BAG ACCESSORIES Store', 'https://www.aliexpress.com/store/1104671765', 'https://www.aliexpress.com/item/3256808585140162.html', '2025-05-31', '2025-05-31', 1754157154402, false, 'in_stock', true, 'accessories', 'bag_accessories'),
    ('1005008771454914', '12000046604491070', '8201173152148847', '8201173152218847', 'Extended Chain for Handbag Metal Extension Chain Armpit Shoulder Bag Transformation Crossbody Bags Extend Chain Bag Accessories', 'https://ae01.alicdn.com/kf/S724d10be61cf4f20b02e9233ab195f06H.jpg_220x220.jpg', 3.61, '$3.61', '$3.61|3|61', 'USD', 1, '{"Color":"Silver 11.8cm","Size":"bag not include"}'::jsonb, ARRAY[]::TEXT[], 'SU7 BAG ACCESSORIES Store', 'https://www.aliexpress.com/store/1104671765', 'https://www.aliexpress.com/item/3256808585140162.html', '2025-05-31', '2025-05-31', 1754157154402, false, 'in_stock', true, 'accessories', 'bag_accessories'),
    ('1005008771454914', '12000046604491065', '8201173152148847', '8201173152228847', 'Extended Chain for Handbag Metal Extension Chain Armpit Shoulder Bag Transformation Crossbody Bags Extend Chain Bag Accessories', 'https://ae01.alicdn.com/kf/Sbac5d8d450a24f77afa504cc531ecb2eg.jpg_220x220.jpg', 4.02, '$4.02', '$4.02|4|02', 'USD', 1, '{"Color":"Gilded Gold 16.8cm","Size":"bag not include"}'::jsonb, ARRAY[]::TEXT[], 'SU7 BAG ACCESSORIES Store', 'https://www.aliexpress.com/store/1104671765', 'https://www.aliexpress.com/item/3256808585140162.html', '2025-05-31', '2025-05-31', 1754157154402, false, 'in_stock', true, 'accessories', 'bag_accessories'),
    ('1005005553863228', '12000034146362365', '8201173152258847', '8201173152268847', 'MIGGA Multicolor Cubic Zircon Pendants Dangle Earrings Set New Design Luxury Women Huggies Jewelry', 'https://ae01.alicdn.com/kf/Sd5204e222b774f46991f9397a701c445B.jpg_220x220.jpg', 6.94, '$6.94', '$6.94|6|94', 'USD', 1, '{"Metal Color":"23050908"}'::jsonb, ARRAY[]::TEXT[], 'MIGGA Official Store', 'https://www.aliexpress.com/store/1100502962', 'https://www.aliexpress.com/item/3256805367548476.html', '2025-05-31', '2025-05-31', 1754157154402, false, 'in_stock', true, 'earrings', 'earring_components'),
    ('1005005553863228', '12000033517784276', '8201173152258847', '8201173152278847', 'MIGGA Multicolor Cubic Zircon Pendants Dangle Earrings Set New Design Luxury Women Huggies Jewelry', 'https://ae01.alicdn.com/kf/S50c0c4385e59433f949c972c2e68a7a3J.jpg_220x220.jpg', 7.18, '$7.18', '$7.18|7|18', 'USD', 1, '{"Metal Color":"22111603"}'::jsonb, ARRAY[]::TEXT[], 'MIGGA Official Store', 'https://www.aliexpress.com/store/1100502962', 'https://www.aliexpress.com/item/3256805367548476.html', '2025-05-31', '2025-05-31', 1754157154402, false, 'in_stock', true, 'earrings', 'earring_components'),
    ('1005005576476086', '12000034146526105', '8201173152258847', '8201173152288847', 'MIGGA 6pcs Cubic Zircon Crystal Princess Drop Earrings Set Original Fairy Tale Women Party Jewelry', 'https://ae01.alicdn.com/kf/S8db541987f70480f84997e063a47c5d1C.jpg_220x220.jpg', 8.27, '$8.27', '$8.27|8|27', 'USD', 1, '{"Metal Color":"23050801"}'::jsonb, ARRAY[]::TEXT[], 'MIGGA Official Store', 'https://www.aliexpress.com/store/1100502962', 'https://www.aliexpress.com/item/3256805390161334.html', '2025-05-31', '2025-05-31', 1754157154402, false, 'in_stock', true, 'earrings', 'earring_components');



INSERT INTO inventory (
    aliexpress_product_id,
    aliexpress_sku_id,
    aliexpress_order_id,
    aliexpress_order_line_id,
    title,
    image_url,
    price_usd,
    original_price,
    price_info,
    currency,
    quantity,
    attributes,
    tags,
    store_name,
    store_page_url,
    product_url,
    order_date,
    order_date_iso,
    import_timestamp,
    ignore_export,
    status,
    is_active,
    category,
    subcategory
) VALUES 
    ('1005005576476086', '12000034146526103', '8201173152258847', '8201173152298847', 'MIGGA 6pcs Cubic Zircon Crystal Princess Drop Earrings Set Original Fairy Tale Women Party Jewelry', 'https://ae01.alicdn.com/kf/Sd450157c508d4699ad3ce77141aee4091.jpg_220x220.jpg', 7.48, '$7.48', '$7.48|7|48', 'USD', 1, '{"Metal Color":"23050902"}'::jsonb, ARRAY[]::TEXT[], 'MIGGA Official Store', 'https://www.aliexpress.com/store/1100502962', 'https://www.aliexpress.com/item/3256805390161334.html', '2025-05-31', '2025-05-31', 1754157154402, false, 'in_stock', true, 'earrings', 'earring_components'),
    ('1005005576476086', '12000034146526104', '8201173152258847', '8201173152308847', 'MIGGA 6pcs Cubic Zircon Crystal Princess Drop Earrings Set Original Fairy Tale Women Party Jewelry', 'https://ae01.alicdn.com/kf/S8a74685f5fc34b319ef875be59321b46f.jpg_220x220.jpg', 7.49, '$7.49', '$7.49|7|49', 'USD', 1, '{"Metal Color":"23050903"}'::jsonb, ARRAY[]::TEXT[], 'MIGGA Official Store', 'https://www.aliexpress.com/store/1100502962', 'https://www.aliexpress.com/item/3256805390161334.html', '2025-05-31', '2025-05-31', 1754157154402, false, 'in_stock', true, 'earrings', 'earring_components'),
    ('1005005217579403', '12000032224754637', '8200595526788847', '8200595526798847', '5pcs Leather Hand Bag Backpack Jewelry Pendant Doll Toys Trigger Snap Findings Hook Split Ring Lobster Clasp Clip Car Key Ring', 'https://ae01.alicdn.com/kf/S4020a4d7d4024cbcba1ab1f8549f28bay.jpg_220x220.jpg', 2.16, '$2.16', '$2.16|2|16', 'USD', 1, '{"Color":"type A gold"}'::jsonb, ARRAY[]::TEXT[], 'MICADS Store', 'https://www.aliexpress.com/store/1102251475', 'https://www.aliexpress.com/item/3256805031264651.html', '2025-05-17', '2025-05-17', 1754157163006, false, 'in_stock', true, 'charms', 'pendants'),
    ('1005007310072962', '12000040194857271', '8200595526808847', '8200595526818847', '10pcs Cute Metal Enamel Clothing Charms Coats Jackets Pants Trousers Pendants for Earrings Bracelets Diy Jewelry Making Supplies', 'https://ae01.alicdn.com/kf/S2626f24329d842e2a98812902066417d3.jpg_220x220.jpg', 2.11, '$2.11', '$2.11|2|11', 'USD', 1, '{"Metal color":"mix styles"}'::jsonb, ARRAY[]::TEXT[], 'TKSGNK Store', 'https://www.aliexpress.com/store/1101601709', 'https://www.aliexpress.com/item/3256807123758210.html', '2025-05-17', '2025-05-17', 1754157171241, false, 'in_stock', true, 'chains', 'bracelet_chains'),
    ('1005008518541066', '12000045526996672', '8200595526828847', '8200595526838847', '10pcs/lot Cute Cartoon Taylor Concert Enamel Charms for Lovers DIY Earrings Jewelry Make Necklace Bracelet Pendant Accessory', 'https://ae01.alicdn.com/kf/S3d011f2f82ff4fe9b1e3367c40883c50p.jpg_220x220.jpg', 3.94, '$3.94', '$3.94|3|94', 'USD', 1, '{"Metal color":"- 02"}'::jsonb, ARRAY[]::TEXT[], 'Shop1104101052 Store', 'https://www.aliexpress.com/store/1104098070', 'https://www.aliexpress.com/item/3256808332226314.html', '2025-05-17', '2025-05-17', 1754157171241, false, 'in_stock', true, 'chains', 'bracelet_chains'),
    ('1005003334916914', '12000036657961328', '8200595526848847', '8200595526858847', '8 style stylish simple design silver plate brass oval Drop rectangle Screw Locking Carabiner Key ring Keychain EDC gift', 'https://ae01.alicdn.com/kf/Sf101b7d8f1ed4016817c8f2aec47ffccC.jpg_220x220.jpg', 2.54, '$2.54', '$2.54|2|54', 'USD', 9, '{"Color":"F","Ships From":"CHINA"}'::jsonb, ARRAY[]::TEXT[], 'findingbeauty2008 Store', 'https://www.aliexpress.com/store/1101754819', 'https://www.aliexpress.com/item/3256803148602162.html', '2025-05-17', '2025-05-17', 1754157171241, false, 'in_stock', true, 'findings', 'carabiners'),
    ('1005004716411351', '12000030212758452', '8200595527018847', '8200595527028847', '10pcs Diy Butterfly Earrings Connectors Colorful Stud Earring Settings Earrings Base for Handmade Jewelry Making Accessories', 'https://ae01.alicdn.com/kf/S30a26ecdb6204926bee71b452d4eef8eY.jpg_220x220.jpg', 4.46, '$4.46', '$4.46|4|46', 'USD', 1, '{"Color":"10"}'::jsonb, ARRAY[]::TEXT[], 'AIW DIY JEWELRY Store', 'https://www.aliexpress.com/store/1101366873', 'https://www.aliexpress.com/item/3256804530096599.html', '2025-05-17', '2025-05-17', 1754157163006, false, 'in_stock', true, 'earrings', 'earring_components'),
    ('1005004744415979', '12000030315896498', '8200595527018847', '8200595527038847', '10pcs Heart Shape Earrings Connectors Handmade Gold Color Stud Earring Settings Earrings Base for Diy Jewelry Making Accessories', 'https://ae01.alicdn.com/kf/S7416a7e1f768497d95003a0eb3fed670R.jpg_220x220.jpg', 5.18, '$5.18', '$5.18|5|18', 'USD', 1, '{"Color":"1"}'::jsonb, ARRAY[]::TEXT[], 'AIW DIY JEWELRY Store', 'https://www.aliexpress.com/store/1101366873', 'https://www.aliexpress.com/item/3256804558101227.html', '2025-05-17', '2025-05-17', 1754157163006, false, 'in_stock', true, 'earrings', 'earring_components'),
    ('4001171138291', '10000015020626790', '8200595527048847', '8200595527058847', '25 pcs Alloy skateboard charms Sport pendant fit DIY handmade necklace earring bracelet charms for Jewelry Making', 'https://ae01.alicdn.com/kf/H34ace882d0ee43b58ddce3a860847ce70.jpg_220x220.jpg', 3.28, '$3.28', '$3.28|3|28', 'USD', 1, '{"Metal color":"Antique  silver"}'::jsonb, ARRAY[]::TEXT[], 'SHUNLEQIAN Luck Xi Official Store', 'https://www.aliexpress.com/store/1101439384', 'https://www.aliexpress.com/item/2255800984823539.html', '2025-05-17', '2025-05-17', 1754157163006, false, 'in_stock', true, 'chains', 'bracelet_chains'),
    ('1005005780759896', '12000034330543954', '8200595527068847', '8200595527078847', 'The Lord of the Rings Charm Bracelet for Women DIY Jewelry Gifts', 'https://ae01.alicdn.com/kf/S425b03e837ae4af7a59d821091737c1f7.jpg_220x220.jpg', 2.92, '$2.92', '$2.92|2|92', 'USD', 2, '{"Metal Color":"Charm Bracelets"}'::jsonb, ARRAY[]::TEXT[], 'Anime Cosplay Jewelry 01 Store', 'https://www.aliexpress.com/store/1102860719', 'https://www.aliexpress.com/item/3256805594445144.html', '2025-05-17', '2025-05-17', 1754157163006, false, 'in_stock', true, 'chains', 'bracelet_chains');



INSERT INTO inventory (
    aliexpress_product_id,
    aliexpress_sku_id,
    aliexpress_order_id,
    aliexpress_order_line_id,
    title,
    image_url,
    price_usd,
    original_price,
    price_info,
    currency,
    quantity,
    attributes,
    tags,
    store_name,
    store_page_url,
    product_url,
    order_date,
    order_date_iso,
    import_timestamp,
    ignore_export,
    status,
    is_active,
    category,
    subcategory
) VALUES 
    ('1005007606842074', '12000041481939210', '8200595527088847', '8200595527098847', '10pcs Fashion Bow Metal Charms for Jewelry making', 'https://ae01.alicdn.com/kf/S4f7f3f9e12824a83aed92c7e0cce7941l.jpg_220x220.jpg', 3.84, '$3.84', '$3.84|3|84', 'USD', 1, '{"Metal color":"10pcs as shown"}'::jsonb, ARRAY[]::TEXT[], 'Mrhuang Store', 'https://www.aliexpress.com/store/1100706257', 'https://www.aliexpress.com/item/3256807420527322.html', '2025-05-17', '2025-05-17', 1754157171241, false, 'in_stock', true, 'charms', 'pendants'),
    ('1005003808147677', '12000027235864321', '8200595527108847', '8200595527118847', '20pcs Roman Spearhead Pendants Charms For Jewelry Making Necklace Bracelet Earrings Keychain DIY Craft Accessories Findings', 'https://ae01.alicdn.com/kf/S5cafd0c94e5040459a7e6662251f5d482.jpg_220x220.jpg', 1.76, '$1.76', '$1.76|1|76', 'USD', 1, '{"Color":"Gold"}'::jsonb, ARRAY[]::TEXT[], 'Shop1100090089 Store', 'https://www.aliexpress.com/store/1101985769', 'https://www.aliexpress.com/item/3256803621832925.html', '2025-05-17', '2025-05-17', 1754157171241, false, 'in_stock', true, 'chains', 'necklace_chains'),
    ('1005003808147677', '12000027235864320', '8200595527108847', '8200595527128847', '20pcs Roman Spearhead Pendants Charms For Jewelry Making Necklace Bracelet Earrings Keychain DIY Craft Accessories Findings', 'https://ae01.alicdn.com/kf/S25f149a5dbf54347acc902b04553e8c5X.jpg_220x220.jpg', 1.91, '$1.91', '$1.91|1|91', 'USD', 1, '{"Color":"Sliver"}'::jsonb, ARRAY[]::TEXT[], 'Shop1100090089 Store', 'https://www.aliexpress.com/store/1101985769', 'https://www.aliexpress.com/item/3256803621832925.html', '2025-05-17', '2025-05-17', 1754157171241, false, 'in_stock', true, 'chains', 'necklace_chains'),
    ('1005007880252268', '12000042680166411', '8200595526868847', '8200595526878847', '3 sizes simple silver plate brass oval running course Screw Locking Carabiner Key ring Keychain EDC gift', 'https://ae01.alicdn.com/kf/Se45a5da3dea74071845f279880fb96704.jpg_220x220.jpg', 3.74, '$3.74', '$3.74|3|74', 'USD', 5, '{"Color":"C","Ships From":"CHINA"}'::jsonb, ARRAY[]::TEXT[], 'findingbeauty2008 Store', 'https://www.aliexpress.com/store/1101754819', 'https://www.aliexpress.com/item/3256807693937516.html', '2025-05-17', '2025-05-17', 1754157171241, false, 'in_stock', true, 'findings', 'carabiners'),
    ('1005007472650711', '12000040894756853', '8200595526888847', '8200595526898847', 'Bohemian Bowknot Heart Keychain Women Sweet Charm Pearl Bow Backpack Key Ring Handmade Jewelry Ornament Bags Pendants Gifts', 'https://ae01.alicdn.com/kf/Sbf24048680964b17abfcc8d0b5420037s.jpg_220x220.jpg', 1.44, '$1.44', '$1.44|1|44', 'USD', 2, '{"Color":"K3002"}'::jsonb, ARRAY[]::TEXT[], 'Shop1103832641 Store', 'https://www.aliexpress.com/store/1103840631', 'https://www.aliexpress.com/item/3256807286335959.html', '2025-05-17', '2025-05-17', 1754157171241, false, 'in_stock', true, 'earrings', 'earring_components'),
    ('1005003475857166', '12000025956920970', '8200595526908847', '8200595526918847', 'Zinc Alloy Spray Paint Colourful Bow Knot Shape Base Earrings Connector 10pcs/lot For Fashion Jewelry Bulk Items Wholesale Lots', 'https://ae01.alicdn.com/kf/H8de252b3dd3c49168e9660b1418a207es.jpg_220x220.jpg', 3.43, '$3.43', '$3.43|3|43', 'USD', 1, '{"Metal Color":"7"}'::jsonb, ARRAY[]::TEXT[], 'MIZUKAGAMI Official Store', 'https://www.aliexpress.com/store/1101192136', 'https://www.aliexpress.com/item/3256803289542414.html', '2025-05-17', '2025-05-17', 1754157171241, false, 'in_stock', true, 'earrings', 'earring_components'),
    ('1005003475857166', '12000025956920966', '8200595526908847', '8200595526928847', 'Zinc Alloy Spray Paint Colourful Bow Knot Shape Base Earrings Connector 10pcs/lot For Fashion Jewelry Bulk Items Wholesale Lots', 'https://ae01.alicdn.com/kf/H28fac8c5f67a47e7a472355633be91b4p.jpg_220x220.jpg', 3.43, '$3.43', '$3.43|3|43', 'USD', 1, '{"Metal Color":"2"}'::jsonb, ARRAY[]::TEXT[], 'MIZUKAGAMI Official Store', 'https://www.aliexpress.com/store/1101192136', 'https://www.aliexpress.com/item/3256803289542414.html', '2025-05-17', '2025-05-17', 1754157171241, false, 'in_stock', true, 'earrings', 'earring_components'),
    ('1005005224861238', '12000032328290572', '8198928310668847', '8198928310678847', '4pcs Stainless Steel Gold Round Spring Clasps Hooks for Bracelet Clavicle Necklace Clasp Connectors DIY Jewelry Making Supplies', 'https://ae01.alicdn.com/kf/Sa6d866137bd4463499cf18c10e931735x.jpg_220x220.jpg', 2.42, '$2.42', '$2.42|2|42', 'USD', 2, '{"Color":"gold","Size":"14mm"}'::jsonb, ARRAY[]::TEXT[], 'Oklayn Official Store', 'https://www.aliexpress.com/store/1102634431', 'https://www.aliexpress.com/item/3256805038546486.html', '2025-02-18', '2025-02-18', 1754157177122, false, 'in_stock', true, 'chains', 'bracelet_chains'),
    ('1005005224861238', '12000032328290577', '8198928310688847', '8198928310698847', '4pcs Stainless Steel Gold Round Spring Clasps Hooks for Bracelet Clavicle Necklace Clasp Connectors DIY Jewelry Making Supplies', 'https://ae01.alicdn.com/kf/Sc6427bd96940455c8221a20a6c2e0eb6s.jpg_220x220.jpg', 2.37, '$2.37', '$2.37|2|37', 'USD', 2, '{"Color":"steel","Size":"14mm"}'::jsonb, ARRAY[]::TEXT[], 'Oklayn Official Store', 'https://www.aliexpress.com/store/1102634431', 'https://www.aliexpress.com/item/3256805038546486.html', '2025-02-18', '2025-02-18', 1754157177122, false, 'in_stock', true, 'chains', 'bracelet_chains'),
    ('1005007637503466', '12000041595411618', '8198928311088847', '8198928311098847', '14K Gold-Color Plated Bracelet Pendant High Heels Milk Tea Mask Pendant Necklace Handmade Diy Accessories Materials', 'https://ae01.alicdn.com/kf/S3ba2933098524f8d8310f9ba47cba4c5n.jpg_220x220.jpg', 0.85, '$0.85', '$0.85|0|85', 'USD', 4, '{"Metal Color":"5x14mm","Length":"1pcs"}'::jsonb, ARRAY[]::TEXT[], 'Shop4565026 Store', 'https://www.aliexpress.com/store/1101302347', 'https://www.aliexpress.com/item/3256807451188714.html', '2025-02-18', '2025-02-18', 1754157177122, false, 'in_stock', true, 'chains', 'bracelet_chains');



INSERT INTO inventory (
    aliexpress_product_id,
    aliexpress_sku_id,
    aliexpress_order_id,
    aliexpress_order_line_id,
    title,
    image_url,
    price_usd,
    original_price,
    price_info,
    currency,
    quantity,
    attributes,
    tags,
    store_name,
    store_page_url,
    product_url,
    order_date,
    order_date_iso,
    import_timestamp,
    ignore_export,
    status,
    is_active,
    category,
    subcategory
) VALUES 
    ('1005007637503466', '12000041595411620', '8198928311088847', '8198928311108847', '14K Gold-Color Plated Bracelet Pendant High Heels Milk Tea Mask Pendant Necklace Handmade Diy Accessories Materials', 'https://ae01.alicdn.com/kf/Sbb9dffe58cee4ec59ed01f1b7d71a4c04.jpg_220x220.jpg', 1.19, '$1.19', '$1.19|1|19', 'USD', 5, '{"Metal Color":"6x15mm","Length":"1pcs"}'::jsonb, ARRAY[]::TEXT[], 'Shop4565026 Store', 'https://www.aliexpress.com/store/1101302347', 'https://www.aliexpress.com/item/3256807451188714.html', '2025-02-18', '2025-02-18', 1754157177122, false, 'in_stock', true, 'chains', 'bracelet_chains'),
    ('1005007637503466', '12000041595411622', '8198928311088847', '8198928311118847', '14K Gold-Color Plated Bracelet Pendant High Heels Milk Tea Mask Pendant Necklace Handmade Diy Accessories Materials', 'https://ae01.alicdn.com/kf/S1632287b640c4c379109a7972489a690f.jpg_220x220.jpg', 1.7, '$1.70', '$1.70|1|70', 'USD', 5, '{"Metal Color":"15x15mm","Length":"1pcs"}'::jsonb, ARRAY[]::TEXT[], 'Shop4565026 Store', 'https://www.aliexpress.com/store/1101302347', 'https://www.aliexpress.com/item/3256807451188714.html', '2025-02-18', '2025-02-18', 1754157177122, false, 'in_stock', true, 'chains', 'bracelet_chains'),
    ('1005007637503466', '12000041595411621', '8198928311088847', '8198928311128847', '14K Gold-Color Plated Bracelet Pendant High Heels Milk Tea Mask Pendant Necklace Handmade Diy Accessories Materials', 'https://ae01.alicdn.com/kf/S386da174528a4842a9212b20e5e04639a.jpg_220x220.jpg', 1.29, '$1.29', '$1.29|1|29', 'USD', 5, '{"Metal Color":"6x20mm","Length":"1pcs"}'::jsonb, ARRAY[]::TEXT[], 'Shop4565026 Store', 'https://www.aliexpress.com/store/1101302347', 'https://www.aliexpress.com/item/3256807451188714.html', '2025-02-18', '2025-02-18', 1754157177122, false, 'in_stock', true, 'chains', 'bracelet_chains'),
    ('1005008127011067', '12000043898382245', '8198928311138847', '8198928311148847', 'Micro Set Zircon Small Charm Series 14K Gold Solid Angel Eye Palm Cross Wing Ornament Charms Pendant K463', 'https://ae01.alicdn.com/kf/Sd9b8d3fba36e44ea840cd244054d1cc87.jpg_220x220.jpg', 0.77, '$0.77', '$0.77|0|77', 'USD', 5, '{"Metal Color":"10x10mm","Length":"1PCS"}'::jsonb, ARRAY[]::TEXT[], 'Shop2820064 Store', 'https://www.aliexpress.com/store/1101241122', 'https://www.aliexpress.com/item/3256807940696315.html', '2025-02-18', '2025-02-18', 1754157177122, false, 'in_stock', true, 'charms', 'pendants'),
    ('1005008127011067', '12000043898382247', '8198928311138847', '8198928311158847', 'Micro Set Zircon Small Charm Series 14K Gold Solid Angel Eye Palm Cross Wing Ornament Charms Pendant K463', 'https://ae01.alicdn.com/kf/S303dc77ebfa74f2ba66f958f25707541L.jpg_220x220.jpg', 0.98, '$0.98', '$0.98|0|98', 'USD', 10, '{"Metal Color":"11x13.5mm","Length":"1PCS"}'::jsonb, ARRAY[]::TEXT[], 'Shop2820064 Store', 'https://www.aliexpress.com/store/1101241122', 'https://www.aliexpress.com/item/3256807940696315.html', '2025-02-18', '2025-02-18', 1754157177122, false, 'in_stock', true, 'charms', 'pendants'),
    ('1005008127011067', '12000043898382248', '8198928311138847', '8198928311168847', 'Micro Set Zircon Small Charm Series 14K Gold Solid Angel Eye Palm Cross Wing Ornament Charms Pendant K463', 'https://ae01.alicdn.com/kf/S611640567ace4a58b96a51e3e0febbd8E.jpg_220x220.jpg', 0.98, '$0.98', '$0.98|0|98', 'USD', 10, '{"Metal Color":"16x12.5mm","Length":"1PCS"}'::jsonb, ARRAY[]::TEXT[], 'Shop2820064 Store', 'https://www.aliexpress.com/store/1101241122', 'https://www.aliexpress.com/item/3256807940696315.html', '2025-02-18', '2025-02-18', 1754157177122, false, 'in_stock', true, 'charms', 'pendants'),
    ('1005008127011067', '12000043898382242', '8198928311138847', '8198928311178847', 'Micro Set Zircon Small Charm Series 14K Gold Solid Angel Eye Palm Cross Wing Ornament Charms Pendant K463', 'https://ae01.alicdn.com/kf/S6c06da5e31954254a5fc4efc88870d17K.jpg_220x220.jpg', 0.8, '$0.80', '$0.80|0|80', 'USD', 5, '{"Metal Color":"10x13mm","Length":"1PCS"}'::jsonb, ARRAY[]::TEXT[], 'Shop2820064 Store', 'https://www.aliexpress.com/store/1101241122', 'https://www.aliexpress.com/item/3256807940696315.html', '2025-02-18', '2025-02-18', 1754157177122, false, 'in_stock', true, 'charms', 'pendants'),
    ('1005008127011067', '12000043898382241', '8198928311138847', '8198928311188847', 'Micro Set Zircon Small Charm Series 14K Gold Solid Angel Eye Palm Cross Wing Ornament Charms Pendant K463', 'https://ae01.alicdn.com/kf/S571e2d18e5774837b3b7bfed0ab6c5d7I.jpg_220x220.jpg', 0.8, '$0.80', '$0.80|0|80', 'USD', 5, '{"Metal Color":"5.8x15mm","Length":"1PCS"}'::jsonb, ARRAY[]::TEXT[], 'Shop2820064 Store', 'https://www.aliexpress.com/store/1101241122', 'https://www.aliexpress.com/item/3256807940696315.html', '2025-02-18', '2025-02-18', 1754157177122, false, 'in_stock', true, 'charms', 'pendants'),
    ('1005008127011067', '12000043898382250', '8198928311138847', '8198928311198847', 'Micro Set Zircon Small Charm Series 14K Gold Solid Angel Eye Palm Cross Wing Ornament Charms Pendant K463', 'https://ae01.alicdn.com/kf/Seefa08bb79834733b09ecf6486c0094cm.jpg_220x220.jpg', 0.63, '$0.63', '$0.63|0|63', 'USD', 5, '{"Metal Color":"8.5x10mm","Length":"1PCS"}'::jsonb, ARRAY[]::TEXT[], 'Shop2820064 Store', 'https://www.aliexpress.com/store/1101241122', 'https://www.aliexpress.com/item/3256807940696315.html', '2025-02-18', '2025-02-18', 1754157177122, false, 'in_stock', true, 'charms', 'pendants'),
    ('1005003803397986', '12000027220906567', '8198928311208847', '8198928311218847', '5pcs Cute Crystal Love Heart Moon Star Charms for Jewelry Making Animal Bear Charms Pendants for DIY Earrings Necklace Accessory', 'https://ae01.alicdn.com/kf/Ha48c73288bae426e8e90b0ddaf6c8228D.jpg_220x220.jpg', 2.21, '$2.21', '$2.21|2|21', 'USD', 2, '{"Color":"as picture shows"}'::jsonb, ARRAY[]::TEXT[], 'Gritavo Official Store', 'https://www.aliexpress.com/store/1101438581', 'https://www.aliexpress.com/item/3256803617083234.html', '2025-02-18', '2025-02-18', 1754157177122, false, 'in_stock', true, 'earrings', 'earring_components');



INSERT INTO inventory (
    aliexpress_product_id,
    aliexpress_sku_id,
    aliexpress_order_id,
    aliexpress_order_line_id,
    title,
    image_url,
    price_usd,
    original_price,
    price_info,
    currency,
    quantity,
    attributes,
    tags,
    store_name,
    store_page_url,
    product_url,
    order_date,
    order_date_iso,
    import_timestamp,
    ignore_export,
    status,
    is_active,
    category,
    subcategory
) VALUES 
    ('1005007446025795', '12000040783764092', '8198928311228847', '8198928311238847', 'Moisturizing Lip Balm Original Lip Oil Gloss Care of the Lips Benetitnt for Lips Plumping Exfoliating Pink Plumping Gloss Oil', 'https://ae01.alicdn.com/kf/Scab6f4b7d69042a199875fd7050b47f8Y.jpg_220x220.jpg', 1.76, '$1.76', '$1.76|1|76', 'USD', 1, '{"Color":"020 mahogany"}'::jsonb, ARRAY[]::TEXT[], 'ibcccndc Official Store', 'https://www.aliexpress.com/store/1103477035', 'https://www.aliexpress.com/item/3256807259711043.html', '2025-02-18', '2025-02-18', 1754157177122, false, 'in_stock', true, 'components', 'miscellaneous'),
    ('1005007446025795', '12000040783764090', '8198928311228847', '8198928311248847', 'Moisturizing Lip Balm Original Lip Oil Gloss Care of the Lips Benetitnt for Lips Plumping Exfoliating Pink Plumping Gloss Oil', 'https://ae01.alicdn.com/kf/S209f89872dc344d49500fa8778eedeb5S.jpg_220x220.jpg', 1.78, '$1.78', '$1.78|1|78', 'USD', 1, '{"Color":"015 cherry"}'::jsonb, ARRAY[]::TEXT[], 'ibcccndc Official Store', 'https://www.aliexpress.com/store/1103477035', 'https://www.aliexpress.com/item/3256807259711043.html', '2025-02-18', '2025-02-18', 1754157177122, false, 'in_stock', true, 'components', 'miscellaneous'),
    ('1005007446025795', '12000040783764091', '8198928311228847', '8198928311258847', 'Moisturizing Lip Balm Original Lip Oil Gloss Care of the Lips Benetitnt for Lips Plumping Exfoliating Pink Plumping Gloss Oil', 'https://ae01.alicdn.com/kf/S858b280133e3454d9fa6ddf6236ba295P.jpg_220x220.jpg', 1.8, '$1.80', '$1.80|1|80', 'USD', 1, '{"Color":"000 clear"}'::jsonb, ARRAY[]::TEXT[], 'ibcccndc Official Store', 'https://www.aliexpress.com/store/1103477035', 'https://www.aliexpress.com/item/3256807259711043.html', '2025-02-18', '2025-02-18', 1754157177122, false, 'in_stock', true, 'components', 'miscellaneous'),
    ('1005007446025795', '12000040783764086', '8198928311228847', '8198928311268847', 'Moisturizing Lip Balm Original Lip Oil Gloss Care of the Lips Benetitnt for Lips Plumping Exfoliating Pink Plumping Gloss Oil', 'https://ae01.alicdn.com/kf/Sd83263d12c154764b7a6d98db1f81d4dB.jpg_220x220.jpg', 1.82, '$1.82', '$1.82|1|82', 'USD', 1, '{"Color":"001 pink"}'::jsonb, ARRAY[]::TEXT[], 'ibcccndc Official Store', 'https://www.aliexpress.com/store/1103477035', 'https://www.aliexpress.com/item/3256807259711043.html', '2025-02-18', '2025-02-18', 1754157177122, false, 'in_stock', true, 'components', 'miscellaneous'),
    ('1005007446025795', '12000040783764087', '8198928311228847', '8198928311278847', 'Moisturizing Lip Balm Original Lip Oil Gloss Care of the Lips Benetitnt for Lips Plumping Exfoliating Pink Plumping Gloss Oil', 'https://ae01.alicdn.com/kf/S7e4f414c87304eb49004fa7b9c6a50aak.jpg_220x220.jpg', 1.83, '$1.83', '$1.83|1|83', 'USD', 1, '{"Color":"004 coral"}'::jsonb, ARRAY[]::TEXT[], 'ibcccndc Official Store', 'https://www.aliexpress.com/store/1103477035', 'https://www.aliexpress.com/item/3256807259711043.html', '2025-02-18', '2025-02-18', 1754157177122, false, 'in_stock', true, 'components', 'miscellaneous'),
    ('1005007016827133', '12000039084810411', '8198269968438847', '8198269968448847', '4pcs Stereoscopic Gold Plated Fruits Vegetables Flower Enamel Charms For Jewelry Making Alloy Eggplant Candy Pendants Bracelet', 'https://ae01.alicdn.com/kf/S2c863e3f52e747c88a9b045cc823195fD.jpg_220x220.jpg', 1.84, '$1.84', '$1.84|1|84', 'USD', 1, '{"Metal color":"25676"}'::jsonb, ARRAY[]::TEXT[], 'Jewelry Charms Pendants &amp; Findings Store', 'https://www.aliexpress.com/store/1103669735', 'https://www.aliexpress.com/item/3256806830512381.html', '2025-02-10', '2025-02-10', 1754157191681, false, 'in_stock', true, 'chains', 'bracelet_chains'),
    ('1005007016827133', '12000039084810413', '8198269968438847', '8198269968458847', '4pcs Stereoscopic Gold Plated Fruits Vegetables Flower Enamel Charms For Jewelry Making Alloy Eggplant Candy Pendants Bracelet', 'https://ae01.alicdn.com/kf/S4d73f30f20f04eee9fd76bfe7506c2f1T.jpg_220x220.jpg', 1.88, '$1.88', '$1.88|1|88', 'USD', 1, '{"Metal color":"25665"}'::jsonb, ARRAY[]::TEXT[], 'Jewelry Charms Pendants &amp; Findings Store', 'https://www.aliexpress.com/store/1103669735', 'https://www.aliexpress.com/item/3256806830512381.html', '2025-02-10', '2025-02-10', 1754157191681, false, 'in_stock', true, 'chains', 'bracelet_chains'),
    ('1005007297493083', '12000040107371097', '8198269968438847', '8198269968468847', '6PCS/lot Small Marine Animal Coral Tree Pendants Charms Seahorse Tropical Clown Fish Lobster Crab Pendant Jewelry Making Finding', 'https://ae01.alicdn.com/kf/Sa1afc5e35e2b4f9cad07b8fffb20c6404.jpg_220x220.jpg', 3.44, '$3.44', '$3.44|3|44', 'USD', 1, '{"Metal color":"M512-7"}'::jsonb, ARRAY[]::TEXT[], 'Jewelry Charms Pendants &amp; Findings Store', 'https://www.aliexpress.com/store/1103669735', 'https://www.aliexpress.com/item/3256807111178331.html', '2025-02-10', '2025-02-10', 1754157191681, false, 'in_stock', true, 'charms', 'pendants'),
    ('1005001393488299', '12000015922327830', '8198269968698847', '8198269968708847', 'GraceAngie 10pcs  tiny bee enamel charm for jewelry making crafting cute earring pendant necklace bracelet charms 11mm trendy', 'https://ae01.alicdn.com/kf/Hbc0f66a32f2b45e59c5dbc0eec3c0b68F.jpg_220x220.jpg', 1.49, '$1.49', '$1.49|1|49', 'USD', 1, '{}'::jsonb, ARRAY[]::TEXT[], 'Julie''s NO.1 Store', 'https://www.aliexpress.com/store/1100711238', 'https://www.aliexpress.com/item/3256801207173547.html', '2025-02-10', '2025-02-10', 1754157191681, false, 'in_stock', true, 'chains', 'bracelet_chains'),
    ('1005006445535280', '12000037226515058', '8198269969008847', '8198269969018847', '10PCS Princess Character Alloy Enamel Pendant Cartoon Kawaii Mulan Dangle DIY Necklace Earrings Bracelet Keychain Accessories', 'https://ae01.alicdn.com/kf/Sac0a46e5cf374a16a19ac815d32421efZ.jpg_220x220.jpg', 3.17, '$3.17', '$3.17|3|17', 'USD', 1, '{"Metal color":"MIXED"}'::jsonb, ARRAY[]::TEXT[], 'Anna Fashion Jewelry Store', 'https://www.aliexpress.com/store/1103400294', 'https://www.aliexpress.com/item/3256806259220528.html', '2025-02-10', '2025-02-10', 1754157191681, false, 'in_stock', true, 'chains', 'necklace_chains');



INSERT INTO inventory (
    aliexpress_product_id,
    aliexpress_sku_id,
    aliexpress_order_id,
    aliexpress_order_line_id,
    title,
    image_url,
    price_usd,
    original_price,
    price_info,
    currency,
    quantity,
    attributes,
    tags,
    store_name,
    store_page_url,
    product_url,
    order_date,
    order_date_iso,
    import_timestamp,
    ignore_export,
    status,
    is_active,
    category,
    subcategory
) VALUES 
    ('1005005715378548', '12000043094679978', '8198269969028847', '8198269969038847', 'Pandahall 20pcs Goose Charms Brass Pendants With Hole For Necklace Bracelet Earring Jewelry Making Gift', 'https://ae01.alicdn.com/kf/S88ce8e37127a417db04c304fda0d196ak.jpg_220x220.jpg', 10.39, '$10.39', '$10.39|10|39', 'USD', 1, '{"Color":"Gold Color"}'::jsonb, ARRAY[]::TEXT[], 'Pandahall BeadGarden Store', 'https://www.aliexpress.com/store/1100788380', 'https://www.aliexpress.com/item/3256805529063796.html', '2025-02-10', '2025-02-10', 1754157191681, false, 'in_stock', true, 'chains', 'bracelet_chains'),
    ('1005008223535196', '12000044298349599', '8198269969028847', '8198269969048847', '50pcs Cute Brass Bowknot Charm Real 14K Gold Plated for Dangles Earrings Necklaces Bracelets DIY Making Accessories 10x10x3mm', 'https://ae01.alicdn.com/kf/S76deed1fae0b4797925ff5e5e5e5c08cU.jpg_220x220.jpg', 12.13, '$12.13', '$12.13|12|13', 'USD', 1, '{"Color":"Silver Color"}'::jsonb, ARRAY[]::TEXT[], 'Pandahall BeadGarden Store', 'https://www.aliexpress.com/store/1100788380', 'https://www.aliexpress.com/item/3256808037220444.html', '2025-02-10', '2025-02-10', 1754157191681, false, 'in_stock', true, 'chains', 'bracelet_chains'),
    ('1005007661494271', '12000041697456713', '8198269969028847', '8198269969058847', '20pcs Cowboy Boots Charms 304 Stainless Steel Pendants with Star Pattern for Jewelry Making Handmade Necklace Supplies Crafts', 'https://ae01.alicdn.com/kf/S65010b373b5a4431b73e638c16034553u.jpg_220x220.jpg', 9.52, '$9.52', '$9.52|9|52', 'USD', 1, '{"Color":"Steel Color"}'::jsonb, ARRAY[]::TEXT[], 'Pandahall BeadGarden Store', 'https://www.aliexpress.com/store/1100788380', 'https://www.aliexpress.com/item/3256807475179519.html', '2025-02-10', '2025-02-10', 1754157191681, false, 'in_stock', true, 'charms', 'pendants'),
    ('1005007661494271', '12000041697456712', '8198269969028847', '8198269969068847', '20pcs Cowboy Boots Charms 304 Stainless Steel Pendants with Star Pattern for Jewelry Making Handmade Necklace Supplies Crafts', 'https://ae01.alicdn.com/kf/S559651414c5344aabb23acff2369cc36w.jpg_220x220.jpg', 11.16, '$11.16', '$11.16|11|16', 'USD', 1, '{"Color":"Real 18K Gold Plated"}'::jsonb, ARRAY[]::TEXT[], 'Pandahall BeadGarden Store', 'https://www.aliexpress.com/store/1100788380', 'https://www.aliexpress.com/item/3256807475179519.html', '2025-02-10', '2025-02-10', 1754157191681, false, 'in_stock', true, 'charms', 'pendants'),
    ('1005007463145035', '12000040857014047', '8198269969028847', '8198269969078847', '10pcs Pink Ballet Shoes Charms Brass Enamel Pendants Real 18K Gold Plated For Bracelet Earrings Necklace Jewelry Making DIY Gift', 'https://ae01.alicdn.com/kf/S92ef896eac67450a822f0d0b0af24e33J.jpg_220x220.jpg', 7.73, '$7.73', '$7.73|7|73', 'USD', 1, '{"Color":"Real 18K Gold Plated","Size":"16x6.5x4mm"}'::jsonb, ARRAY[]::TEXT[], 'Pandahall BeadGarden Store', 'https://www.aliexpress.com/store/1100788380', 'https://www.aliexpress.com/item/3256807276830283.html', '2025-02-10', '2025-02-10', 1754157191681, false, 'in_stock', true, 'chains', 'bracelet_chains'),
    ('1005005715378548', '12000043094679979', '8198269969028847', '8198269969088847', 'Pandahall 20pcs Goose Charms Brass Pendants With Hole For Necklace Bracelet Earring Jewelry Making Gift', 'https://ae01.alicdn.com/kf/S959115b3970b4b17bf76c879c70b621fk.jpg_220x220.jpg', 10.39, '$10.39', '$10.39|10|39', 'USD', 1, '{"Color":"Platinum Color"}'::jsonb, ARRAY[]::TEXT[], 'Pandahall BeadGarden Store', 'https://www.aliexpress.com/store/1100788380', 'https://www.aliexpress.com/item/3256805529063796.html', '2025-02-10', '2025-02-10', 1754157191681, false, 'in_stock', true, 'chains', 'bracelet_chains'),
    ('1005007006894997', '12000043095943885', '8198269969028847', '8198269969098847', '20pcs Brass Cute Dog Charms Dachshund Puppy Pendants Real 18K Gold Plated for Necklace Choker Jewelry Making DIY Accessories', 'https://ae01.alicdn.com/kf/S73ce5c0388e94d3dbe0cbe8fa4652416i.jpg_220x220.jpg', 9.61, '$9.61', '$9.61|9|61', 'USD', 1, '{"Size":"10x4x16mm"}'::jsonb, ARRAY[]::TEXT[], 'Pandahall BeadGarden Store', 'https://www.aliexpress.com/store/1100788380', 'https://www.aliexpress.com/item/3256806820580245.html', '2025-02-10', '2025-02-10', 1754157191681, false, 'in_stock', true, 'charms', 'pendants'),
    ('1005007899503915', '12000042767299061', '8198269969028847', '8198269969108847', '10pcs Brass Enamel Strawberry Charms Fruit Pendants Long-Lasting Plated for DIY Jewelry Making Earrings Necklace Accessories', 'https://ae01.alicdn.com/kf/Sdddd01fb3eb640758003da7df838e078G.jpg_220x220.jpg', 8.02, '$8.02', '$8.02|8|02', 'USD', 1, '{"Color":"Real 18K Gold Plated","Size":"12x9x2mm"}'::jsonb, ARRAY[]::TEXT[], 'Pandahall BeadGarden Store', 'https://www.aliexpress.com/store/1100788380', 'https://www.aliexpress.com/item/3256807713189163.html', '2025-02-10', '2025-02-10', 1754157191681, false, 'in_stock', true, 'earrings', 'earring_components'),
    ('1005008328026207', '12000044617092357', '8198269969028847', '8198269969118847', '10pcs Brass Cassette Pendants Real 18K Gold Plated for Women Men Bracelet Necklace Key Chain Rock Jewelry Gift Making DIY Crafts', 'https://ae01.alicdn.com/kf/S96b41cbad1ff47fba735da004173ff1bw.jpg_220x220.jpg', 6.2, '$6.20', '$6.20|6|20', 'USD', 1, '{"Color":"Platinum Color"}'::jsonb, ARRAY[]::TEXT[], 'Pandahall BeadGarden Store', 'https://www.aliexpress.com/store/1100788380', 'https://www.aliexpress.com/item/3256808141711455.html', '2025-02-10', '2025-02-10', 1754157191681, false, 'in_stock', true, 'chains', 'necklace_chains'),
    ('1005007463296150', '12000044476106631', '8198269969028847', '8198269969128847', '20pcs Brass Enamel Love Envelope Charms Real 18K Gold Plated for Jewelry Making Cute Earrings Bracelet Necklace DIY Findings', 'https://ae01.alicdn.com/kf/S1ec1a1116b344c6aacdf1a74e34e1343r.jpg_220x220.jpg', 9.19, '$9.19', '$9.19|9|19', 'USD', 1, '{"Color":"Real 18K Gold Plated"}'::jsonb, ARRAY[]::TEXT[], 'Pandahall BeadGarden Store', 'https://www.aliexpress.com/store/1100788380', 'https://www.aliexpress.com/item/3256807276981398.html', '2025-02-10', '2025-02-10', 1754157191681, false, 'in_stock', true, 'chains', 'bracelet_chains');



INSERT INTO inventory (
    aliexpress_product_id,
    aliexpress_sku_id,
    aliexpress_order_id,
    aliexpress_order_line_id,
    title,
    image_url,
    price_usd,
    original_price,
    price_info,
    currency,
    quantity,
    attributes,
    tags,
    store_name,
    store_page_url,
    product_url,
    order_date,
    order_date_iso,
    import_timestamp,
    ignore_export,
    status,
    is_active,
    category,
    subcategory
) VALUES 
    ('1005008063017038', '12000043501989019', '8198269969028847', '8198269969138847', '10pcs Cute Duck Charms Brass Enamel Animal Pendants Real 18K Gold Plated for Diy Earrings Necklace Bracelet Jewelry Making Craft', 'https://ae01.alicdn.com/kf/S1093a0c807114951953c999134d6dc860.jpg_220x220.jpg', 13.07, '$13.07', '$13.07|13|07', 'USD', 1, '{"Color":"White 11x13x7mm"}'::jsonb, ARRAY[]::TEXT[], 'Pandahall BeadGarden Store', 'https://www.aliexpress.com/store/1100788380', 'https://www.aliexpress.com/item/3256807876702286.html', '2025-02-10', '2025-02-10', 1754157191681, false, 'in_stock', true, 'chains', 'bracelet_chains'),
    ('1005008328026207', '12000044617092356', '8198269969028847', '8198269969148847', '10pcs Brass Cassette Pendants Real 18K Gold Plated for Women Men Bracelet Necklace Key Chain Rock Jewelry Gift Making DIY Crafts', 'https://ae01.alicdn.com/kf/Scf76f21067954fa79c9d42cbff1814f8t.jpg_220x220.jpg', 4.79, '$4.79', '$4.79|4|79', 'USD', 1, '{"Color":"Real 18K Gold Plated"}'::jsonb, ARRAY[]::TEXT[], 'Pandahall BeadGarden Store', 'https://www.aliexpress.com/store/1100788380', 'https://www.aliexpress.com/item/3256808141711455.html', '2025-02-10', '2025-02-10', 1754157191681, false, 'in_stock', true, 'chains', 'necklace_chains'),
    ('1005007693425314', '12000041870926358', '8198269969028847', '8198269969158847', '20pcs Brass Beetle Charms Insect Pendants Real 18K Gold Plated for Earrings Necklace DIY Making Party Jewelry Supplies Gift', 'https://ae01.alicdn.com/kf/See7a57e207d840abb441dda5fc98c26bs.jpg_220x220.jpg', 9.58, '$9.58', '$9.58|9|58', 'USD', 1, '{"Color":"Real Platinum Plated","Size":"17x13.5x3mm"}'::jsonb, ARRAY[]::TEXT[], 'Pandahall BeadGarden Store', 'https://www.aliexpress.com/store/1100788380', 'https://www.aliexpress.com/item/3256807507110562.html', '2025-02-10', '2025-02-10', 1754157191681, false, 'in_stock', true, 'earrings', 'earring_components'),
    ('1005008223535196', '12000044298349598', '8198269969028847', '8198269969168847', '50pcs Cute Brass Bowknot Charm Real 14K Gold Plated for Dangles Earrings Necklaces Bracelets DIY Making Accessories 10x10x3mm', 'https://ae01.alicdn.com/kf/S256594fbb1e7425a86ec2ee7d4cf19bb4.jpg_220x220.jpg', 12.13, '$12.13', '$12.13|12|13', 'USD', 1, '{"Color":"Real 14K Gold Plated"}'::jsonb, ARRAY[]::TEXT[], 'Pandahall BeadGarden Store', 'https://www.aliexpress.com/store/1100788380', 'https://www.aliexpress.com/item/3256808037220444.html', '2025-02-10', '2025-02-10', 1754157191681, false, 'in_stock', true, 'chains', 'bracelet_chains'),
    ('1005007693425314', '12000041870926357', '8198269969028847', '8198269969178847', '20pcs Brass Beetle Charms Insect Pendants Real 18K Gold Plated for Earrings Necklace DIY Making Party Jewelry Supplies Gift', 'https://ae01.alicdn.com/kf/S6a3d92516cf64c739bb47beb80663375S.jpg_220x220.jpg', 9.58, '$9.58', '$9.58|9|58', 'USD', 1, '{"Color":"Real 18K Gold Plated","Size":"17x13.5x3mm"}'::jsonb, ARRAY[]::TEXT[], 'Pandahall BeadGarden Store', 'https://www.aliexpress.com/store/1100788380', 'https://www.aliexpress.com/item/3256807507110562.html', '2025-02-10', '2025-02-10', 1754157191681, false, 'in_stock', true, 'earrings', 'earring_components'),
    ('1005008303104031', '12000044552130310', '8198269969028847', '8198269969188847', '10pcs 3D Red Cherry Acrylic Charms Fruit Pendants with Alloy Enamel Green Leaf For DIY Bracelets Necklaces Jewelry Making Crafts', 'https://ae01.alicdn.com/kf/Sfb26c5052ead4ff5926abfcbf380ce8fI.jpg_220x220.jpg', 3.77, '$3.77', '$3.77|3|77', 'USD', 1, '{"Color":"Red"}'::jsonb, ARRAY[]::TEXT[], 'Pandahall BeadGarden Store', 'https://www.aliexpress.com/store/1100788380', 'https://www.aliexpress.com/item/3256808116789279.html', '2025-02-10', '2025-02-10', 1754157191681, false, 'in_stock', true, 'chains', 'bracelet_chains'),
    ('1005006823703020', '12000038419075087', '8198269968478847', '8198269968488847', '10PCS New Alloy Dripping Charm Charm Pendant Cartoon School of Magic Pendant DIY Keychain Earrings Jewelry Accessories', 'https://ae01.alicdn.com/kf/S41f5826733454b25ae7ed6fe51fc01f2p.jpg_220x220.jpg', 2.82, '$2.82', '$2.82|2|82', 'USD', 1, '{"Metal color":"3"}'::jsonb, ARRAY[]::TEXT[], 'Shop1102647665 Store', 'https://www.aliexpress.com/store/1103267489', 'https://www.aliexpress.com/item/3256806637388268.html', '2025-02-10', '2025-02-10', 1754157191681, false, 'in_stock', true, 'earrings', 'earring_components'),
    ('1005007453200700', '12000040821394229', '8198269968678847', '8198269968688847', '10pcs Anime Stitching Alloy Enamel Charms Fashion Shiny Metal Pendant DIY Bracelet Necklace Earring Jewelry Keychain Accessory', 'https://ae01.alicdn.com/kf/S1cb7373af9694151a5c27affbf7021fb5.jpg_220x220.jpg', 2.31, '$2.31', '$2.31|2|31', 'USD', 1, '{"Metal color":"MIXED"}'::jsonb, ARRAY[]::TEXT[], 'Shop1103080 Store', 'https://www.aliexpress.com/store/1103075421', 'https://www.aliexpress.com/item/3256807266885948.html', '2025-02-10', '2025-02-10', 1754157194902, false, 'in_stock', true, 'chains', 'necklace_chains'),
    ('1005007520240540', '12000041109283710', '8198269968718847', '8198269968728847', 'new lot 10pcs cartoon Anime cute Charms DIY Jewelry Making Pendant Necklace Pendant Handmade Material accessory kids lovel gift', 'https://ae01.alicdn.com/kf/S8f5f87fafd8c4116a8372cfc0fdc0396e.jpg_220x220.jpg', 2.98, '$2.98', '$2.98|2|98', 'USD', 1, '{}'::jsonb, ARRAY[]::TEXT[], 'gift1225 Store', 'https://www.aliexpress.com/store/1101283293', 'https://www.aliexpress.com/item/3256807333925788.html', '2025-02-10', '2025-02-10', 1754157191681, false, 'in_stock', true, 'charms', 'pendants'),
    ('1005005698972616', '12000038199146118', '8198269968738847', '8198269968748847', '10pcs Enamel Colorful Butterfly Charm for Jewelry Making Cute Necklace Pendant Bracelet Earring Accessories Diy Craft Supplies', 'https://ae01.alicdn.com/kf/S111f5a1d5fcb477d904652830c003acck.jpg_220x220.jpg', 2.03, '$2.03', '$2.03|2|03', 'USD', 1, '{"Metal color":"as picture 1834"}'::jsonb, ARRAY[]::TEXT[], 'Leslie Store', 'https://www.aliexpress.com/store/1102661127', 'https://www.aliexpress.com/item/3256805512657864.html', '2025-02-10', '2025-02-10', 1754157191681, false, 'in_stock', true, 'chains', 'bracelet_chains');



INSERT INTO inventory (
    aliexpress_product_id,
    aliexpress_sku_id,
    aliexpress_order_id,
    aliexpress_order_line_id,
    title,
    image_url,
    price_usd,
    original_price,
    price_info,
    currency,
    quantity,
    attributes,
    tags,
    store_name,
    store_page_url,
    product_url,
    order_date,
    order_date_iso,
    import_timestamp,
    ignore_export,
    status,
    is_active,
    category,
    subcategory
) VALUES 
    ('1005007699230258', '12000041903418533', '8198269968758847', '8198269968768847', '5 pcs Small High quality Spray paint Bow Charm Woman Earring Necklace Alloy Charms for Jewelry Making 32*19mm W310', 'https://ae01.alicdn.com/kf/S9875fad3890c41d98971d9d2ba6a9e93E.jpg_220x220.jpg', 0.93, '$0.93', '$0.93|0|93', 'USD', 1, '{"Metal color":"Peach-E","Ships From":"CHINA"}'::jsonb, ARRAY[]::TEXT[], 'YuenZ Jan Store', 'https://www.aliexpress.com/store/1100900887', 'https://www.aliexpress.com/item/3256807512915506.html', '2025-02-10', '2025-02-10', 1754157191681, false, 'in_stock', true, 'earrings', 'earring_components'),
    ('1005007055730714', '12000039256072737', '8198269968928847', '8198269968938847', '10pcs Cartoon Enamel Charms Characters Charm For Jewelry Making Earring Pendant Bracelet Necklace Accessorys', 'https://ae01.alicdn.com/kf/S9818e2b24c2c45778eb50c95a05e6db3C.jpg_220x220.jpg', 2.49, '$2.49', '$2.49|2|49', 'USD', 1, '{"Metal color":"VIOLET"}'::jsonb, ARRAY[]::TEXT[], 'World Peace Jewelry Store Store', 'https://www.aliexpress.com/store/1102985148', 'https://www.aliexpress.com/item/3256806869415962.html', '2025-02-10', '2025-02-10', 1754157194902, false, 'in_stock', true, 'chains', 'bracelet_chains'),
    ('1005006898466501', '12000038654582379', '8198269968928847', '8198269968948847', '10pcs Cartoon Charm for Jewelry Making Enamel Necklace Earring Bracelet Pendant Diy Accessories Alloy Metal Gold Plated', 'https://ae01.alicdn.com/kf/S09af1cdd6f8245d4a4e5fc9fb2c36ac3w.jpg_220x220.jpg', 2.73, '$2.73', '$2.73|2|73', 'USD', 1, '{"Metal color":"Champagne gold"}'::jsonb, ARRAY[]::TEXT[], 'World Peace Jewelry Store Store', 'https://www.aliexpress.com/store/1102985148', 'https://www.aliexpress.com/item/3256806712151749.html', '2025-02-10', '2025-02-10', 1754157194902, false, 'in_stock', true, 'chains', 'bracelet_chains'),
    ('1005005987553541', '12000035206835955', '8198269968928847', '8198269968958847', '10pcs Enamel Cartoon Charm for Jewelry Making Crafting Earring Pendant Bracelet Necklace Diy Animal Puppy Cute Dog Charms', 'https://ae01.alicdn.com/kf/Sb796ffbac35d4747af40245fa08c88d1H.jpg_220x220.jpg', 2.13, '$2.13', '$2.13|2|13', 'USD', 1, '{"Metal color":"4"}'::jsonb, ARRAY[]::TEXT[], 'World Peace Jewelry Store Store', 'https://www.aliexpress.com/store/1102985148', 'https://www.aliexpress.com/item/3256805801238789.html', '2025-02-10', '2025-02-10', 1754157194902, false, 'in_stock', true, 'chains', 'bracelet_chains'),
    ('1005005881244945', '12000034705575714', '8198269968928847', '8198269968968847', '10pcs Disney Mermaid Princess Elsa Charms Oil Drop Enamel Metal Charms DIY Jewelry Accessory', 'https://ae01.alicdn.com/kf/Sbc4519a012004b42ab68e1ae086f6bff6.jpg_220x220.jpg', 2.55, '$2.55', '$2.55|2|55', 'USD', 1, '{"Color":"10"}'::jsonb, ARRAY[]::TEXT[], 'World Peace Jewelry Store Store', 'https://www.aliexpress.com/store/1102985148', 'https://www.aliexpress.com/item/3256805694930193.html', '2025-02-10', '2025-02-10', 1754157194902, false, 'in_stock', true, 'charms', 'pendants'),
    ('1005005881244945', '12000034705575713', '8198269968928847', '8198269968978847', '10pcs Disney Mermaid Princess Elsa Charms Oil Drop Enamel Metal Charms DIY Jewelry Accessory', 'https://ae01.alicdn.com/kf/S91b9b068a97d4b56bf1a6ff6fbdc66d10.jpg_220x220.jpg', 2.52, '$2.52', '$2.52|2|52', 'USD', 1, '{"Color":"6"}'::jsonb, ARRAY[]::TEXT[], 'World Peace Jewelry Store Store', 'https://www.aliexpress.com/store/1102985148', 'https://www.aliexpress.com/item/3256805694930193.html', '2025-02-10', '2025-02-10', 1754157194902, false, 'in_stock', true, 'charms', 'pendants'),
    ('1005006673491380', '12000037981385940', '8198269968928847', '8198269968988847', '10pcs Alloy Charms Classic Cartoon Anime Animal Pendant Earrings DIY Keychain Bracelet Jewelry Accessories Cute Charms', 'https://ae01.alicdn.com/kf/Sf3a9774314b24ed883f591f2b2cd7341O.jpg_220x220.jpg', 2.62, '$2.62', '$2.62|2|62', 'USD', 1, '{"Metal color":"11"}'::jsonb, ARRAY[]::TEXT[], 'World Peace Jewelry Store Store', 'https://www.aliexpress.com/store/1102985148', 'https://www.aliexpress.com/item/3256806487176628.html', '2025-02-10', '2025-02-10', 1754157194902, false, 'in_stock', true, 'chains', 'bracelet_chains'),
    ('1005005987553541', '12000035206835956', '8198269968928847', '8198269968998847', '10pcs Enamel Cartoon Charm for Jewelry Making Crafting Earring Pendant Bracelet Necklace Diy Animal Puppy Cute Dog Charms', 'https://ae01.alicdn.com/kf/S46e0ab70a2d444c689dfb58a69838a767.jpg_220x220.jpg', 2.08, '$2.08', '$2.08|2|08', 'USD', 1, '{"Metal color":"6"}'::jsonb, ARRAY[]::TEXT[], 'World Peace Jewelry Store Store', 'https://www.aliexpress.com/store/1102985148', 'https://www.aliexpress.com/item/3256805801238789.html', '2025-02-10', '2025-02-10', 1754157194902, false, 'in_stock', true, 'chains', 'bracelet_chains'),
    ('1005006073216738', '12000035606706036', '8198269968498847', '8198269968508847', '6pcs Tiny Olive Charms Glass Green Fruit Pendant Ornaments Diy Female Fashion Jewelry Accessories for Handmade Earrings Making', 'https://ae01.alicdn.com/kf/S996af8a2cea749059497b026ec893667n.jpg_220x220.jpg', 4.91, '$4.91', '$4.91|4|91', 'USD', 1, '{"Color":"green","Size":"about 1.6x1.2cm 6pcs","Ships From":"CHINA"}'::jsonb, ARRAY[]::TEXT[], 'JianHu sumaitong electronic commerce co., LTD Store', 'https://www.aliexpress.com/store/1101221383', 'https://www.aliexpress.com/item/3256805886901986.html', '2025-02-10', '2025-02-10', 1754157191681, false, 'in_stock', true, 'earrings', 'earring_components'),
    ('1005001695651469', '12000026877447160', '8198269969228847', '8198269969238847', 'Pig nose Soda Cap Twin Hole Brass Metal Connect Attachment,Gold Plated Colour,Fashion Trendy Handmade Jewelry Findings , 1pc M59', 'https://ae01.alicdn.com/kf/H5f7b6040e54941e09dbbaa2e9aa048e1M.jpg_220x220.jpg', 1.31, '$1.31', '$1.31|1|31', 'USD', 8, '{"Color":"M596558-White Gold"}'::jsonb, ARRAY[]::TEXT[], 'Beadsfeeder Factory Store', 'https://www.aliexpress.com/store/1101553351', 'https://www.aliexpress.com/item/3256801509336717.html', '2025-02-10', '2025-02-10', 1754157191681, false, 'in_stock', true, 'findings', 'connectors');



INSERT INTO inventory (
    aliexpress_product_id,
    aliexpress_sku_id,
    aliexpress_order_id,
    aliexpress_order_line_id,
    title,
    image_url,
    price_usd,
    original_price,
    price_info,
    currency,
    quantity,
    attributes,
    tags,
    store_name,
    store_page_url,
    product_url,
    order_date,
    order_date_iso,
    import_timestamp,
    ignore_export,
    status,
    is_active,
    category,
    subcategory
) VALUES 
    ('1005001695651469', '12000026877447159', '8198269969228847', '8198269969248847', 'Pig nose Soda Cap Twin Hole Brass Metal Connect Attachment,Gold Plated Colour,Fashion Trendy Handmade Jewelry Findings , 1pc M59', 'https://ae01.alicdn.com/kf/H33216c018fc54795b4a00099bb4a00f5n.jpg_220x220.jpg', 1.25, '$1.25', '$1.25|1|25', 'USD', 10, '{"Color":"M596558-Gold"}'::jsonb, ARRAY[]::TEXT[], 'Beadsfeeder Factory Store', 'https://www.aliexpress.com/store/1101553351', 'https://www.aliexpress.com/item/3256801509336717.html', '2025-02-10', '2025-02-10', 1754157191681, false, 'in_stock', true, 'findings', 'connectors'),
    ('33038061710', '67341957144', '8198269968638847', '8198269968648847', '10pcs Girl Charm for Jewelry Making Enamel Pendant Necklace Bracelet Accessories Zinc Alloy Gold Plated', 'https://ae01.alicdn.com/kf/S2c3e13c51836435f8a8990af5470ab51U.jpg_220x220.jpg', 2.17, '$2.17', '$2.17|2|17', 'USD', 1, '{"Metal color":"yellow"}'::jsonb, ARRAY[]::TEXT[], 'Mrwangs Store', 'https://www.aliexpress.com/store/1100936480', 'https://www.aliexpress.com/item/2251832851746958.html', '2025-02-10', '2025-02-10', 1754157194902, false, 'in_stock', true, 'chains', 'bracelet_chains'),
    ('1005006053867481', '12000035514548790', '8198269968638847', '8198269968658847', '10pcs Crystal Cartoon Charm for Jewelry Making Necklace Earring Pendant Diy Accessories Craft Supplies', 'https://ae01.alicdn.com/kf/Sa73e96662b6a484fb296bc24520552dbY.jpg_220x220.jpg', 2.18, '$2.18', '$2.18|2|18', 'USD', 1, '{"Metal color":"mix-10pcs"}'::jsonb, ARRAY[]::TEXT[], 'Mrwangs Store', 'https://www.aliexpress.com/store/1100936480', 'https://www.aliexpress.com/item/3256805867552729.html', '2025-02-10', '2025-02-10', 1754157194902, false, 'in_stock', true, 'earrings', 'earring_components'),
    ('1005007502200852', '12000041045754316', '8198269968638847', '8198269968668847', '10pcs Cartoon Anime Princess Charm Jewelry Accessories Enamel Necklace Earring Pendant Diy Making Alloy Metal Gold Plated', 'https://ae01.alicdn.com/kf/S7d43b14accce43a48224d0e316b6ce6ap.jpg_220x220.jpg', 2.05, '$2.05', '$2.05|2|05', 'USD', 1, '{"Metal color":"mix-10pcs"}'::jsonb, ARRAY[]::TEXT[], 'Mrwangs Store', 'https://www.aliexpress.com/store/1100936480', 'https://www.aliexpress.com/item/3256807315886100.html', '2025-02-10', '2025-02-10', 1754157194902, false, 'in_stock', true, 'earrings', 'earring_components'),
    ('1005005881252968', '12000034721747507', '8198269968908847', '8198269968918847', '10PCS Disney Marie Cat Cartoon Anime DIY Jewelry Accessories Pendant Necklace Pendant Handmade Material', 'https://ae01.alicdn.com/kf/Sf5e3936844964b61ba6882d078508446F.jpg_220x220.jpg', 2.12, '$2.12', '$2.12|2|12', 'USD', 1, '{"Color":"2"}'::jsonb, ARRAY[]::TEXT[], 'World Peace Jewelry Store Store', 'https://www.aliexpress.com/store/1102985148', 'https://www.aliexpress.com/item/3256805694938216.html', '2025-02-10', '2025-02-10', 1754157194902, false, 'in_stock', true, 'charms', 'pendants'),
    ('1005006295071982', '12000037984276711', '8198269969418847', '8198269969428847', '10PCS Cartoon Pendant Key Chain Small Pendant Necklace DIY Jewelry Accessories Alloy Drip Oil charms', 'https://ae01.alicdn.com/kf/S87eda18f2a1549cc9c21c3c2bf4e5b8as.jpg_220x220.jpg', 2.59, '$2.59', '$2.59|2|59', 'USD', 1, '{"Metal color":"11"}'::jsonb, ARRAY[]::TEXT[], 'Shop1102350389 Store', 'https://www.aliexpress.com/store/1103187812', 'https://www.aliexpress.com/item/3256806108757230.html', '2025-02-10', '2025-02-10', 1754157194902, false, 'in_stock', true, 'chains', 'necklace_chains'),
    ('1005006179594101', '12000036168037053', '8197085318098847', '8197085318108847', 'Fall New 925 Silver Plated MINISO Marvel Star Wars Rescuers Pendant Charm Fit Original Pandora Bracelet Jewelry DIY', 'https://ae01.alicdn.com/kf/Sdb62794789894b60816159b1badbc108j.jpg_220x220.jpg', 1.99, '$1.99', '$1.99|1|99', 'USD', 1, '{"Main Stone Color":"LMP79"}'::jsonb, ARRAY[]::TEXT[], '925 Silver Disneycharm Store', 'https://www.aliexpress.com/store/1102724363', 'https://www.aliexpress.com/item/3256805993279349.html', '2025-01-11', '2025-01-11', 1754157194902, false, 'in_stock', true, 'chains', 'bracelet_chains'),
    ('1005006179603084', '12000039864677868', '8197085318098847', '8197085318118847', '925 Sterling Silver Beads Minnie Mouse Halloween Pumpkin Pixar Coco Miguel Dante Skull Charm Fit Pandora Bracelets DIY', 'https://ae01.alicdn.com/kf/S99419ce2923a4608a410066cc80d842ai.jpg_220x220.jpg', 1.59, '$1.59', '$1.59|1|59', 'USD', 1, '{"Color":"LMP166"}'::jsonb, ARRAY[]::TEXT[], '925 Silver Disneycharm Store', 'https://www.aliexpress.com/store/1102724363', 'https://www.aliexpress.com/item/3256805993288332.html', '2025-01-11', '2025-01-11', 1754157194902, false, 'in_stock', true, 'chains', 'bracelet_chains'),
    ('1005006469461598', '12000037311119252', '8197085318128847', '8197085318138847', 'New 925 Sterling Silver Disney Mermaid Princess Elsa dress Charms Bead Fit Original Bracelets Pendant Charm DIY Women Jewelry', 'https://ae01.alicdn.com/kf/S3d88ff77e754465483d92e47203b0a37o.jpg_220x220.jpg', 1.99, '$1.99', '$1.99|1|99', 'USD', 1, '{"Color":"A1480"}'::jsonb, ARRAY[]::TEXT[], 'Shop1103224095 Store', 'https://www.aliexpress.com/store/1103228092', 'https://www.aliexpress.com/item/3256806809922200.html', '2025-01-11', '2025-01-11', 1754157194902, false, 'in_stock', true, 'chains', 'bracelet_chains'),
    ('1005006268945666', '12000036543118124', '8197085318128847', '8197085318148847', '100% 925 Sterling Silver Disney Park 2024 Minnie Mickey Charm Beads Fit Original Pandora Bracelet DIY Jewelry Christmas Gift', 'https://ae01.alicdn.com/kf/S9a8e7655ddc94dbbb62deab594f4668e5.jpg_220x220.jpg', 1.99, '$1.99', '$1.99|1|99', 'USD', 1, '{"Color":"F785"}'::jsonb, ARRAY[]::TEXT[], 'Shop1103224095 Store', 'https://www.aliexpress.com/store/1103228092', 'https://www.aliexpress.com/item/3256806824013756.html', '2025-01-11', '2025-01-11', 1754157194902, false, 'in_stock', true, 'chains', 'bracelet_chains');



INSERT INTO inventory (
    aliexpress_product_id,
    aliexpress_sku_id,
    aliexpress_order_id,
    aliexpress_order_line_id,
    title,
    image_url,
    price_usd,
    original_price,
    price_info,
    currency,
    quantity,
    attributes,
    tags,
    store_name,
    store_page_url,
    product_url,
    order_date,
    order_date_iso,
    import_timestamp,
    ignore_export,
    status,
    is_active,
    category,
    subcategory
) VALUES 
    ('1005006339747363', '12000036819604403', '8197085318158847', '8197085318168847', 'Disney 100th Princess Pumpkin Cart Mickey Minnie Dumbo Charm Stitch Beads Fit Original Pandora Bracelets DIY Jewelry Gifts Toy', 'https://ae01.alicdn.com/kf/S90576f7b0905493f8b3365f19a82fad1I.png_220x220.png', 0.99, '$0.99', '$0.99|0|99', 'USD', 1, '{"Color":"LMB10"}'::jsonb, ARRAY[]::TEXT[], 'Board Game Toys Store', 'https://www.aliexpress.com/store/1102875956', 'https://www.aliexpress.com/item/3256806675436752.html', '2025-01-11', '2025-01-11', 1754157194902, false, 'in_stock', true, 'chains', 'bracelet_chains'),
    ('1005006339747363', '12000036819604415', '8197085318158847', '8197085318178847', 'Disney 100th Princess Pumpkin Cart Mickey Minnie Dumbo Charm Stitch Beads Fit Original Pandora Bracelets DIY Jewelry Gifts Toy', 'https://ae01.alicdn.com/kf/S09355056b9dd49078cd148104ed33fe2E.png_220x220.png', 0.79, '$0.79', '$0.79|0|79', 'USD', 1, '{"Color":"LMB22"}'::jsonb, ARRAY[]::TEXT[], 'Board Game Toys Store', 'https://www.aliexpress.com/store/1102875956', 'https://www.aliexpress.com/item/3256806675436752.html', '2025-01-11', '2025-01-11', 1754157194902, false, 'in_stock', true, 'chains', 'bracelet_chains'),
    ('1005008025464872', '12000043304775237', '8197085318188847', '8197085318198847', 'New 925 Sterling Silver Toy Story Woody Buzz Lightyear Jessie Charm Beaded Fit Original Pandora Bracelet DIY Ladies Girl Jewelry', 'https://ae01.alicdn.com/kf/S5fe9e93834a34cfd895d4d1fd41db95dI.jpg_220x220.jpg', 1.79, '$1.79', '$1.79|1|79', 'USD', 1, '{"Color":"B1443"}'::jsonb, ARRAY[]::TEXT[], 'Shop1103224095 Store', 'https://www.aliexpress.com/store/1103228092', 'https://www.aliexpress.com/item/3256807839150120.html', '2025-01-11', '2025-01-11', 1754157194902, false, 'in_stock', true, 'chains', 'bracelet_chains'),
    ('1005008025464872', '12000043304775242', '8197085318188847', '8197085318208847', 'New 925 Sterling Silver Toy Story Woody Buzz Lightyear Jessie Charm Beaded Fit Original Pandora Bracelet DIY Ladies Girl Jewelry', 'https://ae01.alicdn.com/kf/S6d247a0ad84c4341ab20babc535c9c96Z.jpg_220x220.jpg', 1.99, '$1.99', '$1.99|1|99', 'USD', 1, '{"Color":"F224"}'::jsonb, ARRAY[]::TEXT[], 'Shop1103224095 Store', 'https://www.aliexpress.com/store/1103228092', 'https://www.aliexpress.com/item/3256807839150120.html', '2025-01-11', '2025-01-11', 1754157194902, false, 'in_stock', true, 'chains', 'bracelet_chains'),
    ('1005007585488270', '12000041395921402', '8197085318218847', '8197085318228847', 'Deadpool & Wolverine Jewellery Findings Loki Avengers Charm Chain Beaded Fit Original Pandora Bracelet DIY Ladies Jewelry Gift', 'https://ae01.alicdn.com/kf/S7ad8f1493ee94a599442213c596a5e40I.jpg_220x220.jpg', 1.19, '$1.19', '$1.19|1|19', 'USD', 1, '{"Color":"27"}'::jsonb, ARRAY[]::TEXT[], 'Board Game Toys Store', 'https://www.aliexpress.com/store/1102875956', 'https://www.aliexpress.com/item/3256807399173518.html', '2025-01-11', '2025-01-11', 1754157194902, false, 'in_stock', true, 'chains', 'bracelet_chains'),
    ('1005007585488270', '12000041395921401', '8197085318218847', '8197085318238847', 'Deadpool & Wolverine Jewellery Findings Loki Avengers Charm Chain Beaded Fit Original Pandora Bracelet DIY Ladies Jewelry Gift', 'https://ae01.alicdn.com/kf/S53656b627c6f42898728afcc613c6456r.jpg_220x220.jpg', 1.19, '$1.19', '$1.19|1|19', 'USD', 1, '{"Color":"26"}'::jsonb, ARRAY[]::TEXT[], 'Board Game Toys Store', 'https://www.aliexpress.com/store/1102875956', 'https://www.aliexpress.com/item/3256807399173518.html', '2025-01-11', '2025-01-11', 1754157194902, false, 'in_stock', true, 'chains', 'bracelet_chains'),
    ('1005006544150456', '12000037743281359', '8197084274098847', '8197084274108847', 'New Diy 925 Sterling Silver Plated Boy Girl Train Bead Fit Original European Charms Bracelet Necklace For Women Fashion', 'https://ae01.alicdn.com/kf/S6ac5d1b7aa354ba7b5e7bc70a169aa77y.jpg_220x220.jpg', 1.99, '$1.99', '$1.99|1|99', 'USD', 2, '{"Color":"P884"}'::jsonb, ARRAY[]::TEXT[], 'Shop3629069 Store', 'https://www.aliexpress.com/store/1103505118', 'https://www.aliexpress.com/item/3256806811054022.html', '2025-01-11', '2025-01-11', 1754157202332, false, 'in_stock', true, 'chains', 'bracelet_chains'),
    ('1005006544150456', '12000037743281345', '8197084274098847', '8197084274118847', 'New Diy 925 Sterling Silver Plated Boy Girl Train Bead Fit Original European Charms Bracelet Necklace For Women Fashion', 'https://ae01.alicdn.com/kf/S4007185fd7b447d1bf6a6f825d6cd364V.jpg_220x220.jpg', 1.79, '$1.79', '$1.79|1|79', 'USD', 2, '{"Color":"P287"}'::jsonb, ARRAY[]::TEXT[], 'Shop3629069 Store', 'https://www.aliexpress.com/store/1103505118', 'https://www.aliexpress.com/item/3256806811054022.html', '2025-01-11', '2025-01-11', 1754157202332, false, 'in_stock', true, 'chains', 'bracelet_chains'),
    ('1005006544150456', '12000037743281358', '8197084274098847', '8197084274128847', 'New Diy 925 Sterling Silver Plated Boy Girl Train Bead Fit Original European Charms Bracelet Necklace For Women Fashion', 'https://ae01.alicdn.com/kf/S6091c92602564f189449d35a2753dac9C.jpg_220x220.jpg', 1.79, '$1.79', '$1.79|1|79', 'USD', 2, '{"Color":"P862"}'::jsonb, ARRAY[]::TEXT[], 'Shop3629069 Store', 'https://www.aliexpress.com/store/1103505118', 'https://www.aliexpress.com/item/3256806811054022.html', '2025-01-11', '2025-01-11', 1754157202332, false, 'in_stock', true, 'chains', 'bracelet_chains'),
    ('1005006544150456', '12000037743281356', '8197084274098847', '8197084274138847', 'New Diy 925 Sterling Silver Plated Boy Girl Train Bead Fit Original European Charms Bracelet Necklace For Women Fashion', 'https://ae01.alicdn.com/kf/S370da38223ae47a58b268196aa61999be.jpg_220x220.jpg', 2, '$2.00', '$2.00|2|00', 'USD', 2, '{"Color":"P523"}'::jsonb, ARRAY[]::TEXT[], 'Shop3629069 Store', 'https://www.aliexpress.com/store/1103505118', 'https://www.aliexpress.com/item/3256806811054022.html', '2025-01-11', '2025-01-11', 1754157202332, false, 'in_stock', true, 'chains', 'bracelet_chains');



INSERT INTO inventory (
    aliexpress_product_id,
    aliexpress_sku_id,
    aliexpress_order_id,
    aliexpress_order_line_id,
    title,
    image_url,
    price_usd,
    original_price,
    price_info,
    currency,
    quantity,
    attributes,
    tags,
    store_name,
    store_page_url,
    product_url,
    order_date,
    order_date_iso,
    import_timestamp,
    ignore_export,
    status,
    is_active,
    category,
    subcategory
) VALUES 
    ('1005006544150456', '12000037743281353', '8197084274098847', '8197084274148847', 'New Diy 925 Sterling Silver Plated Boy Girl Train Bead Fit Original European Charms Bracelet Necklace For Women Fashion', 'https://ae01.alicdn.com/kf/S4ee0b1c77fc5472d8263c4b0efe0153cT.jpg_220x220.jpg', 1.99, '$1.99', '$1.99|1|99', 'USD', 2, '{"Color":"P505"}'::jsonb, ARRAY[]::TEXT[], 'Shop3629069 Store', 'https://www.aliexpress.com/store/1103505118', 'https://www.aliexpress.com/item/3256806811054022.html', '2025-01-11', '2025-01-11', 1754157202332, false, 'in_stock', true, 'chains', 'bracelet_chains'),
    ('1005007800496164', '12000042245164960', '8196458599118847', '8196458599128847', 'Plush Doll Soft Toys for Baby  Ballerina Series Doll Perfect Gift for 1-6 Year-Old Toddlers', 'https://ae01.alicdn.com/kf/A84e9807138ad46b2a82b98bedff2c130e.jpg_220x220.jpg', 18.05, '$18.05', '$18.05|18|05', 'USD', 1, '{"Color":"Brown Purple","Ships From":"United States"}'::jsonb, ARRAY[]::TEXT[], 'Gloveleya Doll Store', 'https://www.aliexpress.com/store/1103839030', 'https://www.aliexpress.com/item/3256807614181412.html', '2024-12-21', '2024-12-21', 1754157202332, false, 'in_stock', true, 'earrings', 'earring_components'),
    ('32319034244', '64370453875', '8196483037318847', '8196483037328847', '20pcs Charms Indian Arrowhead Dagger 28x15mm Handmade Pendant Making fit,Vintage TibetanBronze,DIY For Necklace', 'https://ae01.alicdn.com/kf/HTB1x6JYSXXXXXbyXFXXq6xXFXXXx.jpg_220x220.jpg', 1.63, '$1.63', '$1.63|1|63', 'USD', 1, '{"Metal color":"antique silver"}'::jsonb, ARRAY[]::TEXT[], 'eunwol Official Store', 'https://www.aliexpress.com/store/1101048959', 'https://www.aliexpress.com/item/2251832132719492.html', '2024-12-01', '2024-12-01', 1754157202332, false, 'in_stock', true, 'charms', 'pendants'),
    ('32319034244', '64370453873', '8196483037318847', '8196483037338847', '20pcs Charms Indian Arrowhead Dagger 28x15mm Handmade Pendant Making fit,Vintage TibetanBronze,DIY For Necklace', 'https://ae01.alicdn.com/kf/HTB1DhJQSXXXXXcPXFXXq6xXFXXXB.jpg_220x220.jpg', 1.62, '$1.62', '$1.62|1|62', 'USD', 1, '{"Metal color":"gold"}'::jsonb, ARRAY[]::TEXT[], 'eunwol Official Store', 'https://www.aliexpress.com/store/1101048959', 'https://www.aliexpress.com/item/2251832132719492.html', '2024-12-01', '2024-12-01', 1754157202332, false, 'in_stock', true, 'charms', 'pendants'),
    ('32314545035', '53226516045', '8196483037318847', '8196483037348847', '20pcs Charms Double Sided Lovely Dog 17x12mm Antique Silver Color Pendants Making DIY Handmade Tibetan Silver Color Jewelry', 'https://ae01.alicdn.com/kf/HTB1WjhqSXXXXXaOaXXXq6xXFXXX9.jpg_220x220.jpg', 1.58, '$1.58', '$1.58|1|58', 'USD', 1, '{}'::jsonb, ARRAY[]::TEXT[], 'eunwol Official Store', 'https://www.aliexpress.com/store/1101048959', 'https://www.aliexpress.com/item/2251832128230283.html', '2024-12-01', '2024-12-01', 1754157202332, false, 'in_stock', true, 'charms', 'pendants'),
    ('1005007452927309', '12000040818105557', '8196483037638847', '8196483037648847', 'Hot Sale Bluey And Bingo Family Members PVC Tattoo Stickers Water Transfer Disposable Stickers Kids Birthday Party Gifts Toys', 'https://ae01.alicdn.com/kf/S24797303c54248e9aa5a567f11ba5180i.jpg_220x220.jpg', 1.85, '$1.85', '$1.85|1|85', 'USD', 2, '{"Color":"09"}'::jsonb, ARRAY[]::TEXT[], 'Pokemon Store', 'https://www.aliexpress.com/store/1101989794', 'https://www.aliexpress.com/item/3256807266612557.html', '2024-12-01', '2024-12-01', 1754157202332, false, 'in_stock', true, 'components', 'miscellaneous'),
    ('1005006937677376', '12000038789258672', '8196483037658847', '8196483037668847', '5pcs 15x16mm Computer Charms Pendants For Earrings Crafts Accessories Trendy Jewerly Antique Silver Color', 'https://ae01.alicdn.com/kf/S492de4709cab408fbb93bef0fdf402406.jpg_220x220.jpg', 1.13, '$1.13', '$1.13|1|13', 'USD', 1, '{}'::jsonb, ARRAY[]::TEXT[], 'YanLove Store', 'https://www.aliexpress.com/store/1101691680', 'https://www.aliexpress.com/item/3256806751362624.html', '2024-12-01', '2024-12-01', 1754157202332, false, 'in_stock', true, 'earrings', 'earring_components'),
    ('1005007003823636', '12000039418840555', '8196483037928847', '8196483037938847', 'New 925 Sterling Silver Bead Labrador Puppy Dog Dangle Charm ​DIY fine beads Fit Original Pandora Charms Bracelet Jewelry', 'https://ae01.alicdn.com/kf/Hb4c12aff1298493490070809aea86317E.jpg_220x220.jpg', 2.01, '$2.01', '$2.01|2|01', 'USD', 6, '{"Gem Color":"A1"}'::jsonb, ARRAY[]::TEXT[], '1102773486 Store', 'https://www.aliexpress.com/store/1103740804', 'https://www.aliexpress.com/item/3256806817508884.html', '2024-12-01', '2024-12-01', 1754157202332, false, 'in_stock', true, 'chains', 'bracelet_chains'),
    ('1005004875803481', '12000030851759990', '8196483037948847', '8196483037958847', 'Kawaii Valentine''s Day Heart Charms for Jewelry Making Diy Earring Bracelet Pendant Accessories Findings Wholesale Bulk', 'https://ae01.alicdn.com/kf/Sb2bbf4ed12ab489a9e3a3b690b8ebab9F.jpg_220x220.jpg', 3.28, '$3.28', '$3.28|3|28', 'USD', 1, '{"Metal color":"mix","Ships From":"CHINA"}'::jsonb, ARRAY[]::TEXT[], 'remember my Store', 'https://www.aliexpress.com/store/1101445566', 'https://www.aliexpress.com/item/3256804689488729.html', '2024-12-01', '2024-12-01', 1754157202332, false, 'in_stock', true, 'chains', 'bracelet_chains'),
    ('1005003736927612', '12000026983949941', '8196483037948847', '8196483037968847', '10pcs/Pack Cola Soda Drink Charms for Earring Bracelet Pendant Jewelry Findings Phone Making', 'https://ae01.alicdn.com/kf/H5ca34ce6f0d64b9a8d9bb42df67598b94.jpg_220x220.jpg', 3.38, '$3.38', '$3.38|3|38', 'USD', 2, '{"Metal color":"3","Ships From":"CHINA"}'::jsonb, ARRAY[]::TEXT[], 'remember my Store', 'https://www.aliexpress.com/store/1101445566', 'https://www.aliexpress.com/item/3256803550612860.html', '2024-12-01', '2024-12-01', 1754157202332, false, 'in_stock', true, 'chains', 'bracelet_chains');



INSERT INTO inventory (
    aliexpress_product_id,
    aliexpress_sku_id,
    aliexpress_order_id,
    aliexpress_order_line_id,
    title,
    image_url,
    price_usd,
    original_price,
    price_info,
    currency,
    quantity,
    attributes,
    tags,
    store_name,
    store_page_url,
    product_url,
    order_date,
    order_date_iso,
    import_timestamp,
    ignore_export,
    status,
    is_active,
    category,
    subcategory
) VALUES 
    ('1005004850446714', '12000030740656077', '8196483037978847', '8196483037988847', 'Cute Princess Charms For Bracelets Key Chain Earring Jewelry Making DIY Craft Pendants Handmade', 'https://ae01.alicdn.com/kf/Sfa2a1e2bd38f4e97a0d8954e5e3da1d0q.jpg_220x220.jpg', 3.97, '$3.97', '$3.97|3|97', 'USD', 1, '{"Metal color":"mix 10pairs","Ships From":"CHINA"}'::jsonb, ARRAY[]::TEXT[], 'daydayup Store', 'https://www.aliexpress.com/store/1101148443', 'https://www.aliexpress.com/item/3256804664131962.html', '2024-12-01', '2024-12-01', 1754157202332, false, 'in_stock', true, 'chains', 'bracelet_chains'),
    ('1005003355929663', '12000032569410780', '8196483038218847', '8196483038228847', 'Leopard Lion Mouse Rabbit Snake Bear White Elephant Charm Pendant,18K Gold Animal Necklace Bracelet Handmade Jewelry Supply M64', 'https://ae01.alicdn.com/kf/S877e92dba10b4889958bb779d7dbb3d0t.jpg_220x220.jpg', 3.78, '$3.78', '$3.78|3|78', 'USD', 6, '{"Color":"M649431L1-Gold"}'::jsonb, ARRAY[]::TEXT[], 'Beadsfeeder Factory Store', 'https://www.aliexpress.com/store/1101553351', 'https://www.aliexpress.com/item/3256803169614911.html', '2024-12-01', '2024-12-01', 1754157202332, false, 'in_stock', true, 'chains', 'bracelet_chains'),
    ('1005007586549736', '12000041402078399', '8196483038238847', '8196483038248847', 'Trendy Sports Shirt Ice Skates Dumbbell Sneakers Baseball Football Boots Charm Pendant,18K Gold DIY Necklace Jewelry Supply K85', 'https://ae01.alicdn.com/kf/S69a7dd6e3b6b410ca7626fce9c40496eJ.jpg_220x220.jpg', 0.42, '$0.42', '$0.42|0|42', 'USD', 6, '{"Color":"K858666L1"}'::jsonb, ARRAY[]::TEXT[], 'Beadsfeeder Factory Store', 'https://www.aliexpress.com/store/1101553351', 'https://www.aliexpress.com/item/3256807400234984.html', '2024-12-01', '2024-12-01', 1754157202332, false, 'in_stock', true, 'charms', 'pendants'),
    ('1005007586549736', '12000041402078402', '8196483038238847', '8196483038258847', 'Trendy Sports Shirt Ice Skates Dumbbell Sneakers Baseball Football Boots Charm Pendant,18K Gold DIY Necklace Jewelry Supply K85', 'https://ae01.alicdn.com/kf/S4475795c52d14e63a7d3a61cf61810cbM.jpg_220x220.jpg', 0.31, '$0.31', '$0.31|0|31', 'USD', 6, '{"Color":"K858430H1"}'::jsonb, ARRAY[]::TEXT[], 'Beadsfeeder Factory Store', 'https://www.aliexpress.com/store/1101553351', 'https://www.aliexpress.com/item/3256807400234984.html', '2024-12-01', '2024-12-01', 1754157202332, false, 'in_stock', true, 'charms', 'pendants'),
    ('1005007586549736', '12000041402078411', '8196483038238847', '8196483038268847', 'Trendy Sports Shirt Ice Skates Dumbbell Sneakers Baseball Football Boots Charm Pendant,18K Gold DIY Necklace Jewelry Supply K85', 'https://ae01.alicdn.com/kf/S582a97dd37d04a6693d6710c8b953b2cQ.jpg_220x220.jpg', 0.59, '$0.59', '$0.59|0|59', 'USD', 10, '{"Color":"K858683L1"}'::jsonb, ARRAY[]::TEXT[], 'Beadsfeeder Factory Store', 'https://www.aliexpress.com/store/1101553351', 'https://www.aliexpress.com/item/3256807400234984.html', '2024-12-01', '2024-12-01', 1754157202332, false, 'in_stock', true, 'charms', 'pendants');


-- Validate the import
SELECT 
    'Import Summary' as report_type,
    COUNT(*) as total_items,
    COUNT(DISTINCT category) as categories,
    COUNT(DISTINCT store_name) as stores,
    ROUND(AVG(price_usd), 2) as avg_price,
    SUM(quantity) as total_quantity
FROM inventory
WHERE created_at >= NOW() - INTERVAL '1 hour';

-- Category breakdown
SELECT 
    'Category Breakdown' as report_type,
    category,
    subcategory,
    COUNT(*) as item_count,
    ROUND(AVG(price_usd), 2) as avg_price,
    SUM(quantity) as total_quantity
FROM inventory
WHERE created_at >= NOW() - INTERVAL '1 hour'
GROUP BY category, subcategory
ORDER BY category, subcategory;

COMMIT;
