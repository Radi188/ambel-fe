import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../../services/apiClient';

// PaymentMethod: cash | card | qr
// PaymentStatus: pending | paid | refunded

export const paymentsApi = createApi({
  reducerPath: 'paymentsApi',
  baseQuery:   axiosBaseQuery(),
  tagTypes:    ['Payment'],
  endpoints:   (builder) => ({

    // POST /payments
    // body: { order: string (MongoId), amount: number, method: 'cash'|'card'|'qr', cashReceived?: number, note?: string }
    // branch injected from JWT
    createPayment: builder.mutation({
      query: (body) => ({ url: '/payments', method: 'POST', data: body }),
      invalidatesTags: [{ type: 'Payment', id: 'LIST' }],
    }),

    // GET /payments?status=<PaymentStatus>
    getPayments: builder.query({
      query: (params) => ({ url: '/payments', params }),
      providesTags: (result) =>
        result
          ? [...result.map(({ _id }) => ({ type: 'Payment', id: _id })), { type: 'Payment', id: 'LIST' }]
          : [{ type: 'Payment', id: 'LIST' }],
    }),

    // GET /payments/order/:orderId
    getPaymentByOrder: builder.query({
      query: (orderId) => ({ url: `/payments/order/${orderId}` }),
      providesTags: (_r, _e, orderId) => [{ type: 'Payment', id: `order-${orderId}` }],
    }),

    // GET /payments/:id
    getPaymentById: builder.query({
      query: (id) => ({ url: `/payments/${id}` }),
      providesTags: (_r, _e, id) => [{ type: 'Payment', id }],
    }),

    // PATCH /payments/:id/refund  body: { note? }
    refundPayment: builder.mutation({
      query: ({ id, note }) => ({
        url:    `/payments/${id}/refund`,
        method: 'PATCH',
        data:   { note },
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Payment', id }, { type: 'Payment', id: 'LIST' }],
    }),

  }),
});

export const {
  useCreatePaymentMutation,
  useGetPaymentsQuery,
  useGetPaymentByOrderQuery,
  useGetPaymentByIdQuery,
  useRefundPaymentMutation,
} = paymentsApi;
