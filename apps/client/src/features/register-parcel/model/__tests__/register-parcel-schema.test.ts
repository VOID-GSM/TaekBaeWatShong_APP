import { registerParcelSchema } from '../register-parcel-schema';

describe('registerParcelSchema', () => {
  it('운송장 번호의 공백을 지우고 빈 상품명은 보내지 않는다', () => {
    expect(
      registerParcelSchema.parse({
        invoiceNumber: '6041 2237 8890',
        deliveryCompany: 'CJ대한통운',
        alias: '  ',
      }),
    ).toEqual({ invoiceNumber: '604122378890', deliveryCompany: 'CJ대한통운', alias: undefined });
  });

  it('운송장 번호가 너무 짧으면 거절한다', () => {
    const result = registerParcelSchema.safeParse({
      invoiceNumber: '1234',
      deliveryCompany: '한진',
      alias: '',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('운송장 번호를 다시 확인해 주세요.');
  });

  it('택배사를 고르지 않으면 거절한다', () => {
    const result = registerParcelSchema.safeParse({
      invoiceNumber: '604122378890',
      deliveryCompany: undefined,
      alias: '',
    });

    expect(result.error?.issues[0]?.message).toBe('택배사를 선택해 주세요.');
  });
});
