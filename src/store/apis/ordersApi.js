import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../../services/apiClient';

// OrderStatus: pending | preparing | ready | completed | cancelled

export const ordersApi = createApi({
  reducerPath: 'ordersApi',
  baseQuery:   axiosBaseQuery(),
  tagTypes:    ['Order'],
  endpoints:   (builder) => ({

    // GET /orders?status=<OrderStatus>
    getOrders: builder.query({
      query: ({ headers, ...params } = {}) => ({ url: '/orders', params, headers }),
      providesTags: (result) =>
        result
          ? [...result.map(({ _id }) => ({ type: 'Order', id: _id })), { type: 'Order', id: 'LIST' }]
          : [{ type: 'Order', id: 'LIST' }],
    }),

    // GET /orders/:id
    getOrderById: builder.query({
      query: (id) => ({ url: `/orders/${id}` }),
      providesTags: (_r, _e, id) => [{ type: 'Order', id }],
    }),

    // POST /orders
    // body: {
    //   customerName: string,
    //   items: [{ product: string (MongoId), quantity: number, unitPrice: number }],
    //   subtotal: number,
    //   total: number,
    //   discountType?: 'percentage' | 'fixed',
    //   discountValue?: number,
    //   note?: string,
    // }
    // branch is injected server-side from JWT
    createOrder: builder.mutation({
      query: (body) => ({ url: '/orders', method: 'POST', data: body }),
      invalidatesTags: [{ type: 'Order', id: 'LIST' }],
    }),

    // PATCH /orders/:id/status
    // body: { status: OrderStatus }
    updateOrderStatus: builder.mutation({
      query: ({ id, status }) => ({
        url:    `/orders/${id}/status`,
        method: 'PATCH',
        data:   { status },
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Order', id }, { type: 'Order', id: 'LIST' }],
    }),

    // DELETE /orders/:id  (manager+)
    deleteOrder: builder.mutation({
      query: (id) => ({ url: `/orders/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Order', id: 'LIST' }],
    }),

  }),
});

export const {
  useGetOrdersQuery,
  useGetOrderByIdQuery,
  useCreateOrderMutation,
  useUpdateOrderStatusMutation,
  useDeleteOrderMutation,
} = ordersApi;
