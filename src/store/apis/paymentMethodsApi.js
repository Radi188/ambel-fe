import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../../services/apiClient';

export const paymentMethodsApi = createApi({
  reducerPath: 'paymentMethodsApi',
  baseQuery:   axiosBaseQuery(),
  tagTypes:    ['PaymentMethod'],
  endpoints:   (builder) => ({

    // GET /payment-methods?activeOnly=true  (cashier+)
    getPaymentMethods: builder.query({
      query: (params) => ({ url: '/payment-methods', params }),
      providesTags: (result) =>
        result
          ? [...result.map(({ _id }) => ({ type: 'PaymentMethod', id: _id })), { type: 'PaymentMethod', id: 'LIST' }]
          : [{ type: 'PaymentMethod', id: 'LIST' }],
    }),

    // GET /payment-methods/:id  (cashier+)
    getPaymentMethodById: builder.query({
      query: (id) => ({ url: `/payment-methods/${id}` }),
      providesTags: (_r, _e, id) => [{ type: 'PaymentMethod', id }],
    }),

    // POST /payment-methods  body: { name, code, description?, isActive? }  (super_admin)
    createPaymentMethod: builder.mutation({
      query: (body) => ({ url: '/payment-methods', method: 'POST', data: body }),
      invalidatesTags: [{ type: 'PaymentMethod', id: 'LIST' }],
    }),

    // PATCH /payment-methods/:id  (super_admin)
    updatePaymentMethod: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/payment-methods/${id}`, method: 'PATCH', data: body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'PaymentMethod', id }, { type: 'PaymentMethod', id: 'LIST' }],
    }),

    // DELETE /payment-methods/:id  (super_admin)
    deletePaymentMethod: builder.mutation({
      query: (id) => ({ url: `/payment-methods/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'PaymentMethod', id: 'LIST' }],
    }),

  }),
});

export const {
  useGetPaymentMethodsQuery,
  useGetPaymentMethodByIdQuery,
  useCreatePaymentMethodMutation,
  useUpdatePaymentMethodMutation,
  useDeletePaymentMethodMutation,
} = paymentMethodsApi;
