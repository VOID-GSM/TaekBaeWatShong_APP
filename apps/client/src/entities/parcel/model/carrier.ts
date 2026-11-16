/**
 * 등록 화면에서 고를 수 있는 택배사. 값은 백엔드 `deliveryCompany` 로 그대로 보내며,
 * 백엔드가 이름으로 택배사를 인식한다(CJ대한통운·한진·롯데·우체국·로젠).
 */
export const PARCEL_CARRIERS = ['CJ대한통운', '한진', '롯데', '우체국', '로젠'] as const;

export type ParcelCarrier = (typeof PARCEL_CARRIERS)[number];
